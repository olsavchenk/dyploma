namespace Stride.Adaptive.Models.DTOs.Task;

public class SubmitTaskRequest
{
    public string Answer { get; set; } = string.Empty;
    public int ResponseTimeMs { get; set; }
}
