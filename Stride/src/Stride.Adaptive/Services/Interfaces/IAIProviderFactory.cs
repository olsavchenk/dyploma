namespace Stride.Adaptive.Services.Interfaces;

public interface IAIProviderFactory
{
    IAIProvider GetProvider(string providerName);
    IAIProvider GetDefaultProvider();
    IEnumerable<string> GetAvailableProviders();
}
