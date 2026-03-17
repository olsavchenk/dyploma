using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;
using Stride.Services.Interfaces;
using Stride.Services.Models.Class;

namespace Stride.Services.Implementations;

public class ClassService : IClassService
{
    private readonly StrideDbContext _dbContext;
    private readonly ITaskGenerationService _taskGenerationService;
    private readonly ILogger<ClassService> _logger;
    private const string JoinCodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private const int JoinCodeLength = 6;

    public ClassService(
        StrideDbContext dbContext,
        ITaskGenerationService taskGenerationService,
        ILogger<ClassService> logger)
    {
        _dbContext = dbContext;
        _taskGenerationService = taskGenerationService;
        _logger = logger;
    }

    public async Task<ClassDto> CreateClassAsync(Guid teacherId, CreateClassRequest request)
    {
        // Verify teacher exists
        var teacherProfile = await _dbContext.TeacherProfiles
            .Include(tp => tp.User)
            .FirstOrDefaultAsync(tp => tp.Id == teacherId);

        if (teacherProfile == null)
        {
            throw new InvalidOperationException("Teacher profile not found");
        }

        // Generate unique join code
        var joinCode = await GenerateUniqueJoinCodeAsync();

        var classEntity = new Class
        {
            Id = Guid.NewGuid(),
            TeacherId = teacherId,
            Name = request.Name,
            JoinCode = joinCode,
            GradeLevel = request.GradeLevel,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Classes.Add(classEntity);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation(
            "Class {ClassName} created by teacher {TeacherId} with join code {JoinCode}",
            classEntity.Name,
            teacherId,
            joinCode);

        return new ClassDto
        {
            Id = classEntity.Id,
            TeacherId = classEntity.TeacherId,
            TeacherName = teacherProfile.User.DisplayName,
            Name = classEntity.Name,
            JoinCode = classEntity.JoinCode,
            GradeLevel = classEntity.GradeLevel,
            IsActive = classEntity.IsActive,
            StudentCount = 0,
            CreatedAt = classEntity.CreatedAt,
            UpdatedAt = classEntity.UpdatedAt
        };
    }

    public async Task<List<ClassDto>> GetTeacherClassesAsync(Guid teacherId)
    {
        var classes = await _dbContext.Classes
            .Include(c => c.Teacher)
                .ThenInclude(t => t.User)
            .Include(c => c.Memberships)
            .Where(c => c.TeacherId == teacherId && c.IsActive)
            .OrderByDescending(c => c.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return classes.Select(c => new ClassDto
        {
            Id = c.Id,
            TeacherId = c.TeacherId,
            TeacherName = c.Teacher.User.DisplayName,
            Name = c.Name,
            JoinCode = c.JoinCode,
            GradeLevel = c.GradeLevel,
            IsActive = c.IsActive,
            StudentCount = c.Memberships.Count,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        }).ToList();
    }

    public async Task<ClassQuickStatsDto> GetTeacherQuickStatsAsync(Guid teacherId)
    {
        var classes = await _dbContext.Classes
            .Include(c => c.Memberships)
            .Where(c => c.TeacherId == teacherId && c.IsActive)
            .AsNoTracking()
            .ToListAsync();

        var totalClasses = classes.Count;
        var totalStudents = classes.Sum(c => c.Memberships.Count);
        var averageClassSize = totalClasses > 0
            ? Math.Round((double)totalStudents / totalClasses, 1)
            : 0;

        var classIds = classes.Select(c => c.Id).ToList();
        var weekStart = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek);

        var studentProfileIds = await _dbContext.ClassMemberships
            .Where(m => classIds.Contains(m.ClassId))
            .Select(m => m.StudentId)
            .Distinct()
            .ToListAsync();

        var activeThisWeek = await _dbContext.TaskAttempts
            .Where(ta => studentProfileIds.Contains(ta.StudentId) && ta.CreatedAt >= weekStart)
            .Select(ta => ta.StudentId)
            .Distinct()
            .CountAsync();

        return new ClassQuickStatsDto
        {
            TotalClasses = totalClasses,
            TotalStudents = totalStudents,
            ActiveThisWeek = activeThisWeek,
            AverageClassSize = averageClassSize
        };
    }

    public async Task<ClassDto?> GetClassByIdAsync(Guid classId, Guid userId)
    {
        var classEntity = await _dbContext.Classes
            .Include(c => c.Teacher)
                .ThenInclude(t => t.User)
            .Include(c => c.Memberships)
            .Where(c => c.Id == classId && c.IsActive)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (classEntity == null)
        {
            return null;
        }

        // Verify user has access (teacher owns class or student is member)
        var user = await _dbContext.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.TeacherProfile)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return null;
        }

        var hasAccess = (user.TeacherProfile != null && classEntity.TeacherId == user.TeacherProfile.Id) ||
                        (user.StudentProfile != null &&
                         classEntity.Memberships.Any(m => m.StudentId == user.StudentProfile.Id));

        if (!hasAccess)
        {
            return null;
        }

        return new ClassDto
        {
            Id = classEntity.Id,
            TeacherId = classEntity.TeacherId,
            TeacherName = classEntity.Teacher.User.DisplayName,
            Name = classEntity.Name,
            JoinCode = classEntity.JoinCode,
            GradeLevel = classEntity.GradeLevel,
            IsActive = classEntity.IsActive,
            StudentCount = classEntity.Memberships.Count,
            CreatedAt = classEntity.CreatedAt,
            UpdatedAt = classEntity.UpdatedAt
        };
    }

    public async Task<string> JoinClassAsync(Guid studentId, string joinCode)
    {
        // Find class by join code
        var classEntity = await _dbContext.Classes
            .Include(c => c.Memberships)
            .FirstOrDefaultAsync(c => c.JoinCode == joinCode && c.IsActive);

        if (classEntity == null)
        {
            throw new InvalidOperationException("Invalid join code or class is not active");
        }

        // Check if student already joined
        var existingMembership = await _dbContext.ClassMemberships
            .FirstOrDefaultAsync(cm => cm.ClassId == classEntity.Id && cm.StudentId == studentId);

        if (existingMembership != null)
        {
            throw new InvalidOperationException("You have already joined this class");
        }

        // Verify student exists
        var student = await _dbContext.StudentProfiles
            .Include(sp => sp.User)
            .FirstOrDefaultAsync(sp => sp.Id == studentId);

        if (student == null)
        {
            throw new InvalidOperationException("Student profile not found");
        }

        // Create membership
        var membership = new ClassMembership
        {
            Id = Guid.NewGuid(),
            ClassId = classEntity.Id,
            StudentId = studentId,
            JoinedAt = DateTime.UtcNow
        };

        _dbContext.ClassMemberships.Add(membership);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation(
            "Student {StudentId} joined class {ClassName} ({ClassId})",
            studentId,
            classEntity.Name,
            classEntity.Id);

        return classEntity.Name;
    }

    public async Task<List<StudentRosterDto>> GetClassStudentsAsync(Guid classId, Guid teacherId)
    {
        // Verify teacher owns the class
        var classEntity = await _dbContext.Classes
            .FirstOrDefaultAsync(c => c.Id == classId && c.TeacherId == teacherId && c.IsActive);

        if (classEntity == null)
        {
            throw new InvalidOperationException("Class not found or you don't have access");
        }

        var students = await _dbContext.ClassMemberships
            .Include(cm => cm.Student)
                .ThenInclude(s => s.User)
            .Where(cm => cm.ClassId == classId)
            .OrderBy(cm => cm.Student.User.DisplayName)
            .AsNoTracking()
            .ToListAsync();

        return students.Select(cm => new StudentRosterDto
        {
            StudentId = cm.StudentId,
            DisplayName = cm.Student.User.DisplayName,
            AvatarUrl = cm.Student.User.AvatarUrl,
            CurrentLevel = cm.Student.CurrentLevel,
            TotalXp = cm.Student.TotalXp,
            CurrentStreak = cm.Student.CurrentStreak,
            JoinedAt = cm.JoinedAt,
            LastActiveDate = cm.Student.LastActiveDate
        }).ToList();
    }

    public async Task<AssignmentDto> CreateAssignmentAsync(Guid classId, Guid teacherId, CreateAssignmentRequest request)
    {
        // Verify teacher owns the class
        var classEntity = await _dbContext.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classId && c.TeacherId == teacherId && c.IsActive);

        if (classEntity == null)
        {
            throw new InvalidOperationException("Class not found or you don't have access");
        }

        // Resolve or auto-create subject and topic
        var topicId = await ResolveOrCreateTopicAsync(request.SubjectName, request.TopicName, classEntity.GradeLevel);

        var assignment = new ClassAssignment
        {
            Id = Guid.NewGuid(),
            ClassId = classId,
            TopicId = topicId,
            SubjectName = request.SubjectName,
            TopicName = request.TopicName,
            Title = request.Title,
            Description = request.Description,
            DueDate = request.DueDate,
            TaskCount = request.TaskCount,
            MinDifficulty = request.MinDifficulty,
            MaxDifficulty = request.MaxDifficulty,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ClassAssignments.Add(assignment);
        await _dbContext.SaveChangesAsync();

        // Trigger AI task generation
        Guid? generationJobId = null;
        try
        {
            generationJobId = await _taskGenerationService.StartGenerationAsync(
                assignment.Id,
                topicId,
                request.TaskCount,
                request.MinDifficulty,
                request.MaxDifficulty,
                request.SubjectName,
                request.TopicName,
                classEntity.GradeLevel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to start task generation for assignment {AssignmentId}, topic {TopicId}",
                assignment.Id, topicId);
        }

        _logger.LogInformation(
            "Assignment {AssignmentTitle} created for class {ClassId} by teacher {TeacherId}, generation job {JobId}",
            assignment.Title,
            classId,
            teacherId,
            generationJobId);

        return new AssignmentDto
        {
            Id = assignment.Id,
            ClassId = assignment.ClassId,
            TopicId = assignment.TopicId,
            SubjectName = assignment.SubjectName,
            TopicName = assignment.TopicName,
            Title = assignment.Title,
            Description = assignment.Description,
            DueDate = assignment.DueDate,
            TaskCount = assignment.TaskCount,
            MinDifficulty = assignment.MinDifficulty,
            MaxDifficulty = assignment.MaxDifficulty,
            CreatedAt = assignment.CreatedAt,
            GenerationJobId = generationJobId
        };
    }

    public async Task<List<AssignmentDto>> GetClassAssignmentsAsync(Guid classId, Guid teacherId)
    {
        // Verify teacher owns the class
        var classExists = await _dbContext.Classes
            .AsNoTracking()
            .AnyAsync(c => c.Id == classId && c.TeacherId == teacherId && c.IsActive);

        if (!classExists)
        {
            throw new InvalidOperationException("Class not found or you don't have access");
        }

        var assignments = await _dbContext.ClassAssignments
            .AsNoTracking()
            .Where(a => a.ClassId == classId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AssignmentDto
            {
                Id = a.Id,
                ClassId = a.ClassId,
                TopicId = a.TopicId,
                SubjectName = a.SubjectName,
                TopicName = a.TopicName,
                Title = a.Title,
                Description = a.Description,
                DueDate = a.DueDate,
                TaskCount = a.TaskCount,
                MinDifficulty = a.MinDifficulty,
                MaxDifficulty = a.MaxDifficulty,
                CreatedAt = a.CreatedAt,
                CompletionRate = 0,
                AverageScore = 0,
                GenerationJobId = _dbContext.TaskGenerationJobs
                    .Where(j => j.AssignmentId == a.Id)
                    .OrderByDescending(j => j.CreatedAt)
                    .Select(j => (Guid?)j.Id)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return assignments;
    }

    private async Task<Guid> ResolveOrCreateTopicAsync(string subjectName, string topicName, int gradeLevel)
    {
        // Try to find existing topic
        var existingTopic = await _dbContext.Topics
            .Include(t => t.Subject)
            .FirstOrDefaultAsync(t =>
                t.IsActive &&
                t.Name == topicName &&
                t.Subject.Name == subjectName);

        if (existingTopic != null)
            return existingTopic.Id;

        // Find or create subject
        var subject = await _dbContext.Subjects
            .FirstOrDefaultAsync(s => s.Name == subjectName && s.IsActive);

        if (subject == null)
        {
            subject = new Subject
            {
                Id = Guid.NewGuid(),
                Name = subjectName,
                Slug = subjectName.ToLowerInvariant().Replace(' ', '-'),
                Description = subjectName,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Subjects.Add(subject);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Auto-created subject {SubjectName} ({SubjectId})", subjectName, subject.Id);
        }

        // Create topic
        var topic = new Topic
        {
            Id = Guid.NewGuid(),
            SubjectId = subject.Id,
            Name = topicName,
            Slug = topicName.ToLowerInvariant().Replace(' ', '-'),
            Description = topicName,
            GradeLevel = gradeLevel,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.Topics.Add(topic);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Auto-created topic {TopicName} ({TopicId}) for subject {SubjectName}",
            topicName, topic.Id, subjectName);

        return topic.Id;
    }

    public async Task<List<StudentAssignmentDto>> GetStudentAssignmentsAsync(Guid studentId)
    {
        // Get all class memberships for the student
        var classMemberships = await _dbContext.ClassMemberships
            .Include(cm => cm.Class)
                .ThenInclude(c => c.Teacher)
                    .ThenInclude(t => t.User)
            .Where(cm => cm.StudentId == studentId)
            .AsNoTracking()
            .ToListAsync();

        var classIds = classMemberships.Select(cm => cm.ClassId).ToList();

        // Get all assignments for those classes
        var assignments = await _dbContext.ClassAssignments
            .Where(a => classIds.Contains(a.ClassId))
            .OrderBy(a => a.DueDate ?? DateTime.MaxValue)
            .ThenByDescending(a => a.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        // Get task attempts only for assignments that have a resolved TopicId
        var topicIds = assignments
            .Where(a => a.TopicId.HasValue)
            .Select(a => a.TopicId!.Value)
            .Distinct()
            .ToList();

        Dictionary<Guid, int> attemptDict;
        if (topicIds.Any())
        {
            var taskAttempts = await _dbContext.TaskAttempts
                .Where(ta => ta.StudentId == studentId && topicIds.Contains(ta.TopicId))
                .GroupBy(ta => ta.TopicId)
                .Select(g => new { TopicId = g.Key, Count = g.Count() })
                .AsNoTracking()
                .ToListAsync();

            attemptDict = taskAttempts.ToDictionary(ta => ta.TopicId, ta => ta.Count);
        }
        else
        {
            attemptDict = new Dictionary<Guid, int>();
        }

        var result = new List<StudentAssignmentDto>();

        foreach (var assignment in assignments)
        {
            var classMembership = classMemberships.First(cm => cm.ClassId == assignment.ClassId);
            var completedCount = assignment.TopicId.HasValue
                ? attemptDict.GetValueOrDefault(assignment.TopicId.Value, 0)
                : 0;
            var progressPercentage = assignment.TaskCount > 0
                ? Math.Min(100, (decimal)completedCount / assignment.TaskCount * 100)
                : 0;
            var isCompleted = completedCount >= assignment.TaskCount;
            var isOverdue = assignment.DueDate.HasValue && assignment.DueDate.Value < DateTime.UtcNow && !isCompleted;

            result.Add(new StudentAssignmentDto
            {
                Id = assignment.Id,
                ClassName = classMembership.Class.Name,
                TeacherName = classMembership.Class.Teacher.User.DisplayName,
                TopicId = assignment.TopicId,
                SubjectName = assignment.SubjectName,
                TopicName = assignment.TopicName,
                Title = assignment.Title,
                Description = assignment.Description,
                DueDate = assignment.DueDate,
                TaskCount = assignment.TaskCount,
                CompletedCount = completedCount,
                ProgressPercentage = progressPercentage,
                IsCompleted = isCompleted,
                IsOverdue = isOverdue,
                CreatedAt = assignment.CreatedAt
            });
        }

        return result;
    }

    public async Task<List<StudentClassDto>> GetStudentClassesAsync(Guid studentId)
    {
        var memberships = await _dbContext.ClassMemberships
            .Include(cm => cm.Class)
                .ThenInclude(c => c.Teacher)
                    .ThenInclude(t => t.User)
            .Where(cm => cm.StudentId == studentId)
            .OrderByDescending(cm => cm.JoinedAt)
            .AsNoTracking()
            .ToListAsync();

        if (!memberships.Any())
            return [];

        var classIds = memberships.Select(cm => cm.ClassId).ToList();

        var assignments = await _dbContext.ClassAssignments
            .Include(a => a.Topic)
                .ThenInclude(t => t!.Subject)
            .Where(a => classIds.Contains(a.ClassId))
            .AsNoTracking()
            .ToListAsync();

        var topicIds = assignments
            .Where(a => a.TopicId.HasValue)
            .Select(a => a.TopicId!.Value)
            .Distinct()
            .ToList();

        Dictionary<Guid, int> attemptDict = [];
        if (topicIds.Count > 0)
        {
            var attempts = await _dbContext.TaskAttempts
                .Where(ta => ta.StudentId == studentId && topicIds.Contains(ta.TopicId))
                .GroupBy(ta => ta.TopicId)
                .Select(g => new { TopicId = g.Key, Count = g.Count() })
                .AsNoTracking()
                .ToListAsync();
            attemptDict = attempts.ToDictionary(a => a.TopicId, a => a.Count);
        }

        // Resolve subjects by name for assignments without a resolved TopicId
        var unlinkedSubjectNames = assignments
            .Where(a => a.TopicId == null || a.Topic == null)
            .Select(a => a.SubjectName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var subjectByName = new Dictionary<string, Subject>(StringComparer.OrdinalIgnoreCase);
        if (unlinkedSubjectNames.Count > 0)
        {
            var matchedSubjects = await _dbContext.Subjects
                .Where(s => s.IsActive && unlinkedSubjectNames.Contains(s.Name))
                .AsNoTracking()
                .ToListAsync();
            foreach (var s in matchedSubjects)
                subjectByName[s.Name] = s;
        }

        var assignmentsByClass = assignments
            .GroupBy(a => a.ClassId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var result = new List<StudentClassDto>();

        foreach (var cm in memberships)
        {
            var classAssignments = assignmentsByClass.GetValueOrDefault(cm.ClassId, []);

            var subjectMap = new Dictionary<string, Subject?>(StringComparer.OrdinalIgnoreCase);
            var assignmentMap = new Dictionary<string, List<ClassAssignment>>(StringComparer.OrdinalIgnoreCase);

            foreach (var assignment in classAssignments)
            {
                Subject? subject = null;
                string subjectKey;

                if (assignment.TopicId.HasValue && assignment.Topic?.Subject != null)
                {
                    subject = assignment.Topic.Subject;
                    subjectKey = subject.Name;
                }
                else if (subjectByName.TryGetValue(assignment.SubjectName, out var resolved))
                {
                    subject = resolved;
                    subjectKey = subject.Name;
                }
                else
                {
                    subjectKey = assignment.SubjectName;
                }

                if (!assignmentMap.ContainsKey(subjectKey))
                {
                    subjectMap[subjectKey] = subject;
                    assignmentMap[subjectKey] = [];
                }
                assignmentMap[subjectKey].Add(assignment);
            }

            var subjectDtos = assignmentMap.Select(kvp =>
            {
                var subj = subjectMap[kvp.Key];
                var totalTasks = kvp.Value.Sum(a => a.TaskCount);
                var completed = kvp.Value
                    .Where(a => a.TopicId.HasValue)
                    .Sum(a => attemptDict.GetValueOrDefault(a.TopicId!.Value, 0));
                var progress = totalTasks > 0
                    ? Math.Min(100.0, (double)completed / totalTasks * 100)
                    : 0.0;

                return new StudentClassSubjectDto
                {
                    SubjectId = subj?.Id,
                    Name = subj?.Name ?? kvp.Key,
                    IconUrl = subj?.IconUrl,
                    Description = subj?.Description,
                    AssignmentCount = kvp.Value.Count,
                    CompletedCount = completed,
                    ProgressPercentage = Math.Round(progress, 1)
                };
            }).ToList();

            result.Add(new StudentClassDto
            {
                Id = cm.Class.Id,
                Name = cm.Class.Name,
                GradeLevel = cm.Class.GradeLevel,
                TeacherName = cm.Class.Teacher.User.DisplayName,
                JoinedAt = cm.JoinedAt,
                Subjects = subjectDtos
            });
        }

        return result;
    }

    public async Task<ClassAnalyticsDto> GetClassAnalyticsAsync(Guid classId, Guid teacherId)
    {
        // Verify teacher owns the class
        var classEntity = await _dbContext.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classId && c.TeacherId == teacherId && c.IsActive);

        if (classEntity == null)
        {
            throw new InvalidOperationException("Class not found or you don't have access");
        }

        // Get all students in the class
        var students = await _dbContext.ClassMemberships
            .Include(cm => cm.Student)
                .ThenInclude(s => s.User)
            .Where(cm => cm.ClassId == classId)
            .AsNoTracking()
            .ToListAsync();

        var studentIds = students.Select(s => s.StudentId).ToList();
        var totalStudents = students.Count;

        // Get active students (last 7 days)
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
        var activeStudents = students.Count(s => 
            s.Student.LastActiveDate.HasValue && s.Student.LastActiveDate.Value >= sevenDaysAgo);

        // Get all task attempts for students in this class
        var taskAttempts = await _dbContext.TaskAttempts
            .Include(ta => ta.Topic)
            .Where(ta => studentIds.Contains(ta.StudentId))
            .AsNoTracking()
            .ToListAsync();

        var totalTasksCompleted = taskAttempts.Count;
        var averageAccuracy = taskAttempts.Any() 
            ? (decimal)taskAttempts.Count(ta => ta.IsCorrect) / taskAttempts.Count * 100 
            : 0;

        // Top performers (top 5 by XP)
        var topPerformers = students
            .OrderByDescending(s => s.Student.TotalXp)
            .Take(5)
            .Select(s =>
            {
                var studentAttempts = taskAttempts.Where(ta => ta.StudentId == s.StudentId).ToList();
                var studentAccuracy = studentAttempts.Any()
                    ? (decimal)studentAttempts.Count(ta => ta.IsCorrect) / studentAttempts.Count * 100
                    : 0;

                return new TopPerformerDto
                {
                    StudentId = s.StudentId,
                    DisplayName = s.Student.User.DisplayName,
                    AvatarUrl = s.Student.User.AvatarUrl,
                    TotalXp = s.Student.TotalXp,
                    AverageAccuracy = studentAccuracy,
                    TasksCompleted = studentAttempts.Count
                };
            })
            .ToList();

        // Struggling students (accuracy < 60% and at least 10 attempts, or inactive > 7 days)
        var strugglingStudents = students
            .Select(s =>
            {
                var studentAttempts = taskAttempts.Where(ta => ta.StudentId == s.StudentId).ToList();
                var studentAccuracy = studentAttempts.Any()
                    ? (decimal)studentAttempts.Count(ta => ta.IsCorrect) / studentAttempts.Count * 100
                    : 0;
                var daysSinceActive = s.Student.LastActiveDate.HasValue
                    ? (int)(DateTime.UtcNow - s.Student.LastActiveDate.Value).TotalDays
                    : int.MaxValue;

                return new
                {
                    Student = s,
                    Accuracy = studentAccuracy,
                    AttemptsCount = studentAttempts.Count,
                    DaysSinceActive = daysSinceActive
                };
            })
            .Where(s => (s.Accuracy < 60 && s.AttemptsCount >= 10) || s.DaysSinceActive > 7)
            .OrderBy(s => s.Accuracy)
            .Take(5)
            .Select(s => new StrugglingStudentDto
            {
                StudentId = s.Student.StudentId,
                DisplayName = s.Student.Student.User.DisplayName,
                AvatarUrl = s.Student.Student.User.AvatarUrl,
                AverageAccuracy = s.Accuracy,
                TasksAttempted = s.AttemptsCount,
                DaysSinceLastActive = s.DaysSinceActive == int.MaxValue ? 999 : s.DaysSinceActive
            })
            .ToList();

        // Topic statistics
        var topicStats = taskAttempts
            .GroupBy(ta => new { ta.TopicId, ta.Topic.Name })
            .Select(g =>
            {
                var studentCount = g.Select(ta => ta.StudentId).Distinct().Count();
                var accuracy = (decimal)g.Count(ta => ta.IsCorrect) / g.Count() * 100;

                return new TopicStatDto
                {
                    TopicId = g.Key.TopicId,
                    TopicName = g.Key.Name,
                    StudentsAttempted = studentCount,
                    AverageAccuracy = accuracy,
                    AverageMastery = 0 // Will be calculated from performance data
                };
            })
            .ToList();

        // Get mastery data
        var performances = await _dbContext.StudentPerformances
            .Where(sp => studentIds.Contains(sp.StudentId))
            .AsNoTracking()
            .ToListAsync();

        foreach (var topicStat in topicStats)
        {
            var topicPerformances = performances.Where(p => p.TopicId == topicStat.TopicId).ToList();
            if (topicPerformances.Any())
            {
                topicStat.AverageMastery = topicPerformances.Average(p => p.TopicMastery) * 100;
            }
        }

        return new ClassAnalyticsDto
        {
            ClassId = classId,
            ClassName = classEntity.Name,
            TotalStudents = totalStudents,
            ActiveStudents = activeStudents,
            AverageAccuracy = averageAccuracy,
            TotalTasksCompleted = totalTasksCompleted,
            TopPerformers = topPerformers,
            StrugglingStudents = strugglingStudents,
            TopicStats = topicStats.OrderByDescending(ts => ts.StudentsAttempted).ToList()
        };
    }

    public async Task<StudentPerformanceDetailDto> GetStudentPerformanceDetailAsync(
        Guid classId, 
        Guid studentId, 
        Guid teacherId)
    {
        // Verify teacher owns the class
        var classEntity = await _dbContext.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classId && c.TeacherId == teacherId && c.IsActive);

        if (classEntity == null)
        {
            throw new InvalidOperationException("Class not found or you don't have access");
        }

        // Verify student is in the class
        var membership = await _dbContext.ClassMemberships
            .Include(cm => cm.Student)
                .ThenInclude(s => s.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(cm => cm.ClassId == classId && cm.StudentId == studentId);

        if (membership == null)
        {
            throw new InvalidOperationException("Student not found in this class");
        }

        var student = membership.Student;

        // Get all task attempts
        var taskAttempts = await _dbContext.TaskAttempts
            .AsNoTracking()
            .Where(ta => ta.StudentId == studentId)
            .ToListAsync();

        var totalTasksCompleted = taskAttempts.Count;
        var overallAccuracy = taskAttempts.Any()
            ? (decimal)taskAttempts.Count(ta => ta.IsCorrect) / taskAttempts.Count * 100
            : 0;

        // Get performance by topic
        var performances = await _dbContext.StudentPerformances
            .Include(sp => sp.Topic)
            .Where(sp => sp.StudentId == studentId)
            .OrderByDescending(sp => sp.TotalAttempted)
            .AsNoTracking()
            .ToListAsync();

        var topicPerformances = performances.Select(p => new TopicPerformanceDto
        {
            TopicId = p.TopicId,
            TopicName = p.Topic.Name,
            CurrentDifficulty = p.CurrentDifficulty,
            RollingAccuracy = p.RollingAccuracy * 100,
            TopicMastery = p.TopicMastery * 100,
            TotalAttempted = p.TotalAttempted,
            CurrentStreak = p.CurrentStreak,
            StreakDirection = p.StreakDirection,
            LastActiveAt = p.LastActiveAt
        }).ToList();

        return new StudentPerformanceDetailDto
        {
            StudentId = studentId,
            DisplayName = student.User.DisplayName,
            AvatarUrl = student.User.AvatarUrl,
            CurrentLevel = student.CurrentLevel,
            TotalXp = student.TotalXp,
            CurrentStreak = student.CurrentStreak,
            LastActiveDate = student.LastActiveDate,
            JoinedAt = membership.JoinedAt,
            TotalTasksCompleted = totalTasksCompleted,
            OverallAccuracy = overallAccuracy,
            TopicPerformances = topicPerformances
        };
    }

    private async Task<string> GenerateUniqueJoinCodeAsync()
    {
        var maxAttempts = 10;
        var attempt = 0;

        while (attempt < maxAttempts)
        {
            var joinCode = GenerateSecureJoinCode();

            var exists = await _dbContext.Classes
                .AnyAsync(c => c.JoinCode == joinCode && c.IsActive);

            if (!exists)
            {
                return joinCode;
            }

            attempt++;
        }

        throw new InvalidOperationException("Failed to generate unique join code after multiple attempts");
    }

    private static string GenerateSecureJoinCode()
    {
        var bytes = new byte[JoinCodeLength];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);

        var chars = new char[JoinCodeLength];
        for (var i = 0; i < JoinCodeLength; i++)
        {
            chars[i] = JoinCodeChars[bytes[i] % JoinCodeChars.Length];
        }

        return new string(chars);
    }
}
