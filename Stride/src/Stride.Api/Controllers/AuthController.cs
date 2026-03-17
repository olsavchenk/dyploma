using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Auth;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IGoogleAuthService _googleAuthService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        IGoogleAuthService googleAuthService,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _googleAuthService = googleAuthService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user with email and password
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var ipAddress = GetIpAddress();
            var response = await _authService.RegisterAsync(request, ipAddress);

            _logger.LogInformation("User registered successfully: {Email}", request.Email);

            SetRefreshTokenCookie(response.RefreshToken);

            return CreatedAtAction(nameof(Register), new { id = response.User.Id }, response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Registration failed: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Login with email and password
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var ipAddress = GetIpAddress();
            var response = await _authService.LoginAsync(request, ipAddress);

            _logger.LogInformation("User logged in successfully: {Email}", request.Email);

            SetRefreshTokenCookie(response.RefreshToken);

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Login failed for {Email}: {Message}", request.Email, ex.Message);
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken()
    {
        try
        {
            var refreshToken = Request.Cookies["refreshToken"];

            if (string.IsNullOrEmpty(refreshToken))
            {
                return Unauthorized(new { message = "Refresh token is required" });
            }

            var ipAddress = GetIpAddress();
            var response = await _authService.RefreshTokenAsync(refreshToken, ipAddress);

            _logger.LogInformation("Token refreshed successfully for user: {UserId}", response.User.Id);

            SetRefreshTokenCookie(response.RefreshToken);

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Token refresh failed: {Message}", ex.Message);
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Logout and revoke refresh token
    /// </summary>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];

        if (!string.IsNullOrEmpty(refreshToken))
        {
            var ipAddress = GetIpAddress();
            await _authService.LogoutAsync(refreshToken, ipAddress);
        }

        // Remove cookie
        Response.Cookies.Delete("refreshToken");

        _logger.LogInformation("User logged out successfully");

        return Ok(new { message = "Logged out successfully" });
    }

    /// <summary>
    /// Login with Google OAuth
    /// </summary>
    [HttpPost("google")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            var ipAddress = GetIpAddress();
            var response = await _googleAuthService.LoginWithGoogleAsync(request.IdToken, ipAddress);

            _logger.LogInformation("User logged in with Google: {Email}", response.User.Email);

            SetRefreshTokenCookie(response.RefreshToken);

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Google login failed: {Message}", ex.Message);
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Select role (Student or Teacher) after registration
    /// </summary>
    [HttpPost("select-role")]
    [Authorize]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SelectRole([FromBody] SelectRoleRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            var ipAddress = GetIpAddress();
            var response = await _googleAuthService.SelectRoleAsync(userId, request.Role, ipAddress);

            _logger.LogInformation("User {UserId} selected role: {Role}", userId, request.Role);

            SetRefreshTokenCookie(response.RefreshToken);

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Role selection failed: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Role selection failed: {Message}", ex.Message);
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Request a password reset token
    /// </summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await _authService.ForgotPasswordAsync(request);

        _logger.LogInformation("Password reset requested for email: {Email}", request.Email);

        // Always return success for security (timing attack prevention)
        return Ok(new { message = "If your email is registered, you will receive a password reset link" });
    }

    /// <summary>
    /// Reset password using the reset token
    /// </summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            var ipAddress = GetIpAddress();
            await _authService.ResetPasswordAsync(request, ipAddress);

            _logger.LogInformation("Password reset successfully");

            return Ok(new { message = "Password has been reset successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Password reset failed: {Message}", ex.Message);
            return Unauthorized(new { message = ex.Message });
        }
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(30),
            Secure = true,
            SameSite = SameSiteMode.Strict,
            IsEssential = true
        };

        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }

    private string? GetIpAddress()
    {
        // Only trust X-Forwarded-For if ForwardedHeadersMiddleware is configured
        // with known proxy addresses. The middleware sets RemoteIpAddress correctly.
        // Directly reading X-Forwarded-For is a security risk (IP spoofing).
        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }
}
