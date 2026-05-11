namespace Stride.Services.Models.Class;

public class RecentActivityDto
{
    public Guid AttemptId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? StudentAvatar { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string TopicName { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public DateTime AttemptedAt { get; set; }
}
