namespace Stride.Services.Models.Leaderboard;

public class PromotionDemotionResult
{
    public int PromotedCount { get; set; }
    public int DemotedCount { get; set; }
    public List<Guid> PromotedStudentIds { get; set; } = new List<Guid>();
    public List<Guid> DemotedStudentIds { get; set; } = new List<Guid>();
}
