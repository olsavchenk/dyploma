namespace Stride.Services.Models.Admin;

public class RejectTemplateRequest
{
    public string TemplateId { get; set; } = string.Empty;
    public string? Reason { get; set; }
}
