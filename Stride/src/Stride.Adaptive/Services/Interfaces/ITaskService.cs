using Stride.Adaptive.Models.DTOs.Task;

namespace Stride.Adaptive.Services.Interfaces;

public interface ITaskService
{
    Task<TaskDto> GetNextTaskAsync(Guid studentId, Guid topicId);
    Task<SubmitTaskResponse> SubmitTaskAsync(Guid studentId, string taskInstanceId, SubmitTaskRequest request);
    Task<TaskHistoryResponse> GetTaskHistoryAsync(Guid studentId, int pageNumber = 1, int pageSize = 20);
}
