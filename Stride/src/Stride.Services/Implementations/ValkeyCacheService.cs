using System.Text.Json;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using Stride.Services.Configuration;
using Stride.Services.Interfaces;

namespace Stride.Services.Implementations;

/// <summary>
/// Valkey cache service implementation
/// </summary>
public class ValkeyCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _database;
    private readonly ValkeyOptions _options;

    public ValkeyCacheService(IConnectionMultiplexer redis, IOptions<ValkeyOptions> options)
    {
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _database = _redis.GetDatabase();
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(key);

        var redisKey = GetKey(key);
        var value = await _database.StringGetAsync(redisKey);

        if (!value.HasValue)
        {
            return default;
        }

        return JsonSerializer.Deserialize<T>(value.ToString());
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(key);
        ArgumentNullException.ThrowIfNull(value);

        var redisKey = GetKey(key);
        var serializedValue = JsonSerializer.Serialize(value);
        var expirationTime = expiration ?? TimeSpan.FromMinutes(_options.DefaultExpirationMinutes);

        await _database.StringSetAsync(redisKey, serializedValue, expirationTime);
    }

    public async Task<bool> RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(key);

        var redisKey = GetKey(key);
        return await _database.KeyDeleteAsync(redisKey);
    }

    public async Task<TimeSpan?> GetTtlAsync(string key, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(key);

        var redisKey = GetKey(key);
        return await _database.KeyTimeToLiveAsync(redisKey);
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(key);

        var redisKey = GetKey(key);
        return await _database.KeyExistsAsync(redisKey);
    }

    public async Task<bool> ExpireAsync(string key, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(key);

        var redisKey = GetKey(key);
        return await _database.KeyExpireAsync(redisKey, expiration);
    }

    private string GetKey(string key)
    {
        return $"{_options.InstanceName}{key}";
    }
}
