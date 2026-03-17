using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;
using Stride.DataAccess.Repositories;
using Stride.Services.Interfaces;
using Stride.Services.Models.Admin;

namespace Stride.Services.Implementations;

public class AdminService : IAdminService
{
    private readonly StrideDbContext _dbContext;
    private readonly MongoDbContext _mongoDbContext;
    private readonly ITaskTemplateRepository _taskTemplateRepository;
    private readonly ILogger<AdminService> _logger;

    public AdminService(
        StrideDbContext dbContext,
        MongoDbContext mongoDbContext,
        ITaskTemplateRepository taskTemplateRepository,
        ILogger<AdminService> logger)
    {
        _dbContext = dbContext;
        _mongoDbContext = mongoDbContext;
        _taskTemplateRepository = taskTemplateRepository;
        _logger = logger;
    }

    public async Task<PaginatedResult<AdminUserListItemDto>> GetUsersAsync(
        GetUsersRequest request,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Users
            .Include(u => u.StudentProfile)
                .ThenInclude(sp => sp!.TaskAttempts)
            .Include(u => u.TeacherProfile)
                .ThenInclude(tp => tp!.Classes)
                    .ThenInclude(c => c.Memberships)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchLower = request.Search.ToLower();
            query = query.Where(u =>
                u.Email.ToLower().Contains(searchLower) ||
                u.DisplayName.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            query = query.Where(u => u.Role == request.Role);
        }

        if (request.IsDeleted.HasValue)
        {
            query = query.Where(u => u.IsDeleted == request.IsDeleted.Value);
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "lastloginat" => request.SortOrder?.ToLower() == "asc"
                ? query.OrderBy(u => u.LastLoginAt)
                : query.OrderByDescending(u => u.LastLoginAt),
            "displayname" => request.SortOrder?.ToLower() == "asc"
                ? query.OrderBy(u => u.DisplayName)
                : query.OrderByDescending(u => u.DisplayName),
            _ => request.SortOrder?.ToLower() == "asc"
                ? query.OrderBy(u => u.CreatedAt)
                : query.OrderByDescending(u => u.CreatedAt)
        };

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new AdminUserListItemDto
            {
                Id = u.Id,
                Email = u.Email,
                DisplayName = u.DisplayName,
                AvatarUrl = u.AvatarUrl,
                Role = u.Role,
                CreatedAt = u.CreatedAt,
                LastLoginAt = u.LastLoginAt,
                IsDeleted = u.IsDeleted,
                TotalXp = u.StudentProfile != null ? u.StudentProfile.TotalXp : 0,
                CurrentLevel = u.StudentProfile != null ? u.StudentProfile.CurrentLevel : 0,
                TotalTasksAttempted = u.StudentProfile != null ? u.StudentProfile.TaskAttempts.Count : 0,
                TotalClasses = u.TeacherProfile != null ? u.TeacherProfile.Classes.Count : 0
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<AdminUserListItemDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task ChangeUserRoleAsync(Guid userId, string newRole, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.TeacherProfile)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);

        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        // If role hasn't changed, do nothing
        if (user.Role == newRole)
        {
            return;
        }

        // Update role
        user.Role = newRole;

        // Create profile if needed
        if (newRole == "Student" && user.StudentProfile == null)
        {
            var studentProfile = new StudentProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TotalXp = 0,
                CurrentLevel = 1,
                CurrentStreak = 0,
                LongestStreak = 0,
                StreakFreezes = 0,
                League = "Bronze",
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.StudentProfiles.Add(studentProfile);
        }
        else if (newRole == "Teacher" && user.TeacherProfile == null)
        {
            var teacherProfile = new TeacherProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                School = null,
                GradesTaught = null,
                SubjectsExpertise = null,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.TeacherProfiles.Add(teacherProfile);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<AdminDashboardDto> GetDashboardAnalyticsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var weekAgo = now.AddDays(-7);

        // Get user counts
        var totalUsers = await _dbContext.Users
            .CountAsync(u => !u.IsDeleted, cancellationToken);

        var activeUsersToday = await _dbContext.Users
            .CountAsync(u => !u.IsDeleted && u.LastLoginAt >= today, cancellationToken);

        var activeUsersThisWeek = await _dbContext.Users
            .CountAsync(u => !u.IsDeleted && u.LastLoginAt >= weekAgo, cancellationToken);

        var totalStudents = await _dbContext.Users
            .CountAsync(u => !u.IsDeleted && u.Role == "Student", cancellationToken);

        var totalTeachers = await _dbContext.Users
            .CountAsync(u => !u.IsDeleted && u.Role == "Teacher", cancellationToken);

        var totalAdmins = await _dbContext.Users
            .CountAsync(u => !u.IsDeleted && u.Role == "Admin", cancellationToken);

        // Get task statistics
        var totalTasksAttempted = await _dbContext.TaskAttempts
            .LongCountAsync(cancellationToken);

        var correctAttempts = await _dbContext.TaskAttempts
            .CountAsync(ta => ta.IsCorrect, cancellationToken);

        var averageAccuracy = totalTasksAttempted > 0
            ? Math.Round((double)correctAttempts / totalTasksAttempted * 100, 2)
            : 0.0;

        // Get pending AI reviews count from MongoDB
        var pendingAIReviews = await _taskTemplateRepository.GetPendingReviewCountAsync(cancellationToken);

        return new AdminDashboardDto
        {
            TotalUsers = totalUsers,
            ActiveUsersToday = activeUsersToday,
            ActiveUsersThisWeek = activeUsersThisWeek,
            TotalStudents = totalStudents,
            TotalTeachers = totalTeachers,
            TotalAdmins = totalAdmins,
            TotalTasksAttempted = totalTasksAttempted,
            AverageAccuracy = averageAccuracy,
            PendingAIReviews = pendingAIReviews,
            GeneratedAt = DateTime.UtcNow
        };
    }

    public async Task<PaginatedResult<ReviewQueueItemDto>> GetReviewQueueAsync(
        GetReviewQueueRequest request,
        CancellationToken cancellationToken = default)
    {
        // Get total count with filters
        var totalCount = await _taskTemplateRepository.GetPendingReviewCountWithFiltersAsync(
            request.TopicId,
            request.TaskType,
            request.DifficultyBand,
            cancellationToken);

        // Get paginated templates with filters
        var skip = (request.Page - 1) * request.PageSize;
        var templates = await _taskTemplateRepository.GetPendingReviewWithFiltersAsync(
            request.TopicId,
            request.TaskType,
            request.DifficultyBand,
            skip,
            request.PageSize,
            cancellationToken);

        // Get topic and subject information for each template
        var topicIds = templates.Select(t => t.TopicId).Distinct().ToList();
        var topics = await _dbContext.Topics
            .Include(t => t.Subject)
            .Where(t => topicIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t, cancellationToken);

        // Map to DTOs
        var items = templates.Select(template =>
        {
            var topic = topics.GetValueOrDefault(template.TopicId);
            return new ReviewQueueItemDto
            {
                Id = template.Id,
                TopicId = template.TopicId,
                TopicName = topic?.Name ?? "Unknown Topic",
                SubjectName = topic?.Subject?.Name ?? "Unknown Subject",
                TaskType = template.TaskType,
                DifficultyBand = template.DifficultyBand,
                AiProvider = template.AiProvider,
                CreatedAt = template.CreatedAt,
                TemplateContent = template.TemplateContent
            };
        }).ToList();

        _logger.LogInformation(
            "Retrieved review queue - Page: {Page}, PageSize: {PageSize}, TotalCount: {TotalCount}",
            request.Page,
            request.PageSize,
            totalCount);

        return new PaginatedResult<ReviewQueueItemDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task ApproveTemplateAsync(
        string templateId,
        Guid reviewerId,
        CancellationToken cancellationToken = default)
    {
        var template = await _taskTemplateRepository.GetByIdAsync(templateId);
        if (template == null)
        {
            throw new InvalidOperationException("Template not found");
        }

        if (template.IsApproved)
        {
            _logger.LogWarning("Template {TemplateId} is already approved", templateId);
            return;
        }

        var success = await _taskTemplateRepository.ApproveAsync(templateId, reviewerId);
        if (!success)
        {
            throw new InvalidOperationException("Failed to approve template");
        }

        _logger.LogInformation(
            "Template {TemplateId} approved by reviewer {ReviewerId}",
            templateId,
            reviewerId);

        // Note: Task pool refill will be triggered by the background service
        // that monitors pool levels. No need to trigger it synchronously here.
    }

    public async Task RejectTemplateAsync(
        string templateId,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var template = await _taskTemplateRepository.GetByIdAsync(templateId);
        if (template == null)
        {
            throw new InvalidOperationException("Template not found");
        }

        if (template.IsApproved)
        {
            throw new InvalidOperationException("Cannot reject an approved template");
        }

        var success = await _taskTemplateRepository.DeleteAsync(templateId);
        if (!success)
        {
            throw new InvalidOperationException("Failed to reject template");
        }

        _logger.LogInformation(
            "Template {TemplateId} rejected. Reason: {Reason}",
            templateId,
            reason ?? "No reason provided");
    }
}

