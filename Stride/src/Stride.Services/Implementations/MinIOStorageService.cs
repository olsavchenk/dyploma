using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using Stride.Services.Configuration;
using Stride.Services.Interfaces;

namespace Stride.Services.Implementations;

/// <summary>
/// MinIO storage service implementation
/// </summary>
public class MinIOStorageService : IStorageService
{
    private readonly IMinioClient _minioClient;
    private readonly MinIOOptions _options;

    public MinIOStorageService(IMinioClient minioClient, IOptions<MinIOOptions> options)
    {
        _minioClient = minioClient ?? throw new ArgumentNullException(nameof(minioClient));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
    }

    public async Task<string> UploadAsync(string bucketName, string objectName, Stream data, string contentType, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(bucketName);
        ArgumentNullException.ThrowIfNull(objectName);
        ArgumentNullException.ThrowIfNull(data);

        await EnsureBucketExistsAsync(bucketName, cancellationToken);

        var putObjectArgs = new PutObjectArgs()
            .WithBucket(bucketName)
            .WithObject(objectName)
            .WithStreamData(data)
            .WithObjectSize(data.Length)
            .WithContentType(contentType);

        await _minioClient.PutObjectAsync(putObjectArgs, cancellationToken);

        return objectName;
    }

    public async Task<Stream> DownloadAsync(string bucketName, string objectName, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(bucketName);
        ArgumentNullException.ThrowIfNull(objectName);

        var memoryStream = new MemoryStream();

        var getObjectArgs = new GetObjectArgs()
            .WithBucket(bucketName)
            .WithObject(objectName)
            .WithCallbackStream(stream =>
            {
                stream.CopyTo(memoryStream);
            });

        await _minioClient.GetObjectAsync(getObjectArgs, cancellationToken);
        memoryStream.Position = 0;

        return memoryStream;
    }

    public async Task<bool> DeleteAsync(string bucketName, string objectName, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(bucketName);
        ArgumentNullException.ThrowIfNull(objectName);

        try
        {
            var removeObjectArgs = new RemoveObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectName);

            await _minioClient.RemoveObjectAsync(removeObjectArgs, cancellationToken);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<string> GetPresignedUrlAsync(string bucketName, string objectName, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(bucketName);
        ArgumentNullException.ThrowIfNull(objectName);

        var presignedGetObjectArgs = new PresignedGetObjectArgs()
            .WithBucket(bucketName)
            .WithObject(objectName)
            .WithExpiry((int)expiration.TotalSeconds);

        return await _minioClient.PresignedGetObjectAsync(presignedGetObjectArgs);
    }

    public async Task EnsureBucketExistsAsync(string bucketName, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(bucketName);

        var bucketExistsArgs = new BucketExistsArgs()
            .WithBucket(bucketName);

        bool found = await _minioClient.BucketExistsAsync(bucketExistsArgs, cancellationToken);

        if (!found)
        {
            var makeBucketArgs = new MakeBucketArgs()
                .WithBucket(bucketName);

            await _minioClient.MakeBucketAsync(makeBucketArgs, cancellationToken);
        }
    }

    public async Task<bool> ObjectExistsAsync(string bucketName, string objectName, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(bucketName);
        ArgumentNullException.ThrowIfNull(objectName);

        try
        {
            var statObjectArgs = new StatObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectName);

            await _minioClient.StatObjectAsync(statObjectArgs, cancellationToken);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
