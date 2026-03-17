using Stride.Services.Models.Subject;

namespace Stride.Services.Interfaces;

public interface ISubjectService
{
    Task<List<SubjectListItemDto>> GetAllSubjectsAsync(Guid? studentId = null);
    Task<SubjectDto?> GetSubjectByIdAsync(Guid subjectId);
    Task<SubjectDto?> GetSubjectBySlugAsync(string slug);
    Task<List<ContinueLearningTopicDto>> GetContinueLearningTopicsAsync(Guid studentProfileId, int limit = 3);
    
    // Admin CRUD methods
    Task<SubjectDto> CreateSubjectAsync(CreateSubjectRequest request, CancellationToken cancellationToken = default);
    Task<SubjectDto> UpdateSubjectAsync(Guid id, UpdateSubjectRequest request, CancellationToken cancellationToken = default);
    Task DeleteSubjectAsync(Guid id, CancellationToken cancellationToken = default);
}
