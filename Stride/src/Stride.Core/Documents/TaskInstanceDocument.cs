using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Stride.Core.Documents;

public class TaskInstanceDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("template_id")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string TemplateId { get; set; } = string.Empty;

    [BsonElement("topic_id")]
    [BsonRepresentation(BsonType.String)]
    public Guid TopicId { get; set; }

    [BsonElement("task_type")]
    public string TaskType { get; set; } = string.Empty; // multiple_choice, fill_blank, true_false, matching, ordering

    [BsonElement("difficulty")]
    public int Difficulty { get; set; } // 1-100 precise difficulty

    [BsonElement("rendered_content")]
    public TaskContent RenderedContent { get; set; } = new();

    [BsonElement("created_at")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("expires_at")]
    public DateTime? ExpiresAt { get; set; } // Optional TTL for pool management
}
