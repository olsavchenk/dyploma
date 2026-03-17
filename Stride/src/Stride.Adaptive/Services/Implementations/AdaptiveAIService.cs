using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Stride.Adaptive.Models;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Services.Interfaces;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;
using Stride.DataAccess.Repositories;
using Stride.Services.Interfaces;

namespace Stride.Adaptive.Services.Implementations;

/// <summary>
/// Orchestrates adaptive learning by coordinating task selection, difficulty adjustment, and performance tracking
/// </summary>
public class AdaptiveAIService : IAdaptiveAIService
{
    private readonly ITaskPoolService _taskPoolService;
    private readonly IDifficultyEngine _difficultyEngine;
    private readonly ITaskInstanceRepository _instanceRepository;
    private readonly IGamificationService _gamificationService;
    private readonly StrideDbContext _context;
    private readonly ILogger<AdaptiveAIService> _logger;

    public AdaptiveAIService(
        ITaskPoolService taskPoolService,
        IDifficultyEngine difficultyEngine,
        ITaskInstanceRepository instanceRepository,
        IGamificationService gamificationService,
        StrideDbContext context,
        ILogger<AdaptiveAIService> logger)
    {
        _taskPoolService = taskPoolService;
        _difficultyEngine = difficultyEngine;
        _instanceRepository = instanceRepository;
        _gamificationService = gamificationService;
        _context = context;
        _logger = logger;
    }

    public async Task<GetNextTaskResult> GetNextTaskAsync(
        GetNextTaskRequest request, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "=== GetNextTaskAsync STARTED === StudentId: {StudentId}, TopicId: {TopicId}",
            request.StudentId, request.TopicId);

        try
        {
            // Get or create student performance for this topic
            _logger.LogDebug(
                "Fetching or creating performance record for StudentId: {StudentId}, TopicId: {TopicId}",
                request.StudentId, request.TopicId);

            var performance = await GetOrCreatePerformanceAsync(
                request.StudentId, 
                request.TopicId, 
                cancellationToken);

            _logger.LogInformation(
                "Performance record retrieved - CurrentDifficulty: {CurrentDifficulty}, RollingAccuracy: {RollingAccuracy:F2}, TopicMastery: {TopicMastery:F2}, TotalAttempted: {TotalAttempted}, Streak: {CurrentStreak} ({StreakDirection})",
                performance.CurrentDifficulty, performance.RollingAccuracy, performance.TopicMastery,
                performance.TotalAttempted, performance.CurrentStreak, performance.StreakDirection);

            // Get last attempt for context
            _logger.LogDebug("Fetching last attempt for context...");
            var lastAttempt = await _context.TaskAttempts
                .Where(ta => ta.StudentId == request.StudentId && ta.TopicId == request.TopicId)
                .OrderByDescending(ta => ta.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (lastAttempt != null)
            {
                _logger.LogInformation(
                    "Last attempt found - TaskInstanceId: {TaskInstanceId}, IsCorrect: {IsCorrect}, DifficultyAtTime: {DifficultyAtTime}, ResponseTimeMs: {ResponseTimeMs}, CreatedAt: {CreatedAt}",
                    lastAttempt.TaskInstanceId, lastAttempt.IsCorrect, lastAttempt.DifficultyAtTime,
                    lastAttempt.ResponseTimeMs, lastAttempt.CreatedAt);
            }
            else
            {
                _logger.LogInformation("No previous attempts found for this student and topic");
            }

            // Calculate target difficulty using the difficulty engine
            _logger.LogDebug("Calculating target difficulty using difficulty engine...");
            var prediction = _difficultyEngine.CalculateNextDifficulty(performance, lastAttempt);
            var targetDifficulty = prediction.NextDifficulty;

            _logger.LogInformation(
                "Difficulty calculation complete - TargetDifficulty: {Difficulty}, Confidence: {Confidence:F2}, Method: {Method}",
                targetDifficulty, prediction.Confidence, prediction.Method);

            // Get task from pool
            _logger.LogInformation(
                "Requesting task from TaskPoolService - TopicId: {TopicId}, TargetDifficulty: {TargetDifficulty}",
                request.TopicId, targetDifficulty);

            var taskInstance = await _taskPoolService.GetTaskAsync(
                request.TopicId, 
                targetDifficulty, 
                cancellationToken);

            if (taskInstance == null)
            {
                _logger.LogError(
                    "❌ TASK RETRIEVAL FAILED - No task returned from TaskPoolService. StudentId: {StudentId}, TopicId: {TopicId}, TargetDifficulty: {Difficulty}",
                    request.StudentId, request.TopicId, targetDifficulty);
                
                throw new InvalidOperationException(
                    $"No tasks available for topic {request.TopicId} at difficulty {targetDifficulty}");
            }

            _logger.LogInformation(
                "✅ Task retrieved successfully - TaskInstanceId: {TaskInstanceId}, Difficulty: {Difficulty}, TemplateId: {TemplateId}",
                taskInstance.Id, taskInstance.Difficulty, taskInstance.TemplateId);

            _logger.LogInformation(
                "=== GetNextTaskAsync COMPLETED === StudentId: {StudentId}, TopicId: {TopicId}, TaskId: {TaskId}",
                request.StudentId, request.TopicId, taskInstance.Id);

            return new GetNextTaskResult
            {
                TaskInstance = taskInstance,
                TargetDifficulty = targetDifficulty,
                CurrentPerformance = MapToDto(performance)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "❌ ERROR in GetNextTaskAsync - StudentId: {StudentId}, TopicId: {TopicId}. Exception: {ExceptionType}: {Message}",
                request.StudentId, request.TopicId, ex.GetType().Name, ex.Message);
            throw;
        }
    }

    public async Task<ProcessAnswerResult> ProcessAnswerAsync(
        ProcessAnswerRequest request, 
        CancellationToken cancellationToken = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        
        try
        {
            // Get or create performance record
            var performance = await GetOrCreatePerformanceAsync(
                request.StudentId, 
                request.TopicId, 
                cancellationToken);

            // Get the task instance to determine difficulty
            var taskInstance = await _instanceRepository.GetByIdAsync(request.TaskInstanceId);
            var difficultyAtTime = taskInstance?.Difficulty ?? performance.CurrentDifficulty;

            // Check if this is the first task of the day
            var student = await _context.StudentProfiles
                .FirstOrDefaultAsync(s => s.Id == request.StudentId, cancellationToken);

            if (student == null)
            {
                throw new InvalidOperationException($"Student profile {request.StudentId} not found");
            }

            var isFirstTaskOfDay = !student.LastActiveDate.HasValue || 
                                  student.LastActiveDate.Value.Date < DateTime.UtcNow.Date;

            // Count consecutive correct answers in today's session for perfect lesson bonus
            var todayStart = DateTime.UtcNow.Date;
            var recentAttempts = await _context.TaskAttempts
                .Where(ta => ta.StudentId == request.StudentId && ta.CreatedAt >= todayStart)
                .OrderByDescending(ta => ta.CreatedAt)
                .Take(20)
                .ToListAsync(cancellationToken);

            var consecutiveCorrect = 0;
            foreach (var recentAttempt in recentAttempts)
            {
                if (recentAttempt.IsCorrect)
                    consecutiveCorrect++;
                else
                    break;
            }

            // Update daily streak only when the answer is correct
            if (request.IsCorrect)
            {
                await _gamificationService.UpdateStreakAsync(
                    student.UserId,
                    cancellationToken);
            }

            // Award XP using gamification service (includes all bonuses)
            var xpResult = await _gamificationService.AwardXpAsync(
                student.UserId,
                difficultyAtTime,
                request.IsCorrect,
                isFirstTaskOfDay,
                consecutiveCorrect,
                cancellationToken);

            // Create task attempt record
            var attempt = new TaskAttempt
            {
                Id = Guid.NewGuid(),
                StudentId = request.StudentId,
                TaskInstanceId = request.TaskInstanceId,
                TopicId = request.TopicId,
                IsCorrect = request.IsCorrect,
                ResponseTimeMs = request.ResponseTimeMs,
                DifficultyAtTime = difficultyAtTime,
                XpEarned = xpResult.XpEarned,
                CreatedAt = DateTime.UtcNow
            };

            _context.TaskAttempts.Add(attempt);

            // Update performance metrics (topic-level)
            UpdatePerformanceMetrics(performance, request.IsCorrect);

            // Calculate next difficulty using the difficulty engine
            var prediction = _difficultyEngine.CalculateNextDifficulty(performance, attempt);
            performance.CurrentDifficulty = prediction.NextDifficulty;
            performance.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Processed answer for student {StudentId}, topic {TopicId}. Correct: {IsCorrect}, XP: {XP}, Streak: {Streak}, Next Difficulty: {Difficulty}",
                request.StudentId, request.TopicId, request.IsCorrect, xpResult.XpEarned, 
                performance.CurrentStreak, prediction.NextDifficulty);

            return new ProcessAnswerResult
            {
                UpdatedPerformance = MapToDto(performance),
                NextDifficulty = prediction.NextDifficulty,
                XpEarned = xpResult.XpEarned,
                Confidence = prediction.Confidence,
                PredictionMethod = prediction.Method
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, 
                "Error processing answer for student {StudentId}, topic {TopicId}",
                request.StudentId, request.TopicId);
            throw;
        }
    }

    private async Task<StudentPerformance> GetOrCreatePerformanceAsync(
        Guid studentId, 
        Guid topicId, 
        CancellationToken cancellationToken)
    {
        _logger.LogDebug(
            "Querying performance record - StudentId: {StudentId}, TopicId: {TopicId}",
            studentId, topicId);

        var performance = await _context.StudentPerformances
            .FirstOrDefaultAsync(
                sp => sp.StudentId == studentId && sp.TopicId == topicId, 
                cancellationToken);

        if (performance == null)
        {
            _logger.LogInformation(
                "🆕 Creating NEW performance record - StudentId: {StudentId}, TopicId: {TopicId}, InitialDifficulty: 50",
                studentId, topicId);

            performance = new StudentPerformance
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                TopicId = topicId,
                CurrentDifficulty = 50,
                RollingAccuracy = 0,
                CurrentStreak = 0,
                StreakDirection = "neutral",
                TopicMastery = 0,
                TotalAttempted = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.StudentPerformances.Add(performance);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "✅ Performance record created successfully - PerformanceId: {PerformanceId}",
                performance.Id);
        }
        else
        {
            _logger.LogDebug(
                "Existing performance record found - PerformanceId: {PerformanceId}, CreatedAt: {CreatedAt}",
                performance.Id, performance.CreatedAt);
        }

        return performance;
    }

    private void UpdatePerformanceMetrics(StudentPerformance performance, bool isCorrect)
    {
        // Update total attempted
        performance.TotalAttempted++;

        // Update rolling accuracy (exponential moving average with alpha = 0.2)
        var alpha = 0.2m;
        var currentValue = isCorrect ? 1.0m : 0.0m;
        
        if (performance.TotalAttempted == 1)
        {
            performance.RollingAccuracy = currentValue;
        }
        else
        {
            performance.RollingAccuracy = 
                alpha * currentValue + (1 - alpha) * performance.RollingAccuracy;
        }

        // Update streak
        if (isCorrect)
        {
            if (performance.StreakDirection == "winning")
            {
                performance.CurrentStreak++;
            }
            else
            {
                performance.CurrentStreak = 1;
                performance.StreakDirection = "winning";
            }
        }
        else
        {
            if (performance.StreakDirection == "losing")
            {
                performance.CurrentStreak++;
            }
            else
            {
                performance.CurrentStreak = 1;
                performance.StreakDirection = "losing";
            }
        }

        // Update topic mastery (based on accuracy and consistency)
        performance.TopicMastery = CalculateTopicMastery(
            performance.RollingAccuracy, 
            performance.TotalAttempted,
            performance.CurrentDifficulty);

        // Update last active
        performance.LastActiveAt = DateTime.UtcNow;
    }

    private decimal CalculateTopicMastery(decimal accuracy, int totalAttempts, int difficulty)
    {
        // Mastery considers accuracy, consistency (attempts), and difficulty level
        var accuracyWeight = 0.5m;
        var difficultyWeight = 0.3m;
        var consistencyWeight = 0.2m;

        // Normalize difficulty to 0-1 scale
        var normalizedDifficulty = difficulty / 100m;

        // Consistency increases logarithmically with attempts (caps at ~50 attempts)
        var consistencyScore = Math.Min(1.0m, (decimal)Math.Log10(totalAttempts + 1) / 2);

        var mastery = 
            accuracyWeight * accuracy +
            difficultyWeight * normalizedDifficulty +
            consistencyWeight * consistencyScore;

        return Math.Max(0, Math.Min(1, mastery));
    }



    private StudentPerformanceDto MapToDto(StudentPerformance performance)
    {
        return new StudentPerformanceDto
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
        };
    }
}
