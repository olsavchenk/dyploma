namespace Stride.Services.Models.Class;

public class StudentClassDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int GradeLevel { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public List<StudentClassSubjectDto> Subjects { get; set; } = [];
}
