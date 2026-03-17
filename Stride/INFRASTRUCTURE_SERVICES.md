# Infrastructure Services

This document describes the caching, storage, and search services used in the Stride application.

## Services Overview

### 1. Valkey Cache Service
**Implementation:** `ValkeyCacheService` implements `ICacheService`

**Features:**
- Get/Set/Remove cached values
- TTL (Time To Live) management
- Key existence checking
- Generic type support with JSON serialization

**Configuration:** `appsettings.json`
```json
{
  "Valkey": {
    "ConnectionString": "localhost:6379",
    "DefaultExpirationMinutes": 60,
    "InstanceName": "Stride:"
  }
}
```

**Usage:**
```csharp
public class MyService
{
    private readonly ICacheService _cache;

    public async Task<User> GetUserAsync(string userId)
    {
        var cacheKey = $"user:{userId}";
        var user = await _cache.GetAsync<User>(cacheKey);
        
        if (user == null)
        {
            user = await _database.Users.FindAsync(userId);
            await _cache.SetAsync(cacheKey, user, TimeSpan.FromMinutes(30));
        }
        
        return user;
    }
}
```

### 2. MinIO Storage Service
**Implementation:** `MinIOStorageService` implements `IStorageService`

**Features:**
- Upload/download files
- Pre-signed URLs for temporary access
- Bucket management
- Object existence checking

**Configuration:** `appsettings.json`
```json
{
  "MinIO": {
    "Endpoint": "localhost:9000",
    "AccessKey": "minioadmin",
    "SecretKey": "minioadmin",
    "UseSSL": false,
    "Region": "us-east-1",
    "Buckets": {
      "Avatars": "avatars",
      "Assets": "assets"
    }
  }
}
```

**Usage:**
```csharp
public class AvatarService
{
    private readonly IStorageService _storage;
    private readonly MinIOOptions _options;

    public async Task<string> UploadAvatarAsync(Stream imageStream, string fileName)
    {
        var objectName = $"{Guid.NewGuid()}-{fileName}";
        await _storage.UploadAsync(
            _options.Buckets.Avatars,
            objectName,
            imageStream,
            "image/jpeg"
        );
        
        return objectName;
    }
    
    public async Task<string> GetAvatarUrlAsync(string objectName)
    {
        return await _storage.GetPresignedUrlAsync(
            _options.Buckets.Avatars,
            objectName,
            TimeSpan.FromHours(1)
        );
    }
}
```

### 3. Meilisearch Service
**Implementation:** `MeilisearchService` implements `ISearchService`

**Features:**
- Full-text search
- Document indexing (single and batch)
- Custom search options (filters, attributes, pagination)
- Index management

**Configuration:** `appsettings.json`
```json
{
  "Meilisearch": {
    "Url": "http://localhost:7700",
    "MasterKey": "masterKey",
    "Indexes": {
      "Subjects": "subjects",
      "Topics": "topics"
    }
  }
}
```

**Usage:**
```csharp
public class SubjectSearchService
{
    private readonly ISearchService _search;
    private readonly MeilisearchOptions _options;

    public async Task IndexSubjectAsync(Subject subject)
    {
        await _search.IndexAsync(_options.Indexes.Subjects, subject);
    }
    
    public async Task<SearchResult<Subject>> SearchSubjectsAsync(string query)
    {
        var result = await _search.SearchAsync<Subject>(
            _options.Indexes.Subjects,
            query,
            new SearchOptions
            {
                Limit = 20,
                AttributesToRetrieve = new[] { "id", "name", "description" }
            }
        );
        
        return result;
    }
}
```

## Health Checks

All services include health check implementations:

- **ValkeyHealthCheck** - Checks Valkey connectivity via PING
- **MinIOHealthCheck** - Verifies MinIO connection by listing buckets
- **MeilisearchHealthCheck** - Checks Meilisearch status endpoint

Access health checks via:
- `/health` - Overall health status
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

## Running Infrastructure Services

### Using Docker Compose

Start all infrastructure services:
```bash
docker-compose -f docker-compose.infrastructure.yml up -d
```

Stop services:
```bash
docker-compose -f docker-compose.infrastructure.yml down
```

Stop and remove volumes:
```bash
docker-compose -f docker-compose.infrastructure.yml down -v
```

### Service URLs

- **Valkey:** `localhost:6379`
- **MinIO API:** `http://localhost:9000`
- **MinIO Console:** `http://localhost:9001` (admin/minioadmin)
- **Meilisearch:** `http://localhost:7700`

## Initialization

The application automatically initializes infrastructure on startup:

1. **MongoDB Indexes** - Creates required indexes
2. **MinIO Buckets** - Creates `avatars` and `assets` buckets
3. **Meilisearch Indexes** - Creates `subjects` and `topics` indexes with searchable attributes

See `Program.cs` for initialization logic.

## Dependencies

### NuGet Packages (Stride.Services)
- `StackExchange.Redis` (2.8.16) - Valkey/Redis client
- `Minio` (6.0.3) - MinIO client
- `Meilisearch` (0.18.0) - Meilisearch client
- `Microsoft.Extensions.Options.ConfigurationExtensions` (10.0.0)
- `Microsoft.Extensions.Diagnostics.HealthChecks` (10.0.2)

### NuGet Packages (Stride.Api)
- `AspNetCore.HealthChecks.Redis` (9.0.0) - Redis health check

## Best Practices

1. **Caching**
   - Use appropriate TTL values based on data volatility
   - Cache expensive database queries and computations
   - Always check for cache misses and handle gracefully

2. **Storage**
   - Generate unique object names to avoid collisions
   - Use pre-signed URLs for client-side uploads/downloads
   - Set appropriate content types for proper browser handling

3. **Search**
   - Index documents asynchronously after database writes
   - Use filters to narrow down search results
   - Configure searchable attributes based on query patterns
   - Handle empty search results gracefully

4. **Error Handling**
   - All service methods use async/await pattern
   - Methods validate parameters with ArgumentNullException.ThrowIfNull
   - Health checks catch exceptions and report unhealthy status

## Testing

The services can be tested using the health check endpoints or by running integration tests with Testcontainers (configured in US-040).
