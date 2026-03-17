namespace Stride.Adaptive.Models.DTOs;

public class PredictDifficultyRequest
{
    public Guid StudentId { get; set; }
    public Guid TopicId { get; set; }
}
