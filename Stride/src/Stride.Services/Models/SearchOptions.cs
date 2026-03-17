namespace Stride.Services.Models;

/// <summary>
/// Search options for query customization
/// </summary>
public class SearchOptions
{
    public int Limit { get; set; } = 20;
    public int Offset { get; set; } = 0;
    public IEnumerable<string>? AttributesToRetrieve { get; set; }
    public IEnumerable<string>? AttributesToHighlight { get; set; }
    public IEnumerable<string>? Filter { get; set; }
}
