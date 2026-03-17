using FluentValidation;
using Stride.Adaptive.Models.DTOs.Task;

namespace Stride.Adaptive.Validators;

public class SubmitTaskRequestValidator : AbstractValidator<SubmitTaskRequest>
{
    public SubmitTaskRequestValidator()
    {
        RuleFor(x => x.Answer)
            .NotEmpty()
            .WithMessage("Answer is required")
            .MaximumLength(5000)
            .WithMessage("Answer cannot exceed 5000 characters");

        RuleFor(x => x.ResponseTimeMs)
            .GreaterThan(0)
            .WithMessage("Response time must be greater than 0")
            .LessThanOrEqualTo(600000) // 10 minutes max
            .WithMessage("Response time cannot exceed 10 minutes");
    }
}
