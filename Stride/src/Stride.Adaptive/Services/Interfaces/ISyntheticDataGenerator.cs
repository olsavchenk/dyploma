using Stride.Adaptive.Models;

namespace Stride.Adaptive.Services.Interfaces;

public interface ISyntheticDataGenerator
{
    List<TrainingDataPoint> GenerateTrainingData(int sampleCount);
}
