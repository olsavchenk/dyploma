using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Services.Interfaces;
using Stride.DataAccess.Contexts;
using System.Security.Claims;

namespace Stride.Adaptive.Api.Controllers;

[ApiController]
[Route("api/v1/adaptive")]
[Authorize]
public class DifficultyController : ControllerBase
{
    private readonly IStudentPerformanceService _performanceService;
    private readonly IDifficultyEngine _difficultyEngine;
    private readonly StrideDbContext _dbContext;
    private readonly ILogger<DifficultyController> _logger;

    public DifficultyController(
        IStudentPerformanceService performanceService,
        IDifficultyEngine difficultyEngine,
        StrideDbContext dbContext,
        ILogger<DifficultyController> logger)
    {
        _performanceService = performanceService;
        _difficultyEngine = difficultyEngine;
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Predict next difficulty for a student-topic pair
    /// </summary>
    [HttpPost("predict")]
    [ProducesResponseType(typeof(PredictDifficultyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> PredictDifficulty([FromBody] PredictDifficultyRequest request)
    {
        if (!IsAuthorizedForStudent(request.StudentId))
        {
            return Forbid();
        }

        var performance = await _performanceService.GetOrCreatePerformanceAsync(
            request.StudentId, 
            request.TopicId);

        var lastAttempt = await GetLastAttemptAsync(request.StudentId, request.TopicId);

        var prediction = _difficultyEngine.PredictNextDifficulty(performance, lastAttempt);

        var response = new PredictDifficultyResponse
        {
            NextDifficulty = prediction.NextDifficulty,
            Confidence = prediction.Confidence,
            Method = prediction.Method,
            Performance = await MapPerformanceToDtoAsync(performance)
        };

        return Ok(response);
    }

    /// <summary>
    /// Process a student's answer and update difficulty
    /// </summary>
    [HttpPost("process-answer")]
    [ProducesResponseType(typeof(ProcessAnswerResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ProcessAnswer([FromBody] ProcessAnswerRequest request)
    {
        if (!IsAuthorizedForStudent(request.StudentId))
        {
            return Forbid();
        }

        var result = await _performanceService.ProcessAnswerAsync(request);

        return Ok(result);
    }

    private bool IsAuthorizedForStudent(Guid studentId)
    {
        // Check if user is the student themselves
        var currentStudentId = User.FindFirst("StudentProfileId")?.Value 
            ?? User.FindFirst("StudentId")?.Value;
        if (Guid.TryParse(currentStudentId, out var id) && id == studentId)
        {
            return true;
        }

        // Check if user is admin or teacher (teachers may submit on behalf during guided sessions)
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        return role is "Admin" or "Teacher";
    }

    private async Task<Core.Entities.TaskAttempt?> GetLastAttemptAsync(Guid studentId, Guid topicId)
    {
        return await _dbContext.TaskAttempts
            .Where(ta => ta.StudentId == studentId && ta.TopicId == topicId)
            .OrderByDescending(ta => ta.CreatedAt)
            .FirstOrDefaultAsync();
    }

    private async Task<StudentPerformanceDto> MapPerformanceToDtoAsync(Core.Entities.StudentPerformance performance)
    {
        return await Task.FromResult(new StudentPerformanceDto
        {
            Id = performance.Id,
            StudentId = performance.StudentId,
            TopicId = performance.TopicId,
            CurrentDifficulty = performance.CurrentDifficulty,
            RollingAccuracy = performance.RollingAccuracy,
            CurrentStreak = performance.CurrentStreak,
            StreakDirection = performance.StreakDirection,
            TopicMastery = performance.TopicMastery,
            TotalAttempted = performance.TotalAttempted,
            LastActiveAt = performance.LastActiveAt,
            CreatedAt = performance.CreatedAt,
            UpdatedAt = performance.UpdatedAt
        });
    }
}
