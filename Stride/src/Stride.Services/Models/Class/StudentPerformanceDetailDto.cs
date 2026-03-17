namespace Stride.Services.Models.Class;

public class StudentPerformanceDetailDto
{
    public Guid StudentId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int CurrentLevel { get; set; }
    public int TotalXp { get; set; }
    public int CurrentStreak { get; set; }
    public DateTime? LastActiveDate { get; set; }
    public DateTime JoinedAt { get; set; }
    public int TotalTasksCompleted { get; set; }
    public decimal OverallAccuracy { get; set; }
    public List<TopicPerformanceDto> TopicPerformances { get; set; } = new();
}

public class TopicPerformanceDto
{
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public int CurrentDifficulty { get; set; }
    public decimal RollingAccuracy { get; set; }
    public decimal TopicMastery { get; set; }
    public int TotalAttempted { get; set; }
    public int CurrentStreak { get; set; }
    public string StreakDirection { get; set; } = string.Empty;
    public DateTime? LastActiveAt { get; set; }
}
