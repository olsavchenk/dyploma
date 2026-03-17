namespace Stride.Core.Entities;

public class Achievement
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty; // first_task, streak_7, level_10, etc.
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public int XpReward { get; set; }
    public bool IsHidden { get; set; } // Hidden until unlocked
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public ICollection<StudentAchievement> StudentAchievements { get; set; } = new List<StudentAchievement>();
}
