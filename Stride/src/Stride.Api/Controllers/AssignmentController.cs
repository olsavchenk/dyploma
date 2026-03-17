using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Class;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/assignments")]
[Authorize(Policy = "StudentAccess")]
public class AssignmentController : ControllerBase
{
    private readonly IClassService _classService;
    private readonly ILogger<AssignmentController> _logger;

    public AssignmentController(
        IClassService classService,
        ILogger<AssignmentController> logger)
    {
        _classService = classService;
        _logger = logger;
    }

    /// <summary>
    /// Get all assignments for the current student
    /// </summary>
    /// <returns>List of student's assignments with completion status</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<StudentAssignmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetStudentAssignments()
    {
        var studentId = GetStudentProfileId();

        if (studentId == null)
        {
            _logger.LogWarning("User {UserId} attempted to get assignments without student profile", GetCurrentUserId());
            return BadRequest(new { message = "Student profile not found" });
        }

        var assignments = await _classService.GetStudentAssignmentsAsync(studentId.Value);

        _logger.LogInformation("Retrieved {Count} assignments for student {StudentId}", assignments.Count, studentId);

        return Ok(assignments);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return null;
        }

        return userId;
    }

    private Guid? GetStudentProfileId()
    {
        var studentIdClaim = User.FindFirst("StudentProfileId")?.Value;

        if (string.IsNullOrEmpty(studentIdClaim) || !Guid.TryParse(studentIdClaim, out var studentId))
        {
            return null;
        }

        return studentId;
    }
}
