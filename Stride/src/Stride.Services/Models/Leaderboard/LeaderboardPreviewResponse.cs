namespace Stride.Services.Models.Leaderboard;

public class LeaderboardPreviewResponse
{
    public string League { get; set; } = "Bronze";
    public List<LeaderboardEntryDto> TopEntries { get; set; } = new List<LeaderboardEntryDto>();
    public LeaderboardEntryDto? CurrentUserEntry { get; set; }
    public int? CurrentUserRank { get; set; }
}
