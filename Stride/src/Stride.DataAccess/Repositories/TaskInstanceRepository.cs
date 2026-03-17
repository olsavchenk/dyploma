using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using Stride.Core.Documents;
using Stride.DataAccess.Contexts;

namespace Stride.DataAccess.Repositories;

public class TaskInstanceRepository : ITaskInstanceRepository
{
    private readonly IMongoCollection<TaskInstanceDocument> _instances;
    private readonly ILogger<TaskInstanceRepository> _logger;

    public TaskInstanceRepository(MongoDbContext context, ILogger<TaskInstanceRepository> logger)
    {
        _instances = context.TaskInstances;
        _logger = logger;
    }

    public async Task<TaskInstanceDocument?> GetByIdAsync(string id)
    {
        return await _instances.Find(i => i.Id == id).FirstOrDefaultAsync();
    }

    public async Task<List<TaskInstanceDocument>> GetRandomByTopicAndDifficultyAsync(
        Guid topicId, 
        int minDifficulty, 
        int maxDifficulty, 
        int count)
    {
        _logger.LogInformation(
            "MongoDB Query - GetRandomByTopicAndDifficulty - TopicId: {TopicId}, DifficultyRange: [{Min}, {Max}], RequestedCount: {Count}",
            topicId, minDifficulty, maxDifficulty, count);

        // MongoDB aggregation to get random samples
        var pipeline = new[]
        {
            new BsonDocument("$match", new BsonDocument
            {
                { "topic_id", topicId.ToString() },
                { "difficulty", new BsonDocument
                    {
                        { "$gte", minDifficulty },
                        { "$lte", maxDifficulty }
                    }
                }
            }),
            new BsonDocument("$sample", new BsonDocument("size", count))
        };

        var results = await _instances
            .Aggregate<TaskInstanceDocument>(pipeline)
            .ToListAsync();

        _logger.LogInformation(
            "MongoDB Query Result - Found {FoundCount} task instances",
            results.Count);

        if (results.Count == 0)
        {
            _logger.LogWarning(
                "⚠️ No task instances found in MongoDB for TopicId: {TopicId}, DifficultyRange: [{Min}, {Max}]",
                topicId, minDifficulty, maxDifficulty);
        }

        return results;
    }

    public async Task<string> CreateAsync(TaskInstanceDocument instance)
    {
        instance.CreatedAt = DateTime.UtcNow;
        await _instances.InsertOneAsync(instance);
        return instance.Id;
    }

    public async Task BulkCreateAsync(IEnumerable<TaskInstanceDocument> instances)
    {
        var instanceList = instances.ToList();
        var now = DateTime.UtcNow;
        foreach (var instance in instanceList)
        {
            instance.CreatedAt = now;
        }

        _logger.LogInformation(
            "Bulk inserting {Count} task instances to MongoDB",
            instanceList.Count);

        await _instances.InsertManyAsync(instanceList);

        _logger.LogDebug(
            "✅ Bulk insert completed - {Count} instances created",
            instanceList.Count);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _instances.DeleteOneAsync(i => i.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<long> DeleteExpiredAsync()
    {
        var result = await _instances.DeleteManyAsync(
            i => i.ExpiresAt != null && i.ExpiresAt < DateTime.UtcNow
        );

        return result.DeletedCount;
    }

    public async Task<long> GetPoolCountAsync(Guid topicId, int minDifficulty, int maxDifficulty)
    {
        _logger.LogDebug(
            "Counting task instances - TopicId: {TopicId}, DifficultyRange: [{Min}, {Max}]",
            topicId, minDifficulty, maxDifficulty);

        var count = await _instances.CountDocumentsAsync(
            i => i.TopicId == topicId && 
                 i.Difficulty >= minDifficulty && 
                 i.Difficulty <= maxDifficulty
        );

        _logger.LogInformation(
            "Task instance count - TopicId: {TopicId}, Count: {Count}",
            topicId, count);

        return count;
    }

    public async Task<long> DeleteOldInstancesAsync(Guid topicId, DateTime olderThan)
    {
        var result = await _instances.DeleteManyAsync(
            i => i.TopicId == topicId && i.CreatedAt < olderThan
        );

        return result.DeletedCount;
    }
}
