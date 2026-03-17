namespace Stride.Adaptive.Configuration;

public class TaskPoolSettings
{
    public const string SectionName = "TaskPool";

    public int TargetPoolSize { get; set; } = 50;
    public int RefillThreshold { get; set; } = 20;
    public int DifficultyRangeWindow { get; set; } = 10;
    public int PoolTtlHours { get; set; } = 24;
    public int MaxCachedTasks { get; set; } = 100;
    public TimeSpan CacheDuration { get; set; } = TimeSpan.FromMinutes(30);
}
