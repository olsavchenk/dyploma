namespace Stride.Services.Models.Class;

public class StudentAssignmentDto
{
    public Guid Id { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public Guid? TopicId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string TopicName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public int TaskCount { get; set; }
    public int CompletedCount { get; set; }
    public decimal ProgressPercentage { get; set; }
    public bool IsCompleted { get; set; }
    public bool IsOverdue { get; set; }
    public DateTime CreatedAt { get; set; }
}
