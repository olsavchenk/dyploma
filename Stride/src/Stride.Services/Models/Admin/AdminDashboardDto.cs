namespace Stride.Services.Models.Admin;

public class AdminDashboardDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsersToday { get; set; }
    public int ActiveUsersThisWeek { get; set; }
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalAdmins { get; set; }
    public long TotalTasksAttempted { get; set; }
    public double AverageAccuracy { get; set; }
    public int PendingAIReviews { get; set; }
    public DateTime GeneratedAt { get; set; }
}
