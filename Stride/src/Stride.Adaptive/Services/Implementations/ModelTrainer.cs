using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.ML;
using Microsoft.ML.Data;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Models;
using Stride.Adaptive.Services.Interfaces;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;

namespace Stride.Adaptive.Services.Implementations;

public class ModelTrainer : IModelTrainer
{
    private readonly StrideDbContext _dbContext;
    private readonly ISyntheticDataGenerator _syntheticDataGenerator;
    private readonly DifficultyEngineSettings _engineSettings;
    private readonly ModelTrainingSettings _trainingSettings;
    private readonly ILogger<ModelTrainer> _logger;
    private readonly MLContext _mlContext;
    private ModelMetrics? _currentMetrics;

    public ModelTrainer(
        StrideDbContext dbContext,
        ISyntheticDataGenerator syntheticDataGenerator,
        IOptions<DifficultyEngineSettings> engineSettings,
        IOptions<ModelTrainingSettings> trainingSettings,
        ILogger<ModelTrainer> logger)
    {
        _dbContext = dbContext;
        _syntheticDataGenerator = syntheticDataGenerator;
        _engineSettings = engineSettings.Value;
        _trainingSettings = trainingSettings.Value;
        _logger = logger;
        _mlContext = new MLContext(seed: 42);
    }

    public async Task<ModelTrainingResult> TrainAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting model training on synthetic data");

        var trainingData = _syntheticDataGenerator.GenerateTrainingData(_trainingSettings.SyntheticSampleCount);
        _logger.LogInformation("Generated {Count} synthetic training samples", trainingData.Count);

        var result = await Task.Run(() => TrainModel(trainingData), cancellationToken);

        _currentMetrics = new ModelMetrics
        {
            RSquared = result.RSquared,
            RootMeanSquaredError = result.RootMeanSquaredError,
            MeanAbsoluteError = result.MeanAbsoluteError,
            LastTrainedAt = result.TrainedAt,
            DataPointCount = result.DataPointCount,
            ModelPath = result.ModelPath
        };

        _logger.LogInformation(
            "Model training completed. R²: {RSquared:F4}, RMSE: {RMSE:F2}, MAE: {MAE:F2}",
            result.RSquared, result.RootMeanSquaredError, result.MeanAbsoluteError);

        return result;
    }

    public async Task<ModelTrainingResult> RetrainOnRealDataAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting model retraining on real data");

        var realData = await GetRealTrainingDataAsync(cancellationToken);

        if (realData.Count < _trainingSettings.MinRealDataPoints)
        {
            _logger.LogWarning(
                "Insufficient real data points ({Count} < {Min}). Falling back to synthetic data",
                realData.Count, _trainingSettings.MinRealDataPoints);
            return await TrainAsync(cancellationToken);
        }

        _logger.LogInformation("Retrieved {Count} real training samples", realData.Count);

        var result = await Task.Run(() => TrainModel(realData), cancellationToken);

        _currentMetrics = new ModelMetrics
        {
            RSquared = result.RSquared,
            RootMeanSquaredError = result.RootMeanSquaredError,
            MeanAbsoluteError = result.MeanAbsoluteError,
            LastTrainedAt = result.TrainedAt,
            DataPointCount = result.DataPointCount,
            ModelPath = result.ModelPath
        };

        _logger.LogInformation(
            "Model retraining completed on real data. R²: {RSquared:F4}, RMSE: {RMSE:F2}, MAE: {MAE:F2}",
            result.RSquared, result.RootMeanSquaredError, result.MeanAbsoluteError);

        return result;
    }

    public ModelMetrics? GetCurrentMetrics()
    {
        return _currentMetrics;
    }

    private ModelTrainingResult TrainModel(List<TrainingDataPoint> trainingData)
    {
        var dataView = _mlContext.Data.LoadFromEnumerable(trainingData);

        var trainTestSplit = _mlContext.Data.TrainTestSplit(dataView, testFraction: 0.2);

        var pipeline = _mlContext.Transforms.Concatenate(
                "Features",
                nameof(DifficultyPredictionInput.CurrentDifficulty),
                nameof(DifficultyPredictionInput.RollingAccuracy),
                nameof(DifficultyPredictionInput.CurrentStreak),
                nameof(DifficultyPredictionInput.StreakDirectionEncoded),
                nameof(DifficultyPredictionInput.TopicMastery),
                nameof(DifficultyPredictionInput.TotalAttempted),
                nameof(DifficultyPredictionInput.LastResponseTimeMs),
                nameof(DifficultyPredictionInput.DaysSinceLastActivity),
                nameof(DifficultyPredictionInput.LastAnswerCorrect))
            .Append(_mlContext.Regression.Trainers.FastTree(
                labelColumnName: "Label",
                featureColumnName: "Features",
                numberOfLeaves: _trainingSettings.NumberOfLeaves,
                numberOfTrees: _trainingSettings.NumberOfTrees,
                learningRate: _trainingSettings.LearningRate,
                minimumExampleCountPerLeaf: _trainingSettings.MinDataPointsInLeaves));

        var model = pipeline.Fit(trainTestSplit.TrainSet);

        var predictions = model.Transform(trainTestSplit.TestSet);
        var metrics = _mlContext.Regression.Evaluate(predictions, labelColumnName: "Label");

        var modelDirectory = Path.GetDirectoryName(_engineSettings.ModelFilePath);
        if (!string.IsNullOrEmpty(modelDirectory))
        {
            Directory.CreateDirectory(modelDirectory);
        }

        _mlContext.Model.Save(model, dataView.Schema, _engineSettings.ModelFilePath);

        return new ModelTrainingResult
        {
            RSquared = metrics.RSquared,
            RootMeanSquaredError = metrics.RootMeanSquaredError,
            MeanAbsoluteError = metrics.MeanAbsoluteError,
            TrainedAt = DateTime.UtcNow,
            DataPointCount = trainingData.Count,
            ModelPath = _engineSettings.ModelFilePath
        };
    }

    private async Task<List<TrainingDataPoint>> GetRealTrainingDataAsync(CancellationToken cancellationToken)
    {
        var performances = await _dbContext.StudentPerformances
            .Include(sp => sp.Student)
            .Where(sp => sp.TotalAttempted >= 5)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var trainingPoints = new List<TrainingDataPoint>();

        foreach (var performance in performances)
        {
            var attempts = await _dbContext.TaskAttempts
                .Where(ta => ta.StudentId == performance.StudentId && ta.TopicId == performance.TopicId)
                .OrderByDescending(ta => ta.CreatedAt)
                .Take(10)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            if (attempts.Count < 2) continue;

            for (int i = 1; i < attempts.Count; i++)
            {
                var currentAttempt = attempts[i];
                var nextAttempt = attempts[i - 1];

                var daysSinceLastActivity = performance.LastActiveAt.HasValue
                    ? (float)(currentAttempt.CreatedAt - performance.LastActiveAt.Value).TotalDays
                    : 0f;

                trainingPoints.Add(new TrainingDataPoint
                {
                    CurrentDifficulty = currentAttempt.DifficultyAtTime,
                    RollingAccuracy = (float)performance.RollingAccuracy,
                    CurrentStreak = performance.CurrentStreak,
                    StreakDirectionEncoded = EncodeStreakDirection(performance.StreakDirection),
                    TopicMastery = (float)performance.TopicMastery,
                    TotalAttempted = performance.TotalAttempted,
                    LastResponseTimeMs = currentAttempt.ResponseTimeMs,
                    DaysSinceLastActivity = daysSinceLastActivity,
                    LastAnswerCorrect = currentAttempt.IsCorrect ? 1f : 0f,
                    NextDifficulty = nextAttempt.DifficultyAtTime
                });
            }
        }

        return trainingPoints;
    }

    private static float EncodeStreakDirection(string direction) => direction.ToLower() switch
    {
        "winning" => 1f,
        "losing" => -1f,
        _ => 0f
    };
}
