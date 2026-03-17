using Stride.Adaptive.Models;
using Stride.Core.Entities;

namespace Stride.Adaptive.Services.Interfaces;

public interface IDifficultyEngine
{
    DifficultyPrediction PredictNextDifficulty(StudentPerformance performance, TaskAttempt? lastAttempt);
    DifficultyPrediction CalculateNextDifficulty(StudentPerformance performance, TaskAttempt? lastAttempt);
}
