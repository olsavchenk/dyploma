using Microsoft.AspNetCore.Mvc;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;

    public HealthController(ILogger<HealthController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Basic ping endpoint to test API availability
    /// </summary>
    [HttpGet("ping")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Ping()
    {
        _logger.LogInformation("Ping endpoint called");
        return Ok(new
        {
            message = "pong",
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Test endpoint to demonstrate error handling
    /// </summary>
    [HttpGet("error")]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public IActionResult ThrowError()
    {
        _logger.LogWarning("Error test endpoint called");
        throw new InvalidOperationException("This is a test error to demonstrate RFC 7807 error handling");
    }

    /// <summary>
    /// Test endpoint to demonstrate validation error
    /// </summary>
    [HttpGet("validation-error")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult ThrowValidationError()
    {
        _logger.LogWarning("Validation error test endpoint called");
        throw new ArgumentException("This is a test validation error");
    }

    /// <summary>
    /// Test endpoint to demonstrate not found error
    /// </summary>
    [HttpGet("not-found")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult ThrowNotFound()
    {
        _logger.LogWarning("Not found test endpoint called");
        throw new KeyNotFoundException("The requested resource was not found");
    }

    /// <summary>
    /// Get correlation ID from current request
    /// </summary>
    [HttpGet("correlation-id")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetCorrelationId()
    {
        var correlationId = HttpContext.TraceIdentifier;
        _logger.LogInformation("Correlation ID: {CorrelationId}", correlationId);
        
        return Ok(new
        {
            correlationId,
            headers = Response.Headers.ToDictionary(h => h.Key, h => h.Value.ToString())
        });
    }
}
