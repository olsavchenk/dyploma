namespace Stride.Services.Models.Class;

public class AssignmentDto
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public Guid? TopicId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string TopicName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public int TaskCount { get; set; }
    public int MinDifficulty { get; set; }
    public int MaxDifficulty { get; set; }
    public DateTime CreatedAt { get; set; }
    public double CompletionRate { get; set; }
    public double AverageScore { get; set; }
    public Guid? GenerationJobId { get; set; }
}
