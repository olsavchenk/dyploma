using FluentValidation;
using Stride.Services.Models.Gamification;

namespace Stride.Services.Validators;

public class CreateAchievementRequestValidator : AbstractValidator<CreateAchievementRequest>
{
    public CreateAchievementRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .WithMessage("Achievement code is required")
            .MaximumLength(100)
            .WithMessage("Achievement code cannot exceed 100 characters")
            .Matches(@"^[a-z0-9_]+$")
            .WithMessage("Achievement code must contain only lowercase letters, numbers, and underscores");

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Achievement name is required")
            .MaximumLength(200)
            .WithMessage("Achievement name cannot exceed 200 characters");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required")
            .MaximumLength(500)
            .WithMessage("Description cannot exceed 500 characters");

        RuleFor(x => x.IconUrl)
            .MaximumLength(500)
            .WithMessage("Icon URL cannot exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.IconUrl));

        RuleFor(x => x.XpReward)
            .GreaterThanOrEqualTo(0)
            .WithMessage("XP reward must be non-negative");
    }
}
