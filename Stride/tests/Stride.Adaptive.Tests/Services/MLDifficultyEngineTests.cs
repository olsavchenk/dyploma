using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.ML;
using Microsoft.Extensions.Options;
using Moq;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Models;
using Stride.Adaptive.Services.Implementations;
using Stride.Core.Entities;

namespace Stride.Adaptive.Tests.Services;

/// <summary>
/// Comprehensive tests for MLDifficultyEngine covering rule-based difficulty calculation.
/// Tests winning streaks, losing streaks, time decay, flow zone accuracy, and combined effects.
/// US-040: DifficultyEngine unit tests
/// </summary>
public class MLDifficultyEngineTests
{
    private readonly DifficultyEngineSettings _settings;
    private readonly Mock<ILogger<MLDifficultyEngine>> _loggerMock;

    public MLDifficultyEngineTests()
    {
        _settings = new DifficultyEngineSettings
        {
            MinDifficulty = 1,
            MaxDifficulty = 100,
            TargetAccuracyLow = 0.70,
            TargetAccuracyHigh = 0.80,
            DefaultDifficulty = 50
        };

        _loggerMock = new Mock<ILogger<MLDifficultyEngine>>();
    }

    private MLDifficultyEngine CreateEngine()
    {
        return new MLDifficultyEngine(
            null, // No ML model for rule-based tests
            Options.Create(_settings),
            _loggerMock.Object);
    }

    #region Winning Streak Tests

    [Fact]
    public void CalculateNextDifficulty_WinningStreak3_IncreasesDifficulty()
    {
        // Arrange
        var engine = CreateEngine();
        var performance = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 3,
            StreakDirection = "Winning",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow
        };

        // Act
        var result = engine.CalculateNextDifficulty(performance, null);

        // Assert
        result.NextDifficulty.Should().BeGreaterThan(50);
        result.Method.Should().Be("rule-based");
        result.Confidence.Should().Be(1.0f);
    }

    [Fact]
    public void CalculateNextDifficulty_WinningStreak5_IncreasesMoreThanStreak3()
    {
        // Arrange
        var engine = CreateEngine();
        var performanceStreak3 = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 3,
            StreakDirection = "Winning",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow
        };

        var performanceStreak5 = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 5,
            StreakDirection = "Winning",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow
        };

        // Act
        var resultStreak3 = engine.CalculateNextDifficulty(performanceStreak3, null);
        var resultStreak5 = engine.CalculateNextDifficulty(performanceStreak5, null);

        // Assert
        resultStreak5.NextDifficulty.Should().BeGreaterThan(resultStreak3.NextDifficulty);
    }

    [Fact]
    public void CalculateNextDifficulty_WinningStreakLessThan3_NoStreakBonus()
    {
        // Arrange
        var engine = CreateEngine();
        var performanceNoStreak = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 0,
            StreakDirection = "None",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow
        };

        var performanceStreak2 = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 2,
            StreakDirection = "Winning",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow
        };

        // Act
        var resultNoStreak = engine.CalculateNextDifficulty(performanceNoStreak, null);
        var resultStreak2 = engine.CalculateNextDifficulty(performanceStreak2, null);

        // Assert
        // Both should be approximately the same since winning streak bonus only applies at 3+
        Math.Abs(resultStreak2.NextDifficulty - resultNoStreak.NextDifficulty).Should().BeLessThan(3);
    }

    #endregion

    #region Losing Streak Tests

    [Fact]
    public void CalculateNextDifficulty_LosingStreak2_DecreasesDifficulty()
    {
        // Arrange
        var engine = CreateEngine();
        var performance = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 2,
            StreakDirection = "Losing",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow
        };

        // Act
        var result = engine.CalculateNextDifficulty(performance, null);

        // Assert
        result.NextDifficulty.Should().BeLessThan(50);
    }

    [Fact]
    public void CalculateNextDifficulty_LosingStreak4_DecreasesMoreThanStreak2()
    {
        // Arrange
        var engine = CreateEngine();
        var performanceStreak2 = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 2,
            StreakDirection = "Losing",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow
        };

        var performanceStreak4 = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 4,
            StreakDirection = "Losing",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow
        };

        // Act
        var resultStreak2 = engine.CalculateNextDifficulty(performanceStreak2, null);
        var resultStreak4 = engine.CalculateNextDifficulty(performanceStreak4, null);

        // Assert
        resultStreak4.NextDifficulty.Should().BeLessThan(resultStreak2.NextDifficulty);
    }

    #endregion

    #region Time Decay Tests

    [Fact]
    public void CalculateNextDifficulty_Inactive8Days_AppliesDecay()
    {
        // Arrange
        var engine = CreateEngine();
        var performance = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 0,
            StreakDirection = "None",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow.AddDays(-8)
        };

        // Act
        var result = engine.CalculateNextDifficulty(performance, null);

        // Assert
        result.NextDifficulty.Should().BeLessThan(50);
    }

    [Fact]
    public void CalculateNextDifficulty_Inactive14Days_AppliesMoreDecayThan8Days()
    {
        // Arrange
        var engine = CreateEngine();
        var performance8Days = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 0,
            StreakDirection = "None",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow.AddDays(-8)
        };

        var performance14Days = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 0,
            StreakDirection = "None",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow.AddDays(-14)
        };

        // Act
        var result8Days = engine.CalculateNextDifficulty(performance8Days, null);
        var result14Days = engine.CalculateNextDifficulty(performance14Days, null);

        // Assert
        result14Days.NextDifficulty.Should().BeLessThan(result8Days.NextDifficulty);
    }

    [Fact]
    public void CalculateNextDifficulty_Inactive5Days_NoDecay()
    {
        // Arrange
        var engine = CreateEngine();
        var performanceRecent = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 0,
            StreakDirection = "None",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow
        };

        var performance5Days = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 0,
            StreakDirection = "None",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow.AddDays(-5)
        };

        // Act
        var resultRecent = engine.CalculateNextDifficulty(performanceRecent, null);
        var result5Days = engine.CalculateNextDifficulty(performance5Days, null);

        // Assert
        // Should be the same or very close since decay only applies after 7 days
        Math.Abs(result5Days.NextDifficulty - resultRecent.NextDifficulty).Should().BeLessThan(2);
    }

    #endregion

    #region Flow Zone Tests

    [Fact]
    public void CalculateNextDifficulty_AccuracyTooHigh_IncreasesDifficulty()
    {
        // Arrange
        var engine = CreateEngine();
        var performance = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.90m, // Above target high of 0.80
            CurrentStreak = 0,
            StreakDirection = "None",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow
        };

        // Act
        var result = engine.CalculateNextDifficulty(performance, null);

        // Assert
        result.NextDifficulty.Should().BeGreaterThan(50);
    }

    [Fact]
    public void CalculateNextDifficulty_AccuracyTooLow_DecreasesDifficulty()
    {
        // Arrange
        var engine = CreateEngine();
        var performance = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.60m, // Below target low of 0.70
            CurrentStreak = 0,
            StreakDirection = "None",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow
        };

        // Act
        var result = engine.CalculateNextDifficulty(performance, null);

        // Assert
        result.NextDifficulty.Should().BeLessThan(50);
    }

    [Fact]
    public void CalculateNextDifficulty_AccuracyInFlowZone_MinimalChange()
    {
        // Arrange
        var engine = CreateEngine();
        var performance = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m, // In target range [0.70, 0.80]
            CurrentStreak = 0,
            StreakDirection = "None",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow
        };

        // Act
        var result = engine.CalculateNextDifficulty(performance, null);

        // Assert
        // Should be very close to current difficulty
        Math.Abs(result.NextDifficulty - 50).Should().BeLessThan(5);
    }

    #endregion

    #region Clamping Tests

    [Fact]
    public void CalculateNextDifficulty_WouldExceedMax_ClampsToMax()
    {
        // Arrange
        var engine = CreateEngine();
        var performance = new StudentPerformance
        {
            CurrentDifficulty = 95,
            RollingAccuracy = 0.95m, // Too high, would push over 100
            CurrentStreak = 10,
            StreakDirection = "Winning",
            TopicMastery = 0.9m,
            TotalAttempted = 50,
            LastActiveAt = DateTime.UtcNow
        };

        // Act
        var result = engine.CalculateNextDifficulty(performance, null);

        // Assert
        result.NextDifficulty.Should().Be(100);
    }

    [Fact]
    public void CalculateNextDifficulty_WouldGoBelowMin_ClampsToMin()
    {
        // Arrange
        var engine = CreateEngine();
        var performance = new StudentPerformance
        {
            CurrentDifficulty = 5,
            RollingAccuracy = 0.40m, // Too low, would push below 1
            CurrentStreak = 5,
            StreakDirection = "Losing",
            TopicMastery = 0.1m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow.AddDays(-20)
        };

        // Act
        var result = engine.CalculateNextDifficulty(performance, null);

        // Assert
        result.NextDifficulty.Should().Be(1);
    }

    #endregion

    #region Combined Effects Tests

    [Fact]
    public void CalculateNextDifficulty_WinningStreakAndHighAccuracy_SignificantIncrease()
    {
        // Arrange
        var engine = CreateEngine();
        var performance = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.90m, // High accuracy
            CurrentStreak = 5, // Good winning streak
            StreakDirection = "Winning",
            TopicMastery = 0.6m,
            TotalAttempted = 20,
            LastActiveAt = DateTime.UtcNow
        };

        // Act
        var result = engine.CalculateNextDifficulty(performance, null);

        // Assert
        // Both factors should push difficulty up significantly
        result.NextDifficulty.Should().BeGreaterOrEqualTo(60);
    }

    [Fact]
    public void CalculateNextDifficulty_LosingStreakAndLowAccuracy_SignificantDecrease()
    {
        // Arrange
        var engine = CreateEngine();
        var performance = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.50m, // Low accuracy
            CurrentStreak = 4, // Long losing streak
            StreakDirection = "Losing",
            TopicMastery = 0.3m,
            TotalAttempted = 20,
            LastActiveAt = DateTime.UtcNow
        };

        // Act
        var result = engine.CalculateNextDifficulty(performance, null);

        // Assert
        // Both factors should push difficulty down significantly
        result.NextDifficulty.Should().BeLessThan(35);
    }

    #endregion

    #region Edge Cases

    [Fact]
    public void CalculateNextDifficulty_NewStudent_HandlesGracefully()
    {
        // Arrange
        var engine = CreateEngine();
        var performance = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0m,
            CurrentStreak = 0,
            StreakDirection = "None",
            TopicMastery = 0m,
            TotalAttempted = 0,
            LastActiveAt = null
        };

        // Act
        var result = engine.CalculateNextDifficulty(performance, null);

        // Assert
        result.NextDifficulty.Should().BeInRange(_settings.MinDifficulty, _settings.MaxDifficulty);
        result.Method.Should().Be("rule-based");
    }

    [Fact]
    public void PredictNextDifficulty_NoMLModel_FallsBackToRuleBased()
    {
        // Arrange
        var engine = CreateEngine();
        var performance = new StudentPerformance
        {
            CurrentDifficulty = 50,
            RollingAccuracy = 0.75m,
            CurrentStreak = 0,
            StreakDirection = "None",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            LastActiveAt = DateTime.UtcNow
        };

        // Act
        var result = engine.PredictNextDifficulty(performance, null);

        // Assert
        result.Method.Should().Be("rule-based");
        result.Confidence.Should().Be(1.0f);
    }

    #endregion
}
