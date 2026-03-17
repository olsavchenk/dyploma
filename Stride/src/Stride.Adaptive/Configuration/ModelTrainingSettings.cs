namespace Stride.Adaptive.Configuration;

public class ModelTrainingSettings
{
    public const string SectionName = "ModelTraining";

    public int SyntheticSampleCount { get; set; } = 10000;
    public int MinRealDataPoints { get; set; } = 500;
    public int RetrainingIntervalHours { get; set; } = 168; // Weekly
    public int NumberOfLeaves { get; set; } = 20;
    public int NumberOfTrees { get; set; } = 100;
    public double LearningRate { get; set; } = 0.05;
    public int MinDataPointsInLeaves { get; set; } = 10;
}
