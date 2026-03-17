namespace Stride.Services.Models.Class;

public class ClassAnalyticsDto
{
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public int TotalStudents { get; set; }
    public int ActiveStudents { get; set; }
    public decimal AverageAccuracy { get; set; }
    public int TotalTasksCompleted { get; set; }
    public List<TopPerformerDto> TopPerformers { get; set; } = new();
    public List<StrugglingStudentDto> StrugglingStudents { get; set; } = new();
    public List<TopicStatDto> TopicStats { get; set; } = new();
}

public class TopPerformerDto
{
    public Guid StudentId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int TotalXp { get; set; }
    public decimal AverageAccuracy { get; set; }
    public int TasksCompleted { get; set; }
}

public class StrugglingStudentDto
{
    public Guid StudentId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public decimal AverageAccuracy { get; set; }
    public int TasksAttempted { get; set; }
    public int DaysSinceLastActive { get; set; }
}

public class TopicStatDto
{
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public int StudentsAttempted { get; set; }
    public decimal AverageAccuracy { get; set; }
    public decimal AverageMastery { get; set; }
}
