namespace Stride.Services.Models;

/// <summary>
/// Search result wrapper
/// </summary>
public class SearchResult<T> where T : class
{
    public IReadOnlyList<T> Hits { get; set; } = Array.Empty<T>();
    public int TotalHits { get; set; }
    public int ProcessingTimeMs { get; set; }
    public string Query { get; set; } = string.Empty;
}
