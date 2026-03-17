namespace Stride.Adaptive.Models.DTOs;

public class AIBatchGenerationResponse
{
    public bool Success { get; set; }
    public List<GeneratedTask> Tasks { get; set; } = [];
    public int? TotalTokensUsed { get; set; }
    public int GenerationTimeMs { get; set; }
    public string? ErrorMessage { get; set; }
    public string? RawResponse { get; set; }
}
