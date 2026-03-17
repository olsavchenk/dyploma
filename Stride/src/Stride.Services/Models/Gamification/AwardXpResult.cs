namespace Stride.Services.Models.Gamification;

public class AwardXpResult
{
    public int XpEarned { get; set; }
    public int TotalXp { get; set; }
    public int PreviousLevel { get; set; }
    public int CurrentLevel { get; set; }
    public bool LeveledUp { get; set; }
    public int CurrentStreak { get; set; }
    public bool FirstTaskOfDayBonusAwarded { get; set; }
    public bool PerfectLessonBonusAwarded { get; set; }
    public int XpToNextLevel { get; set; }
    public List<UnlockedAchievementResult> UnlockedAchievements { get; set; } = new List<UnlockedAchievementResult>();
}
