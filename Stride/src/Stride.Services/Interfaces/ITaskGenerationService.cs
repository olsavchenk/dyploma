using Stride.Services.Models.Class;

namespace Stride.Services.Interfaces;

public interface ITaskGenerationService
{
    Task<Guid> StartGenerationAsync(
        Guid assignmentId,
        Guid topicId,
        int taskCount,
        int minDifficulty,
        int maxDifficulty,
        string subjectName,
        string topicName,
        int gradeLevel,
        CancellationToken cancellationToken = default);

    Task<TaskGenerationStatusDto> GetGenerationStatusAsync(
        Guid jobId,
        CancellationToken cancellationToken = default);
}
