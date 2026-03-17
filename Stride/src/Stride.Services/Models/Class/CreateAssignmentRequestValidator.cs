using FluentValidation;

namespace Stride.Services.Models.Class;

public class CreateAssignmentRequestValidator : AbstractValidator<CreateAssignmentRequest>
{
    public CreateAssignmentRequestValidator()
    {
        RuleFor(x => x.SubjectName)
            .NotEmpty().WithMessage("Subject name is required")
            .MaximumLength(200).WithMessage("Subject name must not exceed 200 characters");

        RuleFor(x => x.TopicName)
            .NotEmpty().WithMessage("Topic name is required")
            .MaximumLength(200).WithMessage("Topic name must not exceed 200 characters");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Assignment title is required")
            .MinimumLength(3).WithMessage("Title must be at least 3 characters")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.TaskCount)
            .GreaterThan(0).WithMessage("Task count must be at least 1")
            .LessThanOrEqualTo(100).WithMessage("Task count must not exceed 100");

        RuleFor(x => x.MinDifficulty)
            .GreaterThanOrEqualTo(1).WithMessage("Minimum difficulty must be at least 1")
            .LessThanOrEqualTo(100).WithMessage("Minimum difficulty must not exceed 100");

        RuleFor(x => x.MaxDifficulty)
            .GreaterThanOrEqualTo(1).WithMessage("Maximum difficulty must be at least 1")
            .LessThanOrEqualTo(100).WithMessage("Maximum difficulty must not exceed 100")
            .GreaterThanOrEqualTo(x => x.MinDifficulty)
            .WithMessage("Maximum difficulty must be greater than or equal to minimum difficulty");

        RuleFor(x => x.DueDate)
            .GreaterThan(DateTime.UtcNow).WithMessage("Due date must be in the future")
            .When(x => x.DueDate.HasValue);
    }
}
