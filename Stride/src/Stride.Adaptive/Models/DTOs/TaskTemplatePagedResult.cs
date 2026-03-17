namespace Stride.Adaptive.Models.DTOs;

public class TaskTemplatePagedResult
{
    public List<TaskTemplateListItem> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
