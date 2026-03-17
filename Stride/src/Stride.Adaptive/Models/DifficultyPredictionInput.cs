using Microsoft.ML.Data;

namespace Stride.Adaptive.Models;

public class DifficultyPredictionInput
{
    [LoadColumn(0)]
    public float CurrentDifficulty { get; set; }

    [LoadColumn(1)]
    public float RollingAccuracy { get; set; }

    [LoadColumn(2)]
    public float CurrentStreak { get; set; }

    [LoadColumn(3)]
    public float StreakDirectionEncoded { get; set; } // -1 = losing, 0 = neutral, 1 = winning

    [LoadColumn(4)]
    public float TopicMastery { get; set; }

    [LoadColumn(5)]
    public float TotalAttempted { get; set; }

    [LoadColumn(6)]
    public float LastResponseTimeMs { get; set; }

    [LoadColumn(7)]
    public float DaysSinceLastActivity { get; set; }

    [LoadColumn(8)]
    public float LastAnswerCorrect { get; set; } // 0 or 1
}
