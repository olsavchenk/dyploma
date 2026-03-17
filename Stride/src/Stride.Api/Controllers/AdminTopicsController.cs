using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Topic;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/admin/topics")]
[Authorize(Policy = "AdminAccess")]
public class AdminTopicsController : ControllerBase
{
    private readonly ITopicService _topicService;
    private readonly ILogger<AdminTopicsController> _logger;

    public AdminTopicsController(
        ITopicService topicService,
        ILogger<AdminTopicsController> logger)
    {
        _topicService = topicService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new topic
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(TopicDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateTopic(
        [FromBody] CreateTopicRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var topic = await _topicService.CreateTopicAsync(request, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} created topic {TopicId}: {TopicName}",
                GetCurrentUserId(),
                topic.Id,
                topic.Name);

            return CreatedAtAction(
                nameof(TopicsController.GetTopicById),
                "Topics",
                new { id = topic.Id },
                topic);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to create topic: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating topic");
            return BadRequest(new { message = "Failed to create topic" });
        }
    }

    /// <summary>
    /// Update an existing topic
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TopicDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTopic(
        Guid id,
        [FromBody] UpdateTopicRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var topic = await _topicService.UpdateTopicAsync(id, request, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} updated topic {TopicId}: {TopicName}",
                GetCurrentUserId(),
                topic.Id,
                topic.Name);

            return Ok(topic);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to update topic: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating topic {TopicId}", id);
            return BadRequest(new { message = "Failed to update topic" });
        }
    }

    /// <summary>
    /// Delete a topic (soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTopic(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            await _topicService.DeleteTopicAsync(id, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} deleted topic {TopicId}",
                GetCurrentUserId(),
                id);

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to delete topic: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting topic {TopicId}", id);
            return BadRequest(new { message = "Failed to delete topic" });
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
