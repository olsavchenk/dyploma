namespace Stride.Services.Models.User;

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    
    // Student-specific stats
    public StudentStatsDto? StudentStats { get; set; }
    
    // Teacher-specific stats
    public TeacherStatsDto? TeacherStats { get; set; }
}

public class StudentStatsDto
{
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public int StreakFreezes { get; set; }
    public string League { get; set; } = string.Empty;
    public int TotalTasksAttempted { get; set; }
    public int AchievementsUnlocked { get; set; }
}

public class TeacherStatsDto
{
    public string? School { get; set; }
    public string? GradesTaught { get; set; }
    public string? SubjectsExpertise { get; set; }
    public int TotalClasses { get; set; }
    public int TotalStudents { get; set; }
}
