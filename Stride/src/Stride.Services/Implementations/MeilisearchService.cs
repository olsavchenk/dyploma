using Meilisearch;
using Microsoft.Extensions.Options;
using Stride.Services.Configuration;
using Stride.Services.Interfaces;
using Stride.Services.Models;

namespace Stride.Services.Implementations;

/// <summary>
/// Meilisearch service implementation
/// </summary>
public class MeilisearchService : ISearchService
{
    private readonly MeilisearchClient _client;
    private readonly MeilisearchOptions _options;

    public MeilisearchService(MeilisearchClient client, IOptions<MeilisearchOptions> options)
    {
        _client = client ?? throw new ArgumentNullException(nameof(client));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
    }

    public async Task IndexAsync<T>(string indexName, T document, CancellationToken cancellationToken = default) where T : class
    {
        ArgumentNullException.ThrowIfNull(indexName);
        ArgumentNullException.ThrowIfNull(document);

        var index = _client.Index(indexName);
        await index.AddDocumentsAsync(new[] { document }, cancellationToken: cancellationToken);
    }

    public async Task IndexManyAsync<T>(string indexName, IEnumerable<T> documents, CancellationToken cancellationToken = default) where T : class
    {
        ArgumentNullException.ThrowIfNull(indexName);
        ArgumentNullException.ThrowIfNull(documents);

        var index = _client.Index(indexName);
        await index.AddDocumentsAsync(documents, cancellationToken: cancellationToken);
    }

    public async Task<Models.SearchResult<T>> SearchAsync<T>(string indexName, string query, Models.SearchOptions? options = null, CancellationToken cancellationToken = default) where T : class
    {
        ArgumentNullException.ThrowIfNull(indexName);
        ArgumentNullException.ThrowIfNull(query);

        var index = _client.Index(indexName);
        
        var searchQuery = new SearchQuery
        {
            Q = query,
            Limit = options?.Limit ?? 20,
            Offset = options?.Offset ?? 0,
            AttributesToRetrieve = options?.AttributesToRetrieve,
            AttributesToHighlight = options?.AttributesToHighlight,
            Filter = options?.Filter != null ? string.Join(" AND ", options.Filter) : null
        };

        var searchable = await index.SearchAsync<T>(searchQuery.Q, searchQuery, cancellationToken);
        var result = searchable as Meilisearch.SearchResult<T>;

        return new Models.SearchResult<T>
        {
            Hits = searchable.Hits.ToList(),
            TotalHits = result?.EstimatedTotalHits ?? searchable.Hits.Count,
            ProcessingTimeMs = result?.ProcessingTimeMs ?? 0,
            Query = query
        };
    }

    public async Task DeleteAsync(string indexName, string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(indexName);
        ArgumentNullException.ThrowIfNull(documentId);

        var index = _client.Index(indexName);
        await index.DeleteOneDocumentAsync(documentId, cancellationToken);
    }

    public async Task DeleteManyAsync(string indexName, IEnumerable<string> documentIds, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(indexName);
        ArgumentNullException.ThrowIfNull(documentIds);

        var index = _client.Index(indexName);
        await index.DeleteDocumentsAsync(documentIds, cancellationToken);
    }

    public async Task EnsureIndexExistsAsync(string indexName, string primaryKey, IEnumerable<string>? searchableAttributes = null, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(indexName);
        ArgumentNullException.ThrowIfNull(primaryKey);

        try
        {
            await _client.GetIndexAsync(indexName, cancellationToken);
        }
        catch
        {
            await _client.CreateIndexAsync(indexName, primaryKey, cancellationToken);
            
            if (searchableAttributes != null)
            {
                var index = _client.Index(indexName);
                await index.UpdateSearchableAttributesAsync(searchableAttributes, cancellationToken);
            }
        }
    }
}
