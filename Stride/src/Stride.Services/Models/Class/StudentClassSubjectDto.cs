namespace Stride.Services.Models.Class;

public class StudentClassSubjectDto
{
    public Guid? SubjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public string? Description { get; set; }
    public int AssignmentCount { get; set; }
    public int CompletedCount { get; set; }
    public double ProgressPercentage { get; set; }
}
