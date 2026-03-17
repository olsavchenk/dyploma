namespace Stride.Services.Models.Class;

public class ClassDto
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string JoinCode { get; set; } = string.Empty;
    public int GradeLevel { get; set; }
    public bool IsActive { get; set; }
    public int StudentCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
