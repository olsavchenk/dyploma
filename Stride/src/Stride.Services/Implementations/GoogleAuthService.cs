using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;
using Stride.Services.Configuration;
using Stride.Services.Interfaces;
using Stride.Services.Models.Auth;

namespace Stride.Services.Implementations;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly StrideDbContext _dbContext;
    private readonly IJwtService _jwtService;
    private readonly GoogleAuthSettings _googleAuthSettings;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(
        StrideDbContext dbContext,
        IJwtService jwtService,
        IOptions<GoogleAuthSettings> googleAuthSettings,
        IOptions<JwtSettings> jwtSettings,
        ILogger<GoogleAuthService> logger)
    {
        _dbContext = dbContext;
        _jwtService = jwtService;
        _googleAuthSettings = googleAuthSettings.Value;
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
    }

    public async Task<AuthResponse> LoginWithGoogleAsync(string idToken, string? ipAddress = null)
    {
        try
        {
            // Validate Google ID token
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [_googleAuthSettings.ClientId]
            });

            if (payload == null)
            {
                throw new UnauthorizedAccessException("Invalid Google ID token");
            }

            // Extract user information from Google payload
            var email = payload.Email.ToLower();
            var displayName = payload.Name ?? payload.Email;
            var avatarUrl = payload.Picture;
            var googleId = payload.Subject;

            // Check if user exists by email or GoogleId
            var user = await _dbContext.Users
                .Include(u => u.StudentProfile)
                .Include(u => u.TeacherProfile)
                .FirstOrDefaultAsync(u => u.Email == email || u.GoogleId == googleId);

            if (user != null)
            {
                // Update existing user
                if (string.IsNullOrEmpty(user.GoogleId))
                {
                    user.GoogleId = googleId;
                }

                if (string.IsNullOrEmpty(user.AvatarUrl) && !string.IsNullOrEmpty(avatarUrl))
                {
                    user.AvatarUrl = avatarUrl;
                }

                user.LastLoginAt = DateTime.UtcNow;
                user.FailedLoginAttempts = 0;
                user.LockoutEndDate = null;

                _logger.LogInformation("User logged in with Google: {Email}", email);
            }
            else
            {
                // Create new user without role (user must select role via /auth/select-role)
                user = new User
                {
                    Id = Guid.NewGuid(),
                    Email = email,
                    DisplayName = displayName,
                    AvatarUrl = avatarUrl,
                    GoogleId = googleId,
                    Role = string.Empty, // No default role - user must select one
                    GdprConsent = true, // OAuth users implicitly consent
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow,
                    FailedLoginAttempts = 0
                };

                _dbContext.Users.Add(user);

                _logger.LogInformation("New user registered with Google: {Email}", email);
            }

            await _dbContext.SaveChangesAsync();

            // Generate tokens
            return await GenerateAuthResponseAsync(user, ipAddress);
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Invalid Google ID token");
            throw new UnauthorizedAccessException("Invalid Google ID token", ex);
        }
    }

    public async Task<AuthResponse> SelectRoleAsync(Guid userId, string role, string? ipAddress = null)
    {
        var user = await _dbContext.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.TeacherProfile)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        // Admin role can only be manually assigned, not selected by users
        if (role == "Admin")
        {
            throw new InvalidOperationException("Admin role cannot be selected by users");
        }

        // Update user role
        user.Role = role;

        // Create profile if it doesn't exist
        if (role == "Student" && user.StudentProfile == null)
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
            _logger.LogInformation("Student profile created for user: {UserId}", userId);
        }
        else if (role == "Teacher" && user.TeacherProfile == null)
        {
            var teacherProfile = new TeacherProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.TeacherProfiles.Add(teacherProfile);
            _logger.LogInformation("Teacher profile created for user: {UserId}", userId);
        }

        await _dbContext.SaveChangesAsync();

        // Revoke existing tokens to force re-authentication with new role
        var existingTokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        foreach (var token in existingTokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            token.RevokedByIp = ipAddress;
        }

        await _dbContext.SaveChangesAsync();

        // Generate new tokens with updated role
        return await GenerateAuthResponseAsync(user, ipAddress);
    }

    private async Task<AuthResponse> GenerateAuthResponseAsync(User user, string? ipAddress)
    {
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
}
