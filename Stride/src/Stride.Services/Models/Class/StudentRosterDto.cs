namespace Stride.Services.Models.Class;

public class StudentRosterDto
{
    public Guid StudentId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int CurrentLevel { get; set; }
    public int TotalXp { get; set; }
    public int CurrentStreak { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime? LastActiveDate { get; set; }
}
