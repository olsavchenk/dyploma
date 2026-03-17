using Stride.Core.Documents;

namespace Stride.DataAccess.Repositories;

public interface ITaskInstanceRepository
{
    /// <summary>
    /// Gets a task instance by ID
    /// </summary>
    Task<TaskInstanceDocument?> GetByIdAsync(string id);

    /// <summary>
    /// Gets random task instances for a topic within a difficulty range
    /// </summary>
    Task<List<TaskInstanceDocument>> GetRandomByTopicAndDifficultyAsync(
        Guid topicId, 
        int minDifficulty, 
        int maxDifficulty, 
        int count);

    /// <summary>
    /// Creates a new task instance
    /// </summary>
    Task<string> CreateAsync(TaskInstanceDocument instance);

    /// <summary>
    /// Bulk creates task instances
    /// </summary>
    Task BulkCreateAsync(IEnumerable<TaskInstanceDocument> instances);

    /// <summary>
    /// Deletes a task instance
    /// </summary>
    Task<bool> DeleteAsync(string id);

    /// <summary>
    /// Deletes expired task instances
    /// </summary>
    Task<long> DeleteExpiredAsync();

    /// <summary>
    /// Gets count of instances in the pool for a topic and difficulty range
    /// </summary>
    Task<long> GetPoolCountAsync(Guid topicId, int minDifficulty, int maxDifficulty);

    /// <summary>
    /// Deletes instances older than specified date for a topic
    /// </summary>
    Task<long> DeleteOldInstancesAsync(Guid topicId, DateTime olderThan);
}
