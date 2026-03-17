using Stride.Services.Models.Leaderboard;

namespace Stride.Services.Interfaces;

/// <summary>
/// Service for managing leaderboard functionality with real-time updates
/// </summary>
public interface ILeaderboardService
{
    /// <summary>
    /// Gets a preview of the leaderboard (top 5 + current user) for the student's current league
    /// </summary>
    /// <param name="userId">Current user ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Preview with top entries and current user position</returns>
    Task<LeaderboardPreviewResponse> GetLeaderboardPreviewAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the leaderboard for a specific league
    /// </summary>
    /// <param name="studentId">Current student ID</param>
    /// <param name="league">League name (Bronze, Silver, Gold, Platinum, Diamond)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Leaderboard response with top players and current user position</returns>
    Task<GetLeaderboardResponse> GetLeaderboardAsync(
        Guid studentId,
        string league,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates a student's weekly XP in the leaderboard
    /// </summary>
    /// <param name="studentId">Student ID</param>
    /// <param name="xpToAdd">XP amount to add</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task UpdateWeeklyXpAsync(
        Guid studentId,
        int xpToAdd,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Performs weekly promotion and demotion for all leagues
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result containing promotion and demotion counts</returns>
    Task<PromotionDemotionResult> ProcessWeeklyPromotionsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Archives current week's leaderboard data to PostgreSQL and resets cache
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    Task ArchiveAndResetWeekAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the current week number and year
    /// </summary>
    /// <returns>Tuple of (weekNumber, year)</returns>
    (int weekNumber, int year) GetCurrentWeek();

    /// <summary>
    /// Initializes a student in the leaderboard for the current week
    /// </summary>
    /// <param name="studentId">Student ID</param>
    /// <param name="league">Student's league</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task InitializeStudentInLeaderboardAsync(
        Guid studentId,
        string league,
        CancellationToken cancellationToken = default);
}
