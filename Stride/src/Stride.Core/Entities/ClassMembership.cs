namespace Stride.Core.Entities;

public class ClassMembership
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime JoinedAt { get; set; }

    // Navigation properties
    public Class Class { get; set; } = null!;
    public StudentProfile Student { get; set; } = null!;
}
