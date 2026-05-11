namespace Stride.Adaptive.Models.DTOs;

/// <summary>
/// Teacher-side edit of an AI-generated task template. All fields except
/// the answer/question are optional; only supplied values are written back.
/// </summary>
public class UpdateTaskTemplateRequest
{
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string? Explanation { get; set; }
    public string? TaskType { get; set; }
    public int? DifficultyBand { get; set; }
}
