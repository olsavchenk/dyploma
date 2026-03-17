using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Stride.Core.Documents;

public class TaskTemplateDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("topic_id")]
    [BsonRepresentation(BsonType.String)]
    public Guid TopicId { get; set; }

    [BsonElement("task_type")]
    public string TaskType { get; set; } = string.Empty; // multiple_choice, fill_blank, true_false, matching, ordering

    [BsonElement("difficulty_band")]
    public int DifficultyBand { get; set; } // 1-10, grouped difficulty level

    [BsonElement("template_content")]
    public BsonDocument TemplateContent { get; set; } = new();

    [BsonElement("is_approved")]
    public bool IsApproved { get; set; }

    [BsonElement("ai_provider")]
    public string? AiProvider { get; set; } // gemini, gpt, claude

    [BsonElement("reviewed_by")]
    [BsonRepresentation(BsonType.String)]
    public Guid? ReviewedBy { get; set; }

    [BsonElement("assignment_id")]
    [BsonRepresentation(BsonType.String)]
    public Guid? AssignmentId { get; set; }

    [BsonElement("generation_job_id")]
    [BsonRepresentation(BsonType.String)]
    public Guid? GenerationJobId { get; set; }

    [BsonElement("review_status")]
    public string ReviewStatus { get; set; } = "Pending";

    [BsonElement("created_at")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updated_at")]
    public DateTime? UpdatedAt { get; set; }
}
