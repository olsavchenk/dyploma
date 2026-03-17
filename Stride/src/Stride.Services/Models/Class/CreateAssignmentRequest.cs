namespace Stride.Services.Models.Class;

public class CreateAssignmentRequest
{
    public string SubjectName { get; set; } = string.Empty;
    public string TopicName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public int TaskCount { get; set; }
    public int MinDifficulty { get; set; } = 1;
    public int MaxDifficulty { get; set; } = 100;
}
