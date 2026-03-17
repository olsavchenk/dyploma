namespace Stride.Adaptive.Configuration;

public class DifficultyEngineSettings
{
    public const string SectionName = "DifficultyEngine";

    public string ModelFilePath { get; set; } = "MLModels/difficulty_model.zip";
    public int MinDifficulty { get; set; } = 1;
    public int MaxDifficulty { get; set; } = 100;
    public double TargetAccuracyLow { get; set; } = 0.70;
    public double TargetAccuracyHigh { get; set; } = 0.80;
    public int DefaultDifficulty { get; set; } = 50;
    public double ConfidenceThreshold { get; set; } = 0.6;
}
