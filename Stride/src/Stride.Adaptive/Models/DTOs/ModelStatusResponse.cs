namespace Stride.Adaptive.Models.DTOs;

public class ModelStatusResponse
{
    public DateTime? LastTrainedAt { get; set; }
    public double? RSquared { get; set; }
    public double? RootMeanSquaredError { get; set; }
    public int? DataPointCount { get; set; }
    public string ModelPath { get; set; } = string.Empty;
    public bool IsModelLoaded { get; set; }
}
