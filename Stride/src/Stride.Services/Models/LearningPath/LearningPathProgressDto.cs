namespace Stride.Services.Models.LearningPath;

public class LearningPathProgressDto
{
    public int CompletedSteps { get; set; }
    public int TotalSteps { get; set; }
    public decimal CompletionPercentage { get; set; }
    public decimal AverageMastery { get; set; }
    public Guid? NextStepTopicId { get; set; }
}
