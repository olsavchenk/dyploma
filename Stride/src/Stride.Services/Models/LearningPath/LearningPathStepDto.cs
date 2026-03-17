namespace Stride.Services.Models.LearningPath;

public class LearningPathStepDto
{
    public Guid Id { get; set; }
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public int StepOrder { get; set; }
    public bool IsCompleted { get; set; }
    public decimal Mastery { get; set; }
    public bool IsRecommendedNext { get; set; }
}
