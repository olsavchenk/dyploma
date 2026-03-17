namespace Stride.Services.Models.Gamification;

public class StreakUpdateResult
{
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public bool StreakIncreased { get; set; }
    public bool StreakReset { get; set; }
    public bool FreezeUsed { get; set; }
    public DateTime? LastActiveDate { get; set; }
}
