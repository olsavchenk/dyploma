using Microsoft.Extensions.Diagnostics.HealthChecks;
using Minio;
using Minio.DataModel.Args;

namespace Stride.Services.HealthChecks;

/// <summary>
/// Health check for MinIO storage service
/// </summary>
public class MinIOHealthCheck : IHealthCheck
{
    private readonly IMinioClient _minioClient;

    public MinIOHealthCheck(IMinioClient minioClient)
    {
        _minioClient = minioClient ?? throw new ArgumentNullException(nameof(minioClient));
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            await _minioClient.ListBucketsAsync(cancellationToken);

            return HealthCheckResult.Healthy("MinIO is responsive");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("MinIO is not responsive", ex);
        }
    }
}
