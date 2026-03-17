using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;
using Stride.Services.Configuration;
using Stride.Services.Interfaces;
using Stride.Services.Models.Auth;

namespace Stride.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly StrideDbContext _dbContext;
    private readonly IJwtService _jwtService;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthService> _logger;
    private const int MaxFailedLoginAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(30);

    public AuthService(
        StrideDbContext dbContext,
        IJwtService jwtService,
        IOptions<JwtSettings> jwtSettings,
        ILogger<AuthService> logger)
    {
        _dbContext = dbContext;
        _jwtService = jwtService;
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress = null)
    {
        _logger.LogDebug("Starting {Method} for Email={Email}, IpAddress={IpAddress}",
            nameof(RegisterAsync), MaskEmail(request.Email), ipAddress);

        // Check if email already exists
        var existingUser = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (existingUser != null)
        {
            _logger.LogWarning("{Method} failed: Email already registered for Email={Email}",
                nameof(RegisterAsync), MaskEmail(request.Email));
            throw new InvalidOperationException("Email is already registered");
        }

        // Create new user without role (user must select role via /auth/select-role)
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLower(),
            DisplayName = request.DisplayName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = string.Empty, // No default role - user must select one
            GdprConsent = request.GdprConsent,
            CreatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow,
            FailedLoginAttempts = 0
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("{Method} completed: New user registered UserId={UserId}, Email={Email}, HasGdprConsent={GdprConsent}",
            nameof(RegisterAsync), user.Id, MaskEmail(request.Email), request.GdprConsent);

        // Generate tokens
        return await GenerateAuthResponseAsync(user, ipAddress);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress = null)
    {
        _logger.LogDebug("Starting {Method} for Email={Email}, IpAddress={IpAddress}",
            nameof(LoginAsync), MaskEmail(request.Email), ipAddress);
        var user = await _dbContext.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.TeacherProfile)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower() && !u.IsDeleted);

        if (user == null)
        {
            _logger.LogWarning("{Method} failed: User not found for Email={Email}",
                nameof(LoginAsync), MaskEmail(request.Email));
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        _logger.LogDebug("{Method}: User found UserId={UserId}, Role={Role}, FailedAttempts={FailedAttempts}",
            nameof(LoginAsync), user.Id, user.Role, user.FailedLoginAttempts);

        // Check lockout
        if (user.LockoutEndDate.HasValue && user.LockoutEndDate.Value > DateTime.UtcNow)
        {
            var remainingTime = user.LockoutEndDate.Value - DateTime.UtcNow;
            _logger.LogWarning("{Method}: Account locked for UserId={UserId}, RemainingMinutes={RemainingMinutes}",
                nameof(LoginAsync), user.Id, Math.Ceiling(remainingTime.TotalMinutes));
            throw new UnauthorizedAccessException(
                $"Account is locked. Please try again in {Math.Ceiling(remainingTime.TotalMinutes)} minutes");
        }

        // Verify password
        if (user.PasswordHash == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            // Increment failed login attempts
            user.FailedLoginAttempts++;

            if (user.FailedLoginAttempts >= MaxFailedLoginAttempts)
            {
                user.LockoutEndDate = DateTime.UtcNow.Add(LockoutDuration);
                _logger.LogWarning("{Method}: Account locked due to failed attempts UserId={UserId}, FailedAttempts={FailedAttempts}",
                    nameof(LoginAsync), user.Id, user.FailedLoginAttempts);
            }
            else
            {
                _logger.LogWarning("{Method}: Invalid password attempt UserId={UserId}, FailedAttempts={FailedAttempts}",
                    nameof(LoginAsync), user.Id, user.FailedLoginAttempts);
            }

            await _dbContext.SaveChangesAsync();
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        // Reset failed attempts and lockout on successful login
        user.FailedLoginAttempts = 0;
        user.LockoutEndDate = null;
        user.LastLoginAt = DateTime.UtcNow;

        // Create student profile if user is a student but doesn't have a profile yet
        if (user.Role == "Student" && user.StudentProfile == null)
        {
            var studentProfile = new StudentProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TotalXp = 0,
                CurrentLevel = 1,
                CurrentStreak = 0,
                LongestStreak = 0,
                StreakFreezes = 0,
                League = "Bronze",
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.StudentProfiles.Add(studentProfile);
            user.StudentProfile = studentProfile;
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("{Method} completed: User logged in UserId={UserId}, Role={Role}, HasStudentProfile={HasStudentProfile}",
            nameof(LoginAsync), user.Id, user.Role, user.StudentProfile != null);

        // Generate tokens
        return await GenerateAuthResponseAsync(user, ipAddress);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken, string? ipAddress = null)
    {
        _logger.LogDebug("Starting {Method}, IpAddress={IpAddress}",
            nameof(RefreshTokenAsync), ipAddress);
        var token = await _dbContext.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u.StudentProfile)
            .Include(rt => rt.User)
                .ThenInclude(u => u.TeacherProfile)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (token == null || !token.IsActive)
        {
            _logger.LogWarning("{Method} failed: Invalid or expired refresh token, TokenExists={TokenExists}, IsActive={IsActive}",
                nameof(RefreshTokenAsync), token != null, token?.IsActive ?? false);
            throw new UnauthorizedAccessException("Invalid or expired refresh token");
        }

        _logger.LogDebug("{Method}: Token validated for UserId={UserId}",
            nameof(RefreshTokenAsync), token.UserId);

        // Revoke old token
        token.IsRevoked = true;
        token.RevokedAt = DateTime.UtcNow;
        token.RevokedByIp = ipAddress;

        // Create student profile if user is a student but doesn't have a profile yet
        if (token.User.Role == "Student" && token.User.StudentProfile == null)
        {
            var studentProfile = new StudentProfile
            {
                Id = Guid.NewGuid(),
                UserId = token.User.Id,
                TotalXp = 0,
                CurrentLevel = 1,
                CurrentStreak = 0,
                LongestStreak = 0,
                StreakFreezes = 0,
                League = "Bronze",
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.StudentProfiles.Add(studentProfile);
            token.User.StudentProfile = studentProfile;
        }

        // Generate new tokens
        var response = await GenerateAuthResponseAsync(token.User, ipAddress);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("{Method} completed: Token refreshed for UserId={UserId}",
            nameof(RefreshTokenAsync), token.UserId);

        return response;
    }

    public async Task LogoutAsync(string refreshToken, string? ipAddress = null)
    {
        _logger.LogDebug("Starting {Method}, IpAddress={IpAddress}",
            nameof(LogoutAsync), ipAddress);
        var token = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (token != null && token.IsActive)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            token.RevokedByIp = ipAddress;
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("{Method} completed: User logged out UserId={UserId}",
                nameof(LogoutAsync), token.UserId);
        }
        else
        {
            _logger.LogDebug("{Method}: No active token found to revoke", nameof(LogoutAsync));
        }
    }

    public async Task RevokeAllUserTokensAsync(Guid userId, string? ipAddress = null)
    {
        _logger.LogDebug("Starting {Method} for UserId={UserId}",
            nameof(RevokeAllUserTokensAsync), userId);
        var tokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            token.RevokedByIp = ipAddress;
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("{Method} completed: Revoked {TokenCount} tokens for UserId={UserId}",
            nameof(RevokeAllUserTokensAsync), tokens.Count, userId);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        _logger.LogDebug("Starting {Method} for Email={Email}",
            nameof(ForgotPasswordAsync), MaskEmail(request.Email));
        // Find user by email
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower() && !u.IsDeleted);

        // Always return success for security (timing attack prevention)
        // Even if user doesn't exist, we act as if we sent the email
        if (user == null)
        {
            _logger.LogDebug("{Method}: User not found (returning success for security) Email={Email}",
                nameof(ForgotPasswordAsync), MaskEmail(request.Email));
            return;
        }

        // Generate secure reset token
        var resetToken = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64));

        // Store hashed token
        user.PasswordResetToken = BCrypt.Net.BCrypt.HashPassword(resetToken);
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1);

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("{Method} completed: Password reset token generated for UserId={UserId}",
            nameof(ForgotPasswordAsync), user.Id);

        // TODO: Send email with reset link containing the token
        // In production, you would send an email like:
        // var resetLink = $"https://yourdomain.com/reset-password?token={Uri.EscapeDataString(resetToken)}";
        // await _emailService.SendPasswordResetEmailAsync(user.Email, resetLink);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, string? ipAddress = null)
    {
        _logger.LogDebug("Starting {Method}, IpAddress={IpAddress}",
            nameof(ResetPasswordAsync), ipAddress);

        // Find user with valid reset token
        var users = await _dbContext.Users
            .Where(u => !u.IsDeleted 
                && u.PasswordResetToken != null 
                && u.PasswordResetTokenExpiresAt != null
                && u.PasswordResetTokenExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        User? user = null;

        // Verify token against each user's hashed token
        foreach (var u in users)
        {
            if (u.PasswordResetToken != null && BCrypt.Net.BCrypt.Verify(request.Token, u.PasswordResetToken))
            {
                user = u;
                break;
            }
        }

        if (user == null)
        {
            _logger.LogWarning("{Method} failed: Invalid or expired reset token",
                nameof(ResetPasswordAsync));
            throw new UnauthorizedAccessException("Invalid or expired reset token");
        }

        _logger.LogDebug("{Method}: Valid reset token found for UserId={UserId}",
            nameof(ResetPasswordAsync), user.Id);

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        
        // Clear reset token
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;

        // Reset failed login attempts and lockout
        user.FailedLoginAttempts = 0;
        user.LockoutEndDate = null;

        await _dbContext.SaveChangesAsync();

        // Revoke all existing refresh tokens for security
        await RevokeAllUserTokensAsync(user.Id, ipAddress);

        _logger.LogInformation("{Method} completed: Password reset for UserId={UserId}",
            nameof(ResetPasswordAsync), user.Id);
    }

    private async Task<AuthResponse> GenerateAuthResponseAsync(User user, string? ipAddress)
    {
        _logger.LogDebug("Generating auth response for UserId={UserId}", user.Id);
        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = ipAddress
        };

        _dbContext.RefreshTokens.Add(refreshTokenEntity);
        await _dbContext.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                DisplayName = user.DisplayName,
                AvatarUrl = user.AvatarUrl,
                Role = user.Role,
                IsEmailVerified = true,
                HasCompletedOnboarding = true,
                CreatedAt = user.CreatedAt
            }
        };
    }

    /// <summary>
    /// Masks email for logging (e.g., "john.doe@example.com" -> "j***e@example.com")
    /// </summary>
    private static string MaskEmail(string email)
    {
        if (string.IsNullOrEmpty(email)) return "[empty]";
        
        var atIndex = email.IndexOf('@');
        if (atIndex <= 0) return "[invalid]";
        
        var localPart = email[..atIndex];
        var domain = email[atIndex..];
        
        if (localPart.Length <= 2)
            return $"{localPart[0]}***{domain}";
        
        return $"{localPart[0]}***{localPart[^1]}{domain}";
    }
}
