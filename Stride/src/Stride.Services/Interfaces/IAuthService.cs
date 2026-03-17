using Stride.Services.Models.Auth;

namespace Stride.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress = null);
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress = null);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken, string? ipAddress = null);
    Task LogoutAsync(string refreshToken, string? ipAddress = null);
    Task RevokeAllUserTokensAsync(Guid userId, string? ipAddress = null);
    Task ForgotPasswordAsync(ForgotPasswordRequest request);
    Task ResetPasswordAsync(ResetPasswordRequest request, string? ipAddress = null);
}
