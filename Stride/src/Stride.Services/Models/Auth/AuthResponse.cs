using System.Text.Json.Serialization;

namespace Stride.Services.Models.Auth;

public class AuthResponse
{
    [JsonPropertyName("token")]
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserDto User { get; set; } = null!;
}
