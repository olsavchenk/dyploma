using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Admin;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize(Policy = "AdminAccess")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        IAdminService adminService,
        ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated list of users with search and filters
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(PaginatedResult<AdminUserListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] GetUsersRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetUsersAsync(request, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} retrieved user list - Page: {Page}, TotalCount: {TotalCount}",
                GetCurrentUserId(),
                request.Page,
                result.TotalCount);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user list");
            return BadRequest(new { message = "Failed to retrieve users" });
        }
    }

    /// <summary>
    /// Change user role (creates profile if needed)
    /// </summary>
    [HttpPut("users/{id}/role")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangeUserRole(
        Guid id,
        [FromBody] ChangeUserRoleRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await _adminService.ChangeUserRoleAsync(id, request.Role, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} changed role for user {UserId} to {NewRole}",
                GetCurrentUserId(),
                id,
                request.Role);

            return Ok(new { message = $"User role changed to {request.Role} successfully" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to change user role: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing user role for user {UserId}", id);
            return BadRequest(new { message = "Failed to change user role" });
        }
    }

    /// <summary>
    /// Get admin dashboard analytics (KPIs)
    /// </summary>
    [HttpGet("analytics/dashboard")]
    [ProducesResponseType(typeof(AdminDashboardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDashboardAnalytics(CancellationToken cancellationToken)
    {
        try
        {
            var dashboard = await _adminService.GetDashboardAnalyticsAsync(cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} retrieved dashboard analytics",
                GetCurrentUserId());

            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard analytics");
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { message = "Failed to retrieve dashboard analytics" });
        }
    }

    /// <summary>
    /// Get pending AI-generated task templates for review
    /// </summary>
    [HttpGet("ai/review-queue")]
    [ProducesResponseType(typeof(PaginatedResult<ReviewQueueItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetReviewQueue(
        [FromQuery] GetReviewQueueRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _adminService.GetReviewQueueAsync(request, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} retrieved AI review queue - Page: {Page}, TotalCount: {TotalCount}",
                GetCurrentUserId(),
                request.Page,
                result.TotalCount);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving AI review queue");
            return BadRequest(new { message = "Failed to retrieve review queue" });
        }
    }

    /// <summary>
    /// Approve an AI-generated task template
    /// </summary>
    [HttpPost("ai/review-queue/{id}/approve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveTemplate(
        string id,
        CancellationToken cancellationToken)
    {
        try
        {
            var reviewerId = GetCurrentUserId();
            await _adminService.ApproveTemplateAsync(id, reviewerId, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} approved template {TemplateId}",
                reviewerId,
                id);

            return Ok(new { message = "Template approved successfully" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to approve template: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving template {TemplateId}", id);
            return BadRequest(new { message = "Failed to approve template" });
        }
    }

    /// <summary>
    /// Reject an AI-generated task template
    /// </summary>
    [HttpPost("ai/review-queue/{id}/reject")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectTemplate(
        string id,
        [FromBody] RejectTemplateRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await _adminService.RejectTemplateAsync(id, request.Reason, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} rejected template {TemplateId}. Reason: {Reason}",
                GetCurrentUserId(),
                id,
                request.Reason ?? "No reason provided");

            return Ok(new { message = "Template rejected successfully" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to reject template: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting template {TemplateId}", id);
            return BadRequest(new { message = "Failed to reject template" });
        }
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user token");
        }

        return userId;
    }
}
