using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Services.Interfaces;

namespace Stride.Adaptive.BackgroundServices;

/// <summary>
/// Background service that monitors and refills task pools when they drop below threshold
/// </summary>
public class TaskPoolRefillService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TaskPoolRefillService> _logger;
    private readonly TaskPoolSettings _settings;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5);

    public TaskPoolRefillService(
        IServiceProvider serviceProvider,
        ILogger<TaskPoolRefillService> logger,
        IOptions<TaskPoolSettings> settings)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _settings = settings.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Task Pool Refill Service started");

        // Wait a bit before starting to allow the application to initialize
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RefillPoolsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in task pool refill service");
            }

            // Wait before next check
            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("Task Pool Refill Service stopped");
    }

    private async Task RefillPoolsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var taskPoolService = scope.ServiceProvider.GetRequiredService<ITaskPoolService>();

        try
        {
            _logger.LogDebug("Checking pools for refill");

            // Get all pools that need refilling
            var poolsNeedingRefill = await taskPoolService.GetPoolsNeedingRefillAsync(cancellationToken);

            if (poolsNeedingRefill.Count == 0)
            {
                _logger.LogDebug("No pools need refilling");
                return;
            }

            _logger.LogInformation("Found {Count} pools needing refill", poolsNeedingRefill.Count);

            // Refill each pool
            var refillTasks = poolsNeedingRefill
                .Select(pool => RefillSinglePoolAsync(taskPoolService, pool, cancellationToken))
                .ToList();

            await Task.WhenAll(refillTasks);

            _logger.LogInformation("Pool refill cycle completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during pool refill cycle");
        }
    }

    private async Task RefillSinglePoolAsync(
        ITaskPoolService taskPoolService,
        Stride.Adaptive.Models.DTOs.TaskPoolStatus poolStatus,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation(
                "Refilling pool for topic {TopicId}, band {Band} (current: {Current}/{Target})",
                poolStatus.TopicId, 
                poolStatus.DifficultyBand, 
                poolStatus.CurrentCount, 
                poolStatus.TargetCount);

            var added = await taskPoolService.RefillPoolAsync(
                poolStatus.TopicId,
                poolStatus.DifficultyBand,
                cancellationToken);

            if (added > 0)
            {
                _logger.LogInformation(
                    "Successfully refilled pool for topic {TopicId}, band {Band} with {Count} tasks",
                    poolStatus.TopicId, poolStatus.DifficultyBand, added);
            }
            else
            {
                _logger.LogWarning(
                    "Could not refill pool for topic {TopicId}, band {Band}. No templates available?",
                    poolStatus.TopicId, poolStatus.DifficultyBand);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Error refilling pool for topic {TopicId}, band {Band}",
                poolStatus.TopicId, poolStatus.DifficultyBand);
        }
    }
}
