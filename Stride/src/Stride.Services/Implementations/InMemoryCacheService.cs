using Stride.Services.Interfaces;
using System.Collections.Concurrent;

namespace Stride.Services.Implementations;

public class InMemoryCacheService : ICacheService
{
    private readonly ConcurrentDictionary<string, (object Value, DateTime Expiry)> _cache = new();

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(key, out var entry))
        {
            if (entry.Expiry > DateTime.UtcNow)
            {
                return Task.FromResult((T?)entry.Value);
            }
            _cache.TryRemove(key, out _);
        }
        return Task.FromResult(default(T));
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        var expiry = expiration.HasValue
            ? DateTime.UtcNow.Add(expiration.Value)
            : DateTime.UtcNow.AddHours(1);
        
        _cache[key] = (value!, expiry);
        return Task.CompletedTask;
    }

    public Task<bool> RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        var removed = _cache.TryRemove(key, out _);
        return Task.FromResult(removed);
    }

    public Task<TimeSpan?> GetTtlAsync(string key, CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(key, out var entry))
        {
            if (entry.Expiry > DateTime.UtcNow)
            {
                return Task.FromResult<TimeSpan?>(entry.Expiry - DateTime.UtcNow);
            }
            _cache.TryRemove(key, out _);
        }
        return Task.FromResult<TimeSpan?>(null);
    }

    public Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(key, out var entry))
        {
            if (entry.Expiry > DateTime.UtcNow)
            {
                return Task.FromResult(true);
            }
            _cache.TryRemove(key, out _);
        }
        return Task.FromResult(false);
    }

    public Task<bool> ExpireAsync(string key, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        var newExpiry = DateTime.UtcNow.Add(expiration);
        var updated = false;
        
        _cache.AddOrUpdate(
            key,
            // If key doesn't exist, don't add it (return sentinel that will be immediately removed)
            addValueFactory: _ => (new object(), DateTime.MinValue),
            updateValueFactory: (_, existing) =>
            {
                updated = true;
                return (existing.Value, newExpiry);
            });
        
        // If we added a new entry (key didn't exist), remove it
        if (!updated)
        {
            _cache.TryRemove(key, out _);
        }
        
        return Task.FromResult(updated);
    }
}
