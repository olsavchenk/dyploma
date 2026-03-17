using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Services.Interfaces;
using Stride.Core.Documents;
using Stride.DataAccess.Repositories;
using Stride.Services.Interfaces;
using StackExchange.Redis;
using System.Text.Json;

namespace Stride.Adaptive.Services.Implementations;

/// <summary>
/// Manages task pools in Valkey cache with automatic refilling
/// </summary>
public class TaskPoolService : ITaskPoolService
{
    private readonly ICacheService _cacheService;
    private readonly ITaskTemplateRepository _templateRepository;
    private readonly ITaskInstanceRepository _instanceRepository;
    private readonly ITemplateRenderer _templateRenderer;
    private readonly IConnectionMultiplexer _redis;
    private readonly TaskPoolSettings _settings;
    private readonly ILogger<TaskPoolService> _logger;

    private const string PoolKeyPrefix = "taskpool";
    private const string PoolMetaKeyPrefix = "taskpool:meta";

    public TaskPoolService(
        ICacheService cacheService,
        ITaskTemplateRepository templateRepository,
        ITaskInstanceRepository instanceRepository,
        ITemplateRenderer templateRenderer,
        IConnectionMultiplexer redis,
        IOptions<TaskPoolSettings> settings,
        ILogger<TaskPoolService> logger)
    {
        _cacheService = cacheService;
        _templateRepository = templateRepository;
        _instanceRepository = instanceRepository;
        _templateRenderer = templateRenderer;
        _redis = redis;
        _settings = settings.Value;
        _logger = logger;
    }

    private const int MaxOrphanedTaskRetries = 5;

    public async Task<TaskInstanceDocument?> GetTaskAsync(
        Guid topicId, 
        int targetDifficulty, 
        CancellationToken cancellationToken = default)
    {
        return await GetTaskAsyncInternal(topicId, targetDifficulty, 0, cancellationToken);
    }

    private async Task<TaskInstanceDocument?> GetTaskAsyncInternal(
        Guid topicId, 
        int targetDifficulty, 
        int retryDepth,
        CancellationToken cancellationToken)
    {
        var difficultyBand = CalculateDifficultyBand(targetDifficulty);
        var poolKey = GetPoolKey(topicId, difficultyBand);

        _logger.LogInformation(
            "=== GetTaskAsync STARTED === TopicId: {TopicId}, TargetDifficulty: {TargetDifficulty}, CalculatedBand: {DifficultyBand}, PoolKey: {PoolKey}",
            topicId, targetDifficulty, difficultyBand, poolKey);

        try
        {
            var db = _redis.GetDatabase();
            
            // Check pool size before popping
            var poolSize = await db.ListLengthAsync(poolKey);
            _logger.LogInformation(
                "Valkey pool status - PoolKey: {PoolKey}, CurrentSize: {PoolSize}, RefillThreshold: {RefillThreshold}, TargetSize: {TargetSize}",
                poolKey, poolSize, _settings.RefillThreshold, _settings.TargetPoolSize);
            
            // Pop a task ID from the list
            var taskIdValue = await db.ListRightPopAsync(poolKey);
            
            if (taskIdValue.IsNullOrEmpty)
            {
                _logger.LogWarning(
                    "⚠️ POOL EMPTY - TopicId: {TopicId}, Band: {Band}, PoolKey: {PoolKey}. Initiating fallback to database query.",
                    topicId, difficultyBand, poolKey);
                
                return await GetFallbackTaskAsync(topicId, targetDifficulty, cancellationToken);
            }

            var taskId = taskIdValue.ToString();
            _logger.LogDebug(
                "Popped TaskId from pool - TaskId: {TaskId}, RemainingInPool: {Remaining}",
                taskId, poolSize - 1);

            var task = await _instanceRepository.GetByIdAsync(taskId);

            if (task == null)
            {
                _logger.LogWarning(
                    "⚠️ ORPHANED TASK ID - TaskId {TaskId} found in pool but not in MongoDB. Retry attempt {RetryDepth}/{MaxRetries}",
                    taskId, retryDepth + 1, MaxOrphanedTaskRetries);
                
                if (retryDepth >= MaxOrphanedTaskRetries)
                {
                    _logger.LogError(
                        "❌ MAX RETRIES EXCEEDED - Falling back to database query for TopicId: {TopicId}, TargetDifficulty: {Difficulty}",
                        topicId, targetDifficulty);
                    return await GetFallbackTaskAsync(topicId, targetDifficulty, cancellationToken);
                }
                
                return await GetTaskAsyncInternal(topicId, targetDifficulty, retryDepth + 1, cancellationToken);
            }

            // Check if pool needs refill after removal
            var count = await db.ListLengthAsync(poolKey);
            if (count < _settings.RefillThreshold)
            {
                _logger.LogWarning(
                    "⚠️ POOL NEEDS REFILL - TopicId: {TopicId}, Band: {Band}, CurrentCount: {Count}, Threshold: {Threshold}",
                    topicId, difficultyBand, count, _settings.RefillThreshold);
            }
            else
            {
                _logger.LogDebug(
                    "Pool healthy - TopicId: {TopicId}, Band: {Band}, Count: {Count}",
                    topicId, difficultyBand, count);
            }

            _logger.LogInformation(
                "✅ Task retrieved from pool - TaskId: {TaskId}, Difficulty: {Difficulty}",
                task.Id, task.Difficulty);

            return task;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "❌ ERROR getting task from pool - TopicId: {TopicId}, TargetDifficulty: {TargetDifficulty}, Exception: {ExceptionType}: {Message}",
                topicId, targetDifficulty, ex.GetType().Name, ex.Message);
            return await GetFallbackTaskAsync(topicId, targetDifficulty, cancellationToken);
        }
    }

    public async Task<int> RefillPoolAsync(
        Guid topicId, 
        int difficultyBand, 
        CancellationToken cancellationToken = default)
    {
        var poolKey = GetPoolKey(topicId, difficultyBand);
        var metaKey = GetPoolMetaKey(topicId, difficultyBand);

        _logger.LogInformation(
            "=== RefillPoolAsync STARTED === TopicId: {TopicId}, DifficultyBand: {Band}, PoolKey: {PoolKey}",
            topicId, difficultyBand, poolKey);

        try
        {
            var db = _redis.GetDatabase();
            var currentCount = await db.ListLengthAsync(poolKey);
            var needed = _settings.TargetPoolSize - (int)currentCount;

            _logger.LogInformation(
                "Pool status - Current: {CurrentCount}, Target: {Target}, Need: {Needed}",
                currentCount, _settings.TargetPoolSize, needed);

            if (needed <= 0)
            {
                _logger.LogDebug("Pool is already full, skipping refill");
                return 0;
            }

            _logger.LogInformation(
                "Fetching approved templates - TopicId: {TopicId}, Band: {Band}, Requesting: {Count}",
                topicId, difficultyBand, needed * 2);

            // Get approved templates for this topic and difficulty band
            var templates = await _templateRepository.GetApprovedByTopicAndBandAsync(
                topicId, 
                difficultyBand, 
                needed * 2); // Get more templates than needed for variety

            _logger.LogInformation(
                "Templates fetched - Count: {TemplateCount}, TopicId: {TopicId}, Band: {Band}",
                templates.Count, topicId, difficultyBand);

            if (templates.Count == 0)
            {
                _logger.LogError(
                    "❌ NO TEMPLATES FOUND - TopicId: {TopicId}, DifficultyBand: {Band}. Cannot refill pool!",
                    topicId, difficultyBand);

                // Check if templates exist for ANY band for this topic
                var allTemplates = await _templateRepository.GetApprovedByTopicAsync(topicId);
                _logger.LogError(
                    "📊 Total approved templates for TopicId {TopicId} across ALL bands: {TotalCount}",
                    topicId, allTemplates.Count);

                return 0;
            }

            // Generate task instances from templates
            var instances = new List<TaskInstanceDocument>();
            var random = new Random();
            var minDifficulty = (difficultyBand - 1) * 10 + 1;
            var maxDifficulty = Math.Min(difficultyBand * 10, 100);

            _logger.LogDebug(
                "Generating instances - Count: {Count}, DifficultyRange: [{Min}, {Max}]",
                needed, minDifficulty, maxDifficulty);

            for (int i = 0; i < needed; i++)
            {
                var template = templates[random.Next(templates.Count)];
                var difficulty = random.Next(minDifficulty, maxDifficulty + 1);

                var instance = new TaskInstanceDocument
                {
                    TemplateId = template.Id,
                    TopicId = topicId,
                    TaskType = template.TaskType,
                    Difficulty = difficulty,
                    RenderedContent = _templateRenderer.RenderTemplate(template, difficulty),
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(_settings.PoolTtlHours)
                };

                instances.Add(instance);
            }

            // Bulk insert instances to MongoDB
            _logger.LogDebug("Inserting {Count} instances to MongoDB...", instances.Count);
            await _instanceRepository.BulkCreateAsync(instances);

            // Push task IDs to Valkey list
            var taskIds = instances.Select(i => (RedisValue)i.Id).ToArray();
            _logger.LogDebug("Pushing {Count} task IDs to Valkey pool...", taskIds.Length);
            await db.ListLeftPushAsync(poolKey, taskIds);

            // Update metadata
            var meta = new TaskPoolMetadata
            {
                LastRefillAt = DateTime.UtcNow,
                TotalRefills = await IncrementRefillCountAsync(metaKey)
            };
            await _cacheService.SetAsync(metaKey, meta, TimeSpan.FromDays(7), cancellationToken);

            // Set TTL on pool
            await db.KeyExpireAsync(poolKey, TimeSpan.FromHours(_settings.PoolTtlHours));

            _logger.LogInformation(
                "✅ Pool refilled successfully - TopicId: {TopicId}, Band: {Band}, Added: {Count} tasks, TotalRefills: {TotalRefills}",
                topicId, difficultyBand, instances.Count, meta.TotalRefills);

            return instances.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "❌ ERROR refilling pool - TopicId: {TopicId}, Band: {Band}, Exception: {ExceptionType}: {Message}", 
                topicId, difficultyBand, ex.GetType().Name, ex.Message);
            return 0;
        }
    }

    public async Task<TaskPoolStatus> GetPoolStatusAsync(
        Guid topicId, 
        int difficultyBand, 
        CancellationToken cancellationToken = default)
    {
        var poolKey = GetPoolKey(topicId, difficultyBand);
        var metaKey = GetPoolMetaKey(topicId, difficultyBand);

        try
        {
            var db = _redis.GetDatabase();
            var count = await db.ListLengthAsync(poolKey);
            var meta = await _cacheService.GetAsync<TaskPoolMetadata>(metaKey, cancellationToken);

            return new TaskPoolStatus
            {
                TopicId = topicId,
                DifficultyBand = difficultyBand,
                CurrentCount = (int)count,
                TargetCount = _settings.TargetPoolSize,
                NeedsRefill = count < _settings.RefillThreshold,
                LastRefillAt = meta?.LastRefillAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Error getting pool status for topic {TopicId}, band {Band}", 
                topicId, difficultyBand);
            
            return new TaskPoolStatus
            {
                TopicId = topicId,
                DifficultyBand = difficultyBand,
                CurrentCount = 0,
                TargetCount = _settings.TargetPoolSize,
                NeedsRefill = true
            };
        }
    }

    public async Task<List<TaskPoolStatus>> GetPoolsNeedingRefillAsync(
        CancellationToken cancellationToken = default)
    {
        var statuses = new List<TaskPoolStatus>();

        try
        {
            var db = _redis.GetDatabase();
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            
            // Scan for all pool keys
            var keys = server.Keys(pattern: $"{PoolKeyPrefix}:*", pageSize: 250)
                .Where(k => !k.ToString().Contains(":meta"))
                .ToList();

            foreach (var key in keys)
            {
                // Parse topic ID and band from key: taskpool:{topicId}:{band}
                var parts = key.ToString().Split(':');
                if (parts.Length != 3) continue;

                if (!Guid.TryParse(parts[1], out var topicId)) continue;
                if (!int.TryParse(parts[2], out var band)) continue;

                var count = await db.ListLengthAsync(key);
                if (count < _settings.RefillThreshold)
                {
                    var metaKey = GetPoolMetaKey(topicId, band);
                    var meta = await _cacheService.GetAsync<TaskPoolMetadata>(metaKey, cancellationToken);

                    statuses.Add(new TaskPoolStatus
                    {
                        TopicId = topicId,
                        DifficultyBand = band,
                        CurrentCount = (int)count,
                        TargetCount = _settings.TargetPoolSize,
                        NeedsRefill = true,
                        LastRefillAt = meta?.LastRefillAt
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scanning for pools needing refill");
        }

        return statuses;
    }

    private async Task<TaskInstanceDocument?> GetFallbackTaskAsync(
        Guid topicId, 
        int targetDifficulty, 
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "=== FALLBACK STARTED === TopicId: {TopicId}, TargetDifficulty: {TargetDifficulty}, DifficultyRangeWindow: {Range}",
            topicId, targetDifficulty, _settings.DifficultyRangeWindow);

        // Fallback: Get random task from database
        var range = _settings.DifficultyRangeWindow;
        var minDifficulty = Math.Max(1, targetDifficulty - range);
        var maxDifficulty = Math.Min(100, targetDifficulty + range);

        _logger.LogInformation(
            "Querying MongoDB for tasks - TopicId: {TopicId}, MinDifficulty: {MinDifficulty}, MaxDifficulty: {MaxDifficulty}",
            topicId, minDifficulty, maxDifficulty);

        var tasks = await _instanceRepository.GetRandomByTopicAndDifficultyAsync(
            topicId,
            minDifficulty,
            maxDifficulty,
            1);

        if (tasks.Any())
        {
            var task = tasks.First();
            _logger.LogInformation(
                "✅ Fallback SUCCESS - Found TaskId: {TaskId}, Difficulty: {Difficulty}",
                task.Id, task.Difficulty);
            return task;
        }

        // No instances exist yet — brand-new topic. TaskPoolRefillService only monitors existing
        // Redis pool keys so it never initialises a pool for a topic that has never been requested.
        // Generate instances on-demand now from seeded templates.
        _logger.LogWarning(
            "⚠️ No task instances in MongoDB for TopicId: {TopicId}. Attempting on-demand pool generation from templates...",
            topicId);

        var difficultyBand = CalculateDifficultyBand(targetDifficulty);
        var added = await RefillPoolAsync(topicId, difficultyBand, cancellationToken);

        if (added > 0)
        {
            _logger.LogInformation(
                "✅ On-demand refill generated {Count} instances. Retrying query...",
                added);

            var retryTasks = await _instanceRepository.GetRandomByTopicAndDifficultyAsync(
                topicId, minDifficulty, maxDifficulty, 1);

            if (retryTasks.Any())
            {
                var retryTask = retryTasks.First();
                _logger.LogInformation(
                    "✅ On-demand fallback SUCCESS - TaskId: {TaskId}, Difficulty: {Difficulty}",
                    retryTask.Id, retryTask.Difficulty);
                return retryTask;
            }

            // Generated instances may fall outside the narrow difficulty window — widen to full topic range
            var wideTasks = await _instanceRepository.GetRandomByTopicAndDifficultyAsync(
                topicId, 1, 100, 1);

            if (wideTasks.Any())
            {
                var wideTask = wideTasks.First();
                _logger.LogInformation(
                    "✅ On-demand fallback SUCCESS (widened range) - TaskId: {TaskId}, Difficulty: {Difficulty}",
                    wideTask.Id, wideTask.Difficulty);
                return wideTask;
            }
        }

        _logger.LogError(
            "❌ FALLBACK FAILED - No templates or instances available for TopicId: {TopicId}. Ensure TaskTemplateSeeder ran successfully.",
            topicId);

        var totalTasksCount = await _instanceRepository.GetPoolCountAsync(topicId, 1, 100);
        _logger.LogError(
            "📊 Total tasks in MongoDB for TopicId {TopicId}: {TotalCount}",
            topicId, totalTasksCount);

        return null;
    }

    private int CalculateDifficultyBand(int difficulty)
    {
        // Map 1-100 difficulty to 1-10 bands
        return Math.Max(1, Math.Min(10, (difficulty + 9) / 10));
    }

    private string GetPoolKey(Guid topicId, int difficultyBand)
    {
        return $"{PoolKeyPrefix}:{topicId}:{difficultyBand}";
    }

    private string GetPoolMetaKey(Guid topicId, int difficultyBand)
    {
        return $"{PoolMetaKeyPrefix}:{topicId}:{difficultyBand}";
    }

    private async Task<int> IncrementRefillCountAsync(string metaKey)
    {
        var db = _redis.GetDatabase();
        var counterKey = $"{metaKey}:count";
        return (int)await db.StringIncrementAsync(counterKey);
    }

    private class TaskPoolMetadata
    {
        public DateTime LastRefillAt { get; set; }
        public int TotalRefills { get; set; }
    }
}
