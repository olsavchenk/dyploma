namespace Stride.Core.Entities;

public class LeaderboardEntry
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string League { get; set; } = "Bronze";
    public int WeekNumber { get; set; }
    public int Year { get; set; }
    public int WeeklyXp { get; set; }
    public int Rank { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public StudentProfile Student { get; set; } = null!;
}
