using FluentValidation;
using Meilisearch;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.ML;
using Microsoft.IdentityModel.Tokens;
using Minio;
using StackExchange.Redis;
using Stride.Adaptive.BackgroundServices;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Extensions;
using Stride.Adaptive.Models;
using Stride.Adaptive.Services.Implementations;
using Stride.Adaptive.Services.Interfaces;
using Stride.Adaptive.Validators;
using Stride.DataAccess.Contexts;
using Stride.DataAccess.Repositories;
using Stride.Services.Configuration;
using Stride.Services.Implementations;
using Stride.Services.Interfaces;
using System.Text;

namespace Stride.Adaptive.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDatabaseServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var useInMemory = configuration.GetValue<bool>("Development:UseInMemoryDatabase");
        
        // PostgreSQL or In-Memory Database
        if (useInMemory)
        {
            services.AddDbContext<StrideDbContext>(options =>
                options.UseInMemoryDatabase("StrideAdaptiveInMemoryDb"));
        }
        else
        {
            services.AddDbContext<StrideDbContext>(options =>
                options.UseNpgsql(
                    configuration.GetConnectionString("PostgreSQL"),
                    npgsqlOptions => npgsqlOptions.MigrationsAssembly("Stride.DataAccess")));
        }

        // MongoDB
        services.Configure<MongoDbSettings>(
            configuration.GetSection("MongoDb"));
        services.AddSingleton<MongoDbContext>();

        // MongoDB Repositories
        services.AddScoped<ITaskTemplateRepository, TaskTemplateRepository>();
        services.AddScoped<ITaskInstanceRepository, TaskInstanceRepository>();

        // PostgreSQL Repositories
        services.AddScoped<ITaskAttemptRepository, TaskAttemptRepository>();

        // Seeders
        services.AddScoped<Stride.DataAccess.Seeders.TaskTemplateSeeder>();
        services.AddScoped<Stride.DataAccess.Seeders.SubjectTopicSeeder>();
        services.AddScoped<Stride.DataAccess.Seeders.AchievementSeeder>();

        return services;
    }

    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var skipInfrastructure = configuration.GetValue<bool>("Development:SkipInfrastructureInitialization");
        
        // Valkey (Redis) Cache
        services.Configure<ValkeyOptions>(configuration.GetSection(ValkeyOptions.SectionName));
        var valkeyOptions = configuration.GetSection(ValkeyOptions.SectionName).Get<ValkeyOptions>();
        if (!skipInfrastructure && !string.IsNullOrEmpty(valkeyOptions?.ConnectionString))
        {
            try
            {
                services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(valkeyOptions.ConnectionString));
                services.AddScoped<ICacheService, ValkeyCacheService>();
            }
            catch (Exception)
            {
                // Cache service not available, use in-memory cache
                services.AddSingleton<ICacheService, InMemoryCacheService>();
            }
        }
        else
        {
            // Use in-memory cache when infrastructure is skipped
            services.AddSingleton<ICacheService, InMemoryCacheService>();
        }

        // MinIO Storage
        services.Configure<MinIOOptions>(configuration.GetSection(MinIOOptions.SectionName));
        var minioOptions = configuration.GetSection(MinIOOptions.SectionName).Get<MinIOOptions>();
        if (!skipInfrastructure && minioOptions != null)
        {
            try
            {
                services.AddSingleton<IMinioClient>(sp =>
                {
                    var client = new MinioClient()
                        .WithEndpoint(minioOptions.Endpoint)
                        .WithCredentials(minioOptions.AccessKey, minioOptions.SecretKey);

                    if (minioOptions.UseSSL)
                    {
                        client = client.WithSSL();
                    }

                    return client.Build();
                });
                services.AddScoped<IStorageService, MinIOStorageService>();
            }
            catch (Exception)
            {
                // Storage service not available, use no-op
                services.AddScoped<IStorageService, NoOpStorageService>();
            }
        }
        else
        {
            // Use no-op storage when infrastructure is skipped
            services.AddScoped<IStorageService, NoOpStorageService>();
        }

        // Meilisearch
        services.Configure<MeilisearchOptions>(configuration.GetSection(MeilisearchOptions.SectionName));
        var meilisearchOptions = configuration.GetSection(MeilisearchOptions.SectionName).Get<MeilisearchOptions>();
        if (!skipInfrastructure && meilisearchOptions != null)
        {
            try
            {
                services.AddSingleton(new MeilisearchClient(meilisearchOptions.Url, meilisearchOptions.MasterKey));
                services.AddScoped<ISearchService, MeilisearchService>();
            }
            catch (Exception)
            {
                // Search service not available, continue without it
            }
        }

        return services;
    }

    public static IServiceCollection AddAdaptiveServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Configuration
        services.Configure<DifficultyEngineSettings>(
            configuration.GetSection(DifficultyEngineSettings.SectionName));
        services.Configure<ModelTrainingSettings>(
            configuration.GetSection(ModelTrainingSettings.SectionName));
        services.Configure<TaskPoolSettings>(
            configuration.GetSection(TaskPoolSettings.SectionName));

        // ML.NET Prediction Engine Pool
        var engineSettings = configuration
            .GetSection(DifficultyEngineSettings.SectionName)
            .Get<DifficultyEngineSettings>() ?? new DifficultyEngineSettings();

        var modelPath = Path.Combine(Directory.GetCurrentDirectory(), engineSettings.ModelFilePath);

        // Only load model if file exists, otherwise it will be created on first training
        if (File.Exists(modelPath))
        {
            try
            {
                services.AddPredictionEnginePool<DifficultyPredictionInput, DifficultyPredictionOutput>()
                    .FromFile(modelName: "DifficultyModel", filePath: modelPath, watchForChanges: true);
            }
            catch (Exception)
            {
                // Model file exists but cannot be loaded, will be retrained
            }
        }

        // Services
        services.AddScoped<ISyntheticDataGenerator, SyntheticDataGenerator>();
        services.AddScoped<IModelTrainer, ModelTrainer>();
        services.AddScoped<ITaskPoolService, TaskPoolService>();
        services.AddScoped<IAdaptiveAIService, AdaptiveAIService>();
        services.AddScoped<IDifficultyEngine, MLDifficultyEngine>();
        services.AddScoped<IStudentPerformanceService, StudentPerformanceService>();

        // AI Providers
        services.AddAIProviders(configuration);

        // Template Renderer (required by TaskPoolService)
        services.AddScoped<ITemplateRenderer, TemplateRenderer>();

        // Leaderboard Service (required by GamificationService)
        var skipInfrastructure = configuration.GetValue<bool>("Development:SkipInfrastructureInitialization");
        if (!skipInfrastructure)
        {
            services.AddScoped<ILeaderboardService, LeaderboardService>();
        }
        else
        {
            services.AddScoped<ILeaderboardService, NoOpLeaderboardService>();
        }

        // Gamification Service (required by AdaptiveAIService)
        services.Configure<GamificationSettings>(configuration.GetSection("Gamification"));
        services.AddScoped<IGamificationService, GamificationService>();
        services.AddScoped<IAchievementService, AchievementService>();

        // Background services - only add if not in development mode
        if (!skipInfrastructure)
        {
            services.AddHostedService<ModelRetrainingService>();
            services.AddHostedService<TaskPoolRefillService>();
        }

        // Validators
        services.AddValidatorsFromAssemblyContaining<PredictDifficultyRequestValidator>();

        return services;
    }

    public static IServiceCollection AddAuthenticationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.SaveToken = true;
            options.RequireHttpsMetadata = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidateAudience = true,
                ValidAudience = jwtSettings["Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminAccess", policy => policy.RequireRole("Admin"));
        });

        return services;
    }

    public static IServiceCollection AddHealthCheckServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var skipInfrastructure = configuration.GetValue<bool>("Development:SkipInfrastructureInitialization");
        var healthChecksBuilder = services.AddHealthChecks();
        
        if (!skipInfrastructure)
        {
            var postgresConnectionString = configuration.GetConnectionString("PostgreSQL");
            if (!string.IsNullOrEmpty(postgresConnectionString))
            {
                healthChecksBuilder.AddNpgSql(
                    postgresConnectionString,
                    name: "postgresql",
                    tags: new[] { "db", "sql", "postgres" });
            }
            // TODO: Add MongoDB health check with proper configuration
            // .AddMongoDb(...);
        }

        return services;
    }
}
