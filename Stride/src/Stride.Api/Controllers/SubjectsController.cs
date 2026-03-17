using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Subject;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/subjects")]
public class SubjectsController : ControllerBase
{
    private readonly ISubjectService _subjectService;
    private readonly ILogger<SubjectsController> _logger;

    public SubjectsController(
        ISubjectService subjectService,
        ILogger<SubjectsController> logger)
    {
        _subjectService = subjectService;
        _logger = logger;
    }

    /// <summary>
    /// Get all subjects with optional student progress (cached 1hr for public view)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<SubjectListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllSubjects()
    {
        var userId = GetCurrentUserId();
        var subjects = await _subjectService.GetAllSubjectsAsync(userId);

        return Ok(subjects);
    }

    /// <summary>
    /// Get subject by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(SubjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSubjectById(Guid id)
    {
        var subject = await _subjectService.GetSubjectByIdAsync(id);

        if (subject == null)
        {
            return NotFound(new { message = "Subject not found" });
        }

        return Ok(subject);
    }

    /// <summary>
    /// Get subject by slug
    /// </summary>
    [HttpGet("by-slug/{slug}")]
    [ProducesResponseType(typeof(SubjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSubjectBySlug(string slug)
    {
        var subject = await _subjectService.GetSubjectBySlugAsync(slug);

        if (subject == null)
        {
            return NotFound(new { message = "Subject not found" });
        }

        return Ok(subject);
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
