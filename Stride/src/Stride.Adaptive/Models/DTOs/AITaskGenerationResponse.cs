using MongoDB.Bson;

namespace Stride.Adaptive.Models.DTOs;

public class AITaskGenerationResponse
{
    public bool Success { get; set; }
    public string? Question { get; set; }
    public List<string>? Options { get; set; }
    public object? Answer { get; set; }
    public string? Explanation { get; set; }
    public List<string>? Hints { get; set; }
    public BsonDocument? TemplateContent { get; set; }
    public int? TokensUsed { get; set; }
    public int GenerationTimeMs { get; set; }
    public string? ErrorMessage { get; set; }
    public string? RawResponse { get; set; }
}
