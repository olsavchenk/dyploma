namespace Stride.Adaptive.Models.DTOs.Task;

public class TaskHistoryResponse
{
    public List<TaskAttemptDto> Attempts { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
