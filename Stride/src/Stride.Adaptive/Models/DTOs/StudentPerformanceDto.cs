namespace Stride.Adaptive.Models.DTOs;

public class StudentPerformanceDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid TopicId { get; set; }
    public int CurrentDifficulty { get; set; }
    public decimal RollingAccuracy { get; set; }
    public int CurrentStreak { get; set; }
    public string StreakDirection { get; set; } = string.Empty;
    public decimal TopicMastery { get; set; }
    public int TotalAttempted { get; set; }
    public DateTime? LastActiveAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
