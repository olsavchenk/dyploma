namespace Stride.Core.Entities;

public class TaskAttempt
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string TaskInstanceId { get; set; } = string.Empty; // MongoDB reference
    public Guid TopicId { get; set; }
    public bool IsCorrect { get; set; }
    public int ResponseTimeMs { get; set; }
    public int DifficultyAtTime { get; set; }
    public int XpEarned { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public StudentProfile Student { get; set; } = null!;
    public Topic Topic { get; set; } = null!;
}
