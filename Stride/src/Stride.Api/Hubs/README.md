# SignalR Hubs - Usage Guide

## Overview

This document provides examples of how to use the SignalR hubs for real-time notifications in the Stride application.

## Available Hubs

### 1. LeaderboardHub (`/hubs/leaderboard`)

Handles real-time leaderboard updates and rank changes.

**Client Methods:**
- `JoinLeague(string league)` - Join a specific league's group
- `LeaveLeague(string league)` - Leave a league's group

**Server Events:**
- `LeaderboardUpdated` - Sent to all users in a league when leaderboard changes
- `RankChanged` - Sent to specific user when their rank changes
- `Promoted` - Sent when user is promoted to higher league
- `Demoted` - Sent when user is demoted to lower league

### 2. NotificationHub (`/hubs/notifications`)

Handles real-time notifications for achievements, streaks, and level-ups.

**Server Events:**
- `AchievementUnlocked` - Achievement earned notification
- `LevelUp` - Level up celebration
- `StreakReminder` - Daily streak reminder
- `StreakBroken` - Streak lost notification
- `StreakFreezeUsed` - Streak freeze used notification
- `XpEarned` - XP earned notification
- `Notification` - Generic notification (info, success, warning, error)

## Usage in Services

### Injecting Hub Context

```csharp
using Microsoft.AspNetCore.SignalR;
using Stride.Api.Hubs;

public class GamificationService : IGamificationService
{
    private readonly IHubContext<NotificationHub> _notificationHub;
    private readonly IHubContext<LeaderboardHub> _leaderboardHub;
    
    public GamificationService(
        IHubContext<NotificationHub> notificationHub,
        IHubContext<LeaderboardHub> leaderboardHub)
    {
        _notificationHub = notificationHub;
        _leaderboardHub = leaderboardHub;
    }
    
    // ... service methods
}
```

### Sending Achievement Notifications

```csharp
// In AchievementService or GamificationService
public async Task UnlockAchievementAsync(Guid userId, string achievementCode)
{
    var achievement = await _dbContext.Achievements
        .FirstOrDefaultAsync(a => a.Code == achievementCode);
    
    if (achievement == null) return;
    
    // Save to database
    var studentAchievement = new StudentAchievement
    {
        StudentId = userId,
        AchievementId = achievement.Id,
        UnlockedAt = DateTime.UtcNow
    };
    
    _dbContext.StudentAchievements.Add(studentAchievement);
    await _dbContext.SaveChangesAsync();
    
    // Send real-time notification using extension method
    await _notificationHub.SendAchievementUnlockedAsync(
        userId: userId,
        achievementCode: achievement.Code,
        achievementName: achievement.Name,
        description: achievement.Description,
        iconUrl: achievement.IconUrl,
        xpReward: achievement.XpReward
    );
}
```

### Sending Level Up Notifications

```csharp
// In GamificationService.AwardXpAsync()
if (newLevel > oldLevel)
{
    // Calculate next level XP requirement
    var nextLevelXp = CalculateXpForLevel(newLevel + 1);
    
    // Send level up notification
    await _notificationHub.SendLevelUpAsync(
        userId: studentId,
        oldLevel: oldLevel,
        newLevel: newLevel,
        totalXp: studentProfile.TotalXp,
        nextLevelXp: nextLevelXp
    );
}
```

### Sending Streak Notifications

```csharp
// In GamificationService.UpdateStreakAsync()
public async Task SendStreakReminderAsync(Guid userId)
{
    var profile = await _dbContext.StudentProfiles
        .FirstOrDefaultAsync(sp => sp.UserId == userId);
    
    if (profile == null) return;
    
    await _notificationHub.SendStreakReminderAsync(
        userId: userId,
        currentStreak: profile.CurrentStreak,
        streakFreezes: profile.StreakFreezes,
        message: "Don't break your streak! Complete a task today to keep it going."
    );
}

// When streak is broken
await _notificationHub.SendStreakBrokenAsync(
    userId: userId,
    lostStreak: oldStreak,
    reason: "Missed day - no freeze available"
);

// When freeze is used
await _notificationHub.SendStreakFreezeUsedAsync(
    userId: userId,
    currentStreak: profile.CurrentStreak,
    remainingFreezes: profile.StreakFreezes - 1
);
```

### Sending Leaderboard Updates

```csharp
// In LeaderboardService.UpdatePlayerXpAsync()
public async Task UpdatePlayerXpAsync(Guid studentId, int xpToAdd, string league)
{
    var (weekNumber, year) = GetCurrentWeek();
    var leaderboardKey = GetLeaderboardKey(league, year, weekNumber);
    
    // Get old rank
    var oldRank = await _database.SortedSetRankAsync(
        leaderboardKey, 
        studentId.ToString(), 
        Order.Descending
    );
    
    // Update score in Valkey
    var newScore = await _database.SortedSetIncrementAsync(
        leaderboardKey,
        studentId.ToString(),
        xpToAdd
    );
    
    // Get new rank
    var newRank = await _database.SortedSetRankAsync(
        leaderboardKey,
        studentId.ToString(),
        Order.Descending
    );
    
    // Send rank change notification if rank changed
    if (oldRank.HasValue && newRank.HasValue && oldRank != newRank)
    {
        await _leaderboardHub.SendRankChangedAsync(
            userId: studentId,
            oldRank: (int)oldRank + 1,
            newRank: (int)newRank + 1,
            weeklyXp: (int)newScore,
            league: league
        );
    }
    
    // Broadcast updated leaderboard to all users in the league
    var leaderboardData = await GetLeaderboardAsync(studentId, league);
    await _leaderboardHub.SendLeaderboardUpdatedAsync(league, leaderboardData);
}
```

### Sending Generic Notifications

```csharp
// Send a generic notification
await _notificationHub.SendNotificationAsync(
    userId: userId,
    title: "New Feature Available",
    message: "Check out our new learning paths!",
    type: "info",
    actionUrl: "/learning-paths"
);

// Broadcast to all users
await _notificationHub.BroadcastNotificationAsync(
    title: "System Maintenance",
    message: "The platform will be under maintenance tonight at 2 AM UTC",
    type: "warning"
);
```

## XP Earned Notification

```csharp
// In GamificationService after awarding XP
await _notificationHub.SendXpEarnedAsync(
    userId: studentId,
    xpEarned: xpAmount,
    totalXp: studentProfile.TotalXp,
    reason: "Correct answer on difficult task"
);
```

## Client Connection (Angular)

Example of how the frontend will connect:

```typescript
import * as signalR from '@microsoft/signalr';

// Connection setup
const connection = new signalR.HubConnectionBuilder()
  .withUrl('/hubs/notifications', {
    accessTokenFactory: () => authService.getAccessToken()
  })
  .withAutomaticReconnect()
  .build();

// Listen for events
connection.on('AchievementUnlocked', (data) => {
  console.log('Achievement unlocked:', data);
  // Show toast notification
});

connection.on('LevelUp', (data) => {
  console.log('Level up:', data);
  // Show celebration animation
});

connection.on('StreakReminder', (data) => {
  console.log('Streak reminder:', data);
  // Show reminder notification
});

// Connect
await connection.start();
```

## Authentication

Both hubs require JWT authentication. The token can be passed via:

1. **Query string** (recommended for SignalR):
   ```
   /hubs/notifications?access_token=YOUR_JWT_TOKEN
   ```

2. **Authorization header**:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

The JWT authentication is configured in `ServiceCollectionExtensions.cs` with the `OnMessageReceived` event handler that reads tokens from the query string for `/hubs/*` paths.

## CORS Configuration

CORS is already configured in `Program.cs` to allow connections from:
- `http://localhost:4200` (development)
- `https://localhost:4200` (development HTTPS)

Make sure to update CORS settings for production environments.

## Testing

You can test SignalR connections using:

1. **Browser Console**:
   ```javascript
   const connection = new signalR.HubConnectionBuilder()
     .withUrl('/hubs/notifications?access_token=YOUR_TOKEN')
     .build();
   
   connection.start()
     .then(() => console.log('Connected'))
     .catch(err => console.error(err));
   ```

2. **Postman** or **SignalR Client Tools**

3. **Integration Tests** using `Microsoft.AspNetCore.SignalR.Client`

## Best Practices

1. **Always inject** `IHubContext<THub>` in services, never `Hub` directly
2. **Use extension methods** for consistent notification formatting
3. **Include timestamps** in all notifications (already handled by extension methods)
4. **Log hub operations** for debugging and monitoring
5. **Handle connection failures** gracefully on the client side
6. **Use groups** for efficient broadcasting to specific user segments
7. **Throttle notifications** to avoid overwhelming users
8. **Clean up connections** when users log out

## Performance Considerations

- SignalR maintains persistent WebSocket connections
- Use groups to target specific users instead of broadcasting to all
- Consider batching notifications if sending many in quick succession
- Monitor SignalR backplane (Valkey) for scalability in production
- Use `SendToGroupAsync` instead of iterating and calling `SendAsync` multiple times

## Troubleshooting

**Connection fails:**
- Verify JWT token is valid and not expired
- Check CORS configuration
- Ensure `/hubs` path is allowed in firewall/proxy

**Messages not received:**
- Verify user is in the correct group
- Check client is listening for the correct event name (case-sensitive)
- Ensure connection is established before sending messages

**Performance issues:**
- Monitor connection count and active groups
- Consider implementing backpressure mechanisms
- Use connection pooling in production
