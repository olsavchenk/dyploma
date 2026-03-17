using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Leaderboard;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/leaderboard")]
[Authorize]
public class LeaderboardController : ControllerBase
{
    private readonly ILeaderboardService _leaderboardService;
    private readonly IUserService _userService;
    private readonly ILogger<LeaderboardController> _logger;

    public LeaderboardController(
        ILeaderboardService leaderboardService,
        IUserService userService,
        ILogger<LeaderboardController> logger)
    {
        _leaderboardService = leaderboardService;
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Get leaderboard preview (top 5 + current user) for the student's current league
    /// </summary>
    [HttpGet("preview")]
    [ProducesResponseType(typeof(LeaderboardPreviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLeaderboardPreview(CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var response = await _leaderboardService.GetLeaderboardPreviewAsync(userId, cancellationToken);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting leaderboard preview for user {UserId}", GetCurrentUserId());
            return StatusCode(500, new { message = "An error occurred while retrieving the leaderboard preview" });
        }
    }

    /// <summary>
    /// Get leaderboard for a specific league
    /// </summary>
    /// <param name="league">League name (Bronze, Silver, Gold, Platinum, Diamond). If not provided, uses student's current league.</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(typeof(GetLeaderboardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLeaderboard(
        [FromQuery] string? league = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            // If league not specified, get from student profile
            if (string.IsNullOrEmpty(league))
            {
                var profile = await _userService.GetUserProfileAsync(userId, cancellationToken);
                league = profile.StudentStats?.League ?? "Bronze";
            }

            // Validate league
            var validLeagues = new[] { "Bronze", "Silver", "Gold", "Platinum", "Diamond" };
            if (!validLeagues.Contains(league, StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Invalid league. Must be one of: Bronze, Silver, Gold, Platinum, Diamond" });
            }

            var response = await _leaderboardService.GetLeaderboardAsync(userId, league, cancellationToken);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting leaderboard for user {UserId}", GetCurrentUserId());
            return StatusCode(500, new { message = "An error occurred while retrieving the leaderboard" });
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
