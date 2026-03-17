using FluentValidation;

namespace Stride.Services.Models.User;

public class UpdateUserProfileRequestValidator : AbstractValidator<UpdateUserProfileRequest>
{
    public UpdateUserProfileRequestValidator()
    {
        When(x => !string.IsNullOrEmpty(x.DisplayName), () =>
        {
            RuleFor(x => x.DisplayName)
                .MinimumLength(2).WithMessage("Display name must be at least 2 characters")
                .MaximumLength(100).WithMessage("Display name must not exceed 100 characters");
        });

        When(x => !string.IsNullOrEmpty(x.School), () =>
        {
            RuleFor(x => x.School)
                .MaximumLength(200).WithMessage("School name must not exceed 200 characters");
        });

        When(x => !string.IsNullOrEmpty(x.GradesTaught), () =>
        {
            RuleFor(x => x.GradesTaught)
                .MaximumLength(100).WithMessage("Grades taught must not exceed 100 characters");
        });

        When(x => !string.IsNullOrEmpty(x.SubjectsExpertise), () =>
        {
            RuleFor(x => x.SubjectsExpertise)
                .MaximumLength(200).WithMessage("Subjects expertise must not exceed 200 characters");
        });
    }
}
