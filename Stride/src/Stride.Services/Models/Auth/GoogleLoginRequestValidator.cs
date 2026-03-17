using FluentValidation;

namespace Stride.Services.Models.Auth;

public class GoogleLoginRequestValidator : AbstractValidator<GoogleLoginRequest>
{
    public GoogleLoginRequestValidator()
    {
        RuleFor(x => x.IdToken)
            .NotEmpty()
            .WithMessage("Google ID token is required");
    }
}
