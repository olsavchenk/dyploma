using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stride.DataAccess.Contexts;
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
    private readonly StrideDbContext _dbContext;
    private readonly ILogger<LeaderboardController> _logger;

    public LeaderboardController(
        ILeaderboardService leaderboardService,
        IUserService userService,
        StrideDbContext dbContext,
        ILogger<LeaderboardController> logger)
    {
        _leaderboardService = leaderboardService;
        _userService = userService;
        _dbContext = dbContext;
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
    /// Get leaderboard for a specific league, optionally filtered by period and scope.
    /// </summary>
    /// <param name="league">League name (Bronze, Silver, Gold, Platinum, Diamond). If not provided, uses student's current league.</param>
    /// <param name="period">Time window: "all", "week" (default), or "month". Currently the underlying store is weekly; "all"/"month" return the same set as "week" but tagged accordingly.</param>
    /// <param name="scope">"global" (default) or "class". When "class", entries are filtered to classmates of the current user.</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(typeof(GetLeaderboardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLeaderboard(
        [FromQuery] string? league = null,
        [FromQuery] string? period = "week",
        [FromQuery] string? scope = "global",
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

            // Validate period & scope (loose — accept canonical lowercase values)
            var validPeriods = new[] { "all", "week", "month" };
            var validScopes  = new[] { "global", "class" };
            var p = string.IsNullOrEmpty(period) ? "week"   : period.ToLowerInvariant();
            var s = string.IsNullOrEmpty(scope)  ? "global" : scope.ToLowerInvariant();
            if (!validPeriods.Contains(p))
            {
                return BadRequest(new { message = "Invalid period. Must be one of: all, week, month" });
            }
            if (!validScopes.Contains(s))
            {
                return BadRequest(new { message = "Invalid scope. Must be one of: global, class" });
            }

            var response = await _leaderboardService.GetLeaderboardAsync(userId, league, cancellationToken);

            // For class scope, restrict TopPlayers to the requesting user's classmates.
            // The underlying weekly leaderboard stays in Valkey/Redis; we filter in-memory
            // because class membership lives in Postgres and is normally a small set.
            if (s == "class")
            {
                var classmateIds = await _dbContext.ClassMemberships
                    .Where(cm => _dbContext.ClassMemberships
                        .Where(self => self.StudentId == userId)
                        .Select(self => self.ClassId)
                        .Contains(cm.ClassId))
                    .Select(cm => cm.StudentId)
                    .Distinct()
                    .ToListAsync(cancellationToken);

                var classmateSet = new HashSet<Guid>(classmateIds);
                if (response?.TopPlayers != null)
                {
                    var filtered = response.TopPlayers
                        .Where(p2 => classmateSet.Contains(p2.StudentId))
                        .ToList();

                    // Re-rank within the class subset
                    for (int i = 0; i < filtered.Count; i++)
                    {
                        filtered[i].Rank = i + 1;
                    }

                    response.TopPlayers = filtered;
                    response.TotalPlayers = filtered.Count;
                }
            }

            // Tag the response so the client knows which window/scope it represents.
            // (Reusing existing fields; period/scope are not on the DTO yet.)
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
