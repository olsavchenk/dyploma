using System.Text.Json.Serialization;

namespace Stride.Services.Models.Auth;

public class AuthResponse
{
    // L-13: Standardised on `accessToken` (matches CLAUDE.md spec). Frontend reads `accessToken`.
    [JsonPropertyName("accessToken")]
    public string AccessToken { get; set; } = string.Empty;

    // H-6: Refresh token is delivered only via HttpOnly cookie. Controller blanks this
    // before responding; the IgnoreCondition below keeps it out of the JSON body entirely.
    [JsonIgnore]
    public string RefreshToken { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }
    public UserDto User { get; set; } = null!;
}
