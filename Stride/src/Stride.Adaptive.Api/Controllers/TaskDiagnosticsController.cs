using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stride.DataAccess.Contexts;
using Stride.DataAccess.Repositories;

namespace Stride.Adaptive.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminAccess")]
public class TaskDiagnosticsController : ControllerBase
{
    private readonly ITaskTemplateRepository _templateRepository;
    private readonly ITaskInstanceRepository _instanceRepository;
    private readonly StrideDbContext _dbContext;
    private readonly ILogger<TaskDiagnosticsController> _logger;

    public TaskDiagnosticsController(
        ITaskTemplateRepository templateRepository,
        ITaskInstanceRepository instanceRepository,
        StrideDbContext dbContext,
        ILogger<TaskDiagnosticsController> logger)
    {
        _templateRepository = templateRepository;
        _instanceRepository = instanceRepository;
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Get comprehensive diagnostics for task availability for a specific topic
    /// </summary>
    [HttpGet("topic/{topicId}")]
    public async Task<ActionResult<TaskAvailabilityDiagnostics>> GetTopicDiagnostics(Guid topicId)
    {
        _logger.LogInformation("Running diagnostics for TopicId: {TopicId}", topicId);

        var diagnostics = new TaskAvailabilityDiagnostics
        {
            TopicId = topicId,
            Timestamp = DateTime.UtcNow
        };

        try
        {
            // Check if topic exists
            var topic = await _dbContext.Topics
                .Include(t => t.Subject)
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (topic == null)
            {
                diagnostics.TopicExists = false;
                diagnostics.ErrorMessage = "Topic not found in database";
                return Ok(diagnostics);
            }

            diagnostics.TopicExists = true;
            diagnostics.TopicName = topic.Name;
            diagnostics.SubjectName = topic.Subject.Name;

            // Check templates by difficulty band
            diagnostics.TemplatesByBand = new Dictionary<int, int>();
            for (int band = 1; band <= 10; band++)
            {
                var templates = await _templateRepository.GetApprovedByTopicAndBandAsync(topicId, band, 1000);
                diagnostics.TemplatesByBand[band] = templates.Count;
            }

            diagnostics.TotalTemplates = diagnostics.TemplatesByBand.Values.Sum();

            // Check task instances by difficulty band
            diagnostics.InstancesByBand = new Dictionary<int, long>();
            for (int band = 1; band <= 10; band++)
            {
                var minDiff = (band - 1) * 10 + 1;
                var maxDiff = Math.Min(band * 10, 100);
                var count = await _instanceRepository.GetPoolCountAsync(topicId, minDiff, maxDiff);
                diagnostics.InstancesByBand[band] = count;
            }

            diagnostics.TotalInstances = diagnostics.InstancesByBand.Values.Sum();

            // Check student performance records
            var performanceCount = await _dbContext.StudentPerformances
                .Where(sp => sp.TopicId == topicId)
                .CountAsync();
            diagnostics.StudentPerformanceRecords = performanceCount;

            // Check task attempts
            var attemptCount = await _dbContext.TaskAttempts
                .Where(ta => ta.TopicId == topicId)
                .CountAsync();
            diagnostics.TaskAttempts = attemptCount;

            // Recommendations
            var recommendations = new List<string>();
            
            if (diagnostics.TotalTemplates == 0)
            {
                recommendations.Add("❌ CRITICAL: No task templates exist for this topic. Run seeder or add templates manually.");
            }
            else if (diagnostics.TotalTemplates < 10)
            {
                recommendations.Add($"⚠️ WARNING: Only {diagnostics.TotalTemplates} templates exist. Consider adding more for variety.");
            }

            if (diagnostics.TotalInstances == 0)
            {
                if (diagnostics.TotalTemplates > 0)
                {
                    recommendations.Add("⚠️ WARNING: Templates exist but no task instances. Pool needs initialization/refill.");
                }
            }
            else if (diagnostics.TotalInstances < 50)
            {
                recommendations.Add($"⚠️ INFO: Only {diagnostics.TotalInstances} task instances in pool. Consider refilling.");
            }

            // Check for imbalanced bands
            var emptyBands = diagnostics.TemplatesByBand.Where(kvp => kvp.Value == 0).Select(kvp => kvp.Key).ToList();
            if (emptyBands.Any())
            {
                recommendations.Add($"⚠️ WARNING: No templates in difficulty bands: {string.Join(", ", emptyBands)}");
            }

            diagnostics.Recommendations = recommendations;
            diagnostics.Status = diagnostics.TotalTemplates > 0 && diagnostics.TotalInstances > 0 
                ? "READY" 
                : diagnostics.TotalTemplates > 0 
                    ? "NEEDS_REFILL" 
                    : "NO_TEMPLATES";

            return Ok(diagnostics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running diagnostics for TopicId: {TopicId}", topicId);
            diagnostics.ErrorMessage = $"Error: {ex.Message}";
            diagnostics.Status = "ERROR";
            return Ok(diagnostics);
        }
    }

    /// <summary>
    /// Get list of all topics with their template and instance counts
    /// </summary>
    [HttpGet("topics/summary")]
    public async Task<ActionResult<List<TopicSummary>>> GetTopicsSummary()
    {
        _logger.LogInformation("Getting summary for all topics");

        try
        {
            var topics = await _dbContext.Topics
                .Include(t => t.Subject)
                .Where(t => t.IsActive)
                .OrderBy(t => t.Subject.Name)
                .ThenBy(t => t.SortOrder)
                .ToListAsync();

            var summaries = new List<TopicSummary>();

            foreach (var topic in topics)
            {
                var templates = await _templateRepository.GetApprovedByTopicAsync(topic.Id);
                var instances = await _instanceRepository.GetPoolCountAsync(topic.Id, 1, 100);

                summaries.Add(new TopicSummary
                {
                    TopicId = topic.Id,
                    TopicName = topic.Name,
                    SubjectName = topic.Subject.Name,
                    TemplateCount = templates.Count,
                    InstanceCount = instances,
                    Status = templates.Count > 0 && instances > 0 
                        ? "✅ READY" 
                        : templates.Count > 0 
                            ? "⚠️ NEEDS_REFILL" 
                            : "❌ NO_TEMPLATES"
                });
            }

            return Ok(summaries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting topics summary");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Trigger manual pool refill for a topic and difficulty band
    /// </summary>
    [HttpPost("refill/{topicId}/{difficultyBand}")]
    public async Task<ActionResult> RefillPool(Guid topicId, int difficultyBand)
    {
        if (difficultyBand < 1 || difficultyBand > 10)
        {
            return BadRequest("Difficulty band must be between 1 and 10");
        }

        _logger.LogInformation("Manual refill requested - TopicId: {TopicId}, Band: {Band}", topicId, difficultyBand);

        // Note: This would require injecting ITaskPoolService, which might create circular dependencies
        // For now, this is a placeholder that can be implemented later
        return Ok(new { message = "Refill endpoint - to be implemented" });
    }
}

public class TaskAvailabilityDiagnostics
{
    public Guid TopicId { get; set; }
    public bool TopicExists { get; set; }
    public string? TopicName { get; set; }
    public string? SubjectName { get; set; }
    public Dictionary<int, int> TemplatesByBand { get; set; } = new();
    public int TotalTemplates { get; set; }
    public Dictionary<int, long> InstancesByBand { get; set; } = new();
    public long TotalInstances { get; set; }
    public int StudentPerformanceRecords { get; set; }
    public int TaskAttempts { get; set; }
    public string Status { get; set; } = "UNKNOWN";
    public List<string> Recommendations { get; set; } = new();
    public DateTime Timestamp { get; set; }
    public string? ErrorMessage { get; set; }
}

public class TopicSummary
{
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public int TemplateCount { get; set; }
    public long InstanceCount { get; set; }
    public string Status { get; set; } = string.Empty;
}
