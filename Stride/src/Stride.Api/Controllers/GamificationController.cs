using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Gamification;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/gamification")]
[Authorize(Policy = "StudentAccess")]
public class GamificationController : ControllerBase
{
    private readonly IGamificationService _gamificationService;
    private readonly IAchievementService _achievementService;
    private readonly ILogger<GamificationController> _logger;

    public GamificationController(
        IGamificationService gamificationService,
        IAchievementService achievementService,
        ILogger<GamificationController> logger)
    {
        _gamificationService = gamificationService;
        _achievementService = achievementService;
        _logger = logger;
    }

    /// <summary>
    /// Get gamification statistics for the current student
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(GamificationStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var stats = await _gamificationService.GetStatsAsync(userId, cancellationToken);

            return Ok(stats);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to get gamification stats for user {UserId}: {Message}", 
                GetCurrentUserId(), ex.Message);
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Purchase a streak freeze
    /// </summary>
    [HttpPost("streak/freeze")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> PurchaseStreakFreeze(CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _gamificationService.PurchaseStreakFreezeAsync(userId, cancellationToken);

            _logger.LogInformation("User {UserId} purchased a streak freeze", userId);
            return Ok(new { message = "Streak freeze purchased successfully" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to purchase streak freeze for user {UserId}: {Message}", 
                GetCurrentUserId(), ex.Message);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Repair a broken streak within the repair window
    /// </summary>
    [HttpPost("streak/repair")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RepairStreak(CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _gamificationService.RepairStreakAsync(userId, cancellationToken);

            _logger.LogInformation("User {UserId} repaired their streak", userId);
            return Ok(new { message = "Streak repaired successfully" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to repair streak for user {UserId}: {Message}", 
                GetCurrentUserId(), ex.Message);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get all achievements for the current student (earned and locked)
    /// </summary>
    [HttpGet("achievements")]
    [ProducesResponseType(typeof(List<AchievementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAchievements(CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var achievements = await _achievementService.GetAchievementsAsync(userId, cancellationToken);

            return Ok(achievements);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to get achievements for user {UserId}: {Message}", 
                GetCurrentUserId(), ex.Message);
            return NotFound(new { message = ex.Message });
        }
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }
}
