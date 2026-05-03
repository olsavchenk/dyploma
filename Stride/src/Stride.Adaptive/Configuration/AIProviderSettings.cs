namespace Stride.Adaptive.Configuration;

public class AIProviderSettings
{
    public const string SectionName = "AIProvider";

    public string DefaultProvider { get; set; } = "anthropic";
    public GeminiSettings Gemini { get; set; } = new();
    public AnthropicSettings Anthropic { get; set; } = new();
    public int MaxRetries { get; set; } = 3;
    public int RetryDelayMs { get; set; } = 1000;
    public int TimeoutSeconds { get; set; } = 600;
    /// <summary>Delay between consecutive batch generation calls to respect rate limits.</summary>
    public int BatchDelayMs { get; set; } = 4000;
}

public class GeminiSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gemini-3-flash-preview";
    public string ApiUrl { get; set; } = "https://generativelanguage.googleapis.com/v1beta/models";
    public double Temperature { get; set; } = 0.7;
    public int MaxOutputTokens { get; set; } = 8192;
}

public class AnthropicSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "claude-haiku-4-5-20251001";
    public string ApiUrl { get; set; } = "https://api.anthropic.com/v1/messages";
    public double Temperature { get; set; } = 0.7;
    public int MaxOutputTokens { get; set; } = 8192;
}
