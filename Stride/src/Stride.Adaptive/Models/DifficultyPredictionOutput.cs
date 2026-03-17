using Microsoft.ML.Data;

namespace Stride.Adaptive.Models;

public class DifficultyPredictionOutput
{
    [ColumnName("Score")]
    public float Score { get; set; }
}
