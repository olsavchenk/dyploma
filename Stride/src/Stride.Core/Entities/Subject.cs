namespace Stride.Core.Entities;

public class Subject
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Topic> Topics { get; set; } = new List<Topic>();
    public ICollection<LearningPath> LearningPaths { get; set; } = new List<LearningPath>();
}
