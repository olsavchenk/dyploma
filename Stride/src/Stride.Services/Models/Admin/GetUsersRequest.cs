namespace Stride.Services.Models.Admin;

public class GetUsersRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? Role { get; set; }
    public bool? IsDeleted { get; set; }
    public string? SortBy { get; set; } // createdAt, lastLoginAt, displayName
    public string? SortOrder { get; set; } = "desc"; // asc, desc
}
