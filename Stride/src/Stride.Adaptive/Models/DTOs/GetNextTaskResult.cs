using Stride.Core.Documents;

namespace Stride.Adaptive.Models.DTOs;

public class GetNextTaskResult
{
    public TaskInstanceDocument TaskInstance { get; set; } = null!;
    public int TargetDifficulty { get; set; }
    public StudentPerformanceDto CurrentPerformance { get; set; } = null!;
}
