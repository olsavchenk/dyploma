using Stride.Core.Entities;
using System.Security.Claims;

namespace Stride.Services.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
    Guid? GetUserIdFromToken(string token);
}
