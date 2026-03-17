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

    private const int BatchSize = 30;
    private const int Multiplier = 3;

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
        var totalTasks = taskCount * Multiplier;
        var jobId = Guid.NewGuid();

        // Calculate difficulty bands from min/max
        var minBand = Math.Max(1, (int)Math.Ceiling(minDifficulty / 10.0));
        var maxBand = Math.Min(10, (int)Math.Ceiling(maxDifficulty / 10.0));
        var bands = Enumerable.Range(minBand, maxBand - minBand + 1).ToList();

        // Distribute tasks across types and bands
        var workItems = DistributeTasksAcrossTypesAndBands(
            totalTasks, bands, jobId, assignmentId, topicId,
            topicName, subjectName, gradeLevel);

        // Use the actual enqueued count so job completion tracking is accurate
        var actualTotal = workItems.Sum(w => w.Count);

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
            "Task generation started - JobId: {JobId}, AssignmentId: {AssignmentId}, Bands: {Bands}, TotalTasks: {Total}, WorkItems: {WorkItemCount}",
            jobId, assignmentId, string.Join(",", bands), actualTotal, workItems.Count);

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

    private List<TaskGenerationWorkItem> DistributeTasksAcrossTypesAndBands(
        int totalTasks,
        List<int> bands,
        Guid jobId,
        Guid assignmentId,
        Guid topicId,
        string topicName,
        string subjectName,
        int gradeLevel)
    {
        // Sample ceil(bands/2) representative bands evenly across the difficulty range.
        // Each selected band gets exactly one API call of BatchSize tasks, which:
        //  - minimises total Gemini API calls (e.g. 10 bands → 5 calls)
        //  - maximises tasks per call (full BatchSize) to reduce per-task cost
        //  - still covers the full difficulty spectrum through even sampling
        var targetCallCount = Math.Max(1, (int)Math.Ceiling(bands.Count / 2.0));
        var selectedBands = SampleEvenly(bands, targetCallCount);

        var workItems = new List<TaskGenerationWorkItem>(selectedBands.Count);
        for (var i = 0; i < selectedBands.Count; i++)
        {
            workItems.Add(new TaskGenerationWorkItem
            {
                JobId = jobId,
                AssignmentId = assignmentId,
                TopicId = topicId,
                TopicName = topicName,
                SubjectName = subjectName,
                GradeLevel = gradeLevel,
                TaskType = TaskTypes[i % TaskTypes.Length],
                DifficultyBand = selectedBands[i],
                Count = BatchSize
            });
        }

        return workItems;
    }

    /// <summary>Returns <paramref name="count"/> evenly-spaced elements sampled from <paramref name="source"/>.</summary>
    private static List<int> SampleEvenly(List<int> source, int count)
    {
        if (source.Count <= count)
            return [..source];

        if (count == 1)
            return [source[source.Count / 2]];

        var result = new List<int>(count);
        for (var i = 0; i < count; i++)
        {
            var index = (int)Math.Round((double)i * (source.Count - 1) / (count - 1));
            result.Add(source[index]);
        }
        return result;
    }
}
