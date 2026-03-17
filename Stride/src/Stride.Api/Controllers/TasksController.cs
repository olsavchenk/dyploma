using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Adaptive.Models.DTOs.Task;
using Stride.Adaptive.Services.Interfaces;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly ILogger<TasksController> _logger;

    public TasksController(
        ITaskService taskService,
        ILogger<TasksController> logger)
    {
        _taskService = taskService;
        _logger = logger;
    }

    /// <summary>
    /// Get the next adaptive task for a student based on their performance
    /// </summary>
    /// <param name="topicId">Topic ID to get task for</param>
    /// <returns>Task without answer revealed</returns>
    [HttpGet("next")]
    [ProducesResponseType(typeof(TaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetNextTask([FromQuery] Guid topicId)
    {
        if (topicId == Guid.Empty)
        {
            return BadRequest(new { message = "Topic ID is required" });
        }

        var studentId = GetCurrentStudentId();
        if (studentId == null)
        {
            return Unauthorized(new { message = "Student profile not found" });
        }

        try
        {
            var task = await _taskService.GetNextTaskAsync(studentId.Value, topicId);
            return Ok(task);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "No task available for student {StudentId}, topic {TopicId}", 
                studentId.Value, topicId);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Submit an answer to a task and get feedback
    /// </summary>
    /// <param name="taskInstanceId">Task instance ID</param>
    /// <param name="request">Answer and response time</param>
    /// <returns>Feedback with correctness, explanation, and XP earned</returns>
    [HttpPost("{taskInstanceId}/submit")]
    [ProducesResponseType(typeof(SubmitTaskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SubmitTask(
        string taskInstanceId, 
        [FromBody] SubmitTaskRequest request)
    {
        if (string.IsNullOrWhiteSpace(taskInstanceId))
        {
            return BadRequest(new { message = "Task instance ID is required" });
        }

        var studentId = GetCurrentStudentId();
        if (studentId == null)
        {
            return Unauthorized(new { message = "Student profile not found" });
        }

        try
        {
            var response = await _taskService.SubmitTaskAsync(
                studentId.Value, 
                taskInstanceId, 
                request);
            
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error submitting task {TaskInstanceId} for student {StudentId}", 
                taskInstanceId, studentId.Value);
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get paginated history of task attempts for the current student
    /// </summary>
    /// <param name="pageNumber">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 20, max: 100)</param>
    /// <returns>Paginated task history</returns>
    [HttpGet("history")]
    [ProducesResponseType(typeof(TaskHistoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTaskHistory(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        if (pageNumber < 1)
            pageNumber = 1;

        if (pageSize < 1 || pageSize > 100)
            pageSize = 20;

        var studentId = GetCurrentStudentId();
        if (studentId == null)
        {
            return Unauthorized(new { message = "Student profile not found" });
        }

        var history = await _taskService.GetTaskHistoryAsync(studentId.Value, pageNumber, pageSize);
        return Ok(history);
    }

    private Guid? GetCurrentStudentId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return null;
        }

        var studentIdClaim = User.FindFirst("StudentProfileId")?.Value;
        
        if (string.IsNullOrEmpty(studentIdClaim) || !Guid.TryParse(studentIdClaim, out var studentId))
        {
            return null;
        }

        return studentId;
    }
}
