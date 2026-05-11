using Microsoft.EntityFrameworkCore;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;

namespace Stride.DataAccess.Seeders;

/// <summary>
/// Seeds a default administrator account for Development/Staging environments.
/// Bug fix: M-30 — Admin user not seeded.
/// Skipped in Production for security.
/// </summary>
public class AdminUserSeeder
{
    public const string DefaultAdminEmail = "admin@stride.local";
    public const string DefaultAdminPassword = "Admin1234!";

    private readonly StrideDbContext _dbContext;

    public AdminUserSeeder(StrideDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Returns true if an admin was created (so the caller can log credentials once).
    /// Returns false when an Admin already exists.
    /// </summary>
    public async Task<bool> SeedAsync()
    {
        // Skip if any Admin already exists (covers both seeded and self-registered admins).
        var anyAdmin = await _dbContext.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Role == "Admin");

        if (anyAdmin)
        {
            return false;
        }

        var now = DateTime.UtcNow;

        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Email = DefaultAdminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(DefaultAdminPassword),
            DisplayName = "Stride Admin",
            Role = "Admin",
            GdprConsent = true,
            CreatedAt = now
        };

        await _dbContext.Users.AddAsync(adminUser);
        await _dbContext.SaveChangesAsync();

        return true;
    }
}
