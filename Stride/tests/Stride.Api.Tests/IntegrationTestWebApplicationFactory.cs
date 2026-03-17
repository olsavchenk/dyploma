using DotNet.Testcontainers.Builders;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Stride.DataAccess.Contexts;
using Testcontainers.MongoDb;
using Testcontainers.PostgreSql;
using Testcontainers.Redis;

namespace Stride.Api.Tests;

/// <summary>
/// Custom WebApplicationFactory for integration tests with Testcontainers.
/// Provides PostgreSQL, MongoDB, and Valkey (Redis) containers for testing.
/// US-040: Integration test infrastructure with Testcontainers
/// </summary>
public class IntegrationTestWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgresContainer;
    private readonly MongoDbContainer _mongoContainer;
    private readonly RedisContainer _valkeyContainer;

    public IntegrationTestWebApplicationFactory()
    {
        _postgresContainer = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .WithDatabase("stride_test")
            .WithUsername("postgres")
            .WithPassword("testpassword")
            .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(5432))
            .Build();

        _mongoContainer = new MongoDbBuilder()
            .WithImage("mongo:7")
            .WithUsername("root")
            .WithPassword("testpassword")
            .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(27017))
            .Build();

        _valkeyContainer = new RedisBuilder()
            .WithImage("valkey/valkey:8-alpine")
            .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(6379))
            .Build();
    }

    public string PostgresConnectionString => _postgresContainer.GetConnectionString();
    public string MongoConnectionString => _mongoContainer.GetConnectionString();
    public string ValkeyConnectionString => _valkeyContainer.GetConnectionString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            // Remove existing database contexts
            services.RemoveAll(typeof(DbContextOptions<StrideDbContext>));
            services.RemoveAll<StrideDbContext>();

            // Add test database context with PostgreSQL container
            services.AddDbContext<StrideDbContext>(options =>
            {
                options.UseNpgsql(PostgresConnectionString);
            });

            // Override configuration for MongoDB
            services.Configure<MongoDbSettings>(options =>
            {
                options.ConnectionString = MongoConnectionString;
                options.DatabaseName = "stride_test";
            });

            // Override configuration for Valkey (Redis)
            services.Configure<CacheSettings>(options =>
            {
                options.ConnectionString = ValkeyConnectionString;
            });

            // Build service provider and ensure database is created
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var scopedServices = scope.ServiceProvider;
            var db = scopedServices.GetRequiredService<StrideDbContext>();
            db.Database.EnsureCreated();
        });

        builder.UseEnvironment("Testing");
    }

    public async Task InitializeAsync()
    {
        await _postgresContainer.StartAsync();
        await _mongoContainer.StartAsync();
        await _valkeyContainer.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _postgresContainer.DisposeAsync();
        await _mongoContainer.DisposeAsync();
        await _valkeyContainer.DisposeAsync();
    }

    // Helper classes for settings (if not already in Services project)
    public class MongoDbSettings
    {
        public string ConnectionString { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
    }

    public class CacheSettings
    {
        public string ConnectionString { get; set; } = string.Empty;
    }
}
