using FluentValidation;
using Stride.Adaptive.Models.DTOs;

namespace Stride.Adaptive.Validators;

public class ProcessAnswerRequestValidator : AbstractValidator<ProcessAnswerRequest>
{
    public ProcessAnswerRequestValidator()
    {
        RuleFor(x => x.StudentId)
            .NotEmpty()
            .WithMessage("Student ID is required");

        RuleFor(x => x.TopicId)
            .NotEmpty()
            .WithMessage("Topic ID is required");

        RuleFor(x => x.TaskInstanceId)
            .NotEmpty()
            .WithMessage("Task Instance ID is required");

        RuleFor(x => x.ResponseTimeMs)
            .GreaterThan(0)
            .WithMessage("Response time must be greater than 0");
    }
}
