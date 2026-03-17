using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Models.DTOs.Task;
using Stride.Adaptive.Services.Interfaces;
using Stride.Core.Documents;
using Stride.DataAccess.Contexts;
using Stride.DataAccess.Repositories;
using System.Text.Json;

namespace Stride.Adaptive.Services.Implementations;

public class TaskService : ITaskService
{
    private readonly IAdaptiveAIService _adaptiveAIService;
    private readonly ITaskInstanceRepository _instanceRepository;
    private readonly ITaskAttemptRepository _attemptRepository;
    private readonly ITaskTemplateRepository _templateRepository;
    private readonly StrideDbContext _context;
    private readonly ILogger<TaskService> _logger;

    public TaskService(
        IAdaptiveAIService adaptiveAIService,
        ITaskInstanceRepository instanceRepository,
        ITaskAttemptRepository attemptRepository,
        ITaskTemplateRepository templateRepository,
        StrideDbContext context,
        ILogger<TaskService> logger)
    {
        _adaptiveAIService = adaptiveAIService;
        _instanceRepository = instanceRepository;
        _attemptRepository = attemptRepository;
        _templateRepository = templateRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<TaskDto> GetNextTaskAsync(Guid studentId, Guid topicId)
    {
        try
        {
            var request = new GetNextTaskRequest
            {
                StudentId = studentId,
                TopicId = topicId
            };

            var result = await _adaptiveAIService.GetNextTaskAsync(request);

            var taskTypeName = result.TaskInstance.TaskType;

            // Fallback for legacy instances that pre-date the TaskType field
            if (string.IsNullOrEmpty(taskTypeName))
            {
                var template = await _templateRepository.GetByIdAsync(result.TaskInstance.TemplateId);
                taskTypeName = template?.TaskType ?? string.Empty;
            }

            // Map to DTO without exposing the answer
            return new TaskDto
            {
                Id = result.TaskInstance.Id,
                TopicId = result.TaskInstance.TopicId,
                Difficulty = result.TaskInstance.Difficulty,
                Type = ConvertTaskType(taskTypeName),
                Question = result.TaskInstance.RenderedContent.Question,
                Options = result.TaskInstance.RenderedContent.Options,
                Hints = result.TaskInstance.RenderedContent.Hints
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Error getting next task for student {StudentId}, topic {TopicId}",
                studentId, topicId);
            throw;
        }
    }

    public async Task<SubmitTaskResponse> SubmitTaskAsync(
        Guid studentId, 
        string taskInstanceId, 
        SubmitTaskRequest request)
    {
        try
        {
            // Get the task instance to validate the answer
            var taskInstance = await _instanceRepository.GetByIdAsync(taskInstanceId);
            
            if (taskInstance == null)
            {
                throw new InvalidOperationException($"Task instance {taskInstanceId} not found");
            }

            // Evaluate the answer
            var isCorrect = EvaluateAnswer(request.Answer, taskInstance.RenderedContent);

            // Process the answer through adaptive AI service
            var processRequest = new ProcessAnswerRequest
            {
                StudentId = studentId,
                TopicId = taskInstance.TopicId,
                TaskInstanceId = taskInstanceId,
                IsCorrect = isCorrect,
                ResponseTimeMs = request.ResponseTimeMs
            };

            var result = await _adaptiveAIService.ProcessAnswerAsync(processRequest);

            // Get updated student profile for current level
            var student = await _context.StudentProfiles
                .FirstOrDefaultAsync(s => s.Id == studentId);

            if (student == null)
            {
                throw new InvalidOperationException($"Student profile {studentId} not found");
            }

            // Return response with feedback
            return new SubmitTaskResponse
            {
                IsCorrect = isCorrect,
                Explanation = taskInstance.RenderedContent.Explanation,
                XpEarned = result.XpEarned,
                CurrentStreak = result.UpdatedPerformance.CurrentStreak,
                TotalXp = student.TotalXp,
                CurrentLevel = student.CurrentLevel,
                NextDifficulty = result.NextDifficulty,
                CorrectAnswer = isCorrect ? null : GetAnswerAsString(taskInstance.RenderedContent.Answer)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Error submitting task {TaskInstanceId} for student {StudentId}",
                taskInstanceId, studentId);
            throw;
        }
    }

    public async Task<TaskHistoryResponse> GetTaskHistoryAsync(
        Guid studentId, 
        int pageNumber = 1, 
        int pageSize = 20)
    {
        try
        {
            var attempts = await _attemptRepository.GetByStudentIdAsync(studentId, pageNumber, pageSize);
            var totalCount = await _attemptRepository.GetCountByStudentIdAsync(studentId);

            var attemptDtos = attempts.Select(a => new TaskAttemptDto
            {
                Id = a.Id,
                TopicId = a.TopicId,
                TopicName = a.Topic?.Name ?? "Unknown Topic",
                IsCorrect = a.IsCorrect,
                ResponseTimeMs = a.ResponseTimeMs,
                DifficultyAtTime = a.DifficultyAtTime,
                XpEarned = a.XpEarned,
                CreatedAt = a.CreatedAt
            }).ToList();

            return new TaskHistoryResponse
            {
                Attempts = attemptDtos,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Error getting task history for student {StudentId}",
                studentId);
            throw;
        }
    }

    /// <summary>
    /// Converts snake_case task type (e.g. "true_false") to PascalCase (e.g. "TrueFalse")
    /// as expected by the Angular frontend discriminated union.
    /// </summary>
    private static string ConvertTaskType(string snakeCaseType) =>
        snakeCaseType switch
        {
            "multiple_choice" => "MultipleChoice",
            "fill_blank" => "FillBlank",
            "true_false" => "TrueFalse",
            "matching" => "Matching",
            "ordering" => "Ordering",
            _ => snakeCaseType
        };

    private bool EvaluateAnswer(string studentAnswer, TaskContent taskContent)
    {
        if (string.IsNullOrWhiteSpace(studentAnswer))
            return false;

        var correctAnswer = taskContent.Answer;
        
        // Handle different answer types
        if (correctAnswer.IsBsonNull)
            return false;

        if (correctAnswer.IsString)
        {
            // Simple string comparison (case-insensitive, trimmed)
            return string.Equals(
                studentAnswer.Trim(), 
                correctAnswer.AsString.Trim(), 
                StringComparison.OrdinalIgnoreCase);
        }

        if (correctAnswer.IsBsonArray)
        {
            // For array answers (like matching or ordering), compare JSON
            try
            {
                var studentAnswerArray = JsonSerializer.Deserialize<string[]>(studentAnswer);
                var correctAnswerArray = correctAnswer.AsBsonArray
                    .Select(v => v.AsString)
                    .ToArray();

                return studentAnswerArray != null && 
                       studentAnswerArray.SequenceEqual(correctAnswerArray);
            }
            catch
            {
                return false;
            }
        }

        if (correctAnswer.IsInt32 || correctAnswer.IsInt64)
        {
            // Numeric answer
            if (int.TryParse(studentAnswer, out var studentNum))
            {
                var correctNum = correctAnswer.IsInt32 
                    ? correctAnswer.AsInt32 
                    : (int)correctAnswer.AsInt64;
                return studentNum == correctNum;
            }
            return false;
        }

        if (correctAnswer.IsBoolean)
        {
            // Boolean answer (true/false tasks)
            if (bool.TryParse(studentAnswer, out var studentBool))
            {
                return studentBool == correctAnswer.AsBoolean;
            }
            return false;
        }

        _logger.LogWarning(
            "Unsupported answer type: {AnswerType}",
            correctAnswer.BsonType);
        
        return false;
    }

    private string GetAnswerAsString(MongoDB.Bson.BsonValue answer)
    {
        if (answer.IsBsonNull)
            return string.Empty;

        if (answer.IsString)
            return answer.AsString;

        if (answer.IsBsonArray)
            return JsonSerializer.Serialize(answer.AsBsonArray.Select(v => v.ToString()));

        return answer.ToString() ?? string.Empty;
    }
}
