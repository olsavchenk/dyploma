using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Adaptive.Services.Interfaces;
using Stride.DataAccess.Repositories;
using Stride.DataAccess.Seeders;

namespace Stride.Adaptive.Api.Controllers;

[ApiController]
[Route("api/v1/pool-management")]
[Authorize(Policy = "AdminAccess")]
public class PoolManagementController : ControllerBase
{
    private readonly ITaskPoolService _taskPoolService;
    private readonly ITaskTemplateRepository _templateRepository;
    private readonly ITaskInstanceRepository _instanceRepository;
    private readonly TaskTemplateSeeder _templateSeeder;
    private readonly ILogger<PoolManagementController> _logger;

    public PoolManagementController(
        ITaskPoolService taskPoolService,
        ITaskTemplateRepository templateRepository,
        ITaskInstanceRepository instanceRepository,
        TaskTemplateSeeder templateSeeder,
        ILogger<PoolManagementController> logger)
    {
        _taskPoolService = taskPoolService;
        _templateRepository = templateRepository;
        _instanceRepository = instanceRepository;
        _templateSeeder = templateSeeder;
        _logger = logger;
    }

    /// <summary>
    /// Seed task templates to MongoDB (run once during setup)
    /// </summary>
    [HttpPost("seed-templates")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SeedTemplates()
    {
        _logger.LogInformation("Manual template seeding triggered");
        
        try
        {
            await _templateSeeder.SeedAsync();
            return Ok(new { message = "Templates seeded successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding templates");
            return StatusCode(500, new { message = "Failed to seed templates", error = ex.Message });
        }
    }

    /// <summary>
    /// Pre-fill pool for a specific topic and difficulty band
    /// </summary>
    [HttpPost("prefill-pool")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> PrefillPool(
        [FromQuery] Guid topicId,
        [FromQuery] int difficultyBand,
        CancellationToken cancellationToken = default)
    {
        if (difficultyBand < 1 || difficultyBand > 10)
        {
            return BadRequest(new { message = "Difficulty band must be between 1 and 10" });
        }

        _logger.LogInformation(
            "Manual pool prefill triggered - TopicId: {TopicId}, Band: {Band}",
            topicId, difficultyBand);

        try
        {
            var added = await _taskPoolService.RefillPoolAsync(topicId, difficultyBand, cancellationToken);
            
            return Ok(new 
            { 
                message = "Pool prefilled successfully",
                topicId = topicId,
                difficultyBand = difficultyBand,
                tasksAdded = added
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error prefilling pool");
            return StatusCode(500, new { message = "Failed to prefill pool", error = ex.Message });
        }
    }

    /// <summary>
    /// Check pool status for a specific topic and difficulty band
    /// </summary>
    [HttpGet("pool-status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPoolStatus(
        [FromQuery] Guid topicId,
        [FromQuery] int difficultyBand,
        CancellationToken cancellationToken = default)
    {
        if (difficultyBand < 1 || difficultyBand > 10)
        {
            return BadRequest(new { message = "Difficulty band must be between 1 and 10" });
        }

        try
        {
            var status = await _taskPoolService.GetPoolStatusAsync(topicId, difficultyBand, cancellationToken);
            
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pool status");
            return StatusCode(500, new { message = "Failed to get pool status", error = ex.Message });
        }
    }

    /// <summary>
    /// Check how many templates exist for a topic and difficulty band
    /// </summary>
    [HttpGet("template-count")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTemplateCount(
        [FromQuery] Guid topicId,
        [FromQuery] int? difficultyBand = null)
    {
        try
        {
            var templates = difficultyBand.HasValue
                ? await _templateRepository.GetApprovedByTopicAndBandAsync(topicId, difficultyBand.Value, 1000)
                : await _templateRepository.GetApprovedByTopicAsync(topicId);

            var templatesByBand = templates
                .GroupBy(t => t.DifficultyBand)
                .OrderBy(g => g.Key)
                .Select(g => new
                {
                    band = g.Key,
                    count = g.Count(),
                    types = g.GroupBy(t => t.TaskType).Select(tg => new { type = tg.Key, count = tg.Count() })
                })
                .ToList();

            return Ok(new
            {
                topicId = topicId,
                totalTemplates = templates.Count,
                byBand = templatesByBand
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting template count");
            return StatusCode(500, new { message = "Failed to get template count", error = ex.Message });
        }
    }

    /// <summary>
    /// Check how many task instances exist for a topic in MongoDB
    /// </summary>
    [HttpGet("instance-count")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInstanceCount(
        [FromQuery] Guid topicId,
        [FromQuery] int? minDifficulty = null,
        [FromQuery] int? maxDifficulty = null)
    {
        try
        {
            var min = minDifficulty ?? 1;
            var max = maxDifficulty ?? 100;

            var count = await _instanceRepository.GetPoolCountAsync(topicId, min, max);

            return Ok(new
            {
                topicId = topicId,
                minDifficulty = min,
                maxDifficulty = max,
                instanceCount = count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting instance count");
            return StatusCode(500, new { message = "Failed to get instance count", error = ex.Message });
        }
    }

    /// <summary>
    /// Initialize complete setup for a topic: seed templates and prefill all bands
    /// </summary>
    [HttpPost("initialize-topic")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> InitializeTopic(
        [FromQuery] Guid topicId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Initializing topic {TopicId}", topicId);

        try
        {
            // First, ensure templates are seeded
            await _templateSeeder.SeedAsync();

            // Check if templates exist for this topic
            var templates = await _templateRepository.GetApprovedByTopicAsync(topicId);
            if (templates.Count == 0)
            {
                return BadRequest(new 
                { 
                    message = "No templates found for this topic. Add templates first." 
                });
            }

            // Prefill pools for all bands that have templates
            var bands = templates.Select(t => t.DifficultyBand).Distinct().OrderBy(b => b).ToList();
            var results = new List<object>();

            foreach (var band in bands)
            {
                var added = await _taskPoolService.RefillPoolAsync(topicId, band, cancellationToken);
                results.Add(new
                {
                    band = band,
                    tasksAdded = added
                });
            }

            return Ok(new
            {
                message = "Topic initialized successfully",
                topicId = topicId,
                totalTemplates = templates.Count,
                bandsInitialized = bands.Count,
                bandResults = results
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing topic");
            return StatusCode(500, new { message = "Failed to initialize topic", error = ex.Message });
        }
    }
}
