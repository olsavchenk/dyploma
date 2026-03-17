using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Stride.DataAccess.Contexts;
using Stride.Services.Interfaces;
using Stride.Services.Models.Subject;

namespace Stride.Services.Implementations;

public class SubjectService : ISubjectService
{
    private readonly StrideDbContext _dbContext;
    private readonly ICacheService _cacheService;
    private readonly ILogger<SubjectService> _logger;
    private const string SubjectsListCacheKey = "subjects:list";
    private static readonly TimeSpan SubjectsCacheDuration = TimeSpan.FromHours(1);

    public SubjectService(
        StrideDbContext dbContext,
        ICacheService cacheService,
        ILogger<SubjectService> logger)
    {
        _dbContext = dbContext;
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<List<SubjectListItemDto>> GetAllSubjectsAsync(Guid? studentId = null)
    {
        _logger.LogDebug("Starting {Method} for StudentId={StudentId}",
            nameof(GetAllSubjectsAsync), studentId?.ToString() ?? "null");

        // Try to get from cache first (without student progress)
        if (studentId == null)
        {
            var cached = await _cacheService.GetAsync<List<SubjectListItemDto>>(SubjectsListCacheKey);
            if (cached != null)
            {
                _logger.LogDebug("{Method}: Returning cached subjects, Count={Count}",
                    nameof(GetAllSubjectsAsync), cached.Count);
                return cached;
            }
        }

        var subjects = await _dbContext.Subjects
            .Where(s => s.IsActive)
            .OrderBy(s => s.SortOrder)
            .AsNoTracking()
            .ToListAsync();

        var result = subjects.Select(s => new SubjectListItemDto
        {
            Id = s.Id,
            Name = s.Name,
            Slug = s.Slug,
            Description = s.Description,
            IconUrl = s.IconUrl,
            SortOrder = s.SortOrder,
            Progress = null
        }).ToList();

        // If student ID provided, fetch progress data
        if (studentId.HasValue)
        {
            foreach (var subject in result)
            {
                var progress = await GetSubjectProgressAsync(subject.Id, studentId.Value);
                subject.Progress = progress;
            }
        }
        else
        {
            // Cache only if no student-specific data
            await _cacheService.SetAsync(SubjectsListCacheKey, result, SubjectsCacheDuration);
        }

        return result;
    }

    public async Task<SubjectDto?> GetSubjectByIdAsync(Guid subjectId)
    {
        var subject = await _dbContext.Subjects
            .Where(s => s.Id == subjectId && s.IsActive)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (subject == null)
        {
            return null;
        }

        return new SubjectDto
        {
            Id = subject.Id,
            Name = subject.Name,
            Slug = subject.Slug,
            Description = subject.Description,
            IconUrl = subject.IconUrl,
            SortOrder = subject.SortOrder
        };
    }

    public async Task<SubjectDto?> GetSubjectBySlugAsync(string slug)
    {
        var subject = await _dbContext.Subjects
            .Where(s => s.Slug == slug && s.IsActive)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (subject == null)
        {
            return null;
        }

        return new SubjectDto
        {
            Id = subject.Id,
            Name = subject.Name,
            Slug = subject.Slug,
            Description = subject.Description,
            IconUrl = subject.IconUrl,
            SortOrder = subject.SortOrder
        };
    }

    private async Task<SubjectProgressDto?> GetSubjectProgressAsync(Guid subjectId, Guid studentId)
    {
        // Get all topics for the subject
        var topicIds = await _dbContext.Topics
            .Where(t => t.SubjectId == subjectId && t.IsActive)
            .Select(t => t.Id)
            .ToListAsync();

        if (!topicIds.Any())
        {
            return new SubjectProgressDto
            {
                TotalTopics = 0,
                CompletedTopics = 0,
                OverallMastery = 0,
                TotalXpEarned = 0
            };
        }

        // Get student performance for these topics
        var performances = await _dbContext.StudentPerformances
            .Where(sp => sp.StudentId == studentId && topicIds.Contains(sp.TopicId))
            .AsNoTracking()
            .ToListAsync();

        // Get task attempts for XP calculation
        var totalXp = await _dbContext.TaskAttempts
            .Where(ta => ta.StudentId == studentId && topicIds.Contains(ta.TopicId))
            .SumAsync(ta => ta.XpEarned);

        var completedTopics = performances.Count(p => p.TopicMastery >= 0.8m);
        var overallMastery = performances.Any() ? performances.Average(p => p.TopicMastery) : 0;

        return new SubjectProgressDto
        {
            TotalTopics = topicIds.Count,
            CompletedTopics = completedTopics,
            OverallMastery = overallMastery,
            TotalXpEarned = totalXp
        };
    }

    public async Task<SubjectDto> CreateSubjectAsync(CreateSubjectRequest request, CancellationToken cancellationToken = default)
    {
        // Check if slug already exists
        var existingSubject = await _dbContext.Subjects
            .Where(s => s.Slug == request.Slug)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingSubject != null)
        {
            throw new InvalidOperationException($"A subject with slug '{request.Slug}' already exists");
        }

        var subject = new Core.Entities.Subject
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Slug = request.Slug,
            Description = request.Description,
            IconUrl = request.IconUrl,
            SortOrder = request.SortOrder,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Subjects.Add(subject);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Invalidate cache
        await _cacheService.RemoveAsync(SubjectsListCacheKey);

        return new SubjectDto
        {
            Id = subject.Id,
            Name = subject.Name,
            Slug = subject.Slug,
            Description = subject.Description,
            IconUrl = subject.IconUrl,
            SortOrder = subject.SortOrder
        };
    }

    public async Task<SubjectDto> UpdateSubjectAsync(Guid id, UpdateSubjectRequest request, CancellationToken cancellationToken = default)
    {
        var subject = await _dbContext.Subjects
            .Where(s => s.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        if (subject == null)
        {
            throw new InvalidOperationException($"Subject with ID '{id}' not found");
        }

        // Check if slug is being changed to an existing slug
        if (subject.Slug != request.Slug)
        {
            var existingSubject = await _dbContext.Subjects
                .Where(s => s.Slug == request.Slug && s.Id != id)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingSubject != null)
            {
                throw new InvalidOperationException($"A subject with slug '{request.Slug}' already exists");
            }
        }

        subject.Name = request.Name;
        subject.Slug = request.Slug;
        subject.Description = request.Description;
        subject.IconUrl = request.IconUrl;
        subject.SortOrder = request.SortOrder;
        subject.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Invalidate cache
        await _cacheService.RemoveAsync(SubjectsListCacheKey);

        return new SubjectDto
        {
            Id = subject.Id,
            Name = subject.Name,
            Slug = subject.Slug,
            Description = subject.Description,
            IconUrl = subject.IconUrl,
            SortOrder = subject.SortOrder
        };
    }

    public async Task DeleteSubjectAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var subject = await _dbContext.Subjects
            .Where(s => s.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        if (subject == null)
        {
            throw new InvalidOperationException($"Subject with ID '{id}' not found");
        }

        // Soft delete
        subject.IsActive = false;
        subject.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Invalidate cache
        await _cacheService.RemoveAsync(SubjectsListCacheKey);
    }

    public async Task<List<ContinueLearningTopicDto>> GetContinueLearningTopicsAsync(Guid studentProfileId, int limit = 3)
    {
        return await _dbContext.StudentPerformances
            .Where(sp => sp.StudentId == studentProfileId && sp.LastActiveAt.HasValue)
            .OrderByDescending(sp => sp.LastActiveAt)
            .Take(limit)
            .Select(sp => new ContinueLearningTopicDto
            {
                TopicId = sp.TopicId,
                TopicName = sp.Topic.Name,
                SubjectId = sp.Topic.SubjectId,
                SubjectName = sp.Topic.Subject.Name,
                SubjectIconUrl = sp.Topic.Subject.IconUrl,
                Progress = (double)sp.RollingAccuracy * 100,
                LastActiveAt = sp.LastActiveAt!.Value,
                CurrentDifficulty = sp.CurrentDifficulty,
                MasteryLevel = (double)sp.TopicMastery * 100
            })
            .AsNoTracking()
            .ToListAsync();
    }
}
