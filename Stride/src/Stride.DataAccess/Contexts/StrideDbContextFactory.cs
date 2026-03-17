using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Stride.DataAccess.Contexts;

public class StrideDbContextFactory : IDesignTimeDbContextFactory<StrideDbContext>
{
    public StrideDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<StrideDbContext>();

        // Use a default connection string for migrations
        // In production, this will be overridden by the actual configuration
        var connectionString = "Host=localhost;Port=5432;Database=stride_db;Username=stride_user;Password=dev_password";

        optionsBuilder.UseNpgsql(connectionString, b =>
        {
            b.MigrationsAssembly("Stride.DataAccess");
        });

        return new StrideDbContext(optionsBuilder.Options);
    }
}
