using Serilog;
using Serilog.Context;
using Stride.Adaptive.Api.Extensions;

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
    Log.Information("Starting Stride Adaptive API application");

    var builder = WebApplication.CreateBuilder(args);

    // Add Serilog
    builder.Host.UseSerilog();

    // Add services to the container
    builder.Services.AddControllers();
    builder.Services.AddOpenApi();

    // Add CORS
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins("http://localhost:4200", "https://localhost:4200", "http://localhost:5000", "https://localhost:5001")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    // Add database services
    builder.Services.AddDatabaseServices(builder.Configuration);

    // Add infrastructure services (Cache, Storage, Search)
    builder.Services.AddInfrastructureServices(builder.Configuration);

    // Add adaptive ML services
    builder.Services.AddAdaptiveServices(builder.Configuration);

    // Add authentication services
    builder.Services.AddAuthenticationServices(builder.Configuration);

    // Add health checks
    builder.Services.AddHealthCheckServices(builder.Configuration);

    // Add HTTP context accessor
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

    // Health check endpoints
    app.MapHealthChecks("/health");
    app.MapHealthChecks("/health/ready");
    app.MapHealthChecks("/health/live");

    Log.Information("Stride Adaptive API is ready to handle requests");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Adaptive API application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
