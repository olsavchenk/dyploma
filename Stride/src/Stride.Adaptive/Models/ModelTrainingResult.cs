namespace Stride.Adaptive.Models;

public class ModelTrainingResult
{
    public double RSquared { get; set; }
    public double RootMeanSquaredError { get; set; }
    public double MeanAbsoluteError { get; set; }
    public DateTime TrainedAt { get; set; }
    public int DataPointCount { get; set; }
    public string ModelPath { get; set; } = string.Empty;
}
