using System.Net;
using System.Security.Claims;
using System.Text.Json;
using FluentValidation;

namespace Stride.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await LogExceptionWithContextAsync(context, ex);
            await HandleExceptionAsync(context, ex);
        }
    }

    /// <summary>
    /// Logs exception with comprehensive context for AI debugging.
    /// Includes: request details, user info, exception chain, and sanitized request body.
    /// </summary>
    private async Task LogExceptionWithContextAsync(HttpContext context, Exception exception)
    {
        // Extract user context
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value ?? "none";
        
        // Extract request context
        var method = context.Request.Method;
        var path = context.Request.Path.Value;
        var queryString = context.Request.QueryString.Value;
        var contentType = context.Request.ContentType;
        var correlationId = context.TraceIdentifier;

        // Build exception chain
        var exceptionChain = BuildExceptionChain(exception);

        // Get sanitized request body (for POST/PUT/PATCH)
        string? requestBody = null;
        if (HttpMethods.IsPost(method) || HttpMethods.IsPut(method) || HttpMethods.IsPatch(method))
        {
            requestBody = await GetSanitizedRequestBodyAsync(context);
        }

        // Determine exception type for better categorization
        var exceptionType = GetExceptionCategory(exception);

        _logger.LogError(exception,
            "Unhandled {ExceptionType}: {Message} | " +
            "Request: {Method} {Path}{QueryString} | " +
            "User: {UserId} ({Role}) | " +
            "ContentType: {ContentType} | " +
            "CorrelationId: {CorrelationId} | " +
            "ExceptionChain: {ExceptionChain} | " +
            "RequestBody: {RequestBody}",
            exceptionType,
            exception.Message,
            method,
            path,
            queryString ?? "",
            userId,
            userRole,
            contentType ?? "none",
            correlationId,
            exceptionChain,
            requestBody ?? "[empty]");
    }

    /// <summary>
    /// Builds a chain of exception types and messages for nested exceptions.
    /// </summary>
    private static string BuildExceptionChain(Exception exception)
    {
        var chain = new List<string>();
        var current = exception;
        var depth = 0;
        
        while (current != null && depth < 5)
        {
            chain.Add($"{current.GetType().Name}: {current.Message}");
            current = current.InnerException;
            depth++;
        }
        
        return string.Join(" -> ", chain);
    }

    /// <summary>
    /// Gets the request body with sensitive fields redacted.
    /// </summary>
    private static async Task<string?> GetSanitizedRequestBodyAsync(HttpContext context)
    {
        try
        {
            context.Request.EnableBuffering();
            context.Request.Body.Position = 0;
            
            using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;
            
            if (string.IsNullOrWhiteSpace(body) || body.Length > 4096)
            {
                return body.Length > 4096 ? $"[truncated: {body.Length} bytes]" : null;
            }
            
            // Redact sensitive fields
            return SanitizeRequestBody(body);
        }
        catch
        {
            return "[unable to read]";
        }
    }

    /// <summary>
    /// Redacts sensitive fields from JSON request body.
    /// </summary>
    private static string SanitizeRequestBody(string body)
    {
        var sensitivePatterns = new[]
        {
            ("\"password\"\\s*:\\s*\"[^\"]*\"", "\"password\":\"[REDACTED]\""),
            ("\"token\"\\s*:\\s*\"[^\"]*\"", "\"token\":\"[REDACTED]\""),
            ("\"refreshToken\"\\s*:\\s*\"[^\"]*\"", "\"refreshToken\":\"[REDACTED]\""),
            ("\"secret\"\\s*:\\s*\"[^\"]*\"", "\"secret\":\"[REDACTED]\""),
            ("\"credential\"\\s*:\\s*\"[^\"]*\"", "\"credential\":\"[REDACTED]\""),
            ("\"idToken\"\\s*:\\s*\"[^\"]*\"", "\"idToken\":\"[REDACTED]\""),
        };

        var sanitized = body;
        foreach (var (pattern, replacement) in sensitivePatterns)
        {
            sanitized = System.Text.RegularExpressions.Regex.Replace(
                sanitized, pattern, replacement, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }
        
        return sanitized;
    }

    /// <summary>
    /// Categorizes exception type for easier log filtering.
    /// </summary>
    private static string GetExceptionCategory(Exception exception) => exception switch
    {
        ValidationException => "ValidationError",
        UnauthorizedAccessException => "AuthError",
        KeyNotFoundException => "NotFoundError",
        ArgumentException => "ArgumentError",
        InvalidOperationException => "BusinessLogicError",
        TimeoutException => "TimeoutError",
        HttpRequestException => "ExternalServiceError",
        _ => "UnexpectedError"
    };

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";
        var includeDetails = _environment.IsDevelopment();

        var problemDetails = exception switch
        {
            ValidationException validationException => CreateValidationProblemDetails(context, validationException, includeDetails),
            UnauthorizedAccessException => CreateProblemDetails(
                context,
                HttpStatusCode.Unauthorized,
                "Unauthorized",
                "Authentication is required to access this resource.",
                includeDetails),
            KeyNotFoundException => CreateProblemDetails(
                context,
                HttpStatusCode.NotFound,
                "Not Found",
                "The requested resource was not found.",
                includeDetails),
            ArgumentException argumentException => CreateProblemDetails(
                context,
                HttpStatusCode.BadRequest,
                "Bad Request",
                argumentException.Message,
                includeDetails),
            InvalidOperationException invalidOperationException => CreateProblemDetails(
                context,
                HttpStatusCode.BadRequest,
                "Invalid Operation",
                invalidOperationException.Message,
                includeDetails),
            _ => CreateProblemDetails(
                context,
                HttpStatusCode.InternalServerError,
                "Internal Server Error",
                includeDetails ? exception.Message : "An unexpected error occurred.",
                includeDetails)
        };

        context.Response.StatusCode = problemDetails.Status ?? (int)HttpStatusCode.InternalServerError;

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = includeDetails,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, options));
    }

    private static ProblemDetailsResponse CreateProblemDetails(
        HttpContext context,
        HttpStatusCode statusCode,
        string title,
        string detail,
        bool includeDetails)
    {
        return new ProblemDetailsResponse
        {
            Type = $"https://httpstatuses.com/{(int)statusCode}",
            Title = title,
            Status = (int)statusCode,
            Detail = detail,
            Instance = context.Request.Path,
            TraceId = includeDetails ? context.TraceIdentifier : null
        };
    }

    private static ProblemDetailsResponse CreateValidationProblemDetails(
        HttpContext context,
        ValidationException validationException,
        bool includeDetails)
    {
        var errors = validationException.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => SanitizeValidationMessage(e.ErrorMessage, includeDetails)).ToArray());

        return new ValidationProblemDetailsResponse
        {
            Type = "https://httpstatuses.com/400",
            Title = "Validation Error",
            Status = (int)HttpStatusCode.BadRequest,
            Detail = "One or more validation errors occurred.",
            Instance = context.Request.Path,
            TraceId = includeDetails ? context.TraceIdentifier : null,
            Errors = errors
        };
    }

    /// <summary>
    /// Strips internal parser tokens (e.g. BytePositionInLine, LineNumber, Path) leaked by
    /// System.Text.Json deserialization errors when not in Development.
    /// </summary>
    private static string SanitizeValidationMessage(string message, bool includeDetails)
    {
        if (includeDetails || string.IsNullOrEmpty(message))
        {
            return message;
        }

        var leakingMarkers = new[] { "BytePositionInLine", "LineNumber", "Path:", "Path '$" };
        if (leakingMarkers.Any(m => message.Contains(m, StringComparison.OrdinalIgnoreCase)))
        {
            return "Invalid value.";
        }

        return message;
    }
}

public class ProblemDetailsResponse
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int? Status { get; set; }
    public string Detail { get; set; } = string.Empty;
    public string Instance { get; set; } = string.Empty;
    public string? TraceId { get; set; }
}

public class ValidationProblemDetailsResponse : ProblemDetailsResponse
{
    public Dictionary<string, string[]> Errors { get; set; } = new();
}
