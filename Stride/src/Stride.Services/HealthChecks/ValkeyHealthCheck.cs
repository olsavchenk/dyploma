using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace Stride.Services.HealthChecks;

/// <summary>
/// Health check for Valkey cache service
/// </summary>
public class ValkeyHealthCheck : IHealthCheck
{
    private readonly IConnectionMultiplexer _redis;

    public ValkeyHealthCheck(IConnectionMultiplexer redis)
    {
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var database = _redis.GetDatabase();
            await database.PingAsync();

            return HealthCheckResult.Healthy("Valkey is responsive");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Valkey is not responsive", ex);
        }
    }
}
