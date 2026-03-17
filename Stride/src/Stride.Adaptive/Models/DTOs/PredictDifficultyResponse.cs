namespace Stride.Adaptive.Models.DTOs;

public class PredictDifficultyResponse
{
    public int NextDifficulty { get; set; }
    public float Confidence { get; set; }
    public string Method { get; set; } = string.Empty;
    public StudentPerformanceDto Performance { get; set; } = null!;
}
