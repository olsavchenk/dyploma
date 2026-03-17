using Stride.Services.Models.Class;

namespace Stride.Services.Interfaces;

public interface IClassService
{
    Task<ClassDto> CreateClassAsync(Guid teacherId, CreateClassRequest request);
    Task<List<ClassDto>> GetTeacherClassesAsync(Guid teacherId);
    Task<ClassQuickStatsDto> GetTeacherQuickStatsAsync(Guid teacherId);
    Task<ClassDto?> GetClassByIdAsync(Guid classId, Guid userId);
    Task<string> JoinClassAsync(Guid studentId, string joinCode);
    Task<List<StudentRosterDto>> GetClassStudentsAsync(Guid classId, Guid teacherId);
    
    // Assignments
    Task<AssignmentDto> CreateAssignmentAsync(Guid classId, Guid teacherId, CreateAssignmentRequest request);
    Task<List<AssignmentDto>> GetClassAssignmentsAsync(Guid classId, Guid teacherId);
    Task<List<StudentAssignmentDto>> GetStudentAssignmentsAsync(Guid studentId);
    Task<List<StudentClassDto>> GetStudentClassesAsync(Guid studentId);

    // Analytics
    Task<ClassAnalyticsDto> GetClassAnalyticsAsync(Guid classId, Guid teacherId);
    Task<StudentPerformanceDetailDto> GetStudentPerformanceDetailAsync(Guid classId, Guid studentId, Guid teacherId);
}
