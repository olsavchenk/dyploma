namespace Stride.Adaptive.Models.DTOs.Task;

public class TaskDto
{
    public string Id { get; set; } = string.Empty;
    public Guid TopicId { get; set; }
    public int Difficulty { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public List<string>? Options { get; set; }
    public List<string>? Hints { get; set; }
}
