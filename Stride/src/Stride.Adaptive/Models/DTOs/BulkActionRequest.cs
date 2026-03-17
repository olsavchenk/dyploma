namespace Stride.Adaptive.Models.DTOs;

public class BulkActionRequest
{
    public List<string> TemplateIds { get; set; } = [];
    public string Action { get; set; } = string.Empty; // "approve", "reject", "delete"
}
