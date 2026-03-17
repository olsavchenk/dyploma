namespace Stride.Core.Entities;

public class ClassAssignment
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
    public int MinDifficulty { get; set; } = 1;
    public int MaxDifficulty { get; set; } = 100;
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Class Class { get; set; } = null!;
    public Topic? Topic { get; set; }
}
