using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;
using Stride.Services.Configuration;
using Stride.Services.Implementations;
using Stride.Services.Interfaces;

namespace Stride.Services.Tests;

public class GamificationServiceTests : IDisposable
{
    private readonly StrideDbContext _dbContext;
    private readonly GamificationService _gamificationService;
    private readonly GamificationSettings _settings;

    public GamificationServiceTests()
    {
        // Setup in-memory database
        var options = new DbContextOptionsBuilder<StrideDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _dbContext = new StrideDbContext(options);

        // Setup default settings
        _settings = new GamificationSettings
        {
            Xp = new XpSettings
            {
                BaseXp = 10,
                MinDifficultyMultiplier = 1.0,
                MaxDifficultyMultiplier = 3.0,
                MinStreakMultiplier = 1.0,
                MaxStreakMultiplier = 2.0,
                StreakThresholdForBonus = 3,
                FirstTaskOfDayBonus = 50,
                PerfectLessonBonus = 100,
                PerfectLessonThreshold = 10
            },
            Level = new LevelSettings
            {
                Level1To10XpPerLevel = 100,
                Level11To25XpPerLevel = 250,
                Level26To50XpPerLevel = 500,
                Level51To100XpPerLevel = 1000
            },
            Streak = new StreakSettings
            {
                FreezeXpCost = 200,
                MaxFreezes = 2,
                RepairXpCost = 400,
                RepairWindowHours = 24
            }
        };

        _gamificationService = new GamificationService(
            _dbContext,
            Options.Create(_settings),
            Mock.Of<IAchievementService>(),
            Mock.Of<ILeaderboardService>());
    }

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }

    private async Task<StudentProfile> CreateTestStudentProfile(
        int totalXp = 0,
        int currentLevel = 1,
        int currentStreak = 0,
        int longestStreak = 0,
        int streakFreezes = 0,
        DateTime? lastActiveDate = null)
    {
        var userId = Guid.NewGuid();
        
        var user = new User
        {
            Id = userId,
            Email = $"test{userId}@example.com",
            DisplayName = "Test User",
            Role = "Student",
            CreatedAt = DateTime.UtcNow
        };

        var profile = new StudentProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TotalXp = totalXp,
            CurrentLevel = currentLevel,
            CurrentStreak = currentStreak,
            LongestStreak = longestStreak,
            StreakFreezes = streakFreezes,
            LastActiveDate = lastActiveDate,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);
        _dbContext.StudentProfiles.Add(profile);
        await _dbContext.SaveChangesAsync();

        return profile;
    }

    #region AwardXp Tests

    [Fact]
    public async Task AwardXpAsync_CorrectAnswer_AwardsBaseXp()
    {
        // Arrange
        var profile = await CreateTestStudentProfile();

        // Act
        var result = await _gamificationService.AwardXpAsync(
            profile.UserId,
            difficulty: 50,
            isCorrect: true);

        // Assert
        result.XpEarned.Should().BeGreaterThan(0);
        result.TotalXp.Should().BeGreaterThan(0);
        result.CurrentLevel.Should().Be(1);
        result.LeveledUp.Should().BeFalse();
    }

    [Fact]
    public async Task AwardXpAsync_IncorrectAnswer_AwardsNoXp()
    {
        // Arrange
        var profile = await CreateTestStudentProfile();

        // Act
        var result = await _gamificationService.AwardXpAsync(
            profile.UserId,
            difficulty: 50,
            isCorrect: false);

        // Assert
        result.XpEarned.Should().Be(0);
        result.TotalXp.Should().Be(0);
    }

    [Fact]
    public async Task AwardXpAsync_HighDifficulty_AwardsMoreXp()
    {
        // Arrange
        var profile = await CreateTestStudentProfile();

        // Act
        var lowDifficultyResult = await _gamificationService.AwardXpAsync(
            profile.UserId,
            difficulty: 10,
            isCorrect: true);

        var highDifficultyResult = await _gamificationService.AwardXpAsync(
            profile.UserId,
            difficulty: 90,
            isCorrect: true);

        // Assert
        highDifficultyResult.XpEarned.Should().BeGreaterThan(lowDifficultyResult.XpEarned);
    }

    [Fact]
    public async Task AwardXpAsync_FirstTaskOfDay_AwardsBonus()
    {
        // Arrange
        var profile = await CreateTestStudentProfile();

        // Act
        var result = await _gamificationService.AwardXpAsync(
            profile.UserId,
            difficulty: 50,
            isCorrect: true,
            isFirstTaskOfDay: true);

        // Assert
        result.FirstTaskOfDayBonusAwarded.Should().BeTrue();
        result.XpEarned.Should().BeGreaterThanOrEqualTo(_settings.Xp.FirstTaskOfDayBonus);
    }

    [Fact]
    public async Task AwardXpAsync_PerfectLesson_AwardsBonus()
    {
        // Arrange
        var profile = await CreateTestStudentProfile();

        // Act
        var result = await _gamificationService.AwardXpAsync(
            profile.UserId,
            difficulty: 50,
            isCorrect: true,
            consecutiveCorrectInSession: 10);

        // Assert
        result.PerfectLessonBonusAwarded.Should().BeTrue();
        result.XpEarned.Should().BeGreaterThanOrEqualTo(_settings.Xp.PerfectLessonBonus);
    }

    [Fact]
    public async Task AwardXpAsync_HighStreak_AppliesMultiplier()
    {
        // Arrange
        var lowStreakProfile = await CreateTestStudentProfile(currentStreak: 1);
        var highStreakProfile = await CreateTestStudentProfile(currentStreak: 10);

        // Act
        var lowStreakResult = await _gamificationService.AwardXpAsync(
            lowStreakProfile.UserId,
            difficulty: 50,
            isCorrect: true);

        var highStreakResult = await _gamificationService.AwardXpAsync(
            highStreakProfile.UserId,
            difficulty: 50,
            isCorrect: true);

        // Assert
        highStreakResult.XpEarned.Should().BeGreaterThan(lowStreakResult.XpEarned);
    }

    [Fact]
    public async Task AwardXpAsync_EnoughXp_TriggersLevelUp()
    {
        // Arrange - 95 XP puts us 5 XP away from level 2 (100 XP)
        var profile = await CreateTestStudentProfile(totalXp: 95, currentLevel: 1);

        // Act - Award enough XP to level up
        var result = await _gamificationService.AwardXpAsync(
            profile.UserId,
            difficulty: 50,
            isCorrect: true);

        // Assert
        result.LeveledUp.Should().BeTrue();
        result.PreviousLevel.Should().Be(1);
        result.CurrentLevel.Should().Be(2);
    }

    #endregion

    #region Level Calculation Tests

    [Theory]
    [InlineData(1, 0)]
    [InlineData(2, 100)]
    [InlineData(10, 900)]
    [InlineData(11, 1000)]
    [InlineData(25, 4500)]
    [InlineData(26, 4750)]
    [InlineData(50, 16750)]
    [InlineData(51, 17250)]
    [InlineData(100, 66250)]
    public void GetXpRequiredForLevel_ReturnsCorrectThresholds(int level, int expectedXp)
    {
        // Act
        var actualXp = _gamificationService.GetXpRequiredForLevel(level);

        // Assert
        actualXp.Should().Be(expectedXp);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(50, 1)]
    [InlineData(100, 2)]
    [InlineData(900, 10)]
    [InlineData(1000, 11)]
    [InlineData(4500, 25)]
    [InlineData(4750, 26)]
    [InlineData(16750, 50)]
    [InlineData(66250, 100)]
    public void CalculateLevelFromXp_ReturnsCorrectLevel(int xp, int expectedLevel)
    {
        // Act
        var actualLevel = _gamificationService.CalculateLevelFromXp(xp);

        // Assert
        actualLevel.Should().Be(expectedLevel);
    }

    #endregion

    #region Streak Tests

    [Fact]
    public async Task UpdateStreakAsync_FirstActivity_SetsStreakToOne()
    {
        // Arrange
        var profile = await CreateTestStudentProfile();

        // Act
        var result = await _gamificationService.UpdateStreakAsync(profile.UserId);

        // Assert
        result.StreakIncreased.Should().BeTrue();
        result.CurrentStreak.Should().Be(1);
        result.LongestStreak.Should().Be(1);
    }

    [Fact]
    public async Task UpdateStreakAsync_ConsecutiveDay_IncreasesStreak()
    {
        // Arrange
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);
        var profile = await CreateTestStudentProfile(
            currentStreak: 5,
            longestStreak: 5,
            lastActiveDate: yesterday);

        // Act
        var result = await _gamificationService.UpdateStreakAsync(profile.UserId);

        // Assert
        result.StreakIncreased.Should().BeTrue();
        result.CurrentStreak.Should().Be(6);
        result.LongestStreak.Should().Be(6);
    }

    [Fact]
    public async Task UpdateStreakAsync_SameDay_NoChange()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var profile = await CreateTestStudentProfile(
            currentStreak: 5,
            longestStreak: 10,
            lastActiveDate: today);

        // Act
        var result = await _gamificationService.UpdateStreakAsync(profile.UserId);

        // Assert
        result.StreakIncreased.Should().BeFalse();
        result.StreakReset.Should().BeFalse();
        result.CurrentStreak.Should().Be(5);
    }

    [Fact]
    public async Task UpdateStreakAsync_MissedDayWithFreeze_MaintainsStreak()
    {
        // Arrange
        var twoDaysAgo = DateTime.UtcNow.Date.AddDays(-2);
        var profile = await CreateTestStudentProfile(
            currentStreak: 5,
            longestStreak: 10,
            streakFreezes: 1,
            lastActiveDate: twoDaysAgo);

        // Act
        var result = await _gamificationService.UpdateStreakAsync(profile.UserId);

        // Assert
        result.FreezeUsed.Should().BeTrue();
        result.StreakReset.Should().BeFalse();
        result.CurrentStreak.Should().Be(5);
    }

    [Fact]
    public async Task UpdateStreakAsync_MissedDayWithoutFreeze_ResetsStreak()
    {
        // Arrange
        var threeDaysAgo = DateTime.UtcNow.Date.AddDays(-3);
        var profile = await CreateTestStudentProfile(
            currentStreak: 5,
            longestStreak: 10,
            streakFreezes: 0,
            lastActiveDate: threeDaysAgo);

        // Act
        var result = await _gamificationService.UpdateStreakAsync(profile.UserId);

        // Assert
        result.StreakReset.Should().BeTrue();
        result.CurrentStreak.Should().Be(1);
        result.LongestStreak.Should().Be(10); // Longest streak should remain unchanged
    }

    [Fact]
    public async Task UpdateStreakAsync_NewRecord_UpdatesLongestStreak()
    {
        // Arrange
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);
        var profile = await CreateTestStudentProfile(
            currentStreak: 10,
            longestStreak: 10,
            lastActiveDate: yesterday);

        // Act
        var result = await _gamificationService.UpdateStreakAsync(profile.UserId);

        // Assert
        result.StreakIncreased.Should().BeTrue();
        result.CurrentStreak.Should().Be(11);
        result.LongestStreak.Should().Be(11);
    }

    #endregion

    #region Purchase and Repair Tests

    [Fact]
    public async Task PurchaseStreakFreezeAsync_SufficientXp_PurchasesFreeze()
    {
        // Arrange
        var profile = await CreateTestStudentProfile(totalXp: 500, currentLevel: 5);

        // Act
        await _gamificationService.PurchaseStreakFreezeAsync(profile.UserId);

        // Assert
        var updatedProfile = await _dbContext.StudentProfiles
            .FirstAsync(sp => sp.UserId == profile.UserId);
        updatedProfile.StreakFreezes.Should().Be(1);
        updatedProfile.TotalXp.Should().Be(300); // 500 - 200
    }

    [Fact]
    public async Task PurchaseStreakFreezeAsync_InsufficientXp_ThrowsException()
    {
        // Arrange
        var profile = await CreateTestStudentProfile(totalXp: 100);

        // Act
        var act = async () => await _gamificationService.PurchaseStreakFreezeAsync(profile.UserId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Insufficient XP*");
    }

    [Fact]
    public async Task PurchaseStreakFreezeAsync_MaxFreezesReached_ThrowsException()
    {
        // Arrange
        var profile = await CreateTestStudentProfile(totalXp: 1000, streakFreezes: 2);

        // Act
        var act = async () => await _gamificationService.PurchaseStreakFreezeAsync(profile.UserId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Maximum of 2 streak freezes*");
    }

    [Fact]
    public async Task RepairStreakAsync_WithinWindow_RepairsStreak()
    {
        // Arrange - Broken streak 12 hours ago (within 24 hour window)
        var twelveHoursAgo = DateTime.UtcNow.AddHours(-12);
        var profile = await CreateTestStudentProfile(
            totalXp: 1000,
            currentStreak: 0,
            lastActiveDate: twelveHoursAgo);

        // Act
        await _gamificationService.RepairStreakAsync(profile.UserId);

        // Assert
        var updatedProfile = await _dbContext.StudentProfiles
            .FirstAsync(sp => sp.UserId == profile.UserId);
        updatedProfile.CurrentStreak.Should().Be(1);
        updatedProfile.TotalXp.Should().Be(600); // 1000 - 400
    }

    [Fact]
    public async Task RepairStreakAsync_OutsideWindow_ThrowsException()
    {
        // Arrange - Broken streak 25 hours ago (outside 24 hour window)
        var twentyFiveHoursAgo = DateTime.UtcNow.AddHours(-25);
        var profile = await CreateTestStudentProfile(
            totalXp: 1000,
            currentStreak: 0,
            lastActiveDate: twentyFiveHoursAgo);

        // Act
        var act = async () => await _gamificationService.RepairStreakAsync(profile.UserId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*can only be repaired within 24 hours*");
    }

    [Fact]
    public async Task RepairStreakAsync_StreakNotBroken_ThrowsException()
    {
        // Arrange
        var profile = await CreateTestStudentProfile(totalXp: 1000, currentStreak: 5);

        // Act
        var act = async () => await _gamificationService.RepairStreakAsync(profile.UserId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Streak is not broken*");
    }

    [Fact]
    public async Task RepairStreakAsync_InsufficientXp_ThrowsException()
    {
        // Arrange
        var twelveHoursAgo = DateTime.UtcNow.AddHours(-12);
        var profile = await CreateTestStudentProfile(
            totalXp: 100,
            currentStreak: 0,
            lastActiveDate: twelveHoursAgo);

        // Act
        var act = async () => await _gamificationService.RepairStreakAsync(profile.UserId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Insufficient XP*");
    }

    #endregion

    #region GetStats Tests

    [Fact]
    public async Task GetStatsAsync_ReturnsCorrectStats()
    {
        // Arrange
        var profile = await CreateTestStudentProfile(
            totalXp: 250,
            currentLevel: 3,
            currentStreak: 5,
            longestStreak: 10,
            streakFreezes: 1);

        // Act
        var stats = await _gamificationService.GetStatsAsync(profile.UserId);

        // Assert
        stats.TotalXp.Should().Be(250);
        stats.CurrentLevel.Should().Be(3);
        stats.CurrentStreak.Should().Be(5);
        stats.LongestStreak.Should().Be(10);
        stats.StreakFreezes.Should().Be(1);
        stats.XpToNextLevel.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetStatsAsync_NonExistentProfile_ThrowsException()
    {
        // Arrange
        var nonExistentUserId = Guid.NewGuid();

        // Act
        var act = async () => await _gamificationService.GetStatsAsync(nonExistentUserId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Student profile not found*");
    }

    #endregion
}
