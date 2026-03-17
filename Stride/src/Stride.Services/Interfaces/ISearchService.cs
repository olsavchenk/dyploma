using Stride.Services.Models;

namespace Stride.Services.Interfaces;

/// <summary>
/// Service for search operations using Meilisearch
/// </summary>
public interface ISearchService
{
    /// <summary>
    /// Indexes a document
    /// </summary>
    Task IndexAsync<T>(string indexName, T document, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Indexes multiple documents
    /// </summary>
    Task IndexManyAsync<T>(string indexName, IEnumerable<T> documents, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Searches documents
    /// </summary>
    Task<SearchResult<T>> SearchAsync<T>(string indexName, string query, SearchOptions? options = null, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Deletes a document from index
    /// </summary>
    Task DeleteAsync(string indexName, string documentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes multiple documents from index
    /// </summary>
    Task DeleteManyAsync(string indexName, IEnumerable<string> documentIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ensures an index exists with proper configuration
    /// </summary>
    Task EnsureIndexExistsAsync(string indexName, string primaryKey, IEnumerable<string>? searchableAttributes = null, CancellationToken cancellationToken = default);
}
