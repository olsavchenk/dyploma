using FluentValidation;

namespace Stride.Services.Models.Class;

public class CreateClassRequestValidator : AbstractValidator<CreateClassRequest>
{
    public CreateClassRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Class name is required")
            .MinimumLength(2).WithMessage("Class name must be at least 2 characters")
            .MaximumLength(200).WithMessage("Class name must not exceed 200 characters");

        RuleFor(x => x.GradeLevel)
            .GreaterThanOrEqualTo(1).WithMessage("Grade level must be between 1 and 12")
            .LessThanOrEqualTo(12).WithMessage("Grade level must be between 1 and 12");
    }
}
