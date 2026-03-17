namespace Stride.Adaptive.Models;

public class ModelMetrics
{
    public double RSquared { get; set; }
    public double RootMeanSquaredError { get; set; }
    public double MeanAbsoluteError { get; set; }
    public DateTime? LastTrainedAt { get; set; }
    public int DataPointCount { get; set; }
    public string ModelPath { get; set; } = string.Empty;
}
