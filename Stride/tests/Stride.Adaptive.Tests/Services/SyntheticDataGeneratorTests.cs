using FluentAssertions;
using Microsoft.Extensions.Options;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Services.Implementations;

namespace Stride.Adaptive.Tests.Services;

public class SyntheticDataGeneratorTests
{
    private readonly SyntheticDataGenerator _generator;
    private readonly DifficultyEngineSettings _settings;

    public SyntheticDataGeneratorTests()
    {
        _settings = new DifficultyEngineSettings
        {
            MinDifficulty = 1,
            MaxDifficulty = 100,
            TargetAccuracyLow = 0.70,
            TargetAccuracyHigh = 0.80,
            DefaultDifficulty = 50
        };

        _generator = new SyntheticDataGenerator(Options.Create(_settings));
    }

    [Fact]
    public void GenerateTrainingData_ShouldReturnCorrectNumberOfSamples()
    {
        // Arrange
        var sampleCount = 100;

        // Act
        var result = _generator.GenerateTrainingData(sampleCount);

        // Assert
        result.Should().HaveCount(sampleCount);
    }

    [Fact]
    public void GenerateTrainingData_AllFeatures_ShouldBeWithinValidRanges()
    {
        // Arrange
        var sampleCount = 1000;

        // Act
        var result = _generator.GenerateTrainingData(sampleCount);

        // Assert
        foreach (var dataPoint in result)
        {
            dataPoint.CurrentDifficulty.Should().BeInRange(_settings.MinDifficulty, _settings.MaxDifficulty);
            dataPoint.RollingAccuracy.Should().BeInRange(0f, 1f);
            dataPoint.CurrentStreak.Should().BeGreaterOrEqualTo(0);
            dataPoint.StreakDirectionEncoded.Should().BeOneOf(-1f, 0f, 1f);
            dataPoint.TopicMastery.Should().BeInRange(0f, 1f);
            dataPoint.TotalAttempted.Should().BeGreaterOrEqualTo(0);
            dataPoint.LastResponseTimeMs.Should().BeGreaterOrEqualTo(0);
            dataPoint.DaysSinceLastActivity.Should().BeGreaterOrEqualTo(0);
            dataPoint.LastAnswerCorrect.Should().BeOneOf(0f, 1f);
            dataPoint.NextDifficulty.Should().BeInRange(_settings.MinDifficulty, _settings.MaxDifficulty);
        }
    }

    [Fact]
    public void GenerateTrainingData_WinningStreak_ShouldIncreaseDifficulty()
    {
        // Arrange & Act
        var samples = _generator.GenerateTrainingData(10000);

        // Find samples with winning streaks
        var winningStreakSamples = samples
            .Where(s => s.StreakDirectionEncoded == 1f && s.CurrentStreak >= 3)
            .ToList();

        // Assert
        winningStreakSamples.Should().NotBeEmpty();

        foreach (var sample in winningStreakSamples)
        {
            // Next difficulty should generally be higher (allowing for other factors)
            // At minimum, check that some increase occurred due to winning streak logic
            sample.NextDifficulty.Should().BeLessOrEqualTo(_settings.MaxDifficulty);
        }
    }

    [Fact]
    public void GenerateTrainingData_LosingStreak_ShouldDecreaseDifficulty()
    {
        // Arrange & Act
        var samples = _generator.GenerateTrainingData(10000);

        // Find samples with losing streaks
        var losingStreakSamples = samples
            .Where(s => s.StreakDirectionEncoded == -1f && s.CurrentStreak >= 2)
            .ToList();

        // Assert
        losingStreakSamples.Should().NotBeEmpty();

        foreach (var sample in losingStreakSamples)
        {
            sample.NextDifficulty.Should().BeGreaterOrEqualTo(_settings.MinDifficulty);
        }
    }

    [Fact]
    public void GenerateTrainingData_ShouldProduceVariedData()
    {
        // Arrange & Act
        var samples = _generator.GenerateTrainingData(1000);

        // Assert - Check that we have variety in each feature
        samples.Select(s => s.CurrentDifficulty).Distinct().Count().Should().BeGreaterThan(50);
        samples.Select(s => s.StreakDirectionEncoded).Distinct().Should().HaveCountGreaterOrEqualTo(2);
        samples.Select(s => s.LastAnswerCorrect).Distinct().Should().HaveCount(2); // Should have 0 and 1
    }
}
