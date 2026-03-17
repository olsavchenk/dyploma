using FluentValidation;

namespace Stride.Services.Models.Class;

public class JoinClassRequestValidator : AbstractValidator<JoinClassRequest>
{
    public JoinClassRequestValidator()
    {
        RuleFor(x => x.JoinCode)
            .NotEmpty().WithMessage("Join code is required")
            .Length(6).WithMessage("Join code must be exactly 6 characters")
            .Matches(@"^[A-Z0-9]{6}$").WithMessage("Join code must contain only uppercase letters and numbers");
    }
}
