using Stride.Adaptive.Models.DTOs;

namespace Stride.Adaptive.Services.Interfaces;

public interface ITaskReviewService
{
    Task<TaskTemplatePagedResult> GetTemplatesAsync(
        Guid topicId,
        string? reviewStatus = null,
        int? difficultyBand = null,
        string? taskType = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    Task<TaskTemplateDetailDto?> GetTemplateByIdAsync(
        string templateId,
        CancellationToken cancellationToken = default);

    Task ApproveAsync(string templateId, Guid reviewedBy, CancellationToken cancellationToken = default);
    Task RejectAsync(string templateId, Guid reviewedBy, CancellationToken cancellationToken = default);

    Task BulkActionAsync(
        List<string> templateIds,
        string action,
        Guid reviewedBy,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(string templateId, CancellationToken cancellationToken = default);
}
