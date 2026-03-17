using Microsoft.EntityFrameworkCore;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;

namespace Stride.DataAccess.Repositories;

public class TaskAttemptRepository : ITaskAttemptRepository
{
    private readonly StrideDbContext _context;

    public TaskAttemptRepository(StrideDbContext context)
    {
        _context = context;
    }

    public async Task<TaskAttempt?> GetByIdAsync(Guid id)
    {
        return await _context.TaskAttempts
            .Include(ta => ta.Topic)
            .FirstOrDefaultAsync(ta => ta.Id == id);
    }

    public async Task<TaskAttempt> CreateAsync(TaskAttempt taskAttempt)
    {
        taskAttempt.CreatedAt = DateTime.UtcNow;
        _context.TaskAttempts.Add(taskAttempt);
        await _context.SaveChangesAsync();
        return taskAttempt;
    }

    public async Task<List<TaskAttempt>> GetByStudentIdAsync(
        Guid studentId, 
        int pageNumber = 1, 
        int pageSize = 20)
    {
        return await _context.TaskAttempts
            .Include(ta => ta.Topic)
            .Where(ta => ta.StudentId == studentId)
            .OrderByDescending(ta => ta.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetCountByStudentIdAsync(Guid studentId)
    {
        return await _context.TaskAttempts
            .Where(ta => ta.StudentId == studentId)
            .CountAsync();
    }

    public async Task<List<TaskAttempt>> GetRecentByStudentAndTopicAsync(
        Guid studentId, 
        Guid topicId, 
        int count = 10)
    {
        return await _context.TaskAttempts
            .Where(ta => ta.StudentId == studentId && ta.TopicId == topicId)
            .OrderByDescending(ta => ta.CreatedAt)
            .Take(count)
            .ToListAsync();
    }
}
