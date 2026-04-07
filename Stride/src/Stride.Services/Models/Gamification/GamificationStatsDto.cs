namespace Stride.Services.Models.Gamification;

public class GamificationStatsDto
{
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; }
    public int XpToNextLevel { get; set; }
    public int XpForCurrentLevel { get; set; }
    public int XpProgressInLevel { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public int StreakFreezes { get; set; }
    public string League { get; set; } = "Bronze";
    public DateTime? LastActiveDate { get; set; }
    public bool FirstTaskOfDayCompleted { get; set; }
    public int TasksCompleted { get; set; }
    public double Accuracy { get; set; }
}
