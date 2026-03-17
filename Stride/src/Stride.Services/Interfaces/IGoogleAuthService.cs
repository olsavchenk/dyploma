using Stride.Services.Models.Auth;

namespace Stride.Services.Interfaces;

public interface IGoogleAuthService
{
    Task<AuthResponse> LoginWithGoogleAsync(string idToken, string? ipAddress = null);
    Task<AuthResponse> SelectRoleAsync(Guid userId, string role, string? ipAddress = null);
}
