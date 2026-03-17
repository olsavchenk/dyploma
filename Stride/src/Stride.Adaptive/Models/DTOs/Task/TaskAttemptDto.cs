namespace Stride.Adaptive.Models.DTOs.Task;

public class TaskAttemptDto
{
    public Guid Id { get; set; }
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int ResponseTimeMs { get; set; }
    public int DifficultyAtTime { get; set; }
    public int XpEarned { get; set; }
    public DateTime CreatedAt { get; set; }
}
