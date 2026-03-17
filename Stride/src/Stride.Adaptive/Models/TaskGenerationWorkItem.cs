namespace Stride.Adaptive.Models;

public class TaskGenerationWorkItem
{
    public Guid JobId { get; set; }
    public Guid AssignmentId { get; set; }
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public int GradeLevel { get; set; }
    public string TaskType { get; set; } = string.Empty;
    public int DifficultyBand { get; set; }
    public int Count { get; set; }
}
