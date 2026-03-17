namespace Stride.Services.Models.Auth;

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsEmailVerified { get; set; }
    public bool HasCompletedOnboarding { get; set; }
    public DateTime CreatedAt { get; set; }
}
