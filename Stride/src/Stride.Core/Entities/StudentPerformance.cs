namespace Stride.Core.Entities;

public class StudentPerformance
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid TopicId { get; set; }
    public int CurrentDifficulty { get; set; } = 50; // 1-100 scale
    public decimal RollingAccuracy { get; set; } // 0.0-1.0
    public int CurrentStreak { get; set; }
    public string StreakDirection { get; set; } = "neutral"; // winning, losing, neutral
    public decimal TopicMastery { get; set; } // 0.0-1.0
    public int TotalAttempted { get; set; }
    public DateTime? LastActiveAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public StudentProfile Student { get; set; } = null!;
    public Topic Topic { get; set; } = null!;
}
