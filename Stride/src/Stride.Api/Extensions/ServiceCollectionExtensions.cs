using FluentValidation;
using Meilisearch;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Minio;
using MongoDB.Driver;
using StackExchange.Redis;
using Stride.Api.Filters;
using Stride.DataAccess.Contexts;
using Stride.DataAccess.Repositories;
using Stride.Services.Configuration;
using Stride.Services.HealthChecks;
using Stride.Services.Implementations;
using Stride.Services.Interfaces;
using System.Text;

namespace Stride.Api.Extensions;

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
                options.UseInMemoryDatabase("StrideInMemoryDb"));
        }
        else
        {
            services.AddDbContext<StrideDbContext>(options =>
                options.UseNpgsql(
                    configuration.GetConnectionString("PostgreSQL"),
                    npgsqlOptions => npgsqlOptions.MigrationsAssembly("Stride.DataAccess")));
        }

        // MongoDB
        services.Configure<MongoDbSettings>(configuration.GetSection("MongoDB"));
        services.AddSingleton<MongoDbContext>();

        // MongoDB Repositories
        services.AddScoped<ITaskTemplateRepository, TaskTemplateRepository>();
        services.AddScoped<ITaskInstanceRepository, TaskInstanceRepository>();

        // PostgreSQL Repositories
        services.AddScoped<ITaskAttemptRepository, TaskAttemptRepository>();

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
        
        if (!skipInfrastructure && valkeyOptions != null && !string.IsNullOrEmpty(valkeyOptions.ConnectionString))
        {
            try
            {
                var redis = ConnectionMultiplexer.Connect(valkeyOptions.ConnectionString);
                services.AddSingleton<IConnectionMultiplexer>(redis);
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

    public static IServiceCollection AddHealthCheckServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var skipInfrastructure = configuration.GetValue<bool>("Development:SkipInfrastructureInitialization");
        var healthChecksBuilder = services.AddHealthChecks();
        
        if (!skipInfrastructure)
        {
            var mongoConnectionString = configuration.GetConnectionString("MongoDB");
            var valkeyConnectionString = configuration.GetSection("Valkey:ConnectionString").Value;
            var postgresConnectionString = configuration.GetConnectionString("PostgreSQL");
            
            if (!string.IsNullOrEmpty(postgresConnectionString))
            {
                healthChecksBuilder.AddNpgSql(
                    postgresConnectionString,
                    name: "postgresql",
                    tags: new[] { "db", "sql", "postgres" });
            }
            
            if (!string.IsNullOrEmpty(mongoConnectionString))
            {
                healthChecksBuilder.AddMongoDb(
                    _ => new MongoClient(mongoConnectionString),
                    name: "mongodb",
                    tags: ["db", "nosql", "mongo"]);
            }
            
            if (!string.IsNullOrEmpty(valkeyConnectionString))
            {
                healthChecksBuilder.AddRedis(
                    valkeyConnectionString,
                    name: "valkey",
                    tags: ["cache", "redis", "valkey"]);
            }
            
            healthChecksBuilder
                .AddCheck<MinIOHealthCheck>(
                    "minio",
                    tags: ["storage", "minio"])
                .AddCheck<MeilisearchHealthCheck>(
                    "meilisearch",
                    tags: ["search", "meilisearch"]);
        }

        return services;
    }

    public static IServiceCollection AddValidationServices(
        this IServiceCollection services)
    {
        // Auto-register validators from all assemblies
        services.AddValidatorsFromAssemblyContaining<Program>();
        services.AddValidatorsFromAssembly(typeof(Stride.Services.Interfaces.ICacheService).Assembly);
        
        // Add validation filter
        services.AddScoped<ValidationFilter>();

        return services;
    }

    public static IServiceCollection AddAuthenticationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Configure JWT settings
        services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
        var jwtSettings = configuration.GetSection("JwtSettings").Get<JwtSettings>()!;

        // Configure Google Auth settings
        services.Configure<GoogleAuthSettings>(configuration.GetSection(GoogleAuthSettings.SectionName));

        // Register JWT service
        services.AddScoped<IJwtService, JwtService>();
        
        // Register Auth services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();
        
        // Register User services
        services.AddScoped<IUserService, UserService>();
        
        // Register Template services
        services.AddScoped<ITemplateRenderer, TemplateRenderer>();
        
        // Register Learning Content services
        services.AddScoped<ISubjectService, SubjectService>();
        services.AddScoped<ITopicService, TopicService>();
        services.AddScoped<ILearningPathService, LearningPathService>();
        
        // Register Class services
        services.AddScoped<IClassService, ClassService>();
        
        // Register Gamification services
        services.Configure<GamificationSettings>(configuration.GetSection("Gamification"));
        services.AddScoped<IGamificationService, GamificationService>();
        services.AddScoped<IAchievementService, AchievementService>();
        
        // Register Leaderboard services
        var skipInfrastructure = configuration.GetValue<bool>("Development:SkipInfrastructureInitialization");
        if (!skipInfrastructure)
        {
            services.AddScoped<ILeaderboardService, LeaderboardService>();
        }
        else
        {
            services.AddScoped<ILeaderboardService, NoOpLeaderboardService>();
        }

        // Register Admin services
        services.AddScoped<IAdminService, AdminService>();

        // Configure JWT authentication
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
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtSettings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            // Configure SignalR authentication
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];

                    // If the request is for our hub...
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        // Read the token out of the query string
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                }
            };
        });

        // Configure authorization
        services.AddAuthorization(options =>
        {
            options.AddPolicy("StudentAccess", policy => policy.RequireRole("Student"));
            options.AddPolicy("TeacherAccess", policy => policy.RequireRole("Teacher"));
            options.AddPolicy("AdminAccess", policy => policy.RequireRole("Admin"));
        });

        return services;
    }
}
