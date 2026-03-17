namespace Stride.Services.Models.Leaderboard;

public class LeaderboardUpdateNotification
{
    public Guid StudentId { get; set; }
    public int OldRank { get; set; }
    public int NewRank { get; set; }
    public int WeeklyXp { get; set; }
    public string League { get; set; } = "Bronze";
}
