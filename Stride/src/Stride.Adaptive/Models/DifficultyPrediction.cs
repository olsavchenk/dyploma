namespace Stride.Adaptive.Models;

public class DifficultyPrediction
{
    public int NextDifficulty { get; set; }
    public float Confidence { get; set; }
    public string Method { get; set; } = string.Empty;
    public DifficultyPredictionInput Features { get; set; } = null!;
}
