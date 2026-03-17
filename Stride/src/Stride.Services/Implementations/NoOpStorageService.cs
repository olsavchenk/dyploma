using Stride.Services.Interfaces;

namespace Stride.Services.Implementations;

public class NoOpStorageService : IStorageService
{
    public Task<string> UploadAsync(string bucketName, string objectName, Stream data, string contentType, CancellationToken cancellationToken = default)
    {
        // Return a fake URL for development
        return Task.FromResult($"http://localhost/storage/{bucketName}/{objectName}");
    }

    public Task<Stream> DownloadAsync(string bucketName, string objectName, CancellationToken cancellationToken = default)
    {
        // Return an empty stream
        return Task.FromResult<Stream>(new MemoryStream());
    }

    public Task<bool> DeleteAsync(string bucketName, string objectName, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(true);
    }

    public Task<string> GetPresignedUrlAsync(string bucketName, string objectName, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        // Return a fake presigned URL
        return Task.FromResult($"http://localhost/storage/{bucketName}/{objectName}?expires={expiration.TotalSeconds}");
    }

    public Task EnsureBucketExistsAsync(string bucketName, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task<bool> ObjectExistsAsync(string bucketName, string objectName, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(false);
    }
}
