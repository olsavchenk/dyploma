using System.Threading.Channels;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.ML;
using Stride.Adaptive.BackgroundServices;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Models;
using Stride.Adaptive.Services.Implementations;
using Stride.Adaptive.Services.Interfaces;
using Stride.Services.Interfaces;

namespace Stride.Adaptive.Extensions;

public static class AIProviderServiceExtensions
{
    public static IServiceCollection AddAIProviders(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var skipInfrastructure = configuration.GetValue<bool>("Development:SkipInfrastructureInitialization");

        // Register configuration
        services.Configure<AIProviderSettings>(
            configuration.GetSection(AIProviderSettings.SectionName));
        services.Configure<DifficultyEngineSettings>(
            configuration.GetSection(DifficultyEngineSettings.SectionName));
        services.Configure<ModelTrainingSettings>(
            configuration.GetSection(ModelTrainingSettings.SectionName));
        services.Configure<TaskPoolSettings>(
            configuration.GetSection(TaskPoolSettings.SectionName));

        // ML.NET Prediction Engine Pool (optional - only if model exists)
        var engineSettings = configuration
            .GetSection(DifficultyEngineSettings.SectionName)
            .Get<DifficultyEngineSettings>() ?? new DifficultyEngineSettings();

        var modelPath = Path.Combine(Directory.GetCurrentDirectory(), engineSettings.ModelFilePath);

        // Register the prediction engine pool only if model file exists
        // Otherwise, register null provider and MLDifficultyEngine will use fallback
        if (File.Exists(modelPath))
        {
            services.AddPredictionEnginePool<DifficultyPredictionInput, DifficultyPredictionOutput>()
                .FromFile(modelName: "DifficultyModel", filePath: modelPath, watchForChanges: true);
        }
        else
        {
            // Register a null provider - MLDifficultyEngine will handle null gracefully
            services.AddSingleton<PredictionEnginePool<DifficultyPredictionInput, DifficultyPredictionOutput>>(_ => null!);
        }

        // Register HttpClient for AI providers with proper configuration
        services.AddHttpClient<GeminiProvider>(client =>
        {
            client.DefaultRequestHeaders.Add("User-Agent", "Stride-Adaptive-Engine/1.0");
        });

        // Register individual providers
        services.AddScoped<GeminiProvider>();
        // Future providers:
        // services.AddScoped<GPTProvider>();
        // services.AddScoped<ClaudeProvider>();

        // Register factory
        services.AddScoped<IAIProviderFactory, AIProviderFactory>();

        // Register task generation pipeline — always registered so ClassService can trigger generation
        services.AddSingleton(Channel.CreateUnbounded<TaskGenerationWorkItem>());
        services.AddScoped<ITaskGenerationService, TaskGenerationService>();
        services.AddScoped<ITaskReviewService, TaskReviewService>();
        services.AddHostedService<TaskGenerationBackgroundService>();

        // Infrastructure-dependent services (require Valkey/Redis connection)
        if (!skipInfrastructure)
        {
            services.AddScoped<IDifficultyEngine, MLDifficultyEngine>();
            services.AddScoped<ITaskPoolService, TaskPoolService>();
            services.AddScoped<IAdaptiveAIService, AdaptiveAIService>();
            services.AddScoped<ITaskService, TaskService>();
            services.AddHostedService<TaskPoolRefillService>();
        }

        return services;
    }
}
