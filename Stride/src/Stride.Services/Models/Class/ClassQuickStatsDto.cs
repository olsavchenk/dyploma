namespace Stride.Services.Models.Class;

public class ClassQuickStatsDto
{
    public int TotalClasses { get; set; }
    public int TotalStudents { get; set; }
    public int ActiveThisWeek { get; set; }
    public double AverageClassSize { get; set; }
}
