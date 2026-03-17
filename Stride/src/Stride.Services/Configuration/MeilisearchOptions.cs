namespace Stride.Services.Configuration;

/// <summary>
/// Configuration options for Meilisearch service
/// </summary>
public class MeilisearchOptions
{
    public const string SectionName = "Meilisearch";

    public string Url { get; set; } = string.Empty;
    public string MasterKey { get; set; } = string.Empty;
    
    public IndexConfiguration Indexes { get; set; } = new();
}
