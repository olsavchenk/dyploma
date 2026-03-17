namespace Stride.Services.Models.Leaderboard;

public class GetLeaderboardResponse
{
    public string League { get; set; } = "Bronze";
    public int WeekNumber { get; set; }
    public int Year { get; set; }
    public List<LeaderboardEntryDto> TopPlayers { get; set; } = new List<LeaderboardEntryDto>();
    public LeaderboardEntryDto? CurrentUserEntry { get; set; }
    public int TotalPlayers { get; set; }
    public int PromotionZoneCount { get; set; } = 10;
    public int DemotionZoneCount { get; set; } = 5;
}
