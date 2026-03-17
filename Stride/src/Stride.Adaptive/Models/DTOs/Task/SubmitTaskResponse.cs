namespace Stride.Adaptive.Models.DTOs.Task;

public class SubmitTaskResponse
{
    public bool IsCorrect { get; set; }
    public string? Explanation { get; set; }
    public int XpEarned { get; set; }
    public int CurrentStreak { get; set; }
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; }
    public int NextDifficulty { get; set; }
    public string? CorrectAnswer { get; set; }
}
