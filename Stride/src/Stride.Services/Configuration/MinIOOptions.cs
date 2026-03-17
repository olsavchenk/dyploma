namespace Stride.Services.Configuration;

/// <summary>
/// Configuration options for MinIO storage service
/// </summary>
public class MinIOOptions
{
    public const string SectionName = "MinIO";

    public string Endpoint { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public bool UseSSL { get; set; } = false;
    public string Region { get; set; } = "us-east-1";
    
    public BucketConfiguration Buckets { get; set; } = new();
}
