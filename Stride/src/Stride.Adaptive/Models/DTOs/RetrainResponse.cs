namespace Stride.Adaptive.Models.DTOs;

public class RetrainResponse
{
    public bool Success { get; set; }
    public double RSquared { get; set; }
    public double RootMeanSquaredError { get; set; }
    public int DataPointCount { get; set; }
    public DateTime TrainedAt { get; set; }
    public string Message { get; set; } = string.Empty;
}
