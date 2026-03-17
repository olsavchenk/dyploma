namespace Stride.Services.Models.Subject;

public class ContinueLearningTopicDto
{
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string? SubjectIconUrl { get; set; }
    public double Progress { get; set; }
    public DateTime LastActiveAt { get; set; }
    public int CurrentDifficulty { get; set; }
    public double MasteryLevel { get; set; }
}
