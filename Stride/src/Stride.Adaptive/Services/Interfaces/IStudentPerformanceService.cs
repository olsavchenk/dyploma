using Stride.Adaptive.Models.DTOs;
using Stride.Core.Entities;

namespace Stride.Adaptive.Services.Interfaces;

public interface IStudentPerformanceService
{
    Task<StudentPerformanceDto?> GetPerformanceAsync(Guid studentId, Guid topicId);
    Task<List<StudentPerformanceDto>> GetAllPerformancesAsync(Guid studentId);
    Task<ProcessAnswerResult> ProcessAnswerAsync(ProcessAnswerRequest request);
    Task<StudentPerformance> GetOrCreatePerformanceAsync(Guid studentId, Guid topicId);
}
