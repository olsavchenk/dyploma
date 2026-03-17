namespace Stride.Adaptive.Models.DTOs;

public class ProcessAnswerRequest
{
    public Guid StudentId { get; set; }
    public Guid TopicId { get; set; }
    public string TaskInstanceId { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int ResponseTimeMs { get; set; }
}
