namespace Stride.Core.Entities;

public class Class
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string JoinCode { get; set; } = string.Empty; // Unique 6-character code
    public int GradeLevel { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public TeacherProfile Teacher { get; set; } = null!;
    public ICollection<ClassMembership> Memberships { get; set; } = new List<ClassMembership>();
    public ICollection<ClassAssignment> Assignments { get; set; } = new List<ClassAssignment>();
}
