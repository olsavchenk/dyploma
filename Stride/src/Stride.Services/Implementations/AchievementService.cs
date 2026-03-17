using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;
using Stride.Services.Interfaces;
using Stride.Services.Models.Gamification;

namespace Stride.Services.Implementations;

public class AchievementService : IAchievementService
{
    private readonly StrideDbContext _dbContext;
    private readonly ILogger<AchievementService> _logger;

    public AchievementService(
        StrideDbContext dbContext,
        ILogger<AchievementService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<List<AchievementDto>> GetAchievementsAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var studentProfile = await _dbContext.StudentProfiles
            .Include(sp => sp.Achievements)
            .ThenInclude(sa => sa.Achievement)
            .FirstOrDefaultAsync(sp => sp.UserId == studentId, cancellationToken);

        if (studentProfile == null)
        {
            throw new InvalidOperationException("Student profile not found");
        }

        var allAchievements = await _dbContext.Achievements
            .OrderBy(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        var unlockedAchievementIds = studentProfile.Achievements
            .Select(sa => sa.AchievementId)
            .ToHashSet();

        var achievements = allAchievements.Select(a =>
        {
            var studentAchievement = studentProfile.Achievements
                .FirstOrDefault(sa => sa.AchievementId == a.Id);

            var isUnlocked = unlockedAchievementIds.Contains(a.Id);

            return new AchievementDto
            {
                Id = a.Id,
                Code = a.Code,
                Name = a.Name,
                Description = a.Description,
                IconUrl = a.IconUrl,
                XpReward = a.XpReward,
                IsHidden = a.IsHidden && !isUnlocked, // Show hidden achievements once unlocked
                IsUnlocked = isUnlocked,
                UnlockedAt = studentAchievement?.UnlockedAt
            };
        }).ToList();

        return achievements;
    }

    public async Task<List<UnlockedAchievementResult>> CheckAndUnlockAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var studentProfile = await _dbContext.StudentProfiles
            .Include(sp => sp.Achievements)
                .ThenInclude(sa => sa.Achievement)
            .Include(sp => sp.TaskAttempts)
            .FirstOrDefaultAsync(sp => sp.UserId == studentId, cancellationToken);

        if (studentProfile == null)
        {
            throw new InvalidOperationException("Student profile not found");
        }

        var unlockedAchievements = new List<UnlockedAchievementResult>();

        // Get all achievement codes already unlocked
        var unlockedCodes = studentProfile.Achievements
            .Select(sa => sa.Achievement.Code)
            .ToHashSet();

        // Get all achievements from database
        var allAchievements = await _dbContext.Achievements
            .ToListAsync(cancellationToken);

        var achievementsToCheck = new List<(string code, bool isEligible)>
        {
            // First task milestone
            ("first_task", studentProfile.TaskAttempts.Any()),
            
            // Streak milestones
            ("streak_7", studentProfile.CurrentStreak >= 7),
            ("streak_30", studentProfile.CurrentStreak >= 30),
            ("streak_100", studentProfile.CurrentStreak >= 100),
            
            // Level milestones
            ("level_10", studentProfile.CurrentLevel >= 10),
            ("level_25", studentProfile.CurrentLevel >= 25),
            ("level_50", studentProfile.CurrentLevel >= 50),
            
            // XP milestones
            ("xp_1000", studentProfile.TotalXp >= 1000),
            ("xp_5000", studentProfile.TotalXp >= 5000),
            ("xp_10000", studentProfile.TotalXp >= 10000),
            
            // Task completion milestones
            ("tasks_10", studentProfile.TaskAttempts.Count >= 10),
            ("tasks_50", studentProfile.TaskAttempts.Count >= 50),
            ("tasks_100", studentProfile.TaskAttempts.Count >= 100),
            ("tasks_500", studentProfile.TaskAttempts.Count >= 500),
            
            // Accuracy milestones (70%+ on 20+ tasks)
            ("accuracy_master", studentProfile.TaskAttempts.Count >= 20 && 
                GetAccuracy(studentProfile.TaskAttempts.ToList()) >= 0.70),
            
            // Perfect streak (10 correct in a row)
            ("perfect_10", HasPerfectStreak(studentProfile.TaskAttempts.ToList(), 10))
        };

        var now = DateTime.UtcNow;

        foreach (var (code, isEligible) in achievementsToCheck)
        {
            // Skip if already unlocked or not eligible
            if (unlockedCodes.Contains(code) || !isEligible)
            {
                continue;
            }

            var achievement = allAchievements.FirstOrDefault(a => a.Code == code);
            if (achievement == null)
            {
                _logger.LogWarning("Achievement with code {Code} not found in database", code);
                continue;
            }

            // Unlock the achievement
            var studentAchievement = new StudentAchievement
            {
                Id = Guid.NewGuid(),
                StudentId = studentProfile.Id,
                AchievementId = achievement.Id,
                UnlockedAt = now
            };

            _dbContext.StudentAchievements.Add(studentAchievement);

            // Award XP for the achievement
            studentProfile.TotalXp += achievement.XpReward;

            unlockedAchievements.Add(new UnlockedAchievementResult
            {
                AchievementId = achievement.Id,
                Code = achievement.Code,
                Name = achievement.Name,
                Description = achievement.Description,
                IconUrl = achievement.IconUrl,
                XpReward = achievement.XpReward,
                UnlockedAt = now
            });

            _logger.LogInformation(
                "Student {StudentId} unlocked achievement {AchievementCode}: {AchievementName}",
                studentId, achievement.Code, achievement.Name);
        }

        if (unlockedAchievements.Any())
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return unlockedAchievements;
    }

    public async Task<AchievementDto?> GetAchievementByCodeAsync(string code, Guid? studentId = null, CancellationToken cancellationToken = default)
    {
        var achievement = await _dbContext.Achievements
            .FirstOrDefaultAsync(a => a.Code == code, cancellationToken);

        if (achievement == null)
        {
            return null;
        }

        bool isUnlocked = false;
        DateTime? unlockedAt = null;

        if (studentId.HasValue)
        {
            var studentProfile = await _dbContext.StudentProfiles
                .Include(sp => sp.Achievements)
                .FirstOrDefaultAsync(sp => sp.UserId == studentId.Value, cancellationToken);

            if (studentProfile != null)
            {
                var studentAchievement = studentProfile.Achievements
                    .FirstOrDefault(sa => sa.AchievementId == achievement.Id);

                isUnlocked = studentAchievement != null;
                unlockedAt = studentAchievement?.UnlockedAt;
            }
        }

        return new AchievementDto
        {
            Id = achievement.Id,
            Code = achievement.Code,
            Name = achievement.Name,
            Description = achievement.Description,
            IconUrl = achievement.IconUrl,
            XpReward = achievement.XpReward,
            IsHidden = achievement.IsHidden && !isUnlocked,
            IsUnlocked = isUnlocked,
            UnlockedAt = unlockedAt
        };
    }

    private static double GetAccuracy(List<TaskAttempt> attempts)
    {
        if (!attempts.Any())
        {
            return 0;
        }

        var correctCount = attempts.Count(a => a.IsCorrect);
        return (double)correctCount / attempts.Count;
    }

    private static bool HasPerfectStreak(List<TaskAttempt> attempts, int requiredStreak)
    {
        if (attempts.Count < requiredStreak)
        {
            return false;
        }

        var orderedAttempts = attempts.OrderByDescending(a => a.CreatedAt).ToList();

        int currentStreak = 0;
        foreach (var attempt in orderedAttempts)
        {
            if (attempt.IsCorrect)
            {
                currentStreak++;
                if (currentStreak >= requiredStreak)
                {
                    return true;
                }
            }
            else
            {
                currentStreak = 0;
            }
        }

        return false;
    }

    public async Task<List<AchievementDto>> GetAllAchievementsAsync(CancellationToken cancellationToken = default)
    {
        var achievements = await _dbContext.Achievements
            .OrderBy(a => a.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return achievements.Select(a => new AchievementDto
        {
            Id = a.Id,
            Code = a.Code,
            Name = a.Name,
            Description = a.Description,
            IconUrl = a.IconUrl,
            XpReward = a.XpReward,
            IsHidden = a.IsHidden,
            IsUnlocked = false,
            UnlockedAt = null
        }).ToList();
    }

    public async Task<AchievementDto> CreateAchievementAsync(CreateAchievementRequest request, CancellationToken cancellationToken = default)
    {
        // Check if achievement code already exists
        var existingAchievement = await _dbContext.Achievements
            .Where(a => a.Code == request.Code)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingAchievement != null)
        {
            throw new InvalidOperationException($"An achievement with code '{request.Code}' already exists");
        }

        var achievement = new Achievement
        {
            Id = Guid.NewGuid(),
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            IconUrl = request.IconUrl,
            XpReward = request.XpReward,
            IsHidden = request.IsHidden,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Achievements.Add(achievement);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created achievement {AchievementCode}: {AchievementName}", achievement.Code, achievement.Name);

        return new AchievementDto
        {
            Id = achievement.Id,
            Code = achievement.Code,
            Name = achievement.Name,
            Description = achievement.Description,
            IconUrl = achievement.IconUrl,
            XpReward = achievement.XpReward,
            IsHidden = achievement.IsHidden,
            IsUnlocked = false,
            UnlockedAt = null
        };
    }

    public async Task<AchievementDto> UpdateAchievementAsync(Guid id, UpdateAchievementRequest request, CancellationToken cancellationToken = default)
    {
        var achievement = await _dbContext.Achievements
            .Where(a => a.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        if (achievement == null)
        {
            throw new InvalidOperationException($"Achievement with ID '{id}' not found");
        }

        // Check if code is being changed to an existing code
        if (achievement.Code != request.Code)
        {
            var existingAchievement = await _dbContext.Achievements
                .Where(a => a.Code == request.Code && a.Id != id)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingAchievement != null)
            {
                throw new InvalidOperationException($"An achievement with code '{request.Code}' already exists");
            }
        }

        achievement.Code = request.Code;
        achievement.Name = request.Name;
        achievement.Description = request.Description;
        achievement.IconUrl = request.IconUrl;
        achievement.XpReward = request.XpReward;
        achievement.IsHidden = request.IsHidden;

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated achievement {AchievementId}: {AchievementCode}", id, achievement.Code);

        return new AchievementDto
        {
            Id = achievement.Id,
            Code = achievement.Code,
            Name = achievement.Name,
            Description = achievement.Description,
            IconUrl = achievement.IconUrl,
            XpReward = achievement.XpReward,
            IsHidden = achievement.IsHidden,
            IsUnlocked = false,
            UnlockedAt = null
        };
    }

    public async Task DeleteAchievementAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var achievement = await _dbContext.Achievements
            .Where(a => a.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        if (achievement == null)
        {
            throw new InvalidOperationException($"Achievement with ID '{id}' not found");
        }

        // Check if achievement has been unlocked by any students
        var hasUnlocks = await _dbContext.StudentAchievements
            .AnyAsync(sa => sa.AchievementId == id, cancellationToken);

        if (hasUnlocks)
        {
            throw new InvalidOperationException("Cannot delete an achievement that has been unlocked by students");
        }

        _dbContext.Achievements.Remove(achievement);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted achievement {AchievementId}: {AchievementCode}", id, achievement.Code);
    }
}

