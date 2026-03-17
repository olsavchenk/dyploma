namespace Stride.Services.Models.Class;

public class TaskGenerationStatusDto
{
    public Guid JobId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalTasksRequested { get; set; }
    public int TasksGenerated { get; set; }
    public int TasksFailed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
}
