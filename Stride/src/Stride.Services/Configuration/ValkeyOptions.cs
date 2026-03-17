namespace Stride.Services.Configuration;

/// <summary>
/// Configuration options for Valkey cache service
/// </summary>
public class ValkeyOptions
{
    public const string SectionName = "Valkey";

    public string ConnectionString { get; set; } = string.Empty;
    public int DefaultExpirationMinutes { get; set; } = 60;
    public string InstanceName { get; set; } = "Stride:";
}
