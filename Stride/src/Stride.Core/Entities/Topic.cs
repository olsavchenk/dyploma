namespace Stride.Core.Entities;

public class Topic
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public Guid? ParentTopicId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int GradeLevel { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Subject Subject { get; set; } = null!;
    public Topic? ParentTopic { get; set; }
    public ICollection<Topic> ChildTopics { get; set; } = new List<Topic>();
    public ICollection<StudentPerformance> StudentPerformances { get; set; } = new List<StudentPerformance>();
    public ICollection<TaskAttempt> TaskAttempts { get; set; } = new List<TaskAttempt>();
    public ICollection<LearningPathStep> LearningPathSteps { get; set; } = new List<LearningPathStep>();
    public ICollection<ClassAssignment> ClassAssignments { get; set; } = new List<ClassAssignment>();
}
