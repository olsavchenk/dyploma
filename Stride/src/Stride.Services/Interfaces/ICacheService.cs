namespace Stride.Services.Interfaces;

/// <summary>
/// Service for caching operations using Valkey
/// </summary>
public interface ICacheService
{
    /// <summary>
    /// Gets a cached value by key
    /// </summary>
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sets a cached value with optional TTL
    /// </summary>
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes a cached value by key
    /// </summary>
    Task<bool> RemoveAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the remaining time to live for a key
    /// </summary>
    Task<TimeSpan?> GetTtlAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a key exists
    /// </summary>
    Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sets the expiration time for a key
    /// </summary>
    Task<bool> ExpireAsync(string key, TimeSpan expiration, CancellationToken cancellationToken = default);
}
