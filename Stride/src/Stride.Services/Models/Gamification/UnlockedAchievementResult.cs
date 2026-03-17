namespace Stride.Services.Models.Gamification;

public class UnlockedAchievementResult
{
    public Guid AchievementId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public int XpReward { get; set; }
    public DateTime UnlockedAt { get; set; }
}
