using Stride.Services.Models.Admin;

namespace Stride.Services.Interfaces;

public interface IAdminService
{
    /// <summary>
    /// Get paginated list of users with search and filters
    /// </summary>
    Task<PaginatedResult<AdminUserListItemDto>> GetUsersAsync(GetUsersRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Change user role and create appropriate profile if needed
    /// </summary>
    Task ChangeUserRoleAsync(Guid userId, string newRole, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get admin dashboard analytics
    /// </summary>
    Task<AdminDashboardDto> GetDashboardAnalyticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get pending AI-generated task templates for review
    /// </summary>
    Task<PaginatedResult<ReviewQueueItemDto>> GetReviewQueueAsync(GetReviewQueueRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Approve an AI-generated task template
    /// </summary>
    Task ApproveTemplateAsync(string templateId, Guid reviewerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Reject an AI-generated task template
    /// </summary>
    Task RejectTemplateAsync(string templateId, string? reason, CancellationToken cancellationToken = default);
}
