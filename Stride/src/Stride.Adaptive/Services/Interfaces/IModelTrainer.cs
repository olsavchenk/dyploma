using Stride.Adaptive.Models;

namespace Stride.Adaptive.Services.Interfaces;

public interface IModelTrainer
{
    Task<ModelTrainingResult> TrainAsync(CancellationToken cancellationToken = default);
    Task<ModelTrainingResult> RetrainOnRealDataAsync(CancellationToken cancellationToken = default);
    ModelMetrics? GetCurrentMetrics();
}
