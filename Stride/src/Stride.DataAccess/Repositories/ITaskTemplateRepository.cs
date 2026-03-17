using Stride.Core.Documents;

namespace Stride.DataAccess.Repositories;

public interface ITaskTemplateRepository
{
    /// <summary>
    /// Gets a template by ID
    /// </summary>
    Task<TaskTemplateDocument?> GetByIdAsync(string id);

    /// <summary>
    /// Gets approved templates for a specific topic and difficulty band
    /// </summary>
    Task<List<TaskTemplateDocument>> GetApprovedByTopicAndBandAsync(Guid topicId, int difficultyBand, int limit = 100);

    /// <summary>
    /// Gets approved templates for a specific topic
    /// </summary>
    Task<List<TaskTemplateDocument>> GetApprovedByTopicAsync(Guid topicId);

    /// <summary>
    /// Gets pending review templates (not approved)
    /// </summary>
    Task<List<TaskTemplateDocument>> GetPendingReviewAsync(int skip = 0, int limit = 50);

    /// <summary>
    /// Gets pending review templates with filters
    /// </summary>
    Task<List<TaskTemplateDocument>> GetPendingReviewWithFiltersAsync(
        Guid? topicId = null, 
        string? taskType = null, 
        int? difficultyBand = null, 
        int skip = 0, 
        int limit = 50,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets count of pending review templates with filters
    /// </summary>
    Task<int> GetPendingReviewCountWithFiltersAsync(
        Guid? topicId = null,
        string? taskType = null,
        int? difficultyBand = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets count of pending review templates
    /// </summary>
    Task<int> GetPendingReviewCountAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new template
    /// </summary>
    Task<string> CreateAsync(TaskTemplateDocument template);

    /// <summary>
    /// Updates an existing template
    /// </summary>
    Task<bool> UpdateAsync(TaskTemplateDocument template);

    /// <summary>
    /// Approves a template
    /// </summary>
    Task<bool> ApproveAsync(string id, Guid reviewerId);

    /// <summary>
    /// Soft deletes a template
    /// </summary>
    Task<bool> DeleteAsync(string id);

    /// <summary>
    /// Gets template count for a topic
    /// </summary>
    Task<long> GetCountByTopicAsync(Guid topicId);

    /// <summary>
    /// Gets total count of all approved templates
    /// </summary>
    Task<long> GetTotalCountAsync();

    /// <summary>
    /// Bulk creates templates
    /// </summary>
    Task BulkCreateAsync(IEnumerable<TaskTemplateDocument> templates);
}
