namespace Stride.Adaptive.Models.DTOs;

public class ProcessAnswerResult
{
    public StudentPerformanceDto UpdatedPerformance { get; set; } = null!;
    public int NextDifficulty { get; set; }
    public int XpEarned { get; set; }
    public float Confidence { get; set; }
    public string PredictionMethod { get; set; } = string.Empty;
}
