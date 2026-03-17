using Stride.Services.Interfaces;
using Stride.Services.Models.Leaderboard;

namespace Stride.Services.Implementations;

public class NoOpLeaderboardService : ILeaderboardService
{
    public Task<GetLeaderboardResponse> GetLeaderboardAsync(Guid studentId, string league, CancellationToken cancellationToken = default)
    {
        var response = new GetLeaderboardResponse
        {
            League = league,
            TopPlayers = [],
            CurrentUserEntry = new LeaderboardEntryDto
            {
                StudentId = studentId,
                Rank = 1,
                WeeklyXp = 0
            },
            TotalPlayers = 0,
            WeekNumber = GetCurrentWeek().weekNumber,
            Year = GetCurrentWeek().year
        };
        return Task.FromResult(response);
    }

    public Task UpdateWeeklyXpAsync(Guid studentId, int xpToAdd, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task<PromotionDemotionResult> ProcessWeeklyPromotionsAsync(CancellationToken cancellationToken = default)
    {
        var result = new PromotionDemotionResult
        {
            PromotedCount = 0,
            DemotedCount = 0
        };
        return Task.FromResult(result);
    }

    public Task ArchiveAndResetWeekAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public (int weekNumber, int year) GetCurrentWeek()
    {
        var now = DateTime.UtcNow;
        var weekNumber = System.Globalization.ISOWeek.GetWeekOfYear(now);
        return (weekNumber, now.Year);
    }

    public Task InitializeStudentInLeaderboardAsync(Guid studentId, string league, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task<LeaderboardPreviewResponse> GetLeaderboardPreviewAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var response = new LeaderboardPreviewResponse
        {
            League = "Bronze",
            TopEntries = [],
            CurrentUserEntry = null,
            CurrentUserRank = null
        };
        return Task.FromResult(response);
    }
}
