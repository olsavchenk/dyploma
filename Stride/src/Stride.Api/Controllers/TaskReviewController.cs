using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Services.Interfaces;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/topics/{topicId:guid}/tasks")]
[Authorize(Policy = "TeacherAccess")]
public class TaskReviewController : ControllerBase
{
    private readonly ITaskReviewService _taskReviewService;
    private readonly ILogger<TaskReviewController> _logger;

    public TaskReviewController(
        ITaskReviewService taskReviewService,
        ILogger<TaskReviewController> logger)
    {
        _taskReviewService = taskReviewService;
        _logger = logger;
    }

    /// <summary>
    /// Browse all task templates for a topic with filtering and pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(TaskTemplatePagedResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTemplates(
        Guid topicId,
        [FromQuery] string? reviewStatus = null,
        [FromQuery] int? difficultyBand = null,
        [FromQuery] string? taskType = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var result = await _taskReviewService.GetTemplatesAsync(
            topicId, reviewStatus, difficultyBand, taskType, page, pageSize);

        return Ok(result);
    }

    /// <summary>
    /// Get single task template detail
    /// </summary>
    [HttpGet("{templateId}")]
    [ProducesResponseType(typeof(TaskTemplateDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTemplate(Guid topicId, string templateId)
    {
        var template = await _taskReviewService.GetTemplateByIdAsync(templateId);

        if (template == null || template.TopicId != topicId)
            return NotFound(new { message = "Template not found" });

        return Ok(template);
    }

    /// <summary>
    /// Approve a task template — makes it available for student pool
    /// </summary>
    [HttpPost("{templateId}/approve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveTemplate(Guid topicId, string templateId)
    {
        var teacherId = GetTeacherProfileId();
        if (teacherId == null) return BadRequest(new { message = "Teacher profile not found" });

        try
        {
            await _taskReviewService.ApproveAsync(templateId, teacherId.Value);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = "Template not found" });
        }
    }

    /// <summary>
    /// Reject a task template
    /// </summary>
    [HttpPost("{templateId}/reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectTemplate(Guid topicId, string templateId)
    {
        var teacherId = GetTeacherProfileId();
        if (teacherId == null) return BadRequest(new { message = "Teacher profile not found" });

        try
        {
            await _taskReviewService.RejectAsync(templateId, teacherId.Value);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = "Template not found" });
        }
    }

    /// <summary>
    /// Bulk approve/reject/delete task templates
    /// </summary>
    [HttpPost("bulk-action")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BulkAction(Guid topicId, [FromBody] BulkActionRequest request)
    {
        var teacherId = GetTeacherProfileId();
        if (teacherId == null) return BadRequest(new { message = "Teacher profile not found" });

        if (request.TemplateIds.Count == 0)
            return BadRequest(new { message = "No template IDs provided" });

        var validActions = new[] { "approve", "reject", "delete" };
        if (!validActions.Contains(request.Action.ToLowerInvariant()))
            return BadRequest(new { message = "Invalid action. Use: approve, reject, or delete" });

        await _taskReviewService.BulkActionAsync(
            request.TemplateIds, request.Action, teacherId.Value);

        return NoContent();
    }

    /// <summary>
    /// Delete a task template entirely
    /// </summary>
    [HttpDelete("{templateId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTemplate(Guid topicId, string templateId)
    {
        try
        {
            await _taskReviewService.DeleteAsync(templateId);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = "Template not found" });
        }
    }

    private Guid? GetTeacherProfileId()
    {
        var teacherIdClaim = User.FindFirst("TeacherProfileId")?.Value;

        if (string.IsNullOrEmpty(teacherIdClaim) || !Guid.TryParse(teacherIdClaim, out var teacherId))
            return null;

        return teacherId;
    }
}
