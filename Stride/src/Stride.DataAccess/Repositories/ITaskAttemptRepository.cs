using Stride.Core.Entities;

namespace Stride.DataAccess.Repositories;

public interface ITaskAttemptRepository
{
    Task<TaskAttempt?> GetByIdAsync(Guid id);
    Task<TaskAttempt> CreateAsync(TaskAttempt taskAttempt);
    Task<List<TaskAttempt>> GetByStudentIdAsync(
        Guid studentId, 
        int pageNumber = 1, 
        int pageSize = 20);
    Task<int> GetCountByStudentIdAsync(Guid studentId);
    Task<List<TaskAttempt>> GetRecentByStudentAndTopicAsync(
        Guid studentId, 
        Guid topicId, 
        int count = 10);
}
