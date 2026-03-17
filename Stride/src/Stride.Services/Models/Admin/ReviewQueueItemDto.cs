using MongoDB.Bson;

namespace Stride.Services.Models.Admin;

public class ReviewQueueItemDto
{
    public string Id { get; set; } = string.Empty;
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string TaskType { get; set; } = string.Empty;
    public int DifficultyBand { get; set; }
    public string? AiProvider { get; set; }
    public DateTime CreatedAt { get; set; }
    public BsonDocument TemplateContent { get; set; } = new();
}
