using Microsoft.ML.Data;

namespace Stride.Adaptive.Models;

public class TrainingDataPoint : DifficultyPredictionInput
{
    [LoadColumn(9)]
    [ColumnName("Label")]
    public float NextDifficulty { get; set; }
}
