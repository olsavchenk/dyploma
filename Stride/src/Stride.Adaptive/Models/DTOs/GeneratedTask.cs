using MongoDB.Bson;

namespace Stride.Adaptive.Models.DTOs;

public class GeneratedTask
{
    public string Question { get; set; } = string.Empty;
    public List<string>? Options { get; set; }
    public object? Answer { get; set; }
    public string? Explanation { get; set; }
    public List<string>? Hints { get; set; }
    public BsonDocument? TemplateContent { get; set; }
}
