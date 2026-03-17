namespace Stride.Services.Models.Auth;

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool GdprConsent { get; set; }
}
