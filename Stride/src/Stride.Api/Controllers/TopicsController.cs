using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Topic;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1")]
public class TopicsController : ControllerBase
{
    private readonly ITopicService _topicService;
    private readonly ILogger<TopicsController> _logger;

    public TopicsController(
        ITopicService topicService,
        ILogger<TopicsController> logger)
    {
        _topicService = topicService;
        _logger = logger;
    }

    /// <summary>
    /// Get hierarchical topic tree for a subject with optional mastery data
    /// </summary>
    [HttpGet("subjects/{subjectId:guid}/topics")]
    [ProducesResponseType(typeof(List<TopicTreeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopicsBySubject(Guid subjectId)
    {
        var userId = GetCurrentUserId();
        var topics = await _topicService.GetTopicsBySubjectAsync(subjectId, userId);

        return Ok(topics);
    }

    /// <summary>
    /// Get topic detail by ID with breadcrumbs and student performance
    /// </summary>
    [HttpGet("topics/{id:guid}")]
    [ProducesResponseType(typeof(TopicDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTopicById(Guid id)
    {
        var userId = GetCurrentUserId();
        var topic = await _topicService.GetTopicByIdAsync(id, userId);

        if (topic == null)
        {
            return NotFound(new { message = "Topic not found" });
        }

        return Ok(topic);
    }

    /// <summary>
    /// Get topic by slug within a subject
    /// </summary>
    [HttpGet("subjects/{subjectId:guid}/topics/by-slug/{slug}")]
    [ProducesResponseType(typeof(TopicDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTopicBySlug(Guid subjectId, string slug)
    {
        var userId = GetCurrentUserId();
        var topic = await _topicService.GetTopicBySlugAsync(subjectId, slug, userId);

        if (topic == null)
        {
            return NotFound(new { message = "Topic not found" });
        }

        return Ok(topic);
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
