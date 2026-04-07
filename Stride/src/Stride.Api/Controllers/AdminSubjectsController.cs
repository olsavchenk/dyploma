using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Admin;
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
    /// Get paginated list of subjects with optional search
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResult<SubjectListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetSubjects(
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var all = await _subjectService.GetAllSubjectsAsync();

            var filtered = string.IsNullOrWhiteSpace(search)
                ? all
                : all.Where(s => s.Name.Contains(search, StringComparison.OrdinalIgnoreCase)).ToList();

            var totalCount = filtered.Count;
            var items = filtered
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var result = new PaginatedResult<SubjectListItemDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            _logger.LogInformation(
                "Admin {AdminId} retrieved subjects list - Page: {Page}, TotalCount: {TotalCount}",
                GetCurrentUserId(), page, totalCount);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving subjects list");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to retrieve subjects" });
        }
    }

    /// <summary>
    /// Get a subject by id
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(SubjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSubjectById(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var subject = await _subjectService.GetSubjectByIdAsync(id);
            if (subject is null)
                return NotFound(new { message = "Subject not found" });

            return Ok(subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving subject {SubjectId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to retrieve subject" });
        }
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
