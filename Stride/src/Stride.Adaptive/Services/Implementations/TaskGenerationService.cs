using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Stride.Adaptive.Models;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;
using Stride.Services.Interfaces;
using Stride.Services.Models.Class;

namespace Stride.Adaptive.Services.Implementations;

public class TaskGenerationService : ITaskGenerationService
{
    private readonly StrideDbContext _dbContext;
    private readonly Channel<TaskGenerationWorkItem> _workChannel;
    private readonly ILogger<TaskGenerationService> _logger;

    private static readonly string[] TaskTypes =
        ["multiple_choice", "fill_blank", "true_false", "matching", "ordering"];

    // Tasks are batched per AI call to keep prompt cost reasonable while
    // still respecting Gemini token budgets. Each work item asks for at most
    // this many tasks; if the requested count is smaller we shrink the batch.
    private const int MaxTasksPerBatch = 10;

    public TaskGenerationService(
        StrideDbContext dbContext,
        Channel<TaskGenerationWorkItem> workChannel,
        ILogger<TaskGenerationService> logger)
    {
        _dbContext = dbContext;
        _workChannel = workChannel;
        _logger = logger;
    }

    public async Task<Guid> StartGenerationAsync(
        Guid assignmentId,
        Guid topicId,
        int taskCount,
        int minDifficulty,
        int maxDifficulty,
        string subjectName,
        string topicName,
        int gradeLevel,
        CancellationToken cancellationToken = default)
    {
        // The teacher asks for exactly N tasks. Generate exactly N — no
        // "over-provision multiplier", no batch padding. Anything else
        // confuses the progress UI ("0 / 150 завдань згенеровано").
        var requestedCount = Math.Max(1, taskCount);
        var jobId = Guid.NewGuid();

        // Calculate difficulty bands from min/max
        var minBand = Math.Max(1, (int)Math.Ceiling(minDifficulty / 10.0));
        var maxBand = Math.Min(10, (int)Math.Ceiling(maxDifficulty / 10.0));
        if (maxBand < minBand) maxBand = minBand;
        var bands = Enumerable.Range(minBand, maxBand - minBand + 1).ToList();

        // Distribute tasks across types and bands while honouring the exact
        // requested count.
        var workItems = DistributeTasks(
            requestedCount, bands, jobId, assignmentId, topicId,
            topicName, subjectName, gradeLevel);

        // Defensive: total of work-item counts MUST equal requestedCount.
        var actualTotal = workItems.Sum(w => w.Count);
        if (actualTotal != requestedCount)
        {
            _logger.LogWarning(
                "Work item distribution drift: requested {Requested}, distributed {Actual}. Adjusting last item.",
                requestedCount, actualTotal);
            if (workItems.Count > 0)
            {
                workItems[^1].Count += requestedCount - actualTotal;
                actualTotal = requestedCount;
            }
        }

        var job = new TaskGenerationJob
        {
            Id = jobId,
            AssignmentId = assignmentId,
            TopicId = topicId,
            Status = TaskGenerationStatus.Pending,
            TotalTasksRequested = actualTotal,
            TasksGenerated = 0,
            TasksFailed = 0,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.TaskGenerationJobs.Add(job);
        await _dbContext.SaveChangesAsync(cancellationToken);

        foreach (var workItem in workItems)
        {
            await _workChannel.Writer.WriteAsync(workItem, cancellationToken);
        }

        _logger.LogInformation(
            "Task generation queued — JobId: {JobId}, AssignmentId: {AssignmentId}, RequestedCount: {Requested}, Bands: [{Bands}], WorkItems: {WorkItemCount} (counts: [{Counts}])",
            jobId, assignmentId, requestedCount, string.Join(",", bands),
            workItems.Count, string.Join(",", workItems.Select(w => $"{w.TaskType}/b{w.DifficultyBand}={w.Count}")));

        return jobId;
    }

    public async Task<TaskGenerationStatusDto> GetGenerationStatusAsync(
        Guid jobId,
        CancellationToken cancellationToken = default)
    {
        var job = await _dbContext.TaskGenerationJobs
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == jobId, cancellationToken);

        if (job == null)
        {
            throw new InvalidOperationException($"Generation job {jobId} not found");
        }

        return new TaskGenerationStatusDto
        {
            JobId = job.Id,
            Status = job.Status,
            TotalTasksRequested = job.TotalTasksRequested,
            TasksGenerated = job.TasksGenerated,
            TasksFailed = job.TasksFailed,
            CreatedAt = job.CreatedAt,
            CompletedAt = job.CompletedAt,
            ErrorMessage = job.ErrorMessage
        };
    }

    /// <summary>
    /// Distribute exactly <paramref name="totalTasks"/> across the available
    /// difficulty bands and task types using round-robin assignment, then
    /// chunk each (type, band) bucket into batches of at most
    /// <see cref="MaxTasksPerBatch"/>.
    /// </summary>
    private List<TaskGenerationWorkItem> DistributeTasks(
        int totalTasks,
        List<int> bands,
        Guid jobId,
        Guid assignmentId,
        Guid topicId,
        string topicName,
        string subjectName,
        int gradeLevel)
    {
        // Bucket counts keyed by (taskType, band). Round-robin over both
        // axes so the resulting set covers the spectrum evenly without
        // producing a separate API call per task.
        var buckets = new Dictionary<(string Type, int Band), int>();
        for (var i = 0; i < totalTasks; i++)
        {
            var type = TaskTypes[i % TaskTypes.Length];
            var band = bands[i % bands.Count];
            var key = (type, band);
            buckets[key] = buckets.GetValueOrDefault(key) + 1;
        }

        var workItems = new List<TaskGenerationWorkItem>(buckets.Count);
        foreach (var ((type, band), count) in buckets)
        {
            // Chunk large buckets so a single AI call never has to produce
            // more than MaxTasksPerBatch tasks.
            var remaining = count;
            while (remaining > 0)
            {
                var chunk = Math.Min(MaxTasksPerBatch, remaining);
                workItems.Add(new TaskGenerationWorkItem
                {
                    JobId = jobId,
                    AssignmentId = assignmentId,
                    TopicId = topicId,
                    TopicName = topicName,
                    SubjectName = subjectName,
                    GradeLevel = gradeLevel,
                    TaskType = type,
                    DifficultyBand = band,
                    Count = chunk
                });
                remaining -= chunk;
            }
        }

        return workItems;
    }
}
