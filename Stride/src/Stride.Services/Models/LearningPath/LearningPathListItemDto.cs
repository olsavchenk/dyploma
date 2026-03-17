namespace Stride.Services.Models.LearningPath;

public class LearningPathListItemDto
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int GradeLevel { get; set; }
    public int TotalSteps { get; set; }
    public LearningPathProgressDto? Progress { get; set; }
}
