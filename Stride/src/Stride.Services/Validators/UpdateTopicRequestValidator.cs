using FluentValidation;
using Stride.Services.Models.Topic;

namespace Stride.Services.Validators;

public class UpdateTopicRequestValidator : AbstractValidator<UpdateTopicRequest>
{
    public UpdateTopicRequestValidator()
    {
        RuleFor(x => x.SubjectId)
            .NotEmpty()
            .WithMessage("Subject ID is required");

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Topic name is required")
            .MaximumLength(200)
            .WithMessage("Topic name cannot exceed 200 characters");

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

        RuleFor(x => x.GradeLevel)
            .InclusiveBetween(1, 12)
            .WithMessage("Grade level must be between 1 and 12");

        RuleFor(x => x.SortOrder)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Sort order must be non-negative");
    }
}
