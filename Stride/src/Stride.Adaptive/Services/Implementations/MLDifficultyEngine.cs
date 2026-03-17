using Microsoft.Extensions.Logging;
using Microsoft.Extensions.ML;
using Microsoft.Extensions.Options;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Models;
using Stride.Adaptive.Services.Interfaces;
using Stride.Core.Entities;

namespace Stride.Adaptive.Services.Implementations;

public class MLDifficultyEngine : IDifficultyEngine
{
    private readonly PredictionEnginePool<DifficultyPredictionInput, DifficultyPredictionOutput>? _predictionEnginePool;
    private readonly DifficultyEngineSettings _settings;
    private readonly ILogger<MLDifficultyEngine> _logger;

    public MLDifficultyEngine(
        PredictionEnginePool<DifficultyPredictionInput, DifficultyPredictionOutput>? predictionEnginePool,
        IOptions<DifficultyEngineSettings> settings,
        ILogger<MLDifficultyEngine> logger)
    {
        _predictionEnginePool = predictionEnginePool;
        _settings = settings.Value;
        _logger = logger;
    }

    public DifficultyPrediction PredictNextDifficulty(StudentPerformance performance, TaskAttempt? lastAttempt)
    {
        // Build input features
        var input = BuildPredictionInput(performance, lastAttempt);

        try
        {
            // Try ML prediction
            if (_predictionEnginePool != null && File.Exists(_settings.ModelFilePath))
            {
                var prediction = _predictionEnginePool.Predict(input);
                var mlDifficulty = ClampDifficulty((int)Math.Round(prediction.Score));

                // Also calculate rule-based for confidence comparison
                var ruleBasedPrediction = CalculateRuleBasedDifficulty(input);
                var confidence = CalculateConfidence(mlDifficulty, ruleBasedPrediction);

                _logger.LogDebug(
                    "ML prediction: {ML}, Rule-based: {Rule}, Confidence: {Confidence:F2}",
                    mlDifficulty, ruleBasedPrediction, confidence);

                return new DifficultyPrediction
                {
                    NextDifficulty = mlDifficulty,
                    Confidence = confidence,
                    Method = "ml",
                    Features = input
                };
            }
            else
            {
                _logger.LogWarning("ML model file not found at {Path}. Falling back to rule-based.", _settings.ModelFilePath);
                return CalculateNextDifficulty(performance, lastAttempt);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during ML prediction. Falling back to rule-based.");
            return CalculateNextDifficulty(performance, lastAttempt);
        }
    }

    public DifficultyPrediction CalculateNextDifficulty(StudentPerformance performance, TaskAttempt? lastAttempt)
    {
        _logger.LogInformation(
            "=== CalculateNextDifficulty (Rule-Based) === CurrentDifficulty: {CurrentDifficulty}, RollingAccuracy: {RollingAccuracy:F2}, Streak: {Streak} ({Direction}), TotalAttempted: {TotalAttempted}",
            performance.CurrentDifficulty, performance.RollingAccuracy, performance.CurrentStreak, 
            performance.StreakDirection, performance.TotalAttempted);

        var input = BuildPredictionInput(performance, lastAttempt);
        
        _logger.LogDebug(
            "Prediction input features - CurrentDiff: {CurrentDiff}, Accuracy: {Accuracy:F2}, Streak: {Streak}, StreakDir: {StreakDir:F1}, Mastery: {Mastery:F2}, Attempts: {Attempts}, LastResponseMs: {ResponseMs:F0}, DaysSinceActive: {Days:F1}, LastCorrect: {LastCorrect:F0}",
            input.CurrentDifficulty, input.RollingAccuracy, input.CurrentStreak, input.StreakDirectionEncoded,
            input.TopicMastery, input.TotalAttempted, input.LastResponseTimeMs, input.DaysSinceLastActivity, 
            input.LastAnswerCorrect);

        var difficulty = CalculateRuleBasedDifficulty(input);

        _logger.LogInformation(
            "✅ Rule-based difficulty calculated - NextDifficulty: {NextDifficulty}, Change: {Change:+0;-0}",
            difficulty, difficulty - performance.CurrentDifficulty);

        return new DifficultyPrediction
        {
            NextDifficulty = difficulty,
            Confidence = 1.0f, // Rule-based is deterministic
            Method = "rule-based",
            Features = input
        };
    }

    private DifficultyPredictionInput BuildPredictionInput(StudentPerformance performance, TaskAttempt? lastAttempt)
    {
        var daysSinceLastActivity = performance.LastActiveAt.HasValue
            ? (float)(DateTime.UtcNow - performance.LastActiveAt.Value).TotalDays
            : 0f;

        return new DifficultyPredictionInput
        {
            CurrentDifficulty = performance.CurrentDifficulty,
            RollingAccuracy = (float)performance.RollingAccuracy,
            CurrentStreak = performance.CurrentStreak,
            StreakDirectionEncoded = EncodeStreakDirection(performance.StreakDirection),
            TopicMastery = (float)performance.TopicMastery,
            TotalAttempted = performance.TotalAttempted,
            LastResponseTimeMs = lastAttempt?.ResponseTimeMs ?? 0f,
            DaysSinceLastActivity = daysSinceLastActivity,
            LastAnswerCorrect = lastAttempt?.IsCorrect == true ? 1f : 0f
        };
    }

    private int CalculateRuleBasedDifficulty(DifficultyPredictionInput input)
    {
        var nextDifficulty = (float)input.CurrentDifficulty;
        _logger.LogDebug("Starting difficulty calculation from base: {BaseDifficulty}", nextDifficulty);

        // Winning streak adjustment (3+ correct answers)
        if (input.StreakDirectionEncoded == 1f && input.CurrentStreak >= 3)
        {
            var increase = 5 + (input.CurrentStreak - 2) * 1; // +5 to +10
            increase = Math.Min(increase, 10);
            nextDifficulty += increase;
            _logger.LogDebug(
                "⬆️ WINNING STREAK adjustment - Streak: {Streak}, Increase: +{Increase}, New: {NewDifficulty}",
                input.CurrentStreak, increase, nextDifficulty);
        }

        // Losing streak adjustment (2+ incorrect answers)
        if (input.StreakDirectionEncoded == -1f && input.CurrentStreak >= 2)
        {
            var decrease = 10 + (input.CurrentStreak - 1) * 1; // -10 to -15
            decrease = Math.Min(decrease, 15);
            nextDifficulty -= decrease;
            _logger.LogDebug(
                "⬇️ LOSING STREAK adjustment - Streak: {Streak}, Decrease: -{Decrease}, New: {NewDifficulty}",
                input.CurrentStreak, decrease, nextDifficulty);
        }

        // Time decay (>7 days inactive)
        if (input.DaysSinceLastActivity > 7)
        {
            var decayPercent = 0.10 + ((input.DaysSinceLastActivity - 7) / 100.0); // 10% to 20%
            decayPercent = Math.Min(decayPercent, 0.20);
            var oldDifficulty = nextDifficulty;
            nextDifficulty -= (float)(nextDifficulty * decayPercent);
            _logger.LogDebug(
                "⏰ TIME DECAY adjustment - DaysSinceActive: {Days:F1}, DecayPercent: {Percent:P}, Decrease: -{Decrease:F1}, New: {NewDifficulty}",
                input.DaysSinceLastActivity, decayPercent, oldDifficulty - nextDifficulty, nextDifficulty);
        }

        // Flow zone correction (target 70-80% accuracy)
        if (input.RollingAccuracy > _settings.TargetAccuracyHigh)
        {
            // Too easy, increase difficulty
            var adjustment = (input.RollingAccuracy - (float)_settings.TargetAccuracyHigh) * 20;
            nextDifficulty += adjustment;
            _logger.LogDebug(
                "⬆️ ACCURACY adjustment (too easy) - Accuracy: {Accuracy:P}, Target: {Target:P}, Increase: +{Increase:F1}, New: {NewDifficulty}",
                input.RollingAccuracy, _settings.TargetAccuracyHigh, adjustment, nextDifficulty);
        }
        else if (input.RollingAccuracy < _settings.TargetAccuracyLow)
        {
            // Too hard, decrease difficulty
            var adjustment = ((float)_settings.TargetAccuracyLow - input.RollingAccuracy) * 20;
            nextDifficulty -= adjustment;
            _logger.LogDebug(
                "⬇️ ACCURACY adjustment (too hard) - Accuracy: {Accuracy:P}, Target: {Target:P}, Decrease: -{Decrease:F1}, New: {NewDifficulty}",
                input.RollingAccuracy, _settings.TargetAccuracyLow, adjustment, nextDifficulty);
        }
        else
        {
            _logger.LogDebug(
                "✅ ACCURACY in flow zone - Accuracy: {Accuracy:P}, Target range: [{Low:P}, {High:P}], No adjustment",
                input.RollingAccuracy, _settings.TargetAccuracyLow, _settings.TargetAccuracyHigh);
        }

        var finalDifficulty = ClampDifficulty((int)Math.Round(nextDifficulty));
        _logger.LogDebug(
            "Final difficulty after clamping - BeforeClamping: {Before:F1}, AfterClamping: {After}, Bounds: [{Min}, {Max}]",
            nextDifficulty, finalDifficulty, _settings.MinDifficulty, _settings.MaxDifficulty);

        return finalDifficulty;
    }

    private float CalculateConfidence(int mlDifficulty, int ruleBasedDifficulty)
    {
        // Calculate how close ML and rule-based predictions are
        var difference = Math.Abs(mlDifficulty - ruleBasedDifficulty);
        var maxDifference = _settings.MaxDifficulty - _settings.MinDifficulty;
        var similarity = 1.0f - ((float)difference / maxDifference);

        // If they're very close, high confidence. If far apart, low confidence.
        return Math.Max(0.3f, similarity);
    }

    private int ClampDifficulty(int difficulty)
    {
        return Math.Max(_settings.MinDifficulty, Math.Min(_settings.MaxDifficulty, difficulty));
    }

    private static float EncodeStreakDirection(string direction) => direction.ToLower() switch
    {
        "winning" => 1f,
        "losing" => -1f,
        _ => 0f
    };
}
