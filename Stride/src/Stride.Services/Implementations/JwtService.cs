using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Stride.Core.Entities;
using Stride.Services.Configuration;
using Stride.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Stride.Services.Implementations;

public class JwtService : IJwtService
{
    private readonly JwtSettings _jwtSettings;
    private readonly TokenValidationParameters _tokenValidationParameters;
    private readonly ILogger<JwtService> _logger;

    public JwtService(IOptions<JwtSettings> jwtSettings, ILogger<JwtService> logger)
    {
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
        _tokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey)),
            ValidateIssuer = true,
            ValidIssuer = _jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = _jwtSettings.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    }

    public string GenerateAccessToken(User user)
    {
        _logger.LogDebug("Generating access token for UserId={UserId}, Role={Role}",
            user.Id, user.Role);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Add StudentProfileId claim if user has a student profile
        if (user.StudentProfile != null)
        {
            claims.Add(new Claim("StudentProfileId", user.StudentProfile.Id.ToString()));
        }

        // Add TeacherProfileId claim if user has a teacher profile
        if (user.TeacherProfile != null)
        {
            claims.Add(new Claim("TeacherProfileId", user.TeacherProfile.Id.ToString()));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        _logger.LogDebug("Generating refresh token");
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, _tokenValidationParameters, out var validatedToken);

            if (validatedToken is not JwtSecurityToken jwtToken ||
                !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                _logger.LogWarning("{Method}: Token validation failed - invalid algorithm",
                    nameof(ValidateToken));
                return null;
            }

            _logger.LogDebug("{Method}: Token validated successfully", nameof(ValidateToken));
            return principal;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "{Method}: Token validation failed", nameof(ValidateToken));
            return null;
        }
    }

    public Guid? GetUserIdFromToken(string token)
    {
        var principal = ValidateToken(token);
        var userIdClaim = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
