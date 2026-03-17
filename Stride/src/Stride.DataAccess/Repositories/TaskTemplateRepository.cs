using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Stride.Core.Documents;
using Stride.DataAccess.Contexts;

namespace Stride.DataAccess.Repositories;

public class TaskTemplateRepository : ITaskTemplateRepository
{
    private readonly IMongoCollection<TaskTemplateDocument> _templates;
    private readonly ILogger<TaskTemplateRepository> _logger;

    public TaskTemplateRepository(MongoDbContext context, ILogger<TaskTemplateRepository> logger)
    {
        _templates = context.TaskTemplates;
        _logger = logger;
    }

    public async Task<TaskTemplateDocument?> GetByIdAsync(string id)
    {
        return await _templates.Find(t => t.Id == id).FirstOrDefaultAsync();
    }

    public async Task<List<TaskTemplateDocument>> GetApprovedByTopicAndBandAsync(Guid topicId, int difficultyBand, int limit = 100)
    {
        _logger.LogInformation(
            "MongoDB Query - GetApprovedByTopicAndBand - TopicId: {TopicId}, DifficultyBand: {Band}, Limit: {Limit}",
            topicId, difficultyBand, limit);

        var results = await _templates
            .Find(t => t.TopicId == topicId && t.DifficultyBand == difficultyBand && t.IsApproved)
            .Limit(limit)
            .ToListAsync();

        _logger.LogInformation(
            "Template query result - TopicId: {TopicId}, Band: {Band}, FoundCount: {Count}",
            topicId, difficultyBand, results.Count);

        if (results.Count == 0)
        {
            _logger.LogWarning(
                "⚠️ No approved templates found for TopicId: {TopicId}, Band: {Band}",
                topicId, difficultyBand);
        }

        return results;
    }

    public async Task<List<TaskTemplateDocument>> GetApprovedByTopicAsync(Guid topicId)
    {
        _logger.LogDebug(
            "MongoDB Query - GetApprovedByTopic - TopicId: {TopicId}",
            topicId);

        var results = await _templates
            .Find(t => t.TopicId == topicId && t.IsApproved)
            .ToListAsync();

        _logger.LogInformation(
            "Total approved templates for TopicId {TopicId}: {Count}",
            topicId, results.Count);

        return results;
    }

    public async Task<List<TaskTemplateDocument>> GetPendingReviewAsync(int skip = 0, int limit = 50)
    {
        return await _templates
            .Find(t => !t.IsApproved && t.ReviewedBy == null)
            .SortByDescending(t => t.CreatedAt)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<List<TaskTemplateDocument>> GetPendingReviewWithFiltersAsync(
        Guid? topicId = null,
        string? taskType = null,
        int? difficultyBand = null,
        int skip = 0,
        int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var filterBuilder = Builders<TaskTemplateDocument>.Filter;
        var filters = new List<FilterDefinition<TaskTemplateDocument>>
        {
            filterBuilder.Eq(t => t.IsApproved, false),
            filterBuilder.Eq(t => t.ReviewedBy, null)
        };

        if (topicId.HasValue)
        {
            filters.Add(filterBuilder.Eq(t => t.TopicId, topicId.Value));
        }

        if (!string.IsNullOrWhiteSpace(taskType))
        {
            filters.Add(filterBuilder.Eq(t => t.TaskType, taskType));
        }

        if (difficultyBand.HasValue)
        {
            filters.Add(filterBuilder.Eq(t => t.DifficultyBand, difficultyBand.Value));
        }

        var combinedFilter = filterBuilder.And(filters);

        return await _templates
            .Find(combinedFilter)
            .SortByDescending(t => t.CreatedAt)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetPendingReviewCountWithFiltersAsync(
        Guid? topicId = null,
        string? taskType = null,
        int? difficultyBand = null,
        CancellationToken cancellationToken = default)
    {
        var filterBuilder = Builders<TaskTemplateDocument>.Filter;
        var filters = new List<FilterDefinition<TaskTemplateDocument>>
        {
            filterBuilder.Eq(t => t.IsApproved, false),
            filterBuilder.Eq(t => t.ReviewedBy, null)
        };

        if (topicId.HasValue)
        {
            filters.Add(filterBuilder.Eq(t => t.TopicId, topicId.Value));
        }

        if (!string.IsNullOrWhiteSpace(taskType))
        {
            filters.Add(filterBuilder.Eq(t => t.TaskType, taskType));
        }

        if (difficultyBand.HasValue)
        {
            filters.Add(filterBuilder.Eq(t => t.DifficultyBand, difficultyBand.Value));
        }

        var combinedFilter = filterBuilder.And(filters);

        var count = await _templates
            .CountDocumentsAsync(combinedFilter, cancellationToken: cancellationToken);

        return (int)count;
    }

    public async Task<int> GetPendingReviewCountAsync(CancellationToken cancellationToken = default)
    {
        var count = await _templates
            .CountDocumentsAsync(
                t => !t.IsApproved && t.ReviewedBy == null,
                cancellationToken: cancellationToken);

        return (int)count;
    }

    public async Task<string> CreateAsync(TaskTemplateDocument template)
    {
        template.CreatedAt = DateTime.UtcNow;
        await _templates.InsertOneAsync(template);
        return template.Id;
    }

    public async Task<bool> UpdateAsync(TaskTemplateDocument template)
    {
        template.UpdatedAt = DateTime.UtcNow;
        
        var result = await _templates.ReplaceOneAsync(
            t => t.Id == template.Id,
            template
        );

        return result.ModifiedCount > 0;
    }

    public async Task<bool> ApproveAsync(string id, Guid reviewerId)
    {
        var update = Builders<TaskTemplateDocument>.Update
            .Set(t => t.IsApproved, true)
            .Set(t => t.ReviewedBy, reviewerId)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        var result = await _templates.UpdateOneAsync(
            t => t.Id == id,
            update
        );

        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _templates.DeleteOneAsync(t => t.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<long> GetCountByTopicAsync(Guid topicId)
    {
        return await _templates.CountDocumentsAsync(t => t.TopicId == topicId && t.IsApproved);
    }

    public async Task<long> GetTotalCountAsync()
    {
        return await _templates.CountDocumentsAsync(t => t.IsApproved);
    }

    public async Task BulkCreateAsync(IEnumerable<TaskTemplateDocument> templates)
    {
        var templateList = templates.ToList();
        var now = DateTime.UtcNow;
        foreach (var template in templateList)
        {
            template.CreatedAt = now;
        }

        _logger.LogInformation(
            "Bulk inserting {Count} task templates to MongoDB",
            templateList.Count);

        await _templates.InsertManyAsync(templateList);

        _logger.LogInformation(
            "✅ Successfully inserted {Count} task templates",
            templateList.Count);
    }
}
