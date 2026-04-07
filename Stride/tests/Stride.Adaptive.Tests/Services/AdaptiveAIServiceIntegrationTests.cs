using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Models;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Services.Implementations;
using Stride.Adaptive.Services.Interfaces;
using Stride.Core.Documents;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;
using Stride.DataAccess.Repositories;
using Stride.Services.Implementations;
using Stride.Services.Interfaces;
using Stride.Services.Configuration;
using Microsoft.Extensions.Options;
using Xunit;

namespace Stride.Adaptive.Tests.Services;

public class AdaptiveAIServiceIntegrationTests : IDisposable
{
    private readonly StrideDbContext _context;
    private readonly AdaptiveAIService _adaptiveAIService;
    private readonly GamificationService _gamificationService;
    private readonly Mock<ITaskPoolService> _taskPoolServiceMock;
    private readonly Mock<ITaskInstanceRepository> _instanceRepositoryMock;
    private readonly Mock<IDifficultyEngine> _difficultyEngineMock;

    public AdaptiveAIServiceIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<StrideDbContext>()
            .UseInMemoryDatabase(databaseName: $"StrideTestDb_{Guid.NewGuid()}")
            .Options;

        _context = new StrideDbContext(options);

        // Setup gamification settings
        var gamificationSettings = Options.Create(new GamificationSettings
        {
            Xp = new XpSettings
            {
                BaseXp = 10,
                MinDifficultyMultiplier = 1.0,
                MaxDifficultyMultiplier = 3.0,
                MinStreakMultiplier = 1.0,
                MaxStreakMultiplier = 2.0,
                StreakThresholdForBonus = 3,
                FirstTaskOfDayBonus = 50,
                PerfectLessonBonus = 100,
                PerfectLessonThreshold = 10
            },
            Level = new LevelSettings
            {
                Level1To10XpPerLevel = 100,
                Level11To25XpPerLevel = 250,
                Level26To50XpPerLevel = 500,
                Level51To100XpPerLevel = 1000
            },
            Streak = new StreakSettings
            {
                FreezeXpCost = 200,
                MaxFreezes = 2,
                RepairXpCost = 400,
                RepairWindowHours = 24
            }
        });

        _gamificationService = new GamificationService(
            _context,
            gamificationSettings,
            Mock.Of<IAchievementService>(),
            Mock.Of<ILeaderboardService>(),
            NullLogger<GamificationService>.Instance);

        _taskPoolServiceMock = new Mock<ITaskPoolService>();
        _instanceRepositoryMock = new Mock<ITaskInstanceRepository>();
        _difficultyEngineMock = new Mock<IDifficultyEngine>();

        // Setup default difficulty engine behavior
        _difficultyEngineMock
            .Setup(x => x.CalculateNextDifficulty(It.IsAny<StudentPerformance>(), It.IsAny<TaskAttempt>()))
            .Returns(new DifficultyPrediction
            {
                NextDifficulty = 50,
                Confidence = 0.85f,
                Method = "Mock"
            });

        _adaptiveAIService = new AdaptiveAIService(
            _taskPoolServiceMock.Object,
            _difficultyEngineMock.Object,
            _instanceRepositoryMock.Object,
            _gamificationService,
            _context,
            Mock.Of<ILogger<AdaptiveAIService>>());
    }

    [Fact]
    public async Task ProcessAnswerAsync_FirstTaskOfDay_UpdatesStreakAndAwardsBonus()
    {
        // Arrange
        var studentId = Guid.NewGuid();
        var topicId = Guid.NewGuid();

        var user = new User
        {
            Id = studentId,
            Email = "test@example.com",
            DisplayName = "Test Student",
            PasswordHash = "hash",
            Role = "Student"
        };

        var studentProfile = new StudentProfile
        {
            Id = studentId,
            UserId = studentId,
            TotalXp = 0,
            CurrentLevel = 1,
            CurrentStreak = 0,
            LongestStreak = 0,
            StreakFreezes = 0,
            LastActiveDate = null
        };

        var topic = new Topic
        {
            Id = topicId,
            Name = "Test Topic",
            SubjectId = Guid.NewGuid(),
            GradeLevel = 5,
            SortOrder = 1
        };

        _context.Users.Add(user);
        _context.StudentProfiles.Add(studentProfile);
        _context.Topics.Add(topic);
        await _context.SaveChangesAsync();

        var taskInstance = new TaskInstanceDocument
        {
            Id = "task-instance-1",
            TopicId = topicId,
            Difficulty = 50,
            RenderedContent = new TaskContent
            {
                Question = "What is 2+2?",
                Answer = MongoDB.Bson.BsonValue.Create("4")
            }
        };

        _instanceRepositoryMock
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(taskInstance);

        var request = new ProcessAnswerRequest
        {
            StudentId = studentId,
            TopicId = topicId,
            TaskInstanceId = "task-instance-1",
            IsCorrect = true,
            ResponseTimeMs = 5000
        };

        // Act
        var result = await _adaptiveAIService.ProcessAnswerAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.XpEarned.Should().BeGreaterThan(10); // Base XP + first task bonus

        var updatedProfile = await _context.StudentProfiles
            .FirstOrDefaultAsync(sp => sp.Id == studentId);

        updatedProfile.Should().NotBeNull();
        updatedProfile!.CurrentStreak.Should().Be(1);
        updatedProfile.LongestStreak.Should().Be(1);
        updatedProfile.LastActiveDate.Should().NotBeNull();
        updatedProfile.TotalXp.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task ProcessAnswerAsync_ConsecutiveDays_IncrementsStreak()
    {
        // Arrange
        var studentId = Guid.NewGuid();
        var topicId = Guid.NewGuid();

        var user = new User
        {
            Id = studentId,
            Email = "test2@example.com",
            DisplayName = "Test Student 2",
            PasswordHash = "hash",
            Role = "Student"
        };

        var studentProfile = new StudentProfile
        {
            Id = studentId,
            UserId = studentId,
            TotalXp = 100,
            CurrentLevel = 2,
            CurrentStreak = 5,
            LongestStreak = 5,
            StreakFreezes = 0,
            LastActiveDate = DateTime.UtcNow.Date.AddDays(-1) // Yesterday
        };

        var topic = new Topic
        {
            Id = topicId,
            Name = "Test Topic 2",
            SubjectId = Guid.NewGuid(),
            GradeLevel = 5,
            SortOrder = 1
        };

        _context.Users.Add(user);
        _context.StudentProfiles.Add(studentProfile);
        _context.Topics.Add(topic);
        await _context.SaveChangesAsync();

        var taskInstance = new TaskInstanceDocument
        {
            Id = "task-instance-2",
            TopicId = topicId,
            Difficulty = 60,
            RenderedContent = new TaskContent
            {
                Question = "What is 3+3?",
                Answer = MongoDB.Bson.BsonValue.Create("6")
            }
        };

        _instanceRepositoryMock
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(taskInstance);

        var request = new ProcessAnswerRequest
        {
            StudentId = studentId,
            TopicId = topicId,
            TaskInstanceId = "task-instance-2",
            IsCorrect = true,
            ResponseTimeMs = 4000
        };

        // Act
        var result = await _adaptiveAIService.ProcessAnswerAsync(request);

        // Assert
        result.Should().NotBeNull();

        var updatedProfile = await _context.StudentProfiles
            .FirstOrDefaultAsync(sp => sp.Id == studentId);

        updatedProfile.Should().NotBeNull();
        updatedProfile!.CurrentStreak.Should().Be(6); // Incremented from 5 to 6
        updatedProfile.LongestStreak.Should().Be(6); // New record
        updatedProfile.LastActiveDate.Should().NotBeNull();
        updatedProfile.LastActiveDate!.Value.Date.Should().Be(DateTime.UtcNow.Date);
    }

    [Fact]
    public async Task ProcessAnswerAsync_IncorrectAnswer_NoXpButStreakStillUpdated()
    {
        // Arrange
        var studentId = Guid.NewGuid();
        var topicId = Guid.NewGuid();

        var user = new User
        {
            Id = studentId,
            Email = "test3@example.com",
            DisplayName = "Test Student 3",
            PasswordHash = "hash",
            Role = "Student"
        };

        var studentProfile = new StudentProfile
        {
            Id = studentId,
            UserId = studentId,
            TotalXp = 50,
            CurrentLevel = 1,
            CurrentStreak = 2,
            LongestStreak = 3,
            StreakFreezes = 0,
            LastActiveDate = DateTime.UtcNow.Date.AddDays(-1)
        };

        var topic = new Topic
        {
            Id = topicId,
            Name = "Test Topic 3",
            SubjectId = Guid.NewGuid(),
            GradeLevel = 5,
            SortOrder = 1
        };

        _context.Users.Add(user);
        _context.StudentProfiles.Add(studentProfile);
        _context.Topics.Add(topic);
        await _context.SaveChangesAsync();

        var taskInstance = new TaskInstanceDocument
        {
            Id = "task-instance-3",
            TopicId = topicId,
            Difficulty = 70,
            RenderedContent = new TaskContent
            {
                Question = "What is 5+7?",
                Answer = MongoDB.Bson.BsonValue.Create("12")
            }
        };

        _instanceRepositoryMock
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(taskInstance);

        var request = new ProcessAnswerRequest
        {
            StudentId = studentId,
            TopicId = topicId,
            TaskInstanceId = "task-instance-3",
            IsCorrect = false, // Wrong answer
            ResponseTimeMs = 6000
        };

        // Act
        var result = await _adaptiveAIService.ProcessAnswerAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.XpEarned.Should().Be(0); // No XP for incorrect answer

        var updatedProfile = await _context.StudentProfiles
            .FirstOrDefaultAsync(sp => sp.Id == studentId);

        updatedProfile.Should().NotBeNull();
        updatedProfile!.CurrentStreak.Should().Be(3); // Daily streak still incremented
        updatedProfile.LastActiveDate.Should().NotBeNull();
        updatedProfile.TotalXp.Should().Be(50); // No XP change
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
