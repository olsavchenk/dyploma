namespace Stride.Services.Models.Gamification;

public class AchievementDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public int XpReward { get; set; }
    public bool IsHidden { get; set; }
    public bool IsUnlocked { get; set; }
    public DateTime? UnlockedAt { get; set; }
}
