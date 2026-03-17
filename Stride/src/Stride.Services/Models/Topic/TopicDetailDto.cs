namespace Stride.Services.Models.Topic;

public class TopicDetailDto
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public Guid? ParentTopicId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int GradeLevel { get; set; }
    public int SortOrder { get; set; }
    
    // Breadcrumb navigation
    public List<BreadcrumbDto> Breadcrumbs { get; set; } = new();
    
    // Student performance data (null if not a student or not authenticated)
    public TopicPerformanceDto? Performance { get; set; }
    
    // Related topics
    public List<TopicDto> ChildTopics { get; set; } = new();
    public List<TopicDto> SiblingTopics { get; set; } = new();
}

public class BreadcrumbDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // subject, topic
}

public class TopicPerformanceDto
{
    public decimal MasteryLevel { get; set; } // 0.0-1.0
    public int CurrentDifficulty { get; set; } // 1-100
    public int TotalAttempts { get; set; }
    public int CorrectAttempts { get; set; }
    public decimal Accuracy { get; set; } // 0.0-1.0
    public int CurrentStreak { get; set; }
    public int XpEarned { get; set; }
    public DateTime? LastActiveAt { get; set; }
}
