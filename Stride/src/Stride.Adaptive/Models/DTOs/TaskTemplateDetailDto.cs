namespace Stride.Adaptive.Models.DTOs;

public class TaskTemplateDetailDto
{
    public string Id { get; set; } = string.Empty;
    public Guid TopicId { get; set; }
    public string TaskType { get; set; } = string.Empty;
    public int DifficultyBand { get; set; }
    public string Question { get; set; } = string.Empty;
    public List<string>? Options { get; set; }
    public object? Answer { get; set; }
    public string? Explanation { get; set; }
    public List<string>? Hints { get; set; }
    public string ReviewStatus { get; set; } = string.Empty;
    public bool IsApproved { get; set; }
    public string? AiProvider { get; set; }
    public Guid? ReviewedBy { get; set; }
    public Guid? AssignmentId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
