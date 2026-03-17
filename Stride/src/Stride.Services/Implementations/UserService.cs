using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;
using Stride.Services.Configuration;
using Stride.Services.Interfaces;
using Stride.Services.Models.User;

namespace Stride.Services.Implementations;

public class UserService : IUserService
{
    private readonly StrideDbContext _dbContext;
    private readonly IStorageService _storageService;
    private readonly ICacheService _cacheService;
    private readonly MinIOOptions _minioOptions;
    private readonly ILogger<UserService> _logger;
    private const int MaxAvatarSizeBytes = 5 * 1024 * 1024; // 5MB
    private static readonly string[] AllowedImageTypes = { "image/jpeg", "image/jpg", "image/png", "image/webp" };
    private const string DataExportRateLimitKey = "data_export_rate_limit:";
    private static readonly TimeSpan DataExportRateLimit = TimeSpan.FromHours(24);

    public UserService(
        StrideDbContext dbContext,
        IStorageService storageService,
        ICacheService cacheService,
        IOptions<MinIOOptions> minioOptions,
        ILogger<UserService> logger)
    {
        _dbContext = dbContext;
        _storageService = storageService;
        _cacheService = cacheService;
        _minioOptions = minioOptions.Value;
        _logger = logger;
    }

    public async Task<UserProfileDto> GetUserProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Starting {Method} for UserId={UserId}",
            nameof(GetUserProfileAsync), userId);
        var user = await _dbContext.Users
            .Include(u => u.StudentProfile)
                .ThenInclude(sp => sp!.TaskAttempts)
            .Include(u => u.StudentProfile)
                .ThenInclude(sp => sp!.Achievements)
            .Include(u => u.TeacherProfile)
                .ThenInclude(tp => tp!.Classes)
                    .ThenInclude(c => c.Memberships)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("{Method} failed: User not found UserId={UserId}",
                nameof(GetUserProfileAsync), userId);
            throw new InvalidOperationException("User not found");
        }

        _logger.LogDebug("{Method}: Found user Role={Role}, HasStudentProfile={HasStudentProfile}, HasTeacherProfile={HasTeacherProfile}",
            nameof(GetUserProfileAsync), user.Role, user.StudentProfile != null, user.TeacherProfile != null);

        var profile = new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };

        // Add student-specific stats
        if (user.Role == "Student" && user.StudentProfile != null)
        {
            profile.StudentStats = new StudentStatsDto
            {
                TotalXp = user.StudentProfile.TotalXp,
                CurrentLevel = user.StudentProfile.CurrentLevel,
                CurrentStreak = user.StudentProfile.CurrentStreak,
                LongestStreak = user.StudentProfile.LongestStreak,
                StreakFreezes = user.StudentProfile.StreakFreezes,
                League = user.StudentProfile.League,
                TotalTasksAttempted = user.StudentProfile.TaskAttempts.Count,
                AchievementsUnlocked = user.StudentProfile.Achievements.Count
            };
        }

        // Add teacher-specific stats
        if (user.Role == "Teacher" && user.TeacherProfile != null)
        {
            var totalStudents = user.TeacherProfile.Classes
                .SelectMany(c => c.Memberships)
                .Select(m => m.StudentId)
                .Distinct()
                .Count();

            profile.TeacherStats = new TeacherStatsDto
            {
                School = user.TeacherProfile.School,
                GradesTaught = user.TeacherProfile.GradesTaught,
                SubjectsExpertise = user.TeacherProfile.SubjectsExpertise,
                TotalClasses = user.TeacherProfile.Classes.Count,
                TotalStudents = totalStudents
            };
        }

        _logger.LogInformation("{Method} completed for UserId={UserId}, Role={Role}",
            nameof(GetUserProfileAsync), userId, user.Role);

        return profile;
    }

    public async Task<UserProfileDto> UpdateUserProfileAsync(
        Guid userId,
        UpdateUserProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Starting {Method} for UserId={UserId}, DisplayName={DisplayName}",
            nameof(UpdateUserProfileAsync), userId, request.DisplayName ?? "[not changed]");
        var user = await _dbContext.Users
            .Include(u => u.TeacherProfile)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("{Method} failed: User not found UserId={UserId}",
                nameof(UpdateUserProfileAsync), userId);
            throw new InvalidOperationException("User not found");
        }

        // Update display name if provided
        if (!string.IsNullOrWhiteSpace(request.DisplayName))
        {
            user.DisplayName = request.DisplayName;
        }

        // Update teacher-specific fields if user is a teacher
        if (user.Role == "Teacher" && user.TeacherProfile != null)
        {
            if (request.School != null)
            {
                user.TeacherProfile.School = request.School;
            }

            if (request.GradesTaught != null)
            {
                user.TeacherProfile.GradesTaught = request.GradesTaught;
            }

            if (request.SubjectsExpertise != null)
            {
                user.TeacherProfile.SubjectsExpertise = request.SubjectsExpertise;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("{Method} completed for UserId={UserId}",
            nameof(UpdateUserProfileAsync), userId);

        return await GetUserProfileAsync(userId, cancellationToken);
    }

    public async Task<string> UploadAvatarAsync(
        Guid userId,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Starting {Method} for UserId={UserId}, FileName={FileName}, Size={Size}, ContentType={ContentType}",
            nameof(UploadAvatarAsync), userId, file?.FileName, file?.Length, file?.ContentType);

        ArgumentNullException.ThrowIfNull(file);

        // Validate file size
        if (file.Length > MaxAvatarSizeBytes)
        {
            _logger.LogWarning("{Method} failed: File too large Size={Size}, MaxSize={MaxSize}",
                nameof(UploadAvatarAsync), file.Length, MaxAvatarSizeBytes);
            throw new InvalidOperationException($"Avatar size must not exceed {MaxAvatarSizeBytes / 1024 / 1024}MB");
        }

        // Validate file type
        if (!AllowedImageTypes.Contains(file.ContentType.ToLower()))
        {
            _logger.LogWarning("{Method} failed: Invalid content type ContentType={ContentType}",
                nameof(UploadAvatarAsync), file.ContentType);
            throw new InvalidOperationException("Only image files (JPEG, PNG, WebP) are allowed");
        }

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("{Method} failed: User not found UserId={UserId}",
                nameof(UploadAvatarAsync), userId);
            throw new InvalidOperationException("User not found");
        }

        // Delete old avatar if exists
        if (!string.IsNullOrEmpty(user.AvatarUrl))
        {
            var oldObjectName = Path.GetFileName(new Uri(user.AvatarUrl).LocalPath);
            _logger.LogDebug("{Method}: Deleting old avatar ObjectName={ObjectName}",
                nameof(UploadAvatarAsync), oldObjectName);
            await _storageService.DeleteAsync(_minioOptions.Buckets.Avatars, oldObjectName, cancellationToken);
        }

        // Generate unique filename
        var fileExtension = Path.GetExtension(file.FileName);
        var objectName = $"{userId}_{Guid.NewGuid()}{fileExtension}";

        // Upload to MinIO
        using var stream = file.OpenReadStream();
        await _storageService.UploadAsync(
            _minioOptions.Buckets.Avatars,
            objectName,
            stream,
            file.ContentType,
            cancellationToken);

        // Generate URL
        var avatarUrl = $"/{_minioOptions.Buckets.Avatars}/{objectName}";

        // Update user
        user.AvatarUrl = avatarUrl;
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("{Method} completed for UserId={UserId}, AvatarUrl={AvatarUrl}",
            nameof(UploadAvatarAsync), userId, avatarUrl);

        return avatarUrl;
    }

    public async Task<UserDataExportDto> ExportUserDataAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Starting {Method} for UserId={UserId}",
            nameof(ExportUserDataAsync), userId);

        // Rate limiting check
        var rateLimitKey = $"{DataExportRateLimitKey}{userId}";
        var lastExport = await _cacheService.GetAsync<DateTime?>(rateLimitKey, cancellationToken);

        if (lastExport.HasValue)
        {
            var timeRemaining = DataExportRateLimit - (DateTime.UtcNow - lastExport.Value);
            if (timeRemaining > TimeSpan.Zero)
            {
                _logger.LogWarning("{Method} failed: Rate limited UserId={UserId}, RemainingHours={RemainingHours}",
                    nameof(ExportUserDataAsync), userId, Math.Ceiling(timeRemaining.TotalHours));
                throw new InvalidOperationException(
                    $"Data export is rate limited. Please try again in {Math.Ceiling(timeRemaining.TotalHours)} hours");
            }
        }

        var user = await _dbContext.Users
            .Include(u => u.StudentProfile)
                .ThenInclude(sp => sp!.TaskAttempts)
            .Include(u => u.StudentProfile)
                .ThenInclude(sp => sp!.Achievements)
                    .ThenInclude(sa => sa.Achievement)
            .Include(u => u.StudentProfile)
                .ThenInclude(sp => sp!.ClassMemberships)
                    .ThenInclude(cm => cm.Class)
            .Include(u => u.TeacherProfile)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("{Method} failed: User not found UserId={UserId}",
                nameof(ExportUserDataAsync), userId);
            throw new InvalidOperationException("User not found");
        }

        _logger.LogDebug("{Method}: Building export data for UserId={UserId}, HasStudentProfile={HasStudentProfile}, HasTeacherProfile={HasTeacherProfile}",
            nameof(ExportUserDataAsync), userId, user.StudentProfile != null, user.TeacherProfile != null);

        var exportData = new UserDataExportDto
        {
            User = new UserDataDto
            {
                Id = user.Id,
                Email = user.Email,
                DisplayName = user.DisplayName,
                AvatarUrl = user.AvatarUrl,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt
            },
            ExportedAt = DateTime.UtcNow
        };

        // Export student data
        if (user.StudentProfile != null)
        {
            exportData.StudentProfile = new StudentProfileDataDto
            {
                TotalXp = user.StudentProfile.TotalXp,
                CurrentLevel = user.StudentProfile.CurrentLevel,
                CurrentStreak = user.StudentProfile.CurrentStreak,
                LongestStreak = user.StudentProfile.LongestStreak,
                League = user.StudentProfile.League,
                CreatedAt = user.StudentProfile.CreatedAt
            };

            exportData.TaskAttempts = user.StudentProfile.TaskAttempts
                .Select(ta => new TaskAttemptDataDto
                {
                    TaskInstanceId = Guid.TryParse(ta.TaskInstanceId, out var tid) ? tid : Guid.Empty,
                    TopicId = ta.TopicId,
                    IsCorrect = ta.IsCorrect,
                    ResponseTimeMs = ta.ResponseTimeMs,
                    DifficultyAtTime = ta.DifficultyAtTime,
                    AttemptedAt = ta.CreatedAt
                })
                .ToList();

            exportData.Achievements = user.StudentProfile.Achievements
                .Select(sa => new AchievementDataDto
                {
                    Code = sa.Achievement.Code,
                    Name = sa.Achievement.Name,
                    UnlockedAt = sa.UnlockedAt
                })
                .ToList();

            exportData.ClassMemberships = user.StudentProfile.ClassMemberships
                .Select(cm => new ClassMembershipDataDto
                {
                    ClassName = cm.Class.Name,
                    JoinedAt = cm.JoinedAt
                })
                .ToList();
        }

        // Export teacher data
        if (user.TeacherProfile != null)
        {
            exportData.TeacherProfile = new TeacherProfileDataDto
            {
                School = user.TeacherProfile.School,
                GradesTaught = user.TeacherProfile.GradesTaught,
                SubjectsExpertise = user.TeacherProfile.SubjectsExpertise,
                CreatedAt = user.TeacherProfile.CreatedAt
            };
        }

        // Update rate limit cache
        await _cacheService.SetAsync(rateLimitKey, DateTime.UtcNow, DataExportRateLimit, cancellationToken);

        _logger.LogInformation("{Method} completed for UserId={UserId}, TaskAttemptCount={TaskAttemptCount}, AchievementCount={AchievementCount}",
            nameof(ExportUserDataAsync), userId, exportData.TaskAttempts?.Count ?? 0, exportData.Achievements?.Count ?? 0);

        return exportData;
    }

    public async Task DeleteUserAccountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Starting {Method} for UserId={UserId}",
            nameof(DeleteUserAccountAsync), userId);
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("{Method} failed: User not found UserId={UserId}",
                nameof(DeleteUserAccountAsync), userId);
            throw new InvalidOperationException("User not found");
        }

        _logger.LogInformation("{Method}: Starting account deletion for UserId={UserId}, Email={Email}",
            nameof(DeleteUserAccountAsync), userId, "[REDACTED]");

        // Delete avatar from storage BEFORE nullifying the URL
        if (!string.IsNullOrEmpty(user.AvatarUrl))
        {
            try
            {
                var objectName = Path.GetFileName(new Uri(user.AvatarUrl).LocalPath);
                await _storageService.DeleteAsync(_minioOptions.Buckets.Avatars, objectName, cancellationToken);
            }
            catch
            {
                // Ignore storage deletion errors during account deletion
                _logger.LogDebug("{Method}: Failed to delete avatar from storage (ignored)",
                    nameof(DeleteUserAccountAsync));
            }
        }

        // Soft delete and anonymize
        user.IsDeleted = true;
        user.Email = $"deleted_{userId}@anonymized.local";
        user.DisplayName = "Deleted User";
        user.PasswordHash = null;
        user.GoogleId = null;
        user.AvatarUrl = null;
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;

        // Revoke all refresh tokens
        var refreshTokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var token in refreshTokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("{Method} completed: Account deleted and anonymized UserId={UserId}, RevokedTokens={TokenCount}",
            nameof(DeleteUserAccountAsync), userId, refreshTokens.Count);
    }
}
