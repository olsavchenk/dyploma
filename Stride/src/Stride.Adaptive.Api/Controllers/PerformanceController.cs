using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Services.Interfaces;
using System.Security.Claims;

namespace Stride.Adaptive.Api.Controllers;

[ApiController]
[Route("api/v1/adaptive/performance")]
[Authorize]
public class PerformanceController : ControllerBase
{
    private readonly IStudentPerformanceService _performanceService;
    private readonly ILogger<PerformanceController> _logger;

    public PerformanceController(
        IStudentPerformanceService performanceService,
        ILogger<PerformanceController> logger)
    {
        _performanceService = performanceService;
        _logger = logger;
    }

    /// <summary>
    /// Get all topic performances for a student
    /// </summary>
    [HttpGet("{studentId:guid}")]
    [ProducesResponseType(typeof(List<StudentPerformanceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAllPerformances(Guid studentId)
    {
        if (!IsAuthorizedForStudent(studentId))
        {
            return Forbid();
        }

        var performances = await _performanceService.GetAllPerformancesAsync(studentId);
        return Ok(performances);
    }

    /// <summary>
    /// Get single topic performance for a student
    /// </summary>
    [HttpGet("{studentId:guid}/topic/{topicId:guid}")]
    [ProducesResponseType(typeof(StudentPerformanceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPerformance(Guid studentId, Guid topicId)
    {
        if (!IsAuthorizedForStudent(studentId))
        {
            return Forbid();
        }

        var performance = await _performanceService.GetPerformanceAsync(studentId, topicId);

        if (performance == null)
        {
            return NotFound(new { message = "Performance record not found" });
        }

        return Ok(performance);
    }

    private bool IsAuthorizedForStudent(Guid studentId)
    {
        // Check if user is the student themselves
        var currentStudentId = User.FindFirst("StudentProfileId")?.Value 
            ?? User.FindFirst("StudentId")?.Value;
        if (Guid.TryParse(currentStudentId, out var id) && id == studentId)
        {
            return true;
        }

        // Check if user is admin or teacher
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        return role is "Admin" or "Teacher";
    }
}
