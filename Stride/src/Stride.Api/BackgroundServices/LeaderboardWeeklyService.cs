using Microsoft.AspNetCore.SignalR;
using Stride.Api.Hubs;
using Stride.Services.Interfaces;

namespace Stride.Api.BackgroundServices;

/// <summary>
/// Background service that handles weekly leaderboard resets and promotions/demotions
/// </summary>
public class LeaderboardWeeklyService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<LeaderboardWeeklyService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1);

    public LeaderboardWeeklyService(
        IServiceProvider serviceProvider,
        ILogger<LeaderboardWeeklyService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Leaderboard Weekly Service started");

        // Wait a bit before starting to allow the application to initialize
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndProcessWeekEndAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in leaderboard weekly service");
            }

            // Check every hour
            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("Leaderboard Weekly Service stopped");
    }

    private async Task CheckAndProcessWeekEndAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var leaderboardService = scope.ServiceProvider.GetRequiredService<ILeaderboardService>();
        var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<LeaderboardHub>>();

        try
        {
            // Check if it's Monday 00:00-01:00 UTC (end of week)
            var now = DateTime.UtcNow;
            if (now.DayOfWeek != DayOfWeek.Monday || now.Hour != 0)
            {
                return;
            }

            _logger.LogInformation("Week end detected, processing promotions and demotions");

            // Process promotions and demotions
            var result = await leaderboardService.ProcessWeeklyPromotionsAsync(cancellationToken);

            _logger.LogInformation(
                "Weekly promotions completed: {PromotedCount} promoted, {DemotedCount} demoted",
                result.PromotedCount,
                result.DemotedCount);

            // Send notifications to promoted users
            var leagues = new[] { "Bronze", "Silver", "Gold", "Platinum", "Diamond" };
            foreach (var studentId in result.PromotedStudentIds)
            {
                // Notify user about promotion
                await hubContext.Clients
                    .Group($"user_{studentId}")
                    .SendAsync("Promoted", new
                    {
                        Message = "Congratulations! You've been promoted to a higher league!"
                    }, cancellationToken);
            }

            // Send notifications to demoted users
            foreach (var studentId in result.DemotedStudentIds)
            {
                await hubContext.Clients
                    .Group($"user_{studentId}")
                    .SendAsync("Demoted", new
                    {
                        Message = "You've been moved to the previous league. Keep learning to climb back up!"
                    }, cancellationToken);
            }

            // Archive and reset the week
            await leaderboardService.ArchiveAndResetWeekAsync(cancellationToken);

            _logger.LogInformation("Leaderboard archived and reset for new week");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing week end");
        }
    }
}
