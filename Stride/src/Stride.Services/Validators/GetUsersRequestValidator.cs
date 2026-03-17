using FluentValidation;
using Stride.Services.Models.Admin;

namespace Stride.Services.Validators;

public class GetUsersRequestValidator : AbstractValidator<GetUsersRequest>
{
    private static readonly string[] ValidRoles = { "Student", "Teacher", "Admin" };
    private static readonly string[] ValidSortFields = { "createdAt", "lastLoginAt", "displayName" };
    private static readonly string[] ValidSortOrders = { "asc", "desc" };

    public GetUsersRequestValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page must be at least 1");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("PageSize must be between 1 and 100");

        RuleFor(x => x.Role)
            .Must(role => string.IsNullOrEmpty(role) || ValidRoles.Contains(role))
            .WithMessage($"Role must be one of: {string.Join(", ", ValidRoles)}");

        RuleFor(x => x.SortBy)
            .Must(sortBy => string.IsNullOrEmpty(sortBy) || ValidSortFields.Contains(sortBy))
            .WithMessage($"SortBy must be one of: {string.Join(", ", ValidSortFields)}");

        RuleFor(x => x.SortOrder)
            .Must(sortOrder => string.IsNullOrEmpty(sortOrder) || ValidSortOrders.Contains(sortOrder))
            .WithMessage($"SortOrder must be one of: {string.Join(", ", ValidSortOrders)}");
    }
}
