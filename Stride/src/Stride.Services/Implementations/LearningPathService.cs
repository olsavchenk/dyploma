using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Stride.DataAccess.Contexts;
using Stride.Services.Interfaces;
using Stride.Services.Models.LearningPath;

namespace Stride.Services.Implementations;

public class LearningPathService : ILearningPathService
{
    private readonly StrideDbContext _dbContext;
    private readonly ICacheService _cacheService;
    private readonly ILogger<LearningPathService> _logger;
    private const string LearningPathsCacheKeyPrefix = "learningpaths";
    private static readonly TimeSpan LearningPathsCacheDuration = TimeSpan.FromHours(1);

    public LearningPathService(
        StrideDbContext dbContext,
        ICacheService cacheService,
        ILogger<LearningPathService> logger)
    {
        _dbContext = dbContext;
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<List<LearningPathListItemDto>> GetAllLearningPathsAsync(
        Guid? subjectId = null,
        int? gradeLevel = null,
        Guid? studentId = null)
    {
        // Build cache key based on filters (excluding studentId since that's user-specific)
        var cacheKey = $"{LearningPathsCacheKeyPrefix}:list:{subjectId}:{gradeLevel}";

        // Try to get from cache first (without student progress)
        if (studentId == null)
        {
            var cached = await _cacheService.GetAsync<List<LearningPathListItemDto>>(cacheKey);
            if (cached != null)
            {
                return cached;
            }
        }

        var query = _dbContext.LearningPaths
            .Include(lp => lp.Subject)
            .Include(lp => lp.Steps)
            .Where(lp => lp.IsPublished);

        if (subjectId.HasValue)
        {
            query = query.Where(lp => lp.SubjectId == subjectId.Value);
        }

        if (gradeLevel.HasValue)
        {
            query = query.Where(lp => lp.GradeLevel == gradeLevel.Value);
        }

        var learningPaths = await query
            .OrderBy(lp => lp.GradeLevel)
            .ThenBy(lp => lp.Name)
            .AsNoTracking()
            .ToListAsync();

        var result = learningPaths.Select(lp => new LearningPathListItemDto
        {
            Id = lp.Id,
            SubjectId = lp.SubjectId,
            SubjectName = lp.Subject.Name,
            Name = lp.Name,
            Description = lp.Description,
            GradeLevel = lp.GradeLevel,
            TotalSteps = lp.Steps.Count,
            Progress = null
        }).ToList();

        // If student ID provided, fetch progress data
        if (studentId.HasValue)
        {
            foreach (var learningPath in result)
            {
                var progress = await GetLearningPathProgressAsync(learningPath.Id, studentId.Value);
                learningPath.Progress = progress;
            }
        }
        else
        {
            // Cache only if no student-specific data
            await _cacheService.SetAsync(cacheKey, result, LearningPathsCacheDuration);
        }

        return result;
    }

    public async Task<LearningPathDetailDto?> GetLearningPathByIdAsync(Guid learningPathId, Guid? studentId = null)
    {
        var learningPath = await _dbContext.LearningPaths
            .Include(lp => lp.Subject)
            .Include(lp => lp.Steps)
                .ThenInclude(step => step.Topic)
            .Where(lp => lp.Id == learningPathId && lp.IsPublished)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (learningPath == null)
        {
            return null;
        }

        // Get student performance data if studentId is provided
        Dictionary<Guid, decimal> topicMasteryMap = new();
        Guid? nextStepTopicId = null;

        if (studentId.HasValue)
        {
            var topicIds = learningPath.Steps.Select(s => s.TopicId).ToList();
            var performances = await _dbContext.StudentPerformances
                .Where(sp => sp.StudentId == studentId.Value && topicIds.Contains(sp.TopicId))
                .AsNoTracking()
                .ToListAsync();

            topicMasteryMap = performances.ToDictionary(p => p.TopicId, p => p.TopicMastery);

            // Find the next recommended step (first incomplete step)
            var nextStep = learningPath.Steps
                .OrderBy(s => s.StepOrder)
                .FirstOrDefault(s => !topicMasteryMap.ContainsKey(s.TopicId) || topicMasteryMap[s.TopicId] < 0.8m);

            nextStepTopicId = nextStep?.TopicId;
        }

        var steps = learningPath.Steps
            .OrderBy(s => s.StepOrder)
            .Select(step => new LearningPathStepDto
            {
                Id = step.Id,
                TopicId = step.TopicId,
                TopicName = step.Topic.Name,
                StepOrder = step.StepOrder,
                IsCompleted = topicMasteryMap.ContainsKey(step.TopicId) && topicMasteryMap[step.TopicId] >= 0.8m,
                Mastery = topicMasteryMap.GetValueOrDefault(step.TopicId, 0),
                IsRecommendedNext = step.TopicId == nextStepTopicId
            })
            .ToList();

        var progress = studentId.HasValue
            ? await GetLearningPathProgressAsync(learningPathId, studentId.Value)
            : null;

        return new LearningPathDetailDto
        {
            Id = learningPath.Id,
            SubjectId = learningPath.SubjectId,
            SubjectName = learningPath.Subject.Name,
            Name = learningPath.Name,
            Description = learningPath.Description,
            GradeLevel = learningPath.GradeLevel,
            Steps = steps,
            Progress = progress
        };
    }

    private async Task<LearningPathProgressDto?> GetLearningPathProgressAsync(Guid learningPathId, Guid studentId)
    {
        var steps = await _dbContext.LearningPathSteps
            .Where(lps => lps.LearningPathId == learningPathId)
            .OrderBy(lps => lps.StepOrder)
            .AsNoTracking()
            .ToListAsync();

        if (!steps.Any())
        {
            return new LearningPathProgressDto
            {
                CompletedSteps = 0,
                TotalSteps = 0,
                CompletionPercentage = 0,
                AverageMastery = 0,
                NextStepTopicId = null
            };
        }

        var topicIds = steps.Select(s => s.TopicId).ToList();
        var performances = await _dbContext.StudentPerformances
            .Where(sp => sp.StudentId == studentId && topicIds.Contains(sp.TopicId))
            .AsNoTracking()
            .ToListAsync();

        var masteryMap = performances.ToDictionary(p => p.TopicId, p => p.TopicMastery);

        var completedSteps = steps.Count(s => masteryMap.ContainsKey(s.TopicId) && masteryMap[s.TopicId] >= 0.8m);
        var totalSteps = steps.Count;
        var completionPercentage = totalSteps > 0 ? (decimal)completedSteps / totalSteps * 100 : 0;

        // Calculate average mastery for attempted topics
        var attemptedTopics = steps.Where(s => masteryMap.ContainsKey(s.TopicId)).ToList();
        var averageMastery = attemptedTopics.Any()
            ? attemptedTopics.Average(s => masteryMap[s.TopicId])
            : 0;

        // Find next recommended step (first incomplete)
        var nextStep = steps.FirstOrDefault(s => !masteryMap.ContainsKey(s.TopicId) || masteryMap[s.TopicId] < 0.8m);

        return new LearningPathProgressDto
        {
            CompletedSteps = completedSteps,
            TotalSteps = totalSteps,
            CompletionPercentage = completionPercentage,
            AverageMastery = averageMastery,
            NextStepTopicId = nextStep?.TopicId
        };
    }
}
