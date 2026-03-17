using Microsoft.AspNetCore.Http;
using Stride.Services.Models.User;

namespace Stride.Services.Interfaces;

public interface IUserService
{
    /// <summary>
    /// Get current user profile with role-specific stats
    /// </summary>
    Task<UserProfileDto> GetUserProfileAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update user profile
    /// </summary>
    Task<UserProfileDto> UpdateUserProfileAsync(Guid userId, UpdateUserProfileRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Upload user avatar to storage
    /// </summary>
    Task<string> UploadAvatarAsync(Guid userId, IFormFile file, CancellationToken cancellationToken = default);

    /// <summary>
    /// Export all user data (GDPR compliance)
    /// </summary>
    Task<UserDataExportDto> ExportUserDataAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft delete user account with data anonymization
    /// </summary>
    Task DeleteUserAccountAsync(Guid userId, CancellationToken cancellationToken = default);
}
