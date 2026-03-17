using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;
using Stride.Services.Configuration;
using Stride.Services.Interfaces;
using Stride.Services.Models.Gamification;

namespace Stride.Services.Implementations;

public class GamificationService : IGamificationService
{
    private readonly StrideDbContext _dbContext;
    private readonly GamificationSettings _settings;
    private readonly IAchievementService _achievementService;
    private readonly ILeaderboardService _leaderboardService;
    private readonly ILogger<GamificationService> _logger;

    public GamificationService(
        StrideDbContext dbContext,
        IOptions<GamificationSettings> settings,
        IAchievementService achievementService,
        ILeaderboardService leaderboardService,
        ILogger<GamificationService> logger)
    {
        _dbContext = dbContext;
        _settings = settings.Value;
        _achievementService = achievementService;
        _leaderboardService = leaderboardService;
        _logger = logger;
    }

    public async Task<AwardXpResult> AwardXpAsync(
        Guid studentId,
        int difficulty,
        bool isCorrect,
        bool isFirstTaskOfDay = false,
        int consecutiveCorrectInSession = 0,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Starting {Method} for StudentId={StudentId}, Difficulty={Difficulty}, IsCorrect={IsCorrect}, IsFirstTaskOfDay={IsFirstTaskOfDay}, ConsecutiveCorrect={ConsecutiveCorrect}",
            nameof(AwardXpAsync), studentId, difficulty, isCorrect, isFirstTaskOfDay, consecutiveCorrectInSession);
        var studentProfile = await _dbContext.StudentProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == studentId, cancellationToken);

        if (studentProfile == null)
        {
            _logger.LogWarning("{Method} failed: Student profile not found StudentId={StudentId}",
                nameof(AwardXpAsync), studentId);
            throw new InvalidOperationException("Student profile not found");
        }

        var previousLevel = studentProfile.CurrentLevel;
        var previousXp = studentProfile.TotalXp;

        _logger.LogDebug("{Method}: Current state PreviousXp={PreviousXp}, PreviousLevel={PreviousLevel}, CurrentStreak={CurrentStreak}",
            nameof(AwardXpAsync), previousXp, previousLevel, studentProfile.CurrentStreak);

        // Calculate base XP
        int xpEarned = 0;

        if (isCorrect)
        {
            // Base XP
            xpEarned = _settings.Xp.BaseXp;

            // Apply difficulty multiplier (1-3x based on difficulty 1-100)
            var difficultyMultiplier = CalculateDifficultyMultiplier(difficulty);
            xpEarned = (int)(xpEarned * difficultyMultiplier);

            // Apply streak multiplier (1-2x based on streak)
            var streakMultiplier = CalculateStreakMultiplier(studentProfile.CurrentStreak);
            xpEarned = (int)(xpEarned * streakMultiplier);

            // First task of day bonus
            bool firstTaskBonus = false;
            if (isFirstTaskOfDay)
            {
                xpEarned += _settings.Xp.FirstTaskOfDayBonus;
                firstTaskBonus = true;
            }

            // Perfect lesson bonus (10+ consecutive correct)
            bool perfectLessonBonus = false;
            if (consecutiveCorrectInSession >= _settings.Xp.PerfectLessonThreshold)
            {
                xpEarned += _settings.Xp.PerfectLessonBonus;
                perfectLessonBonus = true;
            }

            // Update student profile
            studentProfile.TotalXp += xpEarned;
            studentProfile.CurrentLevel = CalculateLevelFromXp(studentProfile.TotalXp);

            // Update last active date
            studentProfile.LastActiveDate = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Update leaderboard with earned XP
            await _leaderboardService.UpdateWeeklyXpAsync(studentId, xpEarned, cancellationToken);

            // Check for newly unlocked achievements
            var unlockedAchievements = await _achievementService.CheckAndUnlockAsync(studentId, cancellationToken);

            if (unlockedAchievements?.Count > 0)
            {
                _logger.LogInformation("{Method}: Unlocked {AchievementCount} achievements for StudentId={StudentId}",
                    nameof(AwardXpAsync), unlockedAchievements.Count, studentId);
            }

            var xpForNextLevel = GetXpRequiredForLevel(studentProfile.CurrentLevel + 1);
            var xpToNextLevel = xpForNextLevel - studentProfile.TotalXp;

            return new AwardXpResult
            {
                XpEarned = xpEarned,
                TotalXp = studentProfile.TotalXp,
                PreviousLevel = previousLevel,
                CurrentLevel = studentProfile.CurrentLevel,
                LeveledUp = studentProfile.CurrentLevel > previousLevel,
                CurrentStreak = studentProfile.CurrentStreak,
                FirstTaskOfDayBonusAwarded = firstTaskBonus,
                PerfectLessonBonusAwarded = perfectLessonBonus,
                XpToNextLevel = xpToNextLevel > 0 ? xpToNextLevel : 0,
                UnlockedAchievements = unlockedAchievements
            };
        }
        else
        {
            // No XP for incorrect answers
            studentProfile.LastActiveDate = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);

            var xpForNextLevel = GetXpRequiredForLevel(studentProfile.CurrentLevel + 1);
            var xpToNextLevel = xpForNextLevel - studentProfile.TotalXp;

            _logger.LogDebug("{Method}: Incorrect answer, no XP awarded for StudentId={StudentId}",
                nameof(AwardXpAsync), studentId);

            return new AwardXpResult
            {
                XpEarned = 0,
                TotalXp = studentProfile.TotalXp,
                PreviousLevel = previousLevel,
                CurrentLevel = studentProfile.CurrentLevel,
                LeveledUp = false,
                CurrentStreak = studentProfile.CurrentStreak,
                FirstTaskOfDayBonusAwarded = false,
                PerfectLessonBonusAwarded = false,
                XpToNextLevel = xpToNextLevel > 0 ? xpToNextLevel : 0
            };
        }
    }

    public async Task<GamificationStatsDto> GetStatsAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Starting {Method} for StudentId={StudentId}",
            nameof(GetStatsAsync), studentId);
        var studentProfile = await _dbContext.StudentProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == studentId, cancellationToken);

        if (studentProfile == null)
        {
            _logger.LogWarning("{Method} failed: Student profile not found StudentId={StudentId}",
                nameof(GetStatsAsync), studentId);
            throw new InvalidOperationException("Student profile not found");
        }

        var currentLevelXp = GetXpRequiredForLevel(studentProfile.CurrentLevel);
        var nextLevelXp = GetXpRequiredForLevel(studentProfile.CurrentLevel + 1);
        var xpProgressInLevel = studentProfile.TotalXp - currentLevelXp;

        _logger.LogDebug("{Method} completed: StudentId={StudentId}, Level={Level}, TotalXp={TotalXp}, Streak={Streak}",
            nameof(GetStatsAsync), studentId, studentProfile.CurrentLevel, studentProfile.TotalXp, studentProfile.CurrentStreak);

        return new GamificationStatsDto
        {
            TotalXp = studentProfile.TotalXp,
            CurrentLevel = studentProfile.CurrentLevel,
            XpToNextLevel = nextLevelXp - studentProfile.TotalXp,
            XpForCurrentLevel = nextLevelXp - currentLevelXp,
            XpProgressInLevel = xpProgressInLevel,
            CurrentStreak = studentProfile.CurrentStreak,
            LongestStreak = studentProfile.LongestStreak,
            StreakFreezes = studentProfile.StreakFreezes,
            League = studentProfile.League,
            LastActiveDate = studentProfile.LastActiveDate
        };
    }

    public async Task<StreakUpdateResult> UpdateStreakAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Starting {Method} for StudentId={StudentId}",
            nameof(UpdateStreakAsync), studentId);

        var studentProfile = await _dbContext.StudentProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == studentId, cancellationToken);

        if (studentProfile == null)
        {
            _logger.LogWarning("{Method} failed: Student profile not found StudentId={StudentId}",
                nameof(UpdateStreakAsync), studentId);
            throw new InvalidOperationException("Student profile not found");
        }

        _logger.LogDebug("{Method}: Current streak state CurrentStreak={CurrentStreak}, LastActiveDate={LastActiveDate}",
            nameof(UpdateStreakAsync), studentProfile.CurrentStreak, studentProfile.LastActiveDate);

        var result = new StreakUpdateResult
        {
            CurrentStreak = studentProfile.CurrentStreak,
            LongestStreak = studentProfile.LongestStreak,
            StreakIncreased = false,
            StreakReset = false,
            FreezeUsed = false,
            LastActiveDate = studentProfile.LastActiveDate
        };

        var today = DateTime.UtcNow.Date;
        var lastActiveDate = studentProfile.LastActiveDate?.Date;

        // First activity ever
        if (!lastActiveDate.HasValue)
        {
            studentProfile.CurrentStreak = 1;
            studentProfile.LongestStreak = 1;
            studentProfile.LastActiveDate = DateTime.UtcNow;
            result.StreakIncreased = true;
            result.CurrentStreak = 1;
            result.LongestStreak = 1;
        }
        // Activity on consecutive day
        else if (lastActiveDate.Value.AddDays(1) == today)
        {
            studentProfile.CurrentStreak++;
            studentProfile.LastActiveDate = DateTime.UtcNow;

            if (studentProfile.CurrentStreak > studentProfile.LongestStreak)
            {
                studentProfile.LongestStreak = studentProfile.CurrentStreak;
            }

            result.StreakIncreased = true;
            result.CurrentStreak = studentProfile.CurrentStreak;
            result.LongestStreak = studentProfile.LongestStreak;
        }
        // Activity on same day - no change
        else if (lastActiveDate.Value == today)
        {
            // No change needed
            result.CurrentStreak = studentProfile.CurrentStreak;
            result.LongestStreak = studentProfile.LongestStreak;
        }
        // Missed a day or more
        else
        {
            var daysSinceLastActive = (today - lastActiveDate.Value).Days;

            // Try to use a freeze (can save streak if missed exactly 1 day)
            if (daysSinceLastActive == 2 && studentProfile.StreakFreezes > 0)
            {
                studentProfile.StreakFreezes--;
                studentProfile.LastActiveDate = DateTime.UtcNow;
                result.FreezeUsed = true;
                result.CurrentStreak = studentProfile.CurrentStreak;
                result.LongestStreak = studentProfile.LongestStreak;
            }
            else
            {
                // Reset streak
                studentProfile.CurrentStreak = 1;
                studentProfile.LastActiveDate = DateTime.UtcNow;
                result.StreakReset = true;
                result.CurrentStreak = 1;
                result.LongestStreak = studentProfile.LongestStreak;
            }
        }

        result.LastActiveDate = studentProfile.LastActiveDate;
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("{Method} completed: StudentId={StudentId}, CurrentStreak={CurrentStreak}, StreakIncreased={StreakIncreased}, StreakReset={StreakReset}, FreezeUsed={FreezeUsed}",
            nameof(UpdateStreakAsync), studentId, result.CurrentStreak, result.StreakIncreased, result.StreakReset, result.FreezeUsed);

        return result;
    }

    public async Task PurchaseStreakFreezeAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Starting {Method} for StudentId={StudentId}",
            nameof(PurchaseStreakFreezeAsync), studentId);
        var studentProfile = await _dbContext.StudentProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == studentId, cancellationToken);

        if (studentProfile == null)
        {
            throw new InvalidOperationException("Student profile not found");
        }

        if (studentProfile.StreakFreezes >= _settings.Streak.MaxFreezes)
        {
            _logger.LogWarning("{Method} failed: Max freezes reached StudentId={StudentId}, CurrentFreezes={CurrentFreezes}, MaxFreezes={MaxFreezes}",
                nameof(PurchaseStreakFreezeAsync), studentId, studentProfile.StreakFreezes, _settings.Streak.MaxFreezes);
            throw new InvalidOperationException($"Maximum of {_settings.Streak.MaxFreezes} streak freezes can be held");
        }

        if (studentProfile.TotalXp < _settings.Streak.FreezeXpCost)
        {
            _logger.LogWarning("{Method} failed: Insufficient XP StudentId={StudentId}, TotalXp={TotalXp}, Cost={Cost}",
                nameof(PurchaseStreakFreezeAsync), studentId, studentProfile.TotalXp, _settings.Streak.FreezeXpCost);
            throw new InvalidOperationException($"Insufficient XP. Requires {_settings.Streak.FreezeXpCost} XP");
        }

        studentProfile.TotalXp -= _settings.Streak.FreezeXpCost;
        studentProfile.StreakFreezes++;

        // Recalculate level after XP deduction
        studentProfile.CurrentLevel = CalculateLevelFromXp(studentProfile.TotalXp);

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("{Method} completed: StudentId={StudentId}, NewFreezeCount={FreezeCount}, RemainingXp={RemainingXp}",
            nameof(PurchaseStreakFreezeAsync), studentId, studentProfile.StreakFreezes, studentProfile.TotalXp);
    }

    public async Task RepairStreakAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Starting {Method} for StudentId={StudentId}",
            nameof(RepairStreakAsync), studentId);
        var studentProfile = await _dbContext.StudentProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == studentId, cancellationToken);

        if (studentProfile == null)
        {
            throw new InvalidOperationException("Student profile not found");
        }

        // Check if streak is actually broken
        if (studentProfile.CurrentStreak > 1)
        {
            _logger.LogWarning("{Method} failed: Streak not broken StudentId={StudentId}, CurrentStreak={CurrentStreak}",
                nameof(RepairStreakAsync), studentId, studentProfile.CurrentStreak);
            throw new InvalidOperationException("Streak is not broken");
        }

        var hoursSinceLastActive = studentProfile.LastActiveDate.HasValue
            ? (DateTime.UtcNow - studentProfile.LastActiveDate.Value).TotalHours
            : double.MaxValue;

        if (hoursSinceLastActive > _settings.Streak.RepairWindowHours)
        {
            _logger.LogWarning("{Method} failed: Repair window expired StudentId={StudentId}, HoursSinceActive={Hours}, RepairWindowHours={Window}",
                nameof(RepairStreakAsync), studentId, hoursSinceLastActive, _settings.Streak.RepairWindowHours);
            throw new InvalidOperationException(
                $"Streak can only be repaired within {_settings.Streak.RepairWindowHours} hours of breaking");
        }

        if (studentProfile.TotalXp < _settings.Streak.RepairXpCost)
        {
            _logger.LogWarning("{Method} failed: Insufficient XP StudentId={StudentId}, TotalXp={TotalXp}, Cost={Cost}",
                nameof(RepairStreakAsync), studentId, studentProfile.TotalXp, _settings.Streak.RepairXpCost);
            throw new InvalidOperationException($"Insufficient XP. Requires {_settings.Streak.RepairXpCost} XP");
        }

        studentProfile.TotalXp -= _settings.Streak.RepairXpCost;

        // Restore the streak to 1 (fresh start after repair)
        studentProfile.CurrentStreak = 1;
        studentProfile.LastActiveDate = DateTime.UtcNow;

        // Recalculate level after XP deduction
        studentProfile.CurrentLevel = CalculateLevelFromXp(studentProfile.TotalXp);

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("{Method} completed: Streak repaired for StudentId={StudentId}, RemainingXp={RemainingXp}",
            nameof(RepairStreakAsync), studentId, studentProfile.TotalXp);
    }

    public int GetXpRequiredForLevel(int level)
    {
        if (level <= 1) return 0;

        int totalXp = 0;

        // Levels 2-10: 100 XP each
        if (level <= 10)
        {
            totalXp = (level - 1) * _settings.Level.Level1To10XpPerLevel;
        }
        // Levels 11-25: 250 XP each
        else if (level <= 25)
        {
            totalXp = 10 * _settings.Level.Level1To10XpPerLevel;
            totalXp += (level - 11) * _settings.Level.Level11To25XpPerLevel;
        }
        // Levels 26-50: 500 XP each
        else if (level <= 50)
        {
            totalXp = 10 * _settings.Level.Level1To10XpPerLevel;
            totalXp += 15 * _settings.Level.Level11To25XpPerLevel;
            totalXp += (level - 26) * _settings.Level.Level26To50XpPerLevel;
        }
        // Levels 51-100: 1000 XP each
        else if (level <= 100)
        {
            totalXp = 10 * _settings.Level.Level1To10XpPerLevel;
            totalXp += 15 * _settings.Level.Level11To25XpPerLevel;
            totalXp += 25 * _settings.Level.Level26To50XpPerLevel;
            totalXp += (level - 51) * _settings.Level.Level51To100XpPerLevel;
        }
        // Levels beyond 100: continue at 1000 XP per level
        else
        {
            totalXp = 10 * _settings.Level.Level1To10XpPerLevel;
            totalXp += 15 * _settings.Level.Level11To25XpPerLevel;
            totalXp += 25 * _settings.Level.Level26To50XpPerLevel;
            totalXp += 50 * _settings.Level.Level51To100XpPerLevel;
            totalXp += (level - 101) * _settings.Level.Level51To100XpPerLevel;
        }

        return totalXp;
    }

    public int CalculateLevelFromXp(int totalXp)
    {
        if (totalXp < 0) return 1;

        int level = 1;

        // Check levels 1-10
        int xpThreshold = 10 * _settings.Level.Level1To10XpPerLevel;
        if (totalXp < xpThreshold)
        {
            return Math.Max(1, (totalXp / _settings.Level.Level1To10XpPerLevel) + 1);
        }
        level = 11;
        totalXp -= xpThreshold;

        // Check levels 11-25
        xpThreshold = 15 * _settings.Level.Level11To25XpPerLevel;
        if (totalXp < xpThreshold)
        {
            return level + (totalXp / _settings.Level.Level11To25XpPerLevel);
        }
        level = 26;
        totalXp -= xpThreshold;

        // Check levels 26-50
        xpThreshold = 25 * _settings.Level.Level26To50XpPerLevel;
        if (totalXp < xpThreshold)
        {
            return level + (totalXp / _settings.Level.Level26To50XpPerLevel);
        }
        level = 51;
        totalXp -= xpThreshold;

        // Levels 51+
        return level + (totalXp / _settings.Level.Level51To100XpPerLevel);
    }

    private double CalculateDifficultyMultiplier(int difficulty)
    {
        // Normalize difficulty from 1-100 to 0-1
        var normalizedDifficulty = Math.Clamp(difficulty / 100.0, 0.0, 1.0);

        // Linear interpolation between min and max multipliers
        return _settings.Xp.MinDifficultyMultiplier +
               (normalizedDifficulty * (_settings.Xp.MaxDifficultyMultiplier - _settings.Xp.MinDifficultyMultiplier));
    }

    private double CalculateStreakMultiplier(int currentStreak)
    {
        if (currentStreak < _settings.Xp.StreakThresholdForBonus)
        {
            return _settings.Xp.MinStreakMultiplier;
        }

        // Progressive bonus: starts at min, grows to max over 30 days
        var streakProgress = Math.Min((currentStreak - _settings.Xp.StreakThresholdForBonus) / 27.0, 1.0);

        return _settings.Xp.MinStreakMultiplier +
               (streakProgress * (_settings.Xp.MaxStreakMultiplier - _settings.Xp.MinStreakMultiplier));
    }
}
