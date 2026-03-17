using Microsoft.Extensions.Options;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Models;
using Stride.Adaptive.Services.Interfaces;

namespace Stride.Adaptive.Services.Implementations;

public class SyntheticDataGenerator : ISyntheticDataGenerator
{
    private readonly DifficultyEngineSettings _settings;
    private readonly Random _random = new();

    public SyntheticDataGenerator(IOptions<DifficultyEngineSettings> settings)
    {
        _settings = settings.Value;
    }

    public List<TrainingDataPoint> GenerateTrainingData(int sampleCount)
    {
        var dataPoints = new List<TrainingDataPoint>();

        for (int i = 0; i < sampleCount; i++)
        {
            var dataPoint = GenerateSingleDataPoint();
            dataPoints.Add(dataPoint);
        }

        return dataPoints;
    }

    private TrainingDataPoint GenerateSingleDataPoint()
    {
        // Generate random student state
        var currentDifficulty = (float)_random.Next(_settings.MinDifficulty, _settings.MaxDifficulty + 1);
        var rollingAccuracy = (float)(_random.NextDouble() * 0.6 + 0.2); // 0.2 to 0.8
        var currentStreak = _random.Next(0, 20);
        var streakDirection = _random.Next(0, 3) - 1; // -1, 0, or 1
        var topicMastery = (float)(_random.NextDouble());
        var totalAttempted = _random.Next(1, 500);
        var lastResponseTimeMs = (float)_random.Next(500, 30000);
        var daysSinceLastActivity = (float)_random.Next(0, 30);
        var lastAnswerCorrect = _random.Next(0, 2); // 0 or 1

        // Calculate the ideal next difficulty using rule-based algorithm
        var nextDifficulty = CalculateRuleBasedDifficulty(
            currentDifficulty,
            rollingAccuracy,
            currentStreak,
            streakDirection,
            topicMastery,
            daysSinceLastActivity,
            lastAnswerCorrect
        );

        return new TrainingDataPoint
        {
            CurrentDifficulty = currentDifficulty,
            RollingAccuracy = rollingAccuracy,
            CurrentStreak = currentStreak,
            StreakDirectionEncoded = streakDirection,
            TopicMastery = topicMastery,
            TotalAttempted = totalAttempted,
            LastResponseTimeMs = lastResponseTimeMs,
            DaysSinceLastActivity = daysSinceLastActivity,
            LastAnswerCorrect = lastAnswerCorrect,
            NextDifficulty = nextDifficulty
        };
    }

    private float CalculateRuleBasedDifficulty(
        float currentDifficulty,
        float rollingAccuracy,
        int currentStreak,
        int streakDirection,
        float topicMastery,
        float daysSinceLastActivity,
        int lastAnswerCorrect)
    {
        var nextDifficulty = currentDifficulty;

        // Winning streak adjustment (3+ correct answers)
        if (streakDirection == 1 && currentStreak >= 3)
        {
            var increase = 5 + (currentStreak - 2) * 1; // +5 to +10
            increase = Math.Min(increase, 10);
            nextDifficulty += increase;
        }

        // Losing streak adjustment (2+ incorrect answers)
        if (streakDirection == -1 && currentStreak >= 2)
        {
            var decrease = 10 + (currentStreak - 1) * 1; // -10 to -15
            decrease = Math.Min(decrease, 15);
            nextDifficulty -= decrease;
        }

        // Time decay (>7 days inactive)
        if (daysSinceLastActivity > 7)
        {
            var decayPercent = 0.10 + ((daysSinceLastActivity - 7) / 100.0); // 10% to 20%
            decayPercent = Math.Min(decayPercent, 0.20);
            nextDifficulty -= (float)(nextDifficulty * decayPercent);
        }

        // Flow zone correction (target 70-80% accuracy)
        if (rollingAccuracy > _settings.TargetAccuracyHigh)
        {
            // Too easy, increase difficulty
            var adjustment = (rollingAccuracy - (float)_settings.TargetAccuracyHigh) * 20;
            nextDifficulty += adjustment;
        }
        else if (rollingAccuracy < _settings.TargetAccuracyLow)
        {
            // Too hard, decrease difficulty
            var adjustment = ((float)_settings.TargetAccuracyLow - rollingAccuracy) * 20;
            nextDifficulty -= adjustment;
        }

        // Clamp to valid range
        nextDifficulty = Math.Max(_settings.MinDifficulty, nextDifficulty);
        nextDifficulty = Math.Min(_settings.MaxDifficulty, nextDifficulty);

        return nextDifficulty;
    }
}
