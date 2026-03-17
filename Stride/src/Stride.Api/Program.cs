using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Serilog;
using Serilog.Context;
using Stride.Adaptive.Extensions;
using Stride.Api.BackgroundServices;
using Stride.Api.Extensions;
using Stride.Api.Filters;
using Stride.Api.Hubs;
using Stride.Api.Middleware;
using Stride.DataAccess.Contexts;
using Stride.DataAccess.Seeders;
using Stride.Services.Configuration;
using Stride.Services.Interfaces;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(new ConfigurationBuilder()
        .AddJsonFile("appsettings.json")
        .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
        .Build())
    .Enrich.FromLogContext()
    .CreateLogger();

try
{
    Log.Information("Starting Stride API application");

    var builder = WebApplication.CreateBuilder(args);

    // Add Serilog
    builder.Host.UseSerilog();

    // Add services to the container
    builder.Services.AddControllers(options =>
    {
        // Add global validation filter
        options.Filters.Add<ValidationFilter>();
    });
    builder.Services.AddOpenApi();

    // Add SignalR
    builder.Services.AddSignalR();

    // Add background services
    if (!builder.Configuration.GetValue<bool>("Development:SkipInfrastructureInitialization"))
    {
        builder.Services.AddHostedService<LeaderboardWeeklyService>();
    }

    // Add CORS
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    // Add database services
    builder.Services.AddDatabaseServices(builder.Configuration);

    // Add infrastructure services (Cache, Storage, Search)
    builder.Services.AddInfrastructureServices(builder.Configuration);

    // Add authentication services
    builder.Services.AddAuthenticationServices(builder.Configuration);

    // Add AI Provider and Adaptive services (always register so ITaskGenerationService
    // is available for ClassService regardless of infrastructure availability)
    builder.Services.AddAIProviders(builder.Configuration);

    // Add validation services
    builder.Services.AddValidationServices();

    // Add health checks
    builder.Services.AddHealthCheckServices(builder.Configuration);

    // Add HTTP context accessor for correlation IDs
    builder.Services.AddHttpContextAccessor();

    var app = builder.Build();

    // Configure the HTTP request pipeline

    // Add correlation ID and user context to logs
    app.Use(async (context, next) =>
    {
        var correlationId = context.TraceIdentifier;
        
        // Extract user ID from JWT claims (if authenticated)
        var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
        var userRole = context.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "none";
        
        using (LogContext.PushProperty("CorrelationId", correlationId))
        using (LogContext.PushProperty("UserId", userId))
        using (LogContext.PushProperty("UserRole", userRole))
        {
            context.Response.Headers.Append("X-Correlation-ID", correlationId);
            await next();
        }
    });

    // Global exception handler
    app.UseMiddleware<GlobalExceptionMiddleware>();

    // Serilog request logging with enriched context
    app.UseSerilogRequestLogging(options =>
    {
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("ClientIP", httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");
            diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].ToString());
            diagnosticContext.Set("CorrelationId", httpContext.TraceIdentifier);
            diagnosticContext.Set("UserId", httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "anonymous");
            diagnosticContext.Set("UserRole", httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "none");
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
            diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
        };
    });

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    app.UseCors();

    app.UseHttpsRedirection();

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    // Map SignalR hubs
    app.MapHub<LeaderboardHub>("/hubs/leaderboard");
    app.MapHub<NotificationHub>("/hubs/notifications");

    // Health check endpoints
    app.MapHealthChecks("/health");
    app.MapHealthChecks("/health/ready");
    app.MapHealthChecks("/health/live");

    // Initialize infrastructure on startup
    var skipInfrastructure = builder.Configuration.GetValue<bool>("Development:SkipInfrastructureInitialization");
    
    if (!skipInfrastructure)
    {
        using (var scope = app.Services.CreateScope())
        {
            try
            {
                Log.Information("Initializing infrastructure services");

                // Apply database migrations
                var dbContext = scope.ServiceProvider.GetRequiredService<StrideDbContext>();
                Log.Information("Applying database migrations...");
                await dbContext.Database.MigrateAsync();
                Log.Information("Database migrations applied successfully");

                // MongoDB indexes
                var mongoContext = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
                await mongoContext.InitializeIndexesAsync();
                Log.Information("MongoDB indexes initialized");
                
                // Seed initial data
                var subjectTopicSeeder = new SubjectTopicSeeder(dbContext);
                await subjectTopicSeeder.SeedAsync();
                Log.Information("Database seeded with initial subjects and topics");

                var learningPathSeeder = new LearningPathSeeder(dbContext);
                await learningPathSeeder.SeedAsync();
                Log.Information("Database seeded with learning paths");

                // Seed achievements
                var achievementSeeder = new AchievementSeeder(dbContext);
                await achievementSeeder.SeedAsync();
                Log.Information("Database seeded with achievements");

                // Seed test class (teacher@test.com / student@test.com, join code: TEST01)
                var classSeeder = new ClassSeeder(dbContext);
                await classSeeder.SeedAsync();
                Log.Information("Database seeded with test class (join code: TEST01)");

                // Seed task templates
                var templateRepository = scope.ServiceProvider.GetRequiredService<Stride.DataAccess.Repositories.ITaskTemplateRepository>();
                var taskTemplateSeeder = new TaskTemplateSeeder(dbContext, templateRepository);
                await taskTemplateSeeder.SeedAsync();
                Log.Information("MongoDB seeded with task templates");

                // MinIO buckets
                var storageService = scope.ServiceProvider.GetRequiredService<IStorageService>();
                var minioOptions = scope.ServiceProvider.GetRequiredService<IOptions<MinIOOptions>>().Value;
                await storageService.EnsureBucketExistsAsync(minioOptions.Buckets.Avatars);
                await storageService.EnsureBucketExistsAsync(minioOptions.Buckets.Assets);
                Log.Information("MinIO buckets initialized");

                // Meilisearch indexes
                var searchService = scope.ServiceProvider.GetRequiredService<ISearchService>();
                var meilisearchOptions = scope.ServiceProvider.GetRequiredService<IOptions<MeilisearchOptions>>().Value;
                await searchService.EnsureIndexExistsAsync(
                    meilisearchOptions.Indexes.Subjects,
                    "id",
                    new[] { "name", "description" });
                await searchService.EnsureIndexExistsAsync(
                    meilisearchOptions.Indexes.Topics,
                    "id",
                    new[] { "name", "description" });
                Log.Information("Meilisearch indexes initialized");

                Log.Information("All infrastructure services initialized successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "An error occurred while initializing infrastructure services");
                throw;
            }
        }
    }
    else
    {
        Log.Warning("Infrastructure initialization skipped (Development mode)");
    }

    Log.Information("Stride API is ready to handle requests");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
