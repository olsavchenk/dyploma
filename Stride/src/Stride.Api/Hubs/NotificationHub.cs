using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Stride.Api.Hubs;

/// <summary>
/// SignalR hub for real-time notifications (achievements, level-ups, streaks)
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    /// <summary>
    /// Called when a client connects to the hub
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            // Add user to their personal notification group
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        await base.OnConnectedAsync();
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
/// Extension methods for sending notification events to clients
/// </summary>
public static class NotificationHubExtensions
{
    /// <summary>
    /// Sends achievement unlocked notification to a specific user
    /// </summary>
    /// <param name="hubContext">Hub context</param>
    /// <param name="userId">User ID</param>
    /// <param name="achievementCode">Achievement code</param>
    /// <param name="achievementName">Achievement name</param>
    /// <param name="description">Achievement description</param>
    /// <param name="iconUrl">Achievement icon URL</param>
    /// <param name="xpReward">XP reward amount</param>
    public static async Task SendAchievementUnlockedAsync(
        this IHubContext<NotificationHub> hubContext,
        Guid userId,
        string achievementCode,
        string achievementName,
        string description,
        string? iconUrl,
        int xpReward)
    {
        await hubContext.Clients
            .Group($"user_{userId}")
            .SendAsync("AchievementUnlocked", new
            {
                Code = achievementCode,
                Name = achievementName,
                Description = description,
                IconUrl = iconUrl,
                XpReward = xpReward,
                UnlockedAt = DateTime.UtcNow
            });
    }

    /// <summary>
    /// Sends level up notification to a specific user
    /// </summary>
    /// <param name="hubContext">Hub context</param>
    /// <param name="userId">User ID</param>
    /// <param name="oldLevel">Previous level</param>
    /// <param name="newLevel">New level</param>
    /// <param name="totalXp">Total XP</param>
    /// <param name="nextLevelXp">XP required for next level</param>
    public static async Task SendLevelUpAsync(
        this IHubContext<NotificationHub> hubContext,
        Guid userId,
        int oldLevel,
        int newLevel,
        int totalXp,
        int nextLevelXp)
    {
        await hubContext.Clients
            .Group($"user_{userId}")
            .SendAsync("LevelUp", new
            {
                OldLevel = oldLevel,
                NewLevel = newLevel,
                TotalXp = totalXp,
                NextLevelXp = nextLevelXp,
                LeveledUpAt = DateTime.UtcNow
            });
    }

    /// <summary>
    /// Sends streak reminder notification to a specific user
    /// </summary>
    /// <param name="hubContext">Hub context</param>
    /// <param name="userId">User ID</param>
    /// <param name="currentStreak">Current streak count</param>
    /// <param name="streakFreezes">Available streak freezes</param>
    /// <param name="message">Reminder message</param>
    public static async Task SendStreakReminderAsync(
        this IHubContext<NotificationHub> hubContext,
        Guid userId,
        int currentStreak,
        int streakFreezes,
        string message)
    {
        await hubContext.Clients
            .Group($"user_{userId}")
            .SendAsync("StreakReminder", new
            {
                CurrentStreak = currentStreak,
                StreakFreezes = streakFreezes,
                Message = message,
                ReminderSentAt = DateTime.UtcNow
            });
    }

    /// <summary>
    /// Sends streak broken notification to a specific user
    /// </summary>
    /// <param name="hubContext">Hub context</param>
    /// <param name="userId">User ID</param>
    /// <param name="lostStreak">The streak that was lost</param>
    /// <param name="reason">Reason for streak break (missed day, no freeze available)</param>
    public static async Task SendStreakBrokenAsync(
        this IHubContext<NotificationHub> hubContext,
        Guid userId,
        int lostStreak,
        string reason)
    {
        await hubContext.Clients
            .Group($"user_{userId}")
            .SendAsync("StreakBroken", new
            {
                LostStreak = lostStreak,
                Reason = reason,
                BrokenAt = DateTime.UtcNow
            });
    }

    /// <summary>
    /// Sends streak freeze used notification to a specific user
    /// </summary>
    /// <param name="hubContext">Hub context</param>
    /// <param name="userId">User ID</param>
    /// <param name="currentStreak">Current streak preserved</param>
    /// <param name="remainingFreezes">Remaining streak freezes</param>
    public static async Task SendStreakFreezeUsedAsync(
        this IHubContext<NotificationHub> hubContext,
        Guid userId,
        int currentStreak,
        int remainingFreezes)
    {
        await hubContext.Clients
            .Group($"user_{userId}")
            .SendAsync("StreakFreezeUsed", new
            {
                CurrentStreak = currentStreak,
                RemainingFreezes = remainingFreezes,
                UsedAt = DateTime.UtcNow
            });
    }

    /// <summary>
    /// Sends XP earned notification to a specific user
    /// </summary>
    /// <param name="hubContext">Hub context</param>
    /// <param name="userId">User ID</param>
    /// <param name="xpEarned">Amount of XP earned</param>
    /// <param name="totalXp">Total XP after earning</param>
    /// <param name="reason">Reason for XP gain (task, bonus, etc.)</param>
    public static async Task SendXpEarnedAsync(
        this IHubContext<NotificationHub> hubContext,
        Guid userId,
        int xpEarned,
        int totalXp,
        string reason)
    {
        await hubContext.Clients
            .Group($"user_{userId}")
            .SendAsync("XpEarned", new
            {
                XpEarned = xpEarned,
                TotalXp = totalXp,
                Reason = reason,
                EarnedAt = DateTime.UtcNow
            });
    }

    /// <summary>
    /// Sends a generic notification to a specific user
    /// </summary>
    /// <param name="hubContext">Hub context</param>
    /// <param name="userId">User ID</param>
    /// <param name="title">Notification title</param>
    /// <param name="message">Notification message</param>
    /// <param name="type">Notification type (info, success, warning, error)</param>
    /// <param name="actionUrl">Optional action URL</param>
    public static async Task SendNotificationAsync(
        this IHubContext<NotificationHub> hubContext,
        Guid userId,
        string title,
        string message,
        string type = "info",
        string? actionUrl = null)
    {
        await hubContext.Clients
            .Group($"user_{userId}")
            .SendAsync("Notification", new
            {
                Title = title,
                Message = message,
                Type = type,
                ActionUrl = actionUrl,
                SentAt = DateTime.UtcNow
            });
    }

    /// <summary>
    /// Broadcasts a notification to all connected users
    /// </summary>
    /// <param name="hubContext">Hub context</param>
    /// <param name="title">Notification title</param>
    /// <param name="message">Notification message</param>
    /// <param name="type">Notification type</param>
    public static async Task BroadcastNotificationAsync(
        this IHubContext<NotificationHub> hubContext,
        string title,
        string message,
        string type = "info")
    {
        await hubContext.Clients
            .All
            .SendAsync("Notification", new
            {
                Title = title,
                Message = message,
                Type = type,
                SentAt = DateTime.UtcNow
            });
    }
}
