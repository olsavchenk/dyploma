using FluentValidation;
using Stride.Services.Models.Admin;

namespace Stride.Services.Validators;

public class ChangeUserRoleRequestValidator : AbstractValidator<ChangeUserRoleRequest>
{
    private static readonly string[] ValidRoles = { "Student", "Teacher", "Admin" };

    public ChangeUserRoleRequestValidator()
    {
        RuleFor(x => x.Role)
            .NotEmpty()
            .WithMessage("Role is required")
            .Must(role => ValidRoles.Contains(role))
            .WithMessage($"Role must be one of: {string.Join(", ", ValidRoles)}");
    }
}
