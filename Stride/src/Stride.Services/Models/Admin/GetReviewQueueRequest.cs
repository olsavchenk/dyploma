namespace Stride.Services.Models.Admin;

public class GetReviewQueueRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Guid? TopicId { get; set; }
    public string? TaskType { get; set; }
    public int? DifficultyBand { get; set; }
}
