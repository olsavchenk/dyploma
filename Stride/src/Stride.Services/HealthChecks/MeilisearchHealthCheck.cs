using Meilisearch;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Stride.Services.HealthChecks;

/// <summary>
/// Health check for Meilisearch service
/// </summary>
public class MeilisearchHealthCheck : IHealthCheck
{
    private readonly MeilisearchClient _client;

    public MeilisearchHealthCheck(MeilisearchClient client)
    {
        _client = client ?? throw new ArgumentNullException(nameof(client));
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var health = await _client.HealthAsync(cancellationToken);

            if (health?.Status == "available")
            {
                return HealthCheckResult.Healthy("Meilisearch is responsive");
            }

            return HealthCheckResult.Degraded($"Meilisearch status: {health?.Status}");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Meilisearch is not responsive", ex);
        }
    }
}
