using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Subject;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/learning")]
[Authorize]
public class LearningController : ControllerBase
{
    private readonly ISubjectService _subjectService;
    private readonly ILogger<LearningController> _logger;

    public LearningController(
        ISubjectService subjectService,
        ILogger<LearningController> logger)
    {
        _subjectService = subjectService;
        _logger = logger;
    }

    /// <summary>
    /// Get topics recently active for the student to continue learning
    /// </summary>
    /// <param name="limit">Number of topics to return (default: 3)</param>
    [HttpGet("continue")]
    [ProducesResponseType(typeof(List<ContinueLearningTopicDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetContinueLearningTopics([FromQuery] int limit = 3)
    {
        var studentProfileIdClaim = User.FindFirst("StudentProfileId")?.Value;

        if (string.IsNullOrEmpty(studentProfileIdClaim) || !Guid.TryParse(studentProfileIdClaim, out var studentProfileId))
        {
            return Unauthorized(new { message = "Student profile not found" });
        }

        if (limit < 1 || limit > 20)
            limit = 3;

        var topics = await _subjectService.GetContinueLearningTopicsAsync(studentProfileId, limit);
        return Ok(topics);
    }
}
