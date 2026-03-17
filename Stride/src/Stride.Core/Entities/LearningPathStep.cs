namespace Stride.Core.Entities;

public class LearningPathStep
{
    public Guid Id { get; set; }
    public Guid LearningPathId { get; set; }
    public Guid TopicId { get; set; }
    public int StepOrder { get; set; }

    // Navigation properties
    public LearningPath LearningPath { get; set; } = null!;
    public Topic Topic { get; set; } = null!;
}
