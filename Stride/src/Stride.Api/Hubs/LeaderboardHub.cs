using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Stride.Api.Hubs;

/// <summary>
/// SignalR hub for real-time leaderboard updates
/// </summary>
[Authorize]
public class LeaderboardHub : Hub
{
    private const string LeaderboardGroupPrefix = "leaderboard_";

    /// <summary>
    /// Called when a client connects to the hub
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            // Add user to their personal group for targeted messages
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Join a specific league's leaderboard group
    /// </summary>
    /// <param name="league">League name (Bronze, Silver, Gold, Platinum, Diamond)</param>
    public async Task JoinLeague(string league)
    {
        var groupName = $"{LeaderboardGroupPrefix}{league}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Leave a specific league's leaderboard group
    /// </summary>
    /// <param name="league">League name</param>
    public async Task LeaveLeague(string league)
    {
        var groupName = $"{LeaderboardGroupPrefix}{league}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Called when a client disconnects
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Groups are automatically cleaned up on disconnect
        await base.OnDisconnectedAsync(exception);
    }
}

/// <summary>
/// Extension methods for sending leaderboard events to clients
/// </summary>
public static class LeaderboardHubExtensions
{
    /// <summary>
    /// Sends leaderboard update notification to all users in a league
    /// </summary>
    public static async Task SendLeaderboardUpdatedAsync(
        this IHubContext<LeaderboardHub> hubContext,
        string league,
        object leaderboardData)
    {
        await hubContext.Clients
            .Group($"leaderboard_{league}")
            .SendAsync("LeaderboardUpdated", leaderboardData);
    }

    /// <summary>
    /// Sends rank change notification to a specific user
    /// </summary>
    public static async Task SendRankChangedAsync(
        this IHubContext<LeaderboardHub> hubContext,
        Guid userId,
        int oldRank,
        int newRank,
        int weeklyXp,
        string league)
    {
        await hubContext.Clients
            .Group($"user_{userId}")
            .SendAsync("RankChanged", new
            {
                OldRank = oldRank,
                NewRank = newRank,
                WeeklyXp = weeklyXp,
                League = league
            });
    }

    /// <summary>
    /// Sends promotion notification to a specific user
    /// </summary>
    public static async Task SendPromotionNotificationAsync(
        this IHubContext<LeaderboardHub> hubContext,
        Guid userId,
        string oldLeague,
        string newLeague)
    {
        await hubContext.Clients
            .Group($"user_{userId}")
            .SendAsync("Promoted", new
            {
                OldLeague = oldLeague,
                NewLeague = newLeague
            });
    }

    /// <summary>
    /// Sends demotion notification to a specific user
    /// </summary>
    public static async Task SendDemotionNotificationAsync(
        this IHubContext<LeaderboardHub> hubContext,
        Guid userId,
        string oldLeague,
        string newLeague)
    {
        await hubContext.Clients
            .Group($"user_{userId}")
            .SendAsync("Demoted", new
            {
                OldLeague = oldLeague,
                NewLeague = newLeague
            });
    }
}
