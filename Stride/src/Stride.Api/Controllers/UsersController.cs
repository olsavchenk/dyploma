using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.User;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IUserService userService,
        ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Get current user profile with role-specific stats
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var profile = await _userService.GetUserProfileAsync(userId, cancellationToken);

            return Ok(profile);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to get profile: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update current user profile
    /// </summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateUserProfileRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var profile = await _userService.UpdateUserProfileAsync(userId, request, cancellationToken);

            _logger.LogInformation("User {UserId} updated their profile", userId);

            return Ok(profile);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to update profile: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
    }

    private static readonly HashSet<string> AllowedAvatarContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp"
    };

    private static readonly HashSet<string> AllowedAvatarExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp"
    };

    private const long MaxAvatarSizeBytes = 5 * 1024 * 1024; // 5 MB

    /// <summary>
    /// Upload user avatar
    /// </summary>
    [HttpPost("me/avatar")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadAvatar(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "File is required" });
            }

            // Validate file size
            if (file.Length > MaxAvatarSizeBytes)
            {
                return BadRequest(new { message = $"File size exceeds maximum allowed size of {MaxAvatarSizeBytes / 1024 / 1024} MB" });
            }

            // Validate content type
            if (!AllowedAvatarContentTypes.Contains(file.ContentType))
            {
                return BadRequest(new { message = "Invalid file type. Allowed types: JPEG, PNG, GIF, WebP" });
            }

            // Validate file extension
            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(extension) || !AllowedAvatarExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Invalid file extension. Allowed extensions: .jpg, .jpeg, .png, .gif, .webp" });
            }

            var userId = GetCurrentUserId();
            var avatarUrl = await _userService.UploadAvatarAsync(userId, file, cancellationToken);

            _logger.LogInformation("User {UserId} uploaded avatar: {AvatarUrl}", userId, avatarUrl);

            return Ok(new { avatarUrl });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to upload avatar: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Export all user data (GDPR compliance)
    /// </summary>
    [HttpGet("me/data-export")]
    [ProducesResponseType(typeof(UserDataExportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> ExportData(CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var exportData = await _userService.ExportUserDataAsync(userId, cancellationToken);

            _logger.LogInformation("User {UserId} exported their data", userId);

            return Ok(exportData);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("rate limit"))
        {
            _logger.LogWarning("Data export rate limited for user: {Message}", ex.Message);
            return StatusCode(StatusCodes.Status429TooManyRequests, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to export data: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Delete user account (soft delete with anonymization)
    /// </summary>
    [HttpDelete("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAccount(CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _userService.DeleteUserAccountAsync(userId, cancellationToken);

            _logger.LogInformation("User {UserId} deleted their account", userId);

            // Remove refresh token cookie
            Response.Cookies.Delete("refreshToken");

            return Ok(new { message = "Account deleted successfully" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to delete account: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
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
