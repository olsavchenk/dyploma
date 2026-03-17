using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Stride.Core.Documents;

public class AIGenerationLogDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("provider")]
    public string Provider { get; set; } = string.Empty; // gemini, gpt, claude

    [BsonElement("topic_id")]
    [BsonRepresentation(BsonType.String)]
    public Guid TopicId { get; set; }

    [BsonElement("difficulty_band")]
    public int DifficultyBand { get; set; }

    [BsonElement("task_type")]
    public string TaskType { get; set; } = string.Empty;

    [BsonElement("request_prompt")]
    public string RequestPrompt { get; set; } = string.Empty;

    [BsonElement("response_raw")]
    public string ResponseRaw { get; set; } = string.Empty;

    [BsonElement("tokens_used")]
    public int? TokensUsed { get; set; }

    [BsonElement("generation_time_ms")]
    public int GenerationTimeMs { get; set; }

    [BsonElement("success")]
    public bool Success { get; set; }

    [BsonElement("error_message")]
    public string? ErrorMessage { get; set; }

    [BsonElement("created_at")]
    public DateTime CreatedAt { get; set; }
}
