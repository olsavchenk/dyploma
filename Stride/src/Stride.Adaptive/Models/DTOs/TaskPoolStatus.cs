namespace Stride.Adaptive.Models.DTOs;

public class TaskPoolStatus
{
    public Guid TopicId { get; set; }
    public int DifficultyBand { get; set; }
    public int CurrentCount { get; set; }
    public int TargetCount { get; set; }
    public bool NeedsRefill { get; set; }
    public DateTime? LastRefillAt { get; set; }
}
