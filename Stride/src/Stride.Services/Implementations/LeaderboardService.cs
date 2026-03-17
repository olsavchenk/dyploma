using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;
using Stride.Services.Interfaces;
using Stride.Services.Models.Leaderboard;

namespace Stride.Services.Implementations;

public class LeaderboardService : ILeaderboardService
{
    private readonly StrideDbContext _dbContext;
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _database;
    private readonly ILogger<LeaderboardService> _logger;
    
    private const int TopPlayersCount = 30;
    private const int PromotionCount = 10;
    private const int DemotionCount = 5;
    
    private static readonly string[] Leagues = { "Bronze", "Silver", "Gold", "Platinum", "Diamond" };

    public LeaderboardService(
        StrideDbContext dbContext,
        IConnectionMultiplexer redis,
        ILogger<LeaderboardService> logger)
    {
        _dbContext = dbContext;
        _redis = redis;
        _database = _redis.GetDatabase();
        _logger = logger;
    }

    public async Task<GetLeaderboardResponse> GetLeaderboardAsync(
        Guid studentId,
        string league,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Starting {Method} for StudentId={StudentId}, League={League}",
            nameof(GetLeaderboardAsync), studentId, league);

        var (weekNumber, year) = GetCurrentWeek();
        var leaderboardKey = GetLeaderboardKey(league, year, weekNumber);

        // Get top players from Valkey sorted set
        var topEntries = await _database.SortedSetRangeByRankWithScoresAsync(
            leaderboardKey,
            start: 0,
            stop: TopPlayersCount - 1,
            order: Order.Descending);

        // Get total player count in this league
        var totalPlayers = await _database.SortedSetLengthAsync(leaderboardKey);

        // Get current user's rank and score
        var userScore = await _database.SortedSetScoreAsync(leaderboardKey, studentId.ToString());
        var userRank = userScore.HasValue 
            ? await _database.SortedSetRankAsync(leaderboardKey, studentId.ToString(), Order.Descending) 
            : null;

        // Convert to DTOs
        var studentIds = topEntries.Select(e => Guid.Parse(e.Element.ToString())).ToList();
        if (userScore.HasValue && userRank.HasValue && userRank.Value >= TopPlayersCount)
        {
            studentIds.Add(studentId);
        }

        var students = await _dbContext.StudentProfiles
            .Include(sp => sp.User)
            .Where(sp => studentIds.Contains(sp.UserId))
            .Select(sp => new
            {
                sp.UserId,
                sp.User.DisplayName,
                sp.User.AvatarUrl,
                sp.TotalXp,
                sp.CurrentLevel,
                sp.League
            })
            .ToListAsync(cancellationToken);

        var topPlayers = new List<LeaderboardEntryDto>();
        for (int i = 0; i < topEntries.Length; i++)
        {
            var entry = topEntries[i];
            var sid = Guid.Parse(entry.Element.ToString());
            var student = students.FirstOrDefault(s => s.UserId == sid);

            if (student != null)
            {
                topPlayers.Add(new LeaderboardEntryDto
                {
                    StudentId = sid,
                    DisplayName = student.DisplayName,
                    AvatarUrl = student.AvatarUrl,
                    League = league,
                    WeeklyXp = (int)entry.Score,
                    Rank = i + 1,
                    TotalXp = student.TotalXp,
                    Level = student.CurrentLevel,
                    IsCurrentUser = sid == studentId
                });
            }
        }

        LeaderboardEntryDto? currentUserEntry = null;
        if (userScore.HasValue && userRank.HasValue)
        {
            var student = students.FirstOrDefault(s => s.UserId == studentId);
            if (student != null)
            {
                currentUserEntry = new LeaderboardEntryDto
                {
                    StudentId = studentId,
                    DisplayName = student.DisplayName,
                    AvatarUrl = student.AvatarUrl,
                    League = league,
                    WeeklyXp = (int)userScore.Value,
                    Rank = (int)userRank.Value + 1,
                    TotalXp = student.TotalXp,
                    Level = student.CurrentLevel,
                    IsCurrentUser = true
                };
            }
        }

        return new GetLeaderboardResponse
        {
            League = league,
            WeekNumber = weekNumber,
            Year = year,
            TopPlayers = topPlayers,
            CurrentUserEntry = currentUserEntry,
            TotalPlayers = (int)totalPlayers,
            PromotionZoneCount = PromotionCount,
            DemotionZoneCount = DemotionCount
        };
    }

    public async Task<LeaderboardPreviewResponse> GetLeaderboardPreviewAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var league = await _dbContext.StudentProfiles
            .Where(sp => sp.UserId == userId)
            .Select(sp => sp.League)
            .FirstOrDefaultAsync(cancellationToken) ?? "Bronze";

        var (weekNumber, year) = GetCurrentWeek();
        var leaderboardKey = GetLeaderboardKey(league, year, weekNumber);

        const int previewCount = 5;

        var topEntries = await _database.SortedSetRangeByRankWithScoresAsync(
            leaderboardKey, 0, previewCount - 1, Order.Descending);

        var userScore = await _database.SortedSetScoreAsync(leaderboardKey, userId.ToString());
        var userRank = userScore.HasValue
            ? await _database.SortedSetRankAsync(leaderboardKey, userId.ToString(), Order.Descending)
            : null;

        var studentIds = topEntries.Select(e => Guid.Parse(e.Element.ToString())).ToList();
        if (userScore.HasValue && !studentIds.Contains(userId))
            studentIds.Add(userId);

        var students = await _dbContext.StudentProfiles
            .Include(sp => sp.User)
            .Where(sp => studentIds.Contains(sp.UserId))
            .Select(sp => new { sp.UserId, sp.User.DisplayName, sp.User.AvatarUrl, sp.TotalXp, sp.CurrentLevel })
            .ToListAsync(cancellationToken);

        var topList = new List<LeaderboardEntryDto>();
        for (int i = 0; i < topEntries.Length; i++)
        {
            var sid = Guid.Parse(topEntries[i].Element.ToString());
            var s = students.FirstOrDefault(x => x.UserId == sid);
            if (s != null)
            {
                topList.Add(new LeaderboardEntryDto
                {
                    StudentId = sid,
                    DisplayName = s.DisplayName,
                    AvatarUrl = s.AvatarUrl,
                    League = league,
                    WeeklyXp = (int)topEntries[i].Score,
                    Rank = i + 1,
                    TotalXp = s.TotalXp,
                    Level = s.CurrentLevel,
                    IsCurrentUser = sid == userId
                });
            }
        }

        LeaderboardEntryDto? currentUserEntry = null;
        int? currentUserRank = null;

        if (userScore.HasValue && userRank.HasValue)
        {
            currentUserRank = (int)userRank.Value + 1;
            currentUserEntry = topList.FirstOrDefault(e => e.StudentId == userId);

            if (currentUserEntry == null)
            {
                var s = students.FirstOrDefault(x => x.UserId == userId);
                if (s != null)
                {
                    currentUserEntry = new LeaderboardEntryDto
                    {
                        StudentId = userId,
                        DisplayName = s.DisplayName,
                        AvatarUrl = s.AvatarUrl,
                        League = league,
                        WeeklyXp = (int)userScore.Value,
                        Rank = currentUserRank.Value,
                        TotalXp = s.TotalXp,
                        Level = s.CurrentLevel,
                        IsCurrentUser = true
                    };
                }
            }
        }

        return new LeaderboardPreviewResponse
        {
            League = league,
            TopEntries = topList,
            CurrentUserEntry = currentUserEntry,
            CurrentUserRank = currentUserRank
        };
    }

    public async Task UpdateWeeklyXpAsync(
        Guid studentId,
        int xpToAdd,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Starting {Method} for StudentId={StudentId}, XpToAdd={XpToAdd}",
            nameof(UpdateWeeklyXpAsync), studentId, xpToAdd);

        var studentProfile = await _dbContext.StudentProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == studentId, cancellationToken);

        if (studentProfile == null)
        {
            _logger.LogDebug("{Method}: Student profile not found, skipping. StudentId={StudentId}",
                nameof(UpdateWeeklyXpAsync), studentId);
            return;
        }

        var (weekNumber, year) = GetCurrentWeek();
        var leaderboardKey = GetLeaderboardKey(studentProfile.League, year, weekNumber);

        // Increment score in sorted set (this automatically maintains ranking)
        await _database.SortedSetIncrementAsync(leaderboardKey, studentId.ToString(), xpToAdd);

        // Set expiration to end of week + 7 days for archival
        var endOfWeek = GetEndOfWeek();
        var expiration = endOfWeek.AddDays(7) - DateTime.UtcNow;
        if (expiration.TotalSeconds > 0)
        {
            await _database.KeyExpireAsync(leaderboardKey, expiration);
        }
    }

    public async Task InitializeStudentInLeaderboardAsync(
        Guid studentId,
        string league,
        CancellationToken cancellationToken = default)
    {
        var (weekNumber, year) = GetCurrentWeek();
        var leaderboardKey = GetLeaderboardKey(league, year, weekNumber);

        // Add student with 0 XP if not exists
        var exists = await _database.SortedSetScoreAsync(leaderboardKey, studentId.ToString());
        if (!exists.HasValue)
        {
            await _database.SortedSetAddAsync(leaderboardKey, studentId.ToString(), 0);
        }
    }

    public async Task<PromotionDemotionResult> ProcessWeeklyPromotionsAsync(
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting {Method}", nameof(ProcessWeeklyPromotionsAsync));

        var result = new PromotionDemotionResult();
        var (weekNumber, year) = GetCurrentWeek();

        for (int i = 0; i < Leagues.Length; i++)
        {
            var league = Leagues[i];
            var leaderboardKey = GetLeaderboardKey(league, year, weekNumber);

            // Get all players in this league's leaderboard
            var allPlayers = await _database.SortedSetRangeByRankWithScoresAsync(
                leaderboardKey,
                start: 0,
                stop: -1,
                order: Order.Descending);

            if (allPlayers.Length == 0)
            {
                continue;
            }

            // Promote top players (except Diamond)
            var promotedIds = new HashSet<Guid>();
            if (i < Leagues.Length - 1)
            {
                var playersToPromote = allPlayers.Take(PromotionCount).ToList();
                promotedIds = playersToPromote.Select(p => Guid.Parse(p.Element.ToString())).ToHashSet();

                if (promotedIds.Any())
                {
                    var nextLeague = Leagues[i + 1];
                    await _dbContext.StudentProfiles
                        .Where(sp => promotedIds.Contains(sp.UserId))
                        .ExecuteUpdateAsync(
                            setters => setters.SetProperty(sp => sp.League, nextLeague),
                            cancellationToken);

                    result.PromotedStudentIds.AddRange(promotedIds);
                    result.PromotedCount += promotedIds.Count;
                }
            }

            // Demote bottom players (except Bronze), excluding promoted players
            if (i > 0 && allPlayers.Length > PromotionCount)
            {
                var playersToDemote = allPlayers.Skip(Math.Max(0, allPlayers.Length - DemotionCount)).ToList();
                var demotedIds = playersToDemote
                    .Select(p => Guid.Parse(p.Element.ToString()))
                    .Where(id => !promotedIds.Contains(id)) // Exclude promoted players from demotion
                    .ToList();

                if (demotedIds.Any())
                {
                    var previousLeague = Leagues[i - 1];
                    await _dbContext.StudentProfiles
                        .Where(sp => demotedIds.Contains(sp.UserId))
                        .ExecuteUpdateAsync(
                            setters => setters.SetProperty(sp => sp.League, previousLeague),
                            cancellationToken);

                    result.DemotedStudentIds.AddRange(demotedIds);
                    result.DemotedCount += demotedIds.Count;
                }
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("{Method} completed: Promoted={PromotedCount}, Demoted={DemotedCount}",
            nameof(ProcessWeeklyPromotionsAsync), result.PromotedCount, result.DemotedCount);

        return result;
    }

    public async Task ArchiveAndResetWeekAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting {Method}", nameof(ArchiveAndResetWeekAsync));

        var (weekNumber, year) = GetCurrentWeek();

        // Archive all leagues
        foreach (var league in Leagues)
        {
            var leaderboardKey = GetLeaderboardKey(league, year, weekNumber);

            // Get all entries from Valkey
            var entries = await _database.SortedSetRangeByRankWithScoresAsync(
                leaderboardKey,
                start: 0,
                stop: -1,
                order: Order.Descending);

            if (entries.Length == 0)
            {
                continue;
            }

            // Save to PostgreSQL
            var leaderboardEntries = new List<LeaderboardEntry>();
            for (int i = 0; i < entries.Length; i++)
            {
                var entry = entries[i];
                var studentId = Guid.Parse(entry.Element.ToString());

                leaderboardEntries.Add(new LeaderboardEntry
                {
                    Id = Guid.NewGuid(),
                    StudentId = studentId,
                    League = league,
                    WeekNumber = weekNumber,
                    Year = year,
                    WeeklyXp = (int)entry.Score,
                    Rank = i + 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            _dbContext.LeaderboardEntries.AddRange(leaderboardEntries);

            // Delete the leaderboard key from Valkey
            await _database.KeyDeleteAsync(leaderboardKey);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("{Method} completed: Week={WeekNumber}, Year={Year}",
            nameof(ArchiveAndResetWeekAsync), weekNumber, year);
    }

    public (int weekNumber, int year) GetCurrentWeek()
    {
        var now = DateTime.UtcNow;
        var weekNumber = System.Globalization.ISOWeek.GetWeekOfYear(now);
        return (weekNumber, now.Year);
    }

    private static string GetLeaderboardKey(string league, int year, int weekNumber)
    {
        return $"leaderboard:{league}:{year}:{weekNumber}";
    }

    private static DateTime GetEndOfWeek()
    {
        var now = DateTime.UtcNow;
        var daysUntilMonday = ((int)DayOfWeek.Monday - (int)now.DayOfWeek + 7) % 7;
        if (daysUntilMonday == 0) daysUntilMonday = 7;
        return now.Date.AddDays(daysUntilMonday);
    }
}
