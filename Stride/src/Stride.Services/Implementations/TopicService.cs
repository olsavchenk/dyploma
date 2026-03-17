using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Stride.DataAccess.Contexts;
using Stride.Services.Interfaces;
using Stride.Services.Models.Topic;

namespace Stride.Services.Implementations;

public class TopicService : ITopicService
{
    private readonly StrideDbContext _dbContext;
    private readonly ILogger<TopicService> _logger;

    public TopicService(StrideDbContext dbContext, ILogger<TopicService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<List<TopicTreeDto>> GetTopicsBySubjectAsync(Guid subjectId, Guid? studentId = null)
    {
        _logger.LogDebug("Starting {Method} for SubjectId={SubjectId}, StudentId={StudentId}",
            nameof(GetTopicsBySubjectAsync), subjectId, studentId?.ToString() ?? "null");

        // Get all topics for the subject
        var topics = await _dbContext.Topics
            .Where(t => t.SubjectId == subjectId && t.IsActive)
            .OrderBy(t => t.SortOrder)
            .AsNoTracking()
            .ToListAsync();

        // Get student performance if student ID provided
        Dictionary<Guid, TopicMasteryDto> masteryMap = new();
        if (studentId.HasValue)
        {
            var performances = await _dbContext.StudentPerformances
                .Where(sp => sp.StudentId == studentId.Value && sp.Topic.SubjectId == subjectId)
                .AsNoTracking()
                .ToListAsync();

            masteryMap = performances.ToDictionary(
                p => p.TopicId,
                p => new TopicMasteryDto
                {
                    MasteryLevel = p.TopicMastery,
                    CurrentDifficulty = p.CurrentDifficulty,
                    TotalAttempts = p.TotalAttempted,
                    Accuracy = p.RollingAccuracy,
                    CurrentStreak = p.CurrentStreak,
                    StreakDirection = p.StreakDirection,
                    LastActiveAt = p.LastActiveAt
                });
        }

        // Build hierarchical structure
        var topicDtos = topics.Select(t => new TopicTreeDto
        {
            Id = t.Id,
            SubjectId = t.SubjectId,
            ParentTopicId = t.ParentTopicId,
            Name = t.Name,
            Slug = t.Slug,
            Description = t.Description,
            GradeLevel = t.GradeLevel,
            SortOrder = t.SortOrder,
            Mastery = masteryMap.ContainsKey(t.Id) ? masteryMap[t.Id] : null,
            ChildTopics = new List<TopicTreeDto>()
        }).ToList();

        // Build hierarchical tree (only root topics, children will be nested)
        var rootTopics = topicDtos.Where(t => t.ParentTopicId == null).ToList();
        foreach (var root in rootTopics)
        {
            BuildTopicTree(root, topicDtos);
        }

        return rootTopics;
    }

    public async Task<TopicDetailDto?> GetTopicByIdAsync(Guid topicId, Guid? studentId = null)
    {
        var topic = await _dbContext.Topics
            .Include(t => t.Subject)
            .Where(t => t.Id == topicId && t.IsActive)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (topic == null)
        {
            return null;
        }

        return await BuildTopicDetailAsync(topic, studentId);
    }

    public async Task<TopicDetailDto?> GetTopicBySlugAsync(Guid subjectId, string slug, Guid? studentId = null)
    {
        var topic = await _dbContext.Topics
            .Include(t => t.Subject)
            .Where(t => t.SubjectId == subjectId && t.Slug == slug && t.IsActive)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (topic == null)
        {
            return null;
        }

        return await BuildTopicDetailAsync(topic, studentId);
    }

    private void BuildTopicTree(TopicTreeDto parent, List<TopicTreeDto> allTopics)
    {
        var children = allTopics.Where(t => t.ParentTopicId == parent.Id).OrderBy(t => t.SortOrder).ToList();
        parent.ChildTopics = children;

        foreach (var child in children)
        {
            BuildTopicTree(child, allTopics);
        }
    }

    private async Task<TopicDetailDto> BuildTopicDetailAsync(Core.Entities.Topic topic, Guid? studentId)
    {
        // Build breadcrumbs
        var breadcrumbs = new List<BreadcrumbDto>
        {
            new BreadcrumbDto
            {
                Id = topic.SubjectId,
                Name = topic.Subject.Name,
                Slug = topic.Subject.Slug,
                Type = "subject"
            }
        };

        // Add parent topics to breadcrumbs (if any)
        if (topic.ParentTopicId.HasValue)
        {
            var parentBreadcrumbs = await BuildParentBreadcrumbsAsync(topic.ParentTopicId.Value);
            breadcrumbs.AddRange(parentBreadcrumbs);
        }

        // Add current topic
        breadcrumbs.Add(new BreadcrumbDto
        {
            Id = topic.Id,
            Name = topic.Name,
            Slug = topic.Slug,
            Type = "topic"
        });

        // Get child topics
        var childTopics = await _dbContext.Topics
            .Where(t => t.ParentTopicId == topic.Id && t.IsActive)
            .OrderBy(t => t.SortOrder)
            .AsNoTracking()
            .Select(t => new TopicDto
            {
                Id = t.Id,
                SubjectId = t.SubjectId,
                ParentTopicId = t.ParentTopicId,
                Name = t.Name,
                Slug = t.Slug,
                Description = t.Description,
                GradeLevel = t.GradeLevel,
                SortOrder = t.SortOrder
            })
            .ToListAsync();

        // Get sibling topics
        var siblingTopics = await _dbContext.Topics
            .Where(t => t.ParentTopicId == topic.ParentTopicId && t.Id != topic.Id && t.IsActive)
            .OrderBy(t => t.SortOrder)
            .AsNoTracking()
            .Select(t => new TopicDto
            {
                Id = t.Id,
                SubjectId = t.SubjectId,
                ParentTopicId = t.ParentTopicId,
                Name = t.Name,
                Slug = t.Slug,
                Description = t.Description,
                GradeLevel = t.GradeLevel,
                SortOrder = t.SortOrder
            })
            .ToListAsync();

        // Get student performance if student ID provided
        TopicPerformanceDto? performance = null;
        if (studentId.HasValue)
        {
            var studentPerformance = await _dbContext.StudentPerformances
                .Where(sp => sp.StudentId == studentId.Value && sp.TopicId == topic.Id)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (studentPerformance != null)
            {
                var correctAttempts = await _dbContext.TaskAttempts
                    .CountAsync(ta => ta.StudentId == studentId.Value && ta.TopicId == topic.Id && ta.IsCorrect);

                var xpEarned = await _dbContext.TaskAttempts
                    .Where(ta => ta.StudentId == studentId.Value && ta.TopicId == topic.Id)
                    .SumAsync(ta => ta.XpEarned);

                performance = new TopicPerformanceDto
                {
                    MasteryLevel = studentPerformance.TopicMastery,
                    CurrentDifficulty = studentPerformance.CurrentDifficulty,
                    TotalAttempts = studentPerformance.TotalAttempted,
                    CorrectAttempts = correctAttempts,
                    Accuracy = studentPerformance.RollingAccuracy,
                    CurrentStreak = studentPerformance.CurrentStreak,
                    XpEarned = xpEarned,
                    LastActiveAt = studentPerformance.LastActiveAt
                };
            }
        }

        return new TopicDetailDto
        {
            Id = topic.Id,
            SubjectId = topic.SubjectId,
            SubjectName = topic.Subject.Name,
            ParentTopicId = topic.ParentTopicId,
            Name = topic.Name,
            Slug = topic.Slug,
            Description = topic.Description,
            GradeLevel = topic.GradeLevel,
            SortOrder = topic.SortOrder,
            Breadcrumbs = breadcrumbs,
            Performance = performance,
            ChildTopics = childTopics,
            SiblingTopics = siblingTopics
        };
    }

    private async Task<List<BreadcrumbDto>> BuildParentBreadcrumbsAsync(Guid parentTopicId)
    {
        var breadcrumbs = new List<BreadcrumbDto>();
        var currentTopicId = parentTopicId;

        while (currentTopicId != Guid.Empty)
        {
            var parentTopic = await _dbContext.Topics
                .Where(t => t.Id == currentTopicId)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (parentTopic == null) break;

            breadcrumbs.Insert(0, new BreadcrumbDto
            {
                Id = parentTopic.Id,
                Name = parentTopic.Name,
                Slug = parentTopic.Slug,
                Type = "topic"
            });

            currentTopicId = parentTopic.ParentTopicId ?? Guid.Empty;
        }

        return breadcrumbs;
    }

    public async Task<TopicDto> CreateTopicAsync(CreateTopicRequest request, CancellationToken cancellationToken = default)
    {
        // Validate subject exists
        var subjectExists = await _dbContext.Subjects
            .AnyAsync(s => s.Id == request.SubjectId && s.IsActive, cancellationToken);

        if (!subjectExists)
        {
            throw new InvalidOperationException($"Subject with ID '{request.SubjectId}' not found");
        }

        // Validate parent topic exists if provided
        if (request.ParentTopicId.HasValue)
        {
            var parentTopicExists = await _dbContext.Topics
                .AnyAsync(t => t.Id == request.ParentTopicId.Value && t.SubjectId == request.SubjectId && t.IsActive, cancellationToken);

            if (!parentTopicExists)
            {
                throw new InvalidOperationException($"Parent topic with ID '{request.ParentTopicId}' not found in this subject");
            }
        }

        // Check if slug already exists in this subject
        var existingTopic = await _dbContext.Topics
            .Where(t => t.SubjectId == request.SubjectId && t.Slug == request.Slug)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingTopic != null)
        {
            throw new InvalidOperationException($"A topic with slug '{request.Slug}' already exists in this subject");
        }

        var topic = new Core.Entities.Topic
        {
            Id = Guid.NewGuid(),
            SubjectId = request.SubjectId,
            ParentTopicId = request.ParentTopicId,
            Name = request.Name,
            Slug = request.Slug,
            Description = request.Description,
            GradeLevel = request.GradeLevel,
            SortOrder = request.SortOrder,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Topics.Add(topic);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new TopicDto
        {
            Id = topic.Id,
            SubjectId = topic.SubjectId,
            ParentTopicId = topic.ParentTopicId,
            Name = topic.Name,
            Slug = topic.Slug,
            Description = topic.Description,
            GradeLevel = topic.GradeLevel,
            SortOrder = topic.SortOrder
        };
    }

    public async Task<TopicDto> UpdateTopicAsync(Guid id, UpdateTopicRequest request, CancellationToken cancellationToken = default)
    {
        var topic = await _dbContext.Topics
            .Where(t => t.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        if (topic == null)
        {
            throw new InvalidOperationException($"Topic with ID '{id}' not found");
        }

        // Validate subject exists
        var subjectExists = await _dbContext.Subjects
            .AnyAsync(s => s.Id == request.SubjectId && s.IsActive, cancellationToken);

        if (!subjectExists)
        {
            throw new InvalidOperationException($"Subject with ID '{request.SubjectId}' not found");
        }

        // Validate parent topic exists if provided
        if (request.ParentTopicId.HasValue)
        {
            // Prevent circular reference
            if (request.ParentTopicId.Value == id)
            {
                throw new InvalidOperationException("A topic cannot be its own parent");
            }

            var parentTopicExists = await _dbContext.Topics
                .AnyAsync(t => t.Id == request.ParentTopicId.Value && t.SubjectId == request.SubjectId && t.IsActive, cancellationToken);

            if (!parentTopicExists)
            {
                throw new InvalidOperationException($"Parent topic with ID '{request.ParentTopicId}' not found in this subject");
            }
        }

        // Check if slug is being changed to an existing slug
        if (topic.SubjectId != request.SubjectId || topic.Slug != request.Slug)
        {
            var existingTopic = await _dbContext.Topics
                .Where(t => t.SubjectId == request.SubjectId && t.Slug == request.Slug && t.Id != id)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingTopic != null)
            {
                throw new InvalidOperationException($"A topic with slug '{request.Slug}' already exists in this subject");
            }
        }

        topic.SubjectId = request.SubjectId;
        topic.ParentTopicId = request.ParentTopicId;
        topic.Name = request.Name;
        topic.Slug = request.Slug;
        topic.Description = request.Description;
        topic.GradeLevel = request.GradeLevel;
        topic.SortOrder = request.SortOrder;
        topic.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new TopicDto
        {
            Id = topic.Id,
            SubjectId = topic.SubjectId,
            ParentTopicId = topic.ParentTopicId,
            Name = topic.Name,
            Slug = topic.Slug,
            Description = topic.Description,
            GradeLevel = topic.GradeLevel,
            SortOrder = topic.SortOrder
        };
    }

    public async Task DeleteTopicAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var topic = await _dbContext.Topics
            .Where(t => t.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        if (topic == null)
        {
            throw new InvalidOperationException($"Topic with ID '{id}' not found");
        }

        // Check if topic has child topics
        var hasChildren = await _dbContext.Topics
            .AnyAsync(t => t.ParentTopicId == id && t.IsActive, cancellationToken);

        if (hasChildren)
        {
            throw new InvalidOperationException("Cannot delete a topic that has child topics. Delete or reassign child topics first");
        }

        // Soft delete
        topic.IsActive = false;
        topic.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

