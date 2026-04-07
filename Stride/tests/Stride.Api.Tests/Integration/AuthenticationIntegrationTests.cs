using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Stride.DataAccess.Contexts;

namespace Stride.Api.Tests.Integration;

/// <summary>
/// Integration tests for authentication flow including registration, login, and token refresh.
/// US-040: Auth flow integration tests
/// </summary>
[Collection("Integration Tests")]
public class AuthenticationIntegrationTests : IClassFixture<IntegrationTestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly IntegrationTestWebApplicationFactory _factory;

    public AuthenticationIntegrationTests(IntegrationTestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var registerRequest = new
        {
            email = $"test{Guid.NewGuid()}@example.com",
            password = "SecureP@ssw0rd!",
            displayName = "Test User",
            gdprConsent = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadFromJsonAsync<RegisterResponse>();
        content.Should().NotBeNull();
        content!.AccessToken.Should().NotBeNullOrEmpty();
        content.User.Should().NotBeNull();
        content.User.Email.Should().Be(registerRequest.email);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsBadRequest()
    {
        // Arrange
        var email = $"duplicate{Guid.NewGuid()}@example.com";
        var registerRequest = new
        {
            email,
            password = "SecureP@ssw0rd!",
            displayName = "Test User",
            gdprConsent = true
        };

        // First registration
        await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        // Act - Try to register again with same email
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsTokens()
    {
        // Arrange - First register a user
        var email = $"login{Guid.NewGuid()}@example.com";
        var password = "SecureP@ssw0rd!";
        var registerRequest = new
        {
            email,
            password,
            displayName = "Test User",
            gdprConsent = true
        };
        await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        var loginRequest = new
        {
            email,
            password
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadFromJsonAsync<LoginResponse>();
        content.Should().NotBeNull();
        content!.AccessToken.Should().NotBeNullOrEmpty();
        content.User.Email.Should().Be(email);

        // Check for refresh token cookie
        response.Headers.TryGetValues("Set-Cookie", out var cookies);
        cookies.Should().Contain(c => c.Contains("refreshToken"));
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var loginRequest = new
        {
            email = "nonexistent@example.com",
            password = "WrongPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task FullAuthFlow_RegisterLoginSelectRole_CompletesSuccessfully()
    {
        // Arrange
        var email = $"fullflow{Guid.NewGuid()}@example.com";
        var password = "SecureP@ssw0rd!";

        // Step 1: Register
        var registerRequest = new
        {
            email,
            password,
            displayName = "Full Flow Test User",
            gdprConsent = true
        };
        var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var registerContent = await registerResponse.Content.ReadFromJsonAsync<RegisterResponse>();
        var accessToken = registerContent!.AccessToken;

        // Step 2: Select role as Student
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        var selectRoleRequest = new
        {
            role = "Student"
        };
        var selectRoleResponse = await _client.PostAsJsonAsync("/api/v1/auth/select-role", selectRoleRequest);

        // Assert
        selectRoleResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var selectRoleContent = await selectRoleResponse.Content.ReadFromJsonAsync<SelectRoleResponse>();
        selectRoleContent.Should().NotBeNull();
        selectRoleContent!.User.Role.Should().Be("Student");

        // Step 3: Verify student profile was created
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<StrideDbContext>();
        var user = await dbContext.Users.FindAsync(registerContent.User.Id);
        user.Should().NotBeNull();
        user!.Role.Should().Be("Student");
        
        var studentProfile = await EntityFrameworkQueryableExtensions
            .FirstOrDefaultAsync(dbContext.StudentProfiles, sp => sp.UserId == user.Id);
        studentProfile.Should().NotBeNull();
    }

    [Fact]
    public async Task Login_AfterMultipleFailedAttempts_LocksAccount()
    {
        // Arrange - Register a user
        var email = $"lockout{Guid.NewGuid()}@example.com";
        var password = "SecureP@ssw0rd!";
        var registerRequest = new
        {
            email,
            password,
            displayName = "Lockout Test",
            gdprConsent = true
        };
        await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        // Act - Make 5 failed login attempts
        for (int i = 0; i < 5; i++)
        {
            var loginRequest = new
            {
                email,
                password = "WrongPassword123!"
            };
            await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        }

        // Try with correct password after lockout
        var finalLoginRequest = new
        {
            email,
            password
        };
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", finalLoginRequest);

        // Assert - Should still be locked out
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Logout_WithValidToken_RevokeTokensSuccessfully()
    {
        // Arrange - Register and login
        var email = $"logout{Guid.NewGuid()}@example.com";
        var password = "SecureP@ssw0rd!";
        var registerRequest = new
        {
            email,
            password,
            displayName = "Logout Test",
            gdprConsent = true
        };
        var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        var registerContent = await registerResponse.Content.ReadFromJsonAsync<RegisterResponse>();

        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", registerContent!.AccessToken);

        // Act
        var logoutResponse = await _client.PostAsync("/api/v1/auth/logout", null);

        // Assert
        logoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify token is revoked by trying to use it
        var protectedResponse = await _client.GetAsync("/api/v1/users/me");
        protectedResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // DTOs for deserialization
    private class RegisterResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }

    private class LoginResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }

    private class SelectRoleResponse
    {
        public UserDto User { get; set; } = null!;
    }

    private class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
