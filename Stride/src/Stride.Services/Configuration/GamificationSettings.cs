namespace Stride.Services.Configuration;

public class GamificationSettings
{
    public XpSettings Xp { get; set; } = new();
    public LevelSettings Level { get; set; } = new();
    public StreakSettings Streak { get; set; } = new();
}

public class XpSettings
{
    public int BaseXp { get; set; } = 10;
    public double MinDifficultyMultiplier { get; set; } = 1.0;
    public double MaxDifficultyMultiplier { get; set; } = 3.0;
    public double MinStreakMultiplier { get; set; } = 1.0;
    public double MaxStreakMultiplier { get; set; } = 2.0;
    public int StreakThresholdForBonus { get; set; } = 3;
    public int FirstTaskOfDayBonus { get; set; } = 50;
    public int PerfectLessonBonus { get; set; } = 100;
    public int PerfectLessonThreshold { get; set; } = 10;
}

public class LevelSettings
{
    public int Level1To10XpPerLevel { get; set; } = 100;
    public int Level11To25XpPerLevel { get; set; } = 250;
    public int Level26To50XpPerLevel { get; set; } = 500;
    public int Level51To100XpPerLevel { get; set; } = 1000;
}

public class StreakSettings
{
    public int FreezeXpCost { get; set; } = 200;
    public int MaxFreezes { get; set; } = 2;
    public int RepairXpCost { get; set; } = 400;
    public int RepairWindowHours { get; set; } = 24;
}
