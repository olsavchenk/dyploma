namespace Stride.Core.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? GoogleId { get; set; }
    public string Role { get; set; } = string.Empty; // Student, Teacher, Admin - set via role selection
    public bool GdprConsent { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockoutEndDate { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool IsDeleted { get; set; }

    // Navigation properties
    public StudentProfile? StudentProfile { get; set; }
    public TeacherProfile? TeacherProfile { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
