using Stride.Services.Models.Gamification;

namespace Stride.Services.Interfaces;

public interface IAchievementService
{
    /// <summary>
    /// Get all achievements for a student (earned and locked)
    /// </summary>
    Task<List<AchievementDto>> GetAchievementsAsync(Guid studentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check and unlock achievements based on student milestones
    /// </summary>
    /// <returns>List of newly unlocked achievements</returns>
    Task<List<UnlockedAchievementResult>> CheckAndUnlockAsync(Guid studentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get specific achievement by code
    /// </summary>
    Task<AchievementDto?> GetAchievementByCodeAsync(string code, Guid? studentId = null, CancellationToken cancellationToken = default);
    
    // Admin CRUD methods
    Task<List<AchievementDto>> GetAllAchievementsAsync(CancellationToken cancellationToken = default);
    Task<AchievementDto> CreateAchievementAsync(CreateAchievementRequest request, CancellationToken cancellationToken = default);
    Task<AchievementDto> UpdateAchievementAsync(Guid id, UpdateAchievementRequest request, CancellationToken cancellationToken = default);
    Task DeleteAchievementAsync(Guid id, CancellationToken cancellationToken = default);
}
