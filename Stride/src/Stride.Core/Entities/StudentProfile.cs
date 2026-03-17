namespace Stride.Core.Entities;

public class StudentProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; } = 1;
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public int StreakFreezes { get; set; }
    public DateTime? LastActiveDate { get; set; }
    public string League { get; set; } = "Bronze"; // Bronze, Silver, Gold, Platinum, Diamond
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<StudentPerformance> Performances { get; set; } = new List<StudentPerformance>();
    public ICollection<TaskAttempt> TaskAttempts { get; set; } = new List<TaskAttempt>();
    public ICollection<StudentAchievement> Achievements { get; set; } = new List<StudentAchievement>();
    public ICollection<LeaderboardEntry> LeaderboardEntries { get; set; } = new List<LeaderboardEntry>();
    public ICollection<ClassMembership> ClassMemberships { get; set; } = new List<ClassMembership>();
}
