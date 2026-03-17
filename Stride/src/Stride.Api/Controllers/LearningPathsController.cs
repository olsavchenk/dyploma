using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.LearningPath;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/learning-paths")]
public class LearningPathsController : ControllerBase
{
    private readonly ILearningPathService _learningPathService;
    private readonly ILogger<LearningPathsController> _logger;

    public LearningPathsController(
        ILearningPathService learningPathService,
        ILogger<LearningPathsController> logger)
    {
        _learningPathService = learningPathService;
        _logger = logger;
    }

    /// <summary>
    /// Get all learning paths with optional filters and student progress
    /// </summary>
    /// <param name="subjectId">Optional filter by subject ID</param>
    /// <param name="gradeLevel">Optional filter by grade level</param>
    /// <returns>List of learning paths</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<LearningPathListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllLearningPaths(
        [FromQuery] Guid? subjectId = null,
        [FromQuery] int? gradeLevel = null)
    {
        var studentId = GetCurrentUserId();
        var learningPaths = await _learningPathService.GetAllLearningPathsAsync(subjectId, gradeLevel, studentId);

        _logger.LogInformation(
            "Retrieved {Count} learning paths for user {UserId} with filters: SubjectId={SubjectId}, GradeLevel={GradeLevel}",
            learningPaths.Count,
            studentId?.ToString() ?? "anonymous",
            subjectId?.ToString() ?? "none",
            gradeLevel?.ToString() ?? "none");

        return Ok(learningPaths);
    }

    /// <summary>
    /// Get learning path by ID with steps and completion status
    /// </summary>
    /// <param name="id">Learning path ID</param>
    /// <returns>Learning path detail with steps</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(LearningPathDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLearningPathById(Guid id)
    {
        var studentId = GetCurrentUserId();
        var learningPath = await _learningPathService.GetLearningPathByIdAsync(id, studentId);

        if (learningPath == null)
        {
            _logger.LogWarning("Learning path {LearningPathId} not found", id);
            return NotFound(new { message = "Learning path not found" });
        }

        _logger.LogInformation(
            "Retrieved learning path {LearningPathId} with {StepCount} steps for user {UserId}",
            id,
            learningPath.Steps.Count,
            studentId?.ToString() ?? "anonymous");

        return Ok(learningPath);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return null; // Anonymous user
        }

        return userId;
    }
}
