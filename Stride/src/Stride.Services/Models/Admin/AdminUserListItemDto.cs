namespace Stride.Services.Models.Admin;

public class AdminUserListItemDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool IsDeleted { get; set; }
    
    // Aggregate stats
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; }
    public int TotalTasksAttempted { get; set; }
    public int TotalClasses { get; set; }
}
