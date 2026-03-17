using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Services.Interfaces;

namespace Stride.Adaptive.Services.Implementations;

public class AIProviderFactory : IAIProviderFactory
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AIProviderFactory> _logger;
    private readonly AIProviderSettings _settings;
    private readonly Dictionary<string, Type> _providers;

    public AIProviderFactory(
        IServiceProvider serviceProvider,
        ILogger<AIProviderFactory> logger,
        IOptions<AIProviderSettings> settings)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _settings = settings.Value;
        
        _providers = new Dictionary<string, Type>(StringComparer.OrdinalIgnoreCase)
        {
            { "gemini", typeof(GeminiProvider) }
            // Future providers can be added here:
            // { "gpt", typeof(GPTProvider) },
            // { "claude", typeof(ClaudeProvider) }
        };
    }

    public IAIProvider GetProvider(string providerName)
    {
        if (string.IsNullOrWhiteSpace(providerName))
        {
            throw new ArgumentException("Provider name cannot be null or empty", nameof(providerName));
        }

        if (!_providers.TryGetValue(providerName, out var providerType))
        {
            _logger.LogError("AI provider '{ProviderName}' not found. Available providers: {Providers}",
                providerName, string.Join(", ", _providers.Keys));
            throw new InvalidOperationException($"AI provider '{providerName}' is not registered");
        }

        try
        {
            var provider = _serviceProvider.GetRequiredService(providerType) as IAIProvider;
            if (provider == null)
            {
                throw new InvalidOperationException($"Failed to resolve provider '{providerName}' from service provider");
            }

            _logger.LogDebug("Resolved AI provider: {ProviderName}", providerName);
            return provider;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get AI provider '{ProviderName}'", providerName);
            throw;
        }
    }

    public IAIProvider GetDefaultProvider()
    {
        var defaultProviderName = _settings.DefaultProvider;
        _logger.LogDebug("Getting default AI provider: {ProviderName}", defaultProviderName);
        return GetProvider(defaultProviderName);
    }

    public IEnumerable<string> GetAvailableProviders()
    {
        return _providers.Keys.ToList();
    }
}
