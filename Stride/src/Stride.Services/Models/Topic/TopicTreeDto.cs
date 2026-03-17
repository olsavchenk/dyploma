namespace Stride.Services.Models.Topic;

public class TopicTreeDto
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public Guid? ParentTopicId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int GradeLevel { get; set; }
    public int SortOrder { get; set; }
    
    // Student mastery data (null if not a student or not authenticated)
    public TopicMasteryDto? Mastery { get; set; }
    
    // Child topics for hierarchical structure
    public List<TopicTreeDto> ChildTopics { get; set; } = new();
}

public class TopicMasteryDto
{
    public decimal MasteryLevel { get; set; } // 0.0-1.0
    public int CurrentDifficulty { get; set; } // 1-100
    public int TotalAttempts { get; set; }
    public decimal Accuracy { get; set; } // 0.0-1.0
    public int CurrentStreak { get; set; }
    public string StreakDirection { get; set; } = "neutral"; // winning, losing, neutral
    public DateTime? LastActiveAt { get; set; }
}
