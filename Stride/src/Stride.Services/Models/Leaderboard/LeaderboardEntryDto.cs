namespace Stride.Services.Models.Leaderboard;

public class LeaderboardEntryDto
{
    public Guid StudentId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string League { get; set; } = "Bronze";
    public int WeeklyXp { get; set; }
    public int Rank { get; set; }
    public int TotalXp { get; set; }
    public int Level { get; set; }
    public bool IsCurrentUser { get; set; }
}
