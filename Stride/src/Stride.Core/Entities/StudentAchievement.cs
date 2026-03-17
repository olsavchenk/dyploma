namespace Stride.Core.Entities;

public class StudentAchievement
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid AchievementId { get; set; }
    public DateTime UnlockedAt { get; set; }

    // Navigation properties
    public StudentProfile Student { get; set; } = null!;
    public Achievement Achievement { get; set; } = null!;
}
