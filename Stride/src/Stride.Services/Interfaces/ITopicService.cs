using Stride.Services.Models.Topic;

namespace Stride.Services.Interfaces;

public interface ITopicService
{
    Task<List<TopicTreeDto>> GetTopicsBySubjectAsync(Guid subjectId, Guid? studentId = null);
    Task<TopicDetailDto?> GetTopicByIdAsync(Guid topicId, Guid? studentId = null);
    Task<TopicDetailDto?> GetTopicBySlugAsync(Guid subjectId, string slug, Guid? studentId = null);
    
    // Admin CRUD methods
    Task<TopicDto> CreateTopicAsync(CreateTopicRequest request, CancellationToken cancellationToken = default);
    Task<TopicDto> UpdateTopicAsync(Guid id, UpdateTopicRequest request, CancellationToken cancellationToken = default);
    Task DeleteTopicAsync(Guid id, CancellationToken cancellationToken = default);
}
