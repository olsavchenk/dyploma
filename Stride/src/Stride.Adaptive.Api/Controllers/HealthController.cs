using Microsoft.AspNetCore.Mvc;

namespace Stride.Adaptive.Api.Controllers;

[ApiController]
[Route("api/v1/adaptive")]
public class HealthController : ControllerBase
{
    [HttpGet("health")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", service = "adaptive-api", timestamp = DateTime.UtcNow });
    }
}
