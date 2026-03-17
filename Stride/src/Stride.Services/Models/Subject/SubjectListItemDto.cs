namespace Stride.Services.Models.Subject;

public class SubjectListItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public int SortOrder { get; set; }
    
    // Student progress data (null if not a student or not authenticated)
    public SubjectProgressDto? Progress { get; set; }
}

public class SubjectProgressDto
{
    public int TotalTopics { get; set; }
    public int CompletedTopics { get; set; }
    public decimal OverallMastery { get; set; } // 0.0-1.0
    public int TotalXpEarned { get; set; }
}
