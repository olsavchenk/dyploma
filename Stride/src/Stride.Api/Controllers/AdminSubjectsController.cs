using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Subject;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/admin/subjects")]
[Authorize(Policy = "AdminAccess")]
public class AdminSubjectsController : ControllerBase
{
    private readonly ISubjectService _subjectService;
    private readonly ILogger<AdminSubjectsController> _logger;

    public AdminSubjectsController(
        ISubjectService subjectService,
        ILogger<AdminSubjectsController> logger)
    {
        _subjectService = subjectService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new subject
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SubjectDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateSubject(
        [FromBody] CreateSubjectRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var subject = await _subjectService.CreateSubjectAsync(request, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} created subject {SubjectId}: {SubjectName}",
                GetCurrentUserId(),
                subject.Id,
                subject.Name);

            return CreatedAtAction(
                nameof(SubjectsController.GetSubjectById),
                "Subjects",
                new { id = subject.Id },
                subject);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to create subject: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating subject");
            return BadRequest(new { message = "Failed to create subject" });
        }
    }

    /// <summary>
    /// Update an existing subject
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(SubjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSubject(
        Guid id,
        [FromBody] UpdateSubjectRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var subject = await _subjectService.UpdateSubjectAsync(id, request, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} updated subject {SubjectId}: {SubjectName}",
                GetCurrentUserId(),
                subject.Id,
                subject.Name);

            return Ok(subject);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to update subject: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating subject {SubjectId}", id);
            return BadRequest(new { message = "Failed to update subject" });
        }
    }

    /// <summary>
    /// Delete a subject (soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSubject(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            await _subjectService.DeleteSubjectAsync(id, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} deleted subject {SubjectId}",
                GetCurrentUserId(),
                id);

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to delete subject: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting subject {SubjectId}", id);
            return BadRequest(new { message = "Failed to delete subject" });
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
