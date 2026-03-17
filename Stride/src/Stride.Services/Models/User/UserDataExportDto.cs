namespace Stride.Services.Models.User;

public class UserDataExportDto
{
    public UserDataDto User { get; set; } = null!;
    public StudentProfileDataDto? StudentProfile { get; set; }
    public TeacherProfileDataDto? TeacherProfile { get; set; }
    public List<TaskAttemptDataDto> TaskAttempts { get; set; } = new();
    public List<AchievementDataDto> Achievements { get; set; } = new();
    public List<ClassMembershipDataDto> ClassMemberships { get; set; } = new();
    public DateTime ExportedAt { get; set; }
}

public class UserDataDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class StudentProfileDataDto
{
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public string League { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class TeacherProfileDataDto
{
    public string? School { get; set; }
    public string? GradesTaught { get; set; }
    public string? SubjectsExpertise { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TaskAttemptDataDto
{
    public Guid TaskInstanceId { get; set; }
    public Guid TopicId { get; set; }
    public bool IsCorrect { get; set; }
    public int ResponseTimeMs { get; set; }
    public int DifficultyAtTime { get; set; }
    public DateTime AttemptedAt { get; set; }
}

public class AchievementDataDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime UnlockedAt { get; set; }
}

public class ClassMembershipDataDto
{
    public string ClassName { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}
