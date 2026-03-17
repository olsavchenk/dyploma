namespace Stride.Core.Entities;

public class TeacherProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? School { get; set; }
    public string? GradesTaught { get; set; }
    public string? SubjectsExpertise { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<Class> Classes { get; set; } = new List<Class>();
}
