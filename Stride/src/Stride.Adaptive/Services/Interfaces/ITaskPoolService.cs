using Stride.Adaptive.Models.DTOs;
using Stride.Core.Documents;

namespace Stride.Adaptive.Services.Interfaces;

/// <summary>
/// Service for managing task pools in Valkey cache
/// </summary>
public interface ITaskPoolService
{
    /// <summary>
    /// Gets a task from the pool for a specific topic and difficulty band
    /// </summary>
    /// <param name="topicId">The topic ID</param>
    /// <param name="targetDifficulty">Target difficulty (1-100)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task instance or null if pool is empty</returns>
    Task<TaskInstanceDocument?> GetTaskAsync(
        Guid topicId, 
        int targetDifficulty, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Refills the task pool for a specific topic and difficulty band
    /// </summary>
    /// <param name="topicId">The topic ID</param>
    /// <param name="difficultyBand">Difficulty band (1-10)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Number of tasks added to the pool</returns>
    Task<int> RefillPoolAsync(
        Guid topicId, 
        int difficultyBand, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the current status of the pool for a topic and difficulty band
    /// </summary>
    /// <param name="topicId">The topic ID</param>
    /// <param name="difficultyBand">Difficulty band (1-10)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Pool status information</returns>
    Task<TaskPoolStatus> GetPoolStatusAsync(
        Guid topicId, 
        int difficultyBand, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks all pools and returns those that need refilling
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of pools that need refilling</returns>
    Task<List<TaskPoolStatus>> GetPoolsNeedingRefillAsync(
        CancellationToken cancellationToken = default);
}
