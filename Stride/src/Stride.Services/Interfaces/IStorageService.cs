namespace Stride.Services.Interfaces;

/// <summary>
/// Service for object storage operations using MinIO
/// </summary>
public interface IStorageService
{
    /// <summary>
    /// Uploads a file to storage
    /// </summary>
    Task<string> UploadAsync(string bucketName, string objectName, Stream data, string contentType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Downloads a file from storage
    /// </summary>
    Task<Stream> DownloadAsync(string bucketName, string objectName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a file from storage
    /// </summary>
    Task<bool> DeleteAsync(string bucketName, string objectName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a pre-signed URL for temporary access
    /// </summary>
    Task<string> GetPresignedUrlAsync(string bucketName, string objectName, TimeSpan expiration, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a bucket exists, creates if not
    /// </summary>
    Task EnsureBucketExistsAsync(string bucketName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if an object exists
    /// </summary>
    Task<bool> ObjectExistsAsync(string bucketName, string objectName, CancellationToken cancellationToken = default);
}
