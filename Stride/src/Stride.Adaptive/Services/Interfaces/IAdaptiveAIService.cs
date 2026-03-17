using Stride.Adaptive.Models.DTOs;

namespace Stride.Adaptive.Services.Interfaces;

/// <summary>
/// Orchestrates adaptive learning by coordinating task selection, difficulty adjustment, and performance tracking
/// </summary>
public interface IAdaptiveAIService
{
    /// <summary>
    /// Gets the next adaptive task for a student based on their current performance
    /// </summary>
    /// <param name="request">Request containing student ID and topic ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Next task with context</returns>
    Task<GetNextTaskResult> GetNextTaskAsync(
        GetNextTaskRequest request, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Processes a student's answer, updates performance, awards XP, and returns feedback
    /// </summary>
    /// <param name="request">Request containing answer details</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Processing result with updated performance and next difficulty</returns>
    Task<ProcessAnswerResult> ProcessAnswerAsync(
        ProcessAnswerRequest request, 
        CancellationToken cancellationToken = default);
}
