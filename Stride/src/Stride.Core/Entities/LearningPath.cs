namespace Stride.Core.Entities;

public class LearningPath
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int GradeLevel { get; set; }
    public bool IsPublished { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Subject Subject { get; set; } = null!;
    public ICollection<LearningPathStep> Steps { get; set; } = new List<LearningPathStep>();
}
