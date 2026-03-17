using System.Text.Json;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Services.Interfaces;
using Stride.DataAccess.Contexts;

namespace Stride.Adaptive.Services.Implementations;

public class TaskReviewService : ITaskReviewService
{
    private readonly MongoDbContext _mongoDbContext;
    private readonly ILogger<TaskReviewService> _logger;

    public TaskReviewService(
        MongoDbContext mongoDbContext,
        ILogger<TaskReviewService> logger)
    {
        _mongoDbContext = mongoDbContext;
        _logger = logger;
    }

    public async Task<TaskTemplatePagedResult> GetTemplatesAsync(
        Guid topicId,
        string? reviewStatus = null,
        int? difficultyBand = null,
        string? taskType = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var filterBuilder = Builders<Core.Documents.TaskTemplateDocument>.Filter;
        var filter = filterBuilder.Eq(t => t.TopicId, topicId);

        if (!string.IsNullOrEmpty(reviewStatus))
            filter &= filterBuilder.Eq(t => t.ReviewStatus, reviewStatus);

        if (difficultyBand.HasValue)
            filter &= filterBuilder.Eq(t => t.DifficultyBand, difficultyBand.Value);

        if (!string.IsNullOrEmpty(taskType))
            filter &= filterBuilder.Eq(t => t.TaskType, taskType);

        var totalCount = await _mongoDbContext.TaskTemplates
            .CountDocumentsAsync(filter, cancellationToken: cancellationToken);

        var templates = await _mongoDbContext.TaskTemplates
            .Find(filter)
            .SortByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(cancellationToken);

        var items = templates.Select(MapToListItem).ToList();

        return new TaskTemplatePagedResult
        {
            Items = items,
            TotalCount = (int)totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };
    }

    public async Task<TaskTemplateDetailDto?> GetTemplateByIdAsync(
        string templateId,
        CancellationToken cancellationToken = default)
    {
        var template = await _mongoDbContext.TaskTemplates
            .Find(t => t.Id == templateId)
            .FirstOrDefaultAsync(cancellationToken);

        if (template == null) return null;

        return MapToDetailDto(template);
    }

    public async Task ApproveAsync(string templateId, Guid reviewedBy, CancellationToken cancellationToken = default)
    {
        var update = Builders<Core.Documents.TaskTemplateDocument>.Update
            .Set(t => t.IsApproved, true)
            .Set(t => t.ReviewStatus, "Approved")
            .Set(t => t.ReviewedBy, reviewedBy)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        var result = await _mongoDbContext.TaskTemplates
            .UpdateOneAsync(t => t.Id == templateId, update, cancellationToken: cancellationToken);

        if (result.MatchedCount == 0)
            throw new InvalidOperationException($"Template {templateId} not found");

        _logger.LogInformation("Template {TemplateId} approved by {ReviewedBy}", templateId, reviewedBy);
    }

    public async Task RejectAsync(string templateId, Guid reviewedBy, CancellationToken cancellationToken = default)
    {
        var update = Builders<Core.Documents.TaskTemplateDocument>.Update
            .Set(t => t.IsApproved, false)
            .Set(t => t.ReviewStatus, "Rejected")
            .Set(t => t.ReviewedBy, reviewedBy)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        var result = await _mongoDbContext.TaskTemplates
            .UpdateOneAsync(t => t.Id == templateId, update, cancellationToken: cancellationToken);

        if (result.MatchedCount == 0)
            throw new InvalidOperationException($"Template {templateId} not found");

        _logger.LogInformation("Template {TemplateId} rejected by {ReviewedBy}", templateId, reviewedBy);
    }

    public async Task BulkActionAsync(
        List<string> templateIds,
        string action,
        Guid reviewedBy,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<Core.Documents.TaskTemplateDocument>.Filter
            .In(t => t.Id, templateIds);

        switch (action.ToLowerInvariant())
        {
            case "approve":
                var approveUpdate = Builders<Core.Documents.TaskTemplateDocument>.Update
                    .Set(t => t.IsApproved, true)
                    .Set(t => t.ReviewStatus, "Approved")
                    .Set(t => t.ReviewedBy, reviewedBy)
                    .Set(t => t.UpdatedAt, DateTime.UtcNow);
                await _mongoDbContext.TaskTemplates.UpdateManyAsync(filter, approveUpdate, cancellationToken: cancellationToken);
                break;

            case "reject":
                var rejectUpdate = Builders<Core.Documents.TaskTemplateDocument>.Update
                    .Set(t => t.IsApproved, false)
                    .Set(t => t.ReviewStatus, "Rejected")
                    .Set(t => t.ReviewedBy, reviewedBy)
                    .Set(t => t.UpdatedAt, DateTime.UtcNow);
                await _mongoDbContext.TaskTemplates.UpdateManyAsync(filter, rejectUpdate, cancellationToken: cancellationToken);
                break;

            case "delete":
                await _mongoDbContext.TaskTemplates.DeleteManyAsync(filter, cancellationToken);
                break;

            default:
                throw new ArgumentException($"Unknown action: {action}");
        }

        _logger.LogInformation(
            "Bulk action '{Action}' performed on {Count} templates by {ReviewedBy}",
            action, templateIds.Count, reviewedBy);
    }

    public async Task DeleteAsync(string templateId, CancellationToken cancellationToken = default)
    {
        var result = await _mongoDbContext.TaskTemplates
            .DeleteOneAsync(t => t.Id == templateId, cancellationToken);

        if (result.DeletedCount == 0)
            throw new InvalidOperationException($"Template {templateId} not found");

        // Also delete any instances generated from this template
        await _mongoDbContext.TaskInstances
            .DeleteManyAsync(i => i.TemplateId == templateId, cancellationToken);

        _logger.LogInformation("Template {TemplateId} and its instances deleted", templateId);
    }

    private static TaskTemplateListItem MapToListItem(Core.Documents.TaskTemplateDocument template)
    {
        var question = "";
        if (template.TemplateContent.Contains("question"))
            question = template.TemplateContent["question"].AsString;

        return new TaskTemplateListItem
        {
            Id = template.Id,
            TaskType = template.TaskType,
            DifficultyBand = template.DifficultyBand,
            Question = question,
            ReviewStatus = template.ReviewStatus,
            IsApproved = template.IsApproved,
            AiProvider = template.AiProvider,
            CreatedAt = template.CreatedAt
        };
    }

    private static TaskTemplateDetailDto MapToDetailDto(Core.Documents.TaskTemplateDocument template)
    {
        var content = template.TemplateContent;

        var question = content.Contains("question") ? content["question"].AsString : "";
        var explanation = content.Contains("explanation") ? content["explanation"].AsString : null;

        List<string>? options = null;
        if (content.Contains("options") && content["options"].IsBsonArray)
        {
            options = content["options"].AsBsonArray
                .Select(v => v.AsString)
                .ToList();
        }

        object? answer = null;
        if (content.Contains("answer"))
        {
            answer = BsonValueToObject(content["answer"]);
        }

        List<string>? hints = null;
        if (content.Contains("hints") && content["hints"].IsBsonArray)
        {
            hints = content["hints"].AsBsonArray
                .Select(v => v.AsString)
                .ToList();
        }

        return new TaskTemplateDetailDto
        {
            Id = template.Id,
            TopicId = template.TopicId,
            TaskType = template.TaskType,
            DifficultyBand = template.DifficultyBand,
            Question = question,
            Options = options,
            Answer = answer,
            Explanation = explanation,
            Hints = hints,
            ReviewStatus = template.ReviewStatus,
            IsApproved = template.IsApproved,
            AiProvider = template.AiProvider,
            ReviewedBy = template.ReviewedBy,
            AssignmentId = template.AssignmentId,
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt
        };
    }

    private static object? BsonValueToObject(BsonValue value)
    {
        return value.BsonType switch
        {
            BsonType.String => value.AsString,
            BsonType.Int32 => value.AsInt32,
            BsonType.Int64 => value.AsInt64,
            BsonType.Boolean => value.AsBoolean,
            BsonType.Double => value.AsDouble,
            BsonType.Array => value.AsBsonArray.Select(BsonValueToObject).ToList(),
            BsonType.Null => null,
            _ => value.ToString()
        };
    }
}
