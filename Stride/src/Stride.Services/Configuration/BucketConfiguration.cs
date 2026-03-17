namespace Stride.Services.Configuration;

/// <summary>
/// Bucket configuration for MinIO
/// </summary>
public class BucketConfiguration
{
    public string Avatars { get; set; } = "avatars";
    public string Assets { get; set; } = "assets";
}
