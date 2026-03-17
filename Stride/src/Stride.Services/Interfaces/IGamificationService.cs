using Stride.Services.Models.Gamification;

namespace Stride.Services.Interfaces;

public interface IGamificationService
{
    /// <summary>
    /// Awards XP to a student based on task difficulty, streak, and other factors
    /// </summary>
    /// <param name="studentId">The student ID</param>
    /// <param name="difficulty">Task difficulty (1-100)</param>
    /// <param name="isCorrect">Whether the answer was correct</param>
    /// <param name="isFirstTaskOfDay">Whether this is the first task of the day</param>
    /// <param name="consecutiveCorrectInSession">Number of consecutive correct answers in current session</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result containing XP earned, level changes, and new streak information</returns>
    Task<AwardXpResult> AwardXpAsync(
        Guid studentId,
        int difficulty,
        bool isCorrect,
        bool isFirstTaskOfDay = false,
        int consecutiveCorrectInSession = 0,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets gamification statistics for a student
    /// </summary>
    Task<GamificationStatsDto> GetStatsAsync(Guid studentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates the student's daily streak
    /// </summary>
    Task<StreakUpdateResult> UpdateStreakAsync(Guid studentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Purchases a streak freeze for the student
    /// </summary>
    Task PurchaseStreakFreezeAsync(Guid studentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Repairs a broken streak within the repair window
    /// </summary>
    Task RepairStreakAsync(Guid studentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculates the XP required for a given level
    /// </summary>
    int GetXpRequiredForLevel(int level);

    /// <summary>
    /// Calculates the current level from total XP
    /// </summary>
    int CalculateLevelFromXp(int totalXp);
}
