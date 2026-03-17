namespace Stride.Core.Entities;

public class TaskGenerationJob
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public Guid TopicId { get; set; }
    public string Status { get; set; } = TaskGenerationStatus.Pending;
    public int TotalTasksRequested { get; set; }
    public int TasksGenerated { get; set; }
    public int TasksFailed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }

    // Navigation properties
    public ClassAssignment Assignment { get; set; } = null!;
    public Topic Topic { get; set; } = null!;
}
