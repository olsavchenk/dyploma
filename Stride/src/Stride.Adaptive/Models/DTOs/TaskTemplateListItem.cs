namespace Stride.Adaptive.Models.DTOs;

public class TaskTemplateListItem
{
    public string Id { get; set; } = string.Empty;
    public string TaskType { get; set; } = string.Empty;
    public int DifficultyBand { get; set; }
    public string Question { get; set; } = string.Empty;
    public string ReviewStatus { get; set; } = string.Empty;
    public bool IsApproved { get; set; }
    public string? AiProvider { get; set; }
    public DateTime CreatedAt { get; set; }
}
