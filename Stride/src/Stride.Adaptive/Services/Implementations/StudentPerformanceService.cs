using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Services.Interfaces;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;

namespace Stride.Adaptive.Services.Implementations;

public class StudentPerformanceService : IStudentPerformanceService
{
    private readonly StrideDbContext _dbContext;
    private readonly IDifficultyEngine _difficultyEngine;
    private readonly DifficultyEngineSettings _settings;
    private readonly ILogger<StudentPerformanceService> _logger;

    public StudentPerformanceService(
        StrideDbContext dbContext,
        IDifficultyEngine difficultyEngine,
        IOptions<DifficultyEngineSettings> settings,
        ILogger<StudentPerformanceService> logger)
    {
        _dbContext = dbContext;
        _difficultyEngine = difficultyEngine;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<StudentPerformanceDto?> GetPerformanceAsync(Guid studentId, Guid topicId)
    {
        var performance = await _dbContext.StudentPerformances
            .AsNoTracking()
            .FirstOrDefaultAsync(sp => sp.StudentId == studentId && sp.TopicId == topicId);

        return performance != null ? MapToDto(performance) : null;
    }

    public async Task<List<StudentPerformanceDto>> GetAllPerformancesAsync(Guid studentId)
    {
        var performances = await _dbContext.StudentPerformances
            .Where(sp => sp.StudentId == studentId)
            .AsNoTracking()
            .ToListAsync();

        return performances.Select(MapToDto).ToList();
    }

    public async Task<ProcessAnswerResult> ProcessAnswerAsync(ProcessAnswerRequest request)
    {
        // Get or create performance record
        var performance = await GetOrCreatePerformanceAsync(request.StudentId, request.TopicId);

        // Get last attempt for context
        var lastAttempt = await _dbContext.TaskAttempts
            .Where(ta => ta.StudentId == request.StudentId && ta.TopicId == request.TopicId)
            .OrderByDescending(ta => ta.CreatedAt)
            .FirstOrDefaultAsync();

        // Update rolling accuracy (exponential moving average with alpha = 0.2)
        var alpha = 0.2m;
        var newAccuracy = request.IsCorrect ? 1.0m : 0.0m;
        if (performance.TotalAttempted == 0)
        {
            performance.RollingAccuracy = newAccuracy;
        }
        else
        {
            performance.RollingAccuracy = alpha * newAccuracy + (1 - alpha) * performance.RollingAccuracy;
        }

        // Update streak
        UpdateStreak(performance, request.IsCorrect);

        // Update topic mastery based on accuracy trend
        performance.TopicMastery = CalculateTopicMastery(performance);

        // Update counts
        performance.TotalAttempted++;
        performance.LastActiveAt = DateTime.UtcNow;
        performance.UpdatedAt = DateTime.UtcNow;

        // Save task attempt
        var taskAttempt = new TaskAttempt
        {
            Id = Guid.NewGuid(),
            StudentId = request.StudentId,
            TaskInstanceId = request.TaskInstanceId,
            TopicId = request.TopicId,
            IsCorrect = request.IsCorrect,
            ResponseTimeMs = request.ResponseTimeMs,
            DifficultyAtTime = performance.CurrentDifficulty,
            XpEarned = 0, // Will be set below
            CreatedAt = DateTime.UtcNow
        };

        // Calculate XP earned
        var xpEarned = CalculateXp(performance.CurrentDifficulty, request.IsCorrect, performance.CurrentStreak);
        taskAttempt.XpEarned = xpEarned;

        // Predict next difficulty
        var prediction = _difficultyEngine.PredictNextDifficulty(performance, taskAttempt);
        performance.CurrentDifficulty = prediction.NextDifficulty;

        // Save to database
        _dbContext.TaskAttempts.Add(taskAttempt);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation(
            "Processed answer for student {StudentId}, topic {TopicId}. Correct: {IsCorrect}, Next difficulty: {NextDifficulty}, XP: {XP}",
            request.StudentId, request.TopicId, request.IsCorrect, prediction.NextDifficulty, xpEarned);

        return new ProcessAnswerResult
        {
            UpdatedPerformance = MapToDto(performance),
            NextDifficulty = prediction.NextDifficulty,
            XpEarned = xpEarned,
            Confidence = prediction.Confidence,
            PredictionMethod = prediction.Method
        };
    }

    public async Task<StudentPerformance> GetOrCreatePerformanceAsync(Guid studentId, Guid topicId)
    {
        var performance = await _dbContext.StudentPerformances
            .FirstOrDefaultAsync(sp => sp.StudentId == studentId && sp.TopicId == topicId);

        if (performance == null)
        {
            performance = new StudentPerformance
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                TopicId = topicId,
                CurrentDifficulty = _settings.DefaultDifficulty,
                RollingAccuracy = 0m,
                CurrentStreak = 0,
                StreakDirection = "neutral",
                TopicMastery = 0m,
                TotalAttempted = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.StudentPerformances.Add(performance);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation(
                "Created new performance record for student {StudentId}, topic {TopicId}",
                studentId, topicId);
        }

        return performance;
    }

    private void UpdateStreak(StudentPerformance performance, bool isCorrect)
    {
        var newDirection = isCorrect ? "winning" : "losing";

        if (performance.StreakDirection == newDirection)
        {
            // Continue current streak
            performance.CurrentStreak++;
        }
        else if (performance.StreakDirection == "neutral")
        {
            // Start new streak
            performance.StreakDirection = newDirection;
            performance.CurrentStreak = 1;
        }
        else
        {
            // Direction changed, reset streak
            performance.StreakDirection = newDirection;
            performance.CurrentStreak = 1;
        }
    }

    private decimal CalculateTopicMastery(StudentPerformance performance)
    {
        // Mastery considers accuracy, difficulty level, and consistency
        // Using same weights as AdaptiveAIService: 50/30/20
        var accuracyWeight = 0.5m;
        var difficultyWeight = 0.3m;
        var consistencyWeight = 0.2m;

        // Normalize difficulty to 0-1 scale
        var normalizedDifficulty = performance.CurrentDifficulty / (decimal)_settings.MaxDifficulty;

        // Consistency increases logarithmically with attempts (caps at ~50 attempts)
        var consistencyScore = Math.Min(1.0m, (decimal)Math.Log10(performance.TotalAttempted + 1) / 2);

        var mastery = 
            accuracyWeight * performance.RollingAccuracy +
            difficultyWeight * normalizedDifficulty +
            consistencyWeight * consistencyScore;

        return Math.Max(0, Math.Min(1, mastery));
    }

    private int CalculateXp(int difficulty, bool isCorrect, int currentStreak)
    {
        if (!isCorrect) return 0;

        // Base XP: 10
        var baseXp = 10;

        // Difficulty multiplier (1.0 - 3.0 based on difficulty 1-100)
        var difficultyMultiplier = 1.0 + (difficulty / 50.0);

        // Streak multiplier (1.0 - 2.0 based on streak)
        var streakMultiplier = 1.0 + Math.Min(currentStreak * 0.1, 1.0);

        var totalXp = (int)(baseXp * difficultyMultiplier * streakMultiplier);

        return totalXp;
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
