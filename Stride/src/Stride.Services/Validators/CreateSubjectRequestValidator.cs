using FluentValidation;
using Stride.Services.Models.Subject;

namespace Stride.Services.Validators;

public class CreateSubjectRequestValidator : AbstractValidator<CreateSubjectRequest>
{
    public CreateSubjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Subject name is required")
            .MaximumLength(200)
            .WithMessage("Subject name cannot exceed 200 characters");

        RuleFor(x => x.Slug)
            .NotEmpty()
            .WithMessage("Slug is required")
            .MaximumLength(100)
            .WithMessage("Slug cannot exceed 100 characters")
            .Matches(@"^[a-z0-9-]+$")
            .WithMessage("Slug must contain only lowercase letters, numbers, and hyphens");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required")
            .MaximumLength(1000)
            .WithMessage("Description cannot exceed 1000 characters");

        RuleFor(x => x.IconUrl)
            .MaximumLength(500)
            .WithMessage("Icon URL cannot exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.IconUrl));

        RuleFor(x => x.SortOrder)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Sort order must be non-negative");
    }
}
