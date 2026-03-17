namespace Stride.Adaptive.Models.DTOs;

public class AIBatchGenerationRequest
{
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string TaskType { get; set; } = string.Empty;
    public int DifficultyBand { get; set; }
    public int GradeLevel { get; set; }
    public int Count { get; set; } = 5;
}
