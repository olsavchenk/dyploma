using FluentValidation;

namespace Stride.Services.Models.Auth;

public class SelectRoleRequestValidator : AbstractValidator<SelectRoleRequest>
{
    public SelectRoleRequestValidator()
    {
        RuleFor(x => x.Role)
            .NotEmpty()
            .WithMessage("Role is required")
            .Must(role => role == "Student" || role == "Teacher")
            .WithMessage("Role must be either 'Student' or 'Teacher'");
    }
}
