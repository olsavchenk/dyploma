using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Models;
using Stride.Adaptive.Services.Implementations;
using Stride.Adaptive.Services.Interfaces;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;

namespace Stride.Adaptive.Tests.Services;

public class StudentPerformanceServiceTests
{
    private readonly Mock<IDifficultyEngine> _mockDifficultyEngine;
    private readonly Mock<ILogger<StudentPerformanceService>> _mockLogger;
    private readonly DifficultyEngineSettings _settings;

    public StudentPerformanceServiceTests()
    {
        _mockDifficultyEngine = new Mock<IDifficultyEngine>();
        _mockLogger = new Mock<ILogger<StudentPerformanceService>>();
        _settings = new DifficultyEngineSettings
        {
            DefaultDifficulty = 50,
            MinDifficulty = 1,
            MaxDifficulty = 100
        };
    }

    private StrideDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<StrideDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new StrideDbContext(options);
    }

    [Fact]
    public async Task GetOrCreatePerformanceAsync_NewStudent_ShouldCreateWithDefaults()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var service = new StudentPerformanceService(
            context,
            _mockDifficultyEngine.Object,
            Options.Create(_settings),
            _mockLogger.Object);

        var studentId = Guid.NewGuid();
        var topicId = Guid.NewGuid();

        // Act
        var result = await service.GetOrCreatePerformanceAsync(studentId, topicId);

        // Assert
        result.Should().NotBeNull();
        result.StudentId.Should().Be(studentId);
        result.TopicId.Should().Be(topicId);
        result.CurrentDifficulty.Should().Be(_settings.DefaultDifficulty);
        result.RollingAccuracy.Should().Be(0m);
        result.CurrentStreak.Should().Be(0);
        result.StreakDirection.Should().Be("neutral");
        result.TotalAttempted.Should().Be(0);
    }

    [Fact]
    public async Task ProcessAnswerAsync_CorrectAnswer_ShouldUpdateStreak()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var service = new StudentPerformanceService(
            context,
            _mockDifficultyEngine.Object,
            Options.Create(_settings),
            _mockLogger.Object);

        var studentId = Guid.NewGuid();
        var topicId = Guid.NewGuid();

        // Create initial performance
        await service.GetOrCreatePerformanceAsync(studentId, topicId);

        _mockDifficultyEngine
            .Setup(x => x.PredictNextDifficulty(It.IsAny<StudentPerformance>(), It.IsAny<TaskAttempt>()))
            .Returns(new DifficultyPrediction
            {
                NextDifficulty = 55,
                Confidence = 0.8f,
                Method = "rule-based",
                Features = new DifficultyPredictionInput()
            });

        var request = new ProcessAnswerRequest
        {
            StudentId = studentId,
            TopicId = topicId,
            TaskInstanceId = "task123",
            IsCorrect = true,
            ResponseTimeMs = 5000
        };

        // Act
        var result = await service.ProcessAnswerAsync(request);

        // Assert
        result.UpdatedPerformance.CurrentStreak.Should().Be(1);
        result.UpdatedPerformance.StreakDirection.Should().Be("winning");
        result.UpdatedPerformance.TotalAttempted.Should().Be(1);
        result.XpEarned.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task ProcessAnswerAsync_IncorrectAnswer_ShouldUpdateStreakToLosing()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var service = new StudentPerformanceService(
            context,
            _mockDifficultyEngine.Object,
            Options.Create(_settings),
            _mockLogger.Object);

        var studentId = Guid.NewGuid();
        var topicId = Guid.NewGuid();

        await service.GetOrCreatePerformanceAsync(studentId, topicId);

        _mockDifficultyEngine
            .Setup(x => x.PredictNextDifficulty(It.IsAny<StudentPerformance>(), It.IsAny<TaskAttempt>()))
            .Returns(new DifficultyPrediction
            {
                NextDifficulty = 45,
                Confidence = 0.8f,
                Method = "rule-based",
                Features = new DifficultyPredictionInput()
            });

        var request = new ProcessAnswerRequest
        {
            StudentId = studentId,
            TopicId = topicId,
            TaskInstanceId = "task123",
            IsCorrect = false,
            ResponseTimeMs = 15000
        };

        // Act
        var result = await service.ProcessAnswerAsync(request);

        // Assert
        result.UpdatedPerformance.CurrentStreak.Should().Be(1);
        result.UpdatedPerformance.StreakDirection.Should().Be("losing");
        result.XpEarned.Should().Be(0); // No XP for incorrect answer
    }

    [Fact]
    public async Task ProcessAnswerAsync_ContinuingWinningStreak_ShouldIncrementStreak()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var service = new StudentPerformanceService(
            context,
            _mockDifficultyEngine.Object,
            Options.Create(_settings),
            _mockLogger.Object);

        var studentId = Guid.NewGuid();
        var topicId = Guid.NewGuid();

        // Create performance with existing winning streak
        var performance = new StudentPerformance
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            TopicId = topicId,
            CurrentDifficulty = 50,
            RollingAccuracy = 0.8m,
            CurrentStreak = 2,
            StreakDirection = "winning",
            TopicMastery = 0.6m,
            TotalAttempted = 5,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context. StudentPerformances.Add(performance);
        await context.SaveChangesAsync();

        _mockDifficultyEngine
            .Setup(x => x.PredictNextDifficulty(It.IsAny<StudentPerformance>(), It.IsAny<TaskAttempt>()))
            .Returns(new DifficultyPrediction
            {
                NextDifficulty = 60,
                Confidence = 0.9f,
                Method = "ml",
                Features = new DifficultyPredictionInput()
            });

        var request = new ProcessAnswerRequest
        {
            StudentId = studentId,
            TopicId = topicId,
            TaskInstanceId = "task456",
            IsCorrect = true,
            ResponseTimeMs = 4000
        };

        // Act
        var result = await service.ProcessAnswerAsync(request);

        // Assert
        result.UpdatedPerformance.CurrentStreak.Should().Be(3);
        result.UpdatedPerformance.StreakDirection.Should().Be("winning");
    }

    [Fact]
    public async Task ProcessAnswerAsync_BreakingStreak_ShouldResetStreak()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var service = new StudentPerformanceService(
            context,
            _mockDifficultyEngine.Object,
            Options.Create(_settings),
            _mockLogger.Object);

        var studentId = Guid.NewGuid();
        var topicId = Guid.NewGuid();

        // Create performance with winning streak
        var performance = new StudentPerformance
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            TopicId = topicId,
            CurrentDifficulty = 60,
            RollingAccuracy = 0.75m,
            CurrentStreak = 4,
            StreakDirection = "winning",
            TopicMastery = 0.7m,
            TotalAttempted = 10,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.StudentPerformances.Add(performance);
        await context.SaveChangesAsync();

        _mockDifficultyEngine
            .Setup(x => x.PredictNextDifficulty(It.IsAny<StudentPerformance>(), It.IsAny<TaskAttempt>()))
            .Returns(new DifficultyPrediction
            {
                NextDifficulty = 50,
                Confidence = 0.85f,
                Method = "ml",
                Features = new DifficultyPredictionInput()
            });

        var request = new ProcessAnswerRequest
        {
            StudentId = studentId,
            TopicId = topicId,
            TaskInstanceId = "task789",
            IsCorrect = false, // Break the streak
            ResponseTimeMs = 20000
        };

        // Act
        var result = await service.ProcessAnswerAsync(request);

        // Assert
        result.UpdatedPerformance.CurrentStreak.Should().Be(1);
        result.UpdatedPerformance.StreakDirection.Should().Be("losing");
    }

    [Fact]
    public async Task ProcessAnswerAsync_ShouldUpdateRollingAccuracy()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var service = new StudentPerformanceService(
            context,
            _mockDifficultyEngine.Object,
            Options.Create(_settings),
            _mockLogger.Object);

        var studentId = Guid.NewGuid();
        var topicId = Guid.NewGuid();

        // Create performance
        var performance = new StudentPerformance
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            TopicId = topicId,
            CurrentDifficulty = 50,
            RollingAccuracy = 0.5m,
            CurrentStreak = 0,
            StreakDirection = "neutral",
            TopicMastery = 0.5m,
            TotalAttempted = 10,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.StudentPerformances.Add(performance);
        await context.SaveChangesAsync();

        _mockDifficultyEngine
            .Setup(x => x.PredictNextDifficulty(It.IsAny<StudentPerformance>(), It.IsAny<TaskAttempt>()))
            .Returns(new DifficultyPrediction
            {
                NextDifficulty = 55,
                Confidence = 0.8f,
                Method = "rule-based",
                Features = new DifficultyPredictionInput()
            });

        var request = new ProcessAnswerRequest
        {
            StudentId = studentId,
            TopicId = topicId,
            TaskInstanceId = "task_acc",
            IsCorrect = true,
            ResponseTimeMs = 5000
        };

        // Act
        var result = await service.ProcessAnswerAsync(request);

        // Assert
        result.UpdatedPerformance.RollingAccuracy.Should().BeGreaterThan(0.5m);
        result.UpdatedPerformance.RollingAccuracy.Should().BeLessOrEqualTo(1.0m);
    }

    [Fact]
    public async Task GetAllPerformancesAsync_ShouldReturnAllTopicsForStudent()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var service = new StudentPerformanceService(
            context,
            _mockDifficultyEngine.Object,
            Options.Create(_settings),
            _mockLogger.Object);

        var studentId = Guid.NewGuid();
        var topic1Id = Guid.NewGuid();
        var topic2Id = Guid.NewGuid();

        await service.GetOrCreatePerformanceAsync(studentId, topic1Id);
        await service.GetOrCreatePerformanceAsync(studentId, topic2Id);

        // Act
        var result = await service.GetAllPerformancesAsync(studentId);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(p => p.TopicId == topic1Id);
        result.Should().Contain(p => p.TopicId == topic2Id);
    }
}
