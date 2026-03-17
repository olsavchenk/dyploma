using FluentAssertions;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Validators;

namespace Stride.Adaptive.Tests.Validators;

public class ValidatorTests
{
    [Fact]
    public void PredictDifficultyRequestValidator_ValidRequest_ShouldPass()
    {
        // Arrange
        var validator = new PredictDifficultyRequestValidator();
        var request = new PredictDifficultyRequest
        {
            StudentId = Guid.NewGuid(),
            TopicId = Guid.NewGuid()
        };

        // Act
        var result = validator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void PredictDifficultyRequestValidator_EmptyStudentId_ShouldFail()
    {
        // Arrange
        var validator = new PredictDifficultyRequestValidator();
        var request = new PredictDifficultyRequest
        {
            StudentId = Guid.Empty,
            TopicId = Guid.NewGuid()
        };

        // Act
        var result = validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(request.StudentId));
    }

    [Fact]
    public void ProcessAnswerRequestValidator_ValidRequest_ShouldPass()
    {
        // Arrange
        var validator = new ProcessAnswerRequestValidator();
        var request = new ProcessAnswerRequest
        {
            StudentId = Guid.NewGuid(),
            TopicId = Guid.NewGuid(),
            TaskInstanceId = "task123",
            IsCorrect = true,
            ResponseTimeMs = 5000
        };

        // Act
        var result = validator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void ProcessAnswerRequestValidator_EmptyTaskInstanceId_ShouldFail()
    {
        // Arrange
        var validator = new ProcessAnswerRequestValidator();
        var request = new ProcessAnswerRequest
        {
            StudentId = Guid.NewGuid(),
            TopicId = Guid.NewGuid(),
            TaskInstanceId = "",
            IsCorrect = true,
            ResponseTimeMs = 5000
        };

        // Act
        var result = validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(request.TaskInstanceId));
    }

    [Fact]
    public void ProcessAnswerRequestValidator_NegativeResponseTime_ShouldFail()
    {
        // Arrange
        var validator = new ProcessAnswerRequestValidator();
        var request = new ProcessAnswerRequest
        {
            StudentId = Guid.NewGuid(),
            TopicId = Guid.NewGuid(),
            TaskInstanceId = "task123",
            IsCorrect = true,
            ResponseTimeMs = -100
        };

        // Act
        var result = validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(request.ResponseTimeMs));
    }

    [Fact]
    public void ProcessAnswerRequestValidator_ZeroResponseTime_ShouldFail()
    {
        // Arrange
        var validator = new ProcessAnswerRequestValidator();
        var request = new ProcessAnswerRequest
        {
            StudentId = Guid.NewGuid(),
            TopicId = Guid.NewGuid(),
            TaskInstanceId = "task123",
            IsCorrect = true,
            ResponseTimeMs = 0
        };

        // Act
        var result = validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(request.ResponseTimeMs));
    }
}
