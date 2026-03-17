using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Services.Interfaces;

namespace Stride.Adaptive.BackgroundServices;

public class ModelRetrainingService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ModelTrainingSettings _trainingSettings;
    private readonly DifficultyEngineSettings _engineSettings;
    private readonly ILogger<ModelRetrainingService> _logger;

    public ModelRetrainingService(
        IServiceProvider serviceProvider,
        IOptions<ModelTrainingSettings> trainingSettings,
        IOptions<DifficultyEngineSettings> engineSettings,
        ILogger<ModelRetrainingService> logger)
    {
        _serviceProvider = serviceProvider;
        _trainingSettings = trainingSettings.Value;
        _engineSettings = engineSettings.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Model Retraining Service starting");

        // Train initial model if it doesn't exist
        await EnsureInitialModelAsync(stoppingToken);

        // Periodic retraining loop
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var interval = TimeSpan.FromHours(_trainingSettings.RetrainingIntervalHours);
                _logger.LogInformation(
                    "Waiting {Hours} hours until next retraining cycle",
                    _trainingSettings.RetrainingIntervalHours);

                await Task.Delay(interval, stoppingToken);

                if (!stoppingToken.IsCancellationRequested)
                {
                    await RetrainModelAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Model Retraining Service is stopping");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in retraining loop. Will retry after interval.");
            }
        }

        _logger.LogInformation("Model Retraining Service stopped");
    }

    private async Task EnsureInitialModelAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(_engineSettings.ModelFilePath))
        {
            _logger.LogInformation("No existing model found. Training initial model on synthetic data");

            try
            {
                using var scope = _serviceProvider.CreateScope();
                var modelTrainer = scope.ServiceProvider.GetRequiredService<IModelTrainer>();

                var result = await modelTrainer.TrainAsync(cancellationToken);

                _logger.LogInformation(
                    "Initial model trained successfully. R²: {RSquared:F4}, RMSE: {RMSE:F2}, Samples: {Count}",
                    result.RSquared, result.RootMeanSquaredError, result.DataPointCount);
            }
            catch (Exception ex)
            {
                // Log error but do not throw - allow rule-based engine to work as fallback
                _logger.LogError(ex, "Failed to train initial model. Rule-based difficulty engine will be used as fallback.");
            }
        }
        else
        {
            _logger.LogInformation("Existing model found at {Path}", _engineSettings.ModelFilePath);
        }
    }

    private async Task RetrainModelAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting scheduled model retraining");

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var modelTrainer = scope.ServiceProvider.GetRequiredService<IModelTrainer>();

            var result = await modelTrainer.RetrainOnRealDataAsync(cancellationToken);

            _logger.LogInformation(
                "Model retrained successfully. R²: {RSquared:F4}, RMSE: {RMSE:F2}, Samples: {Count}",
                result.RSquared, result.RootMeanSquaredError, result.DataPointCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrain model");
        }
    }
}
