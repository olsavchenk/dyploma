using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Stride.Core.Documents;

public class TaskContent
{
    [BsonElement("question")]
    public string Question { get; set; } = string.Empty;

    [BsonElement("options")]
    public List<string>? Options { get; set; }

    [BsonElement("answer")]
    public BsonValue Answer { get; set; } = BsonNull.Value; // Can be string, array, or object

    [BsonElement("explanation")]
    public string? Explanation { get; set; }

    [BsonElement("hints")]
    public List<string>? Hints { get; set; }
}
