using Stride.Services.Models.LearningPath;

namespace Stride.Services.Interfaces;

public interface ILearningPathService
{
    Task<List<LearningPathListItemDto>> GetAllLearningPathsAsync(Guid? subjectId = null, int? gradeLevel = null, Guid? studentId = null);
    Task<LearningPathDetailDto?> GetLearningPathByIdAsync(Guid learningPathId, Guid? studentId = null);
}
