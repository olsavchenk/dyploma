using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Admin;
using Stride.Services.Models.Gamification;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/admin/achievements")]
[Authorize(Policy = "AdminAccess")]
public class AdminAchievementsController : ControllerBase
{
    private readonly IAchievementService _achievementService;
    private readonly ILogger<AdminAchievementsController> _logger;

    public AdminAchievementsController(
        IAchievementService achievementService,
        ILogger<AdminAchievementsController> logger)
    {
        _achievementService = achievementService;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated list of achievements with optional search
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResult<AchievementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAllAchievements(
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var all = await _achievementService.GetAllAchievementsAsync(cancellationToken);

            var filtered = string.IsNullOrWhiteSpace(search)
                ? all
                : all.Where(a => a.Name.Contains(search, StringComparison.OrdinalIgnoreCase)
                              || a.Code.Contains(search, StringComparison.OrdinalIgnoreCase)).ToList();

            var totalCount = filtered.Count;
            var items = filtered
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var result = new PaginatedResult<AchievementDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            _logger.LogInformation(
                "Admin {AdminId} retrieved achievements list - Page: {Page}, TotalCount: {TotalCount}",
                GetCurrentUserId(), page, totalCount);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving achievements");
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { message = "Failed to retrieve achievements" });
        }
    }

    /// <summary>
    /// Get achievement by id
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AchievementDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAchievementById(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var all = await _achievementService.GetAllAchievementsAsync(cancellationToken);
            var achievement = all.FirstOrDefault(a => a.Id == id);
            if (achievement is null)
                return NotFound(new { message = "Achievement not found" });

            return Ok(achievement);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving achievement {AchievementId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to retrieve achievement" });
        }
    }

    /// <summary>
    /// Create a new achievement
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AchievementDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateAchievement(
        [FromBody] CreateAchievementRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var achievement = await _achievementService.CreateAchievementAsync(request, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} created achievement {AchievementId}: {AchievementCode}",
                GetCurrentUserId(),
                achievement.Id,
                achievement.Code);

            return CreatedAtAction(
                nameof(GetAllAchievements),
                new { id = achievement.Id },
                achievement);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to create achievement: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating achievement");
            return BadRequest(new { message = "Failed to create achievement" });
        }
    }

    /// <summary>
    /// Update an existing achievement
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(AchievementDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAchievement(
        Guid id,
        [FromBody] UpdateAchievementRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var achievement = await _achievementService.UpdateAchievementAsync(id, request, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} updated achievement {AchievementId}: {AchievementCode}",
                GetCurrentUserId(),
                achievement.Id,
                achievement.Code);

            return Ok(achievement);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to update achievement: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating achievement {AchievementId}", id);
            return BadRequest(new { message = "Failed to update achievement" });
        }
    }

    /// <summary>
    /// Delete an achievement
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAchievement(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            await _achievementService.DeleteAchievementAsync(id, cancellationToken);

            _logger.LogInformation(
                "Admin {AdminId} deleted achievement {AchievementId}",
                GetCurrentUserId(),
                id);

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to delete achievement: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting achievement {AchievementId}", id);
            return BadRequest(new { message = "Failed to delete achievement" });
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
