namespace Stride.Services.Models.Auth;

/// <summary>
/// Thrown by AuthService when a login attempt targets a locked account or when
/// per-account exponential backoff is in effect. Surfaces a Retry-After hint so the
/// API can return HTTP 423 with proper headers (CR-4 / CR-11).
/// </summary>
public class AccountLockedException : UnauthorizedAccessException
{
    public TimeSpan RetryAfter { get; }

    public AccountLockedException(string message, TimeSpan retryAfter) : base(message)
    {
        RetryAfter = retryAfter;
    }
}
