using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Class;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/task-generation")]
[Authorize(Policy = "TeacherAccess")]
public class TaskGenerationController : ControllerBase
{
    private readonly ITaskGenerationService _taskGenerationService;
    private readonly ILogger<TaskGenerationController> _logger;

    public TaskGenerationController(
        ITaskGenerationService taskGenerationService,
        ILogger<TaskGenerationController> logger)
    {
        _taskGenerationService = taskGenerationService;
        _logger = logger;
    }

    /// <summary>
    /// Poll task generation job status
    /// </summary>
    [HttpGet("{jobId:guid}/status")]
    [ProducesResponseType(typeof(TaskGenerationStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGenerationStatus(Guid jobId)
    {
        try
        {
            var status = await _taskGenerationService.GetGenerationStatusAsync(jobId);
            return Ok(status);
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = $"Generation job {jobId} not found" });
        }
    }
}
