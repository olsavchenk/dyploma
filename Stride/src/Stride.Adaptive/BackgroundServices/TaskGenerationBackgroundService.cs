using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Models;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Services.Interfaces;
using Stride.Core.Documents;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;

namespace Stride.Adaptive.BackgroundServices;

public class TaskGenerationBackgroundService : BackgroundService
{
    private readonly Channel<TaskGenerationWorkItem> _workChannel;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TaskGenerationBackgroundService> _logger;
    private readonly AIProviderSettings _settings;

    public TaskGenerationBackgroundService(
        Channel<TaskGenerationWorkItem> workChannel,
        IServiceProvider serviceProvider,
        ILogger<TaskGenerationBackgroundService> logger,
        IOptions<AIProviderSettings> settings)
    {
        _workChannel = workChannel;
        _serviceProvider = serviceProvider;
        _logger = logger;
        _settings = settings.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Task Generation Background Service started");

        await foreach (var workItem in _workChannel.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await ProcessWorkItemAsync(workItem, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error processing work item for JobId: {JobId}, TaskType: {TaskType}, Band: {Band}",
                    workItem.JobId, workItem.TaskType, workItem.DifficultyBand);

                await UpdateJobOnErrorAsync(workItem.JobId, workItem.Count, ex.Message, stoppingToken);
            }

            if (_settings.BatchDelayMs > 0 && !stoppingToken.IsCancellationRequested)
            {
                _logger.LogDebug("Rate-limit delay: waiting {DelayMs}ms before next batch", _settings.BatchDelayMs);
                await Task.Delay(_settings.BatchDelayMs, stoppingToken);
            }
        }

        _logger.LogInformation("Task Generation Background Service stopped");
    }

    private async Task ProcessWorkItemAsync(TaskGenerationWorkItem workItem, CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<StrideDbContext>();
        var mongoDbContext = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
        var aiProviderFactory = scope.ServiceProvider.GetRequiredService<IAIProviderFactory>();

        // Mark job as InProgress if still Pending
        await MarkJobInProgressAsync(dbContext, workItem.JobId, cancellationToken);

        var provider = aiProviderFactory.GetDefaultProvider();

        var request = new AIBatchGenerationRequest
        {
            TopicId = workItem.TopicId,
            TopicName = workItem.TopicName,
            SubjectName = workItem.SubjectName,
            TaskType = workItem.TaskType,
            DifficultyBand = workItem.DifficultyBand,
            GradeLevel = workItem.GradeLevel,
            Count = workItem.Count
        };

        _logger.LogInformation(
            "Generating batch - JobId: {JobId}, Type: {TaskType}, Band: {Band}, Count: {Count}",
            workItem.JobId, workItem.TaskType, workItem.DifficultyBand, workItem.Count);

        var response = await provider.GenerateTaskBatchAsync(request, cancellationToken);

        var generatedCount = 0;
        var failedCount = 0;

        if (response.Success && response.Tasks.Count > 0)
        {
            var templates = new List<TaskTemplateDocument>();

            foreach (var task in response.Tasks)
            {
                if (task.TemplateContent == null || string.IsNullOrWhiteSpace(task.Question))
                {
                    failedCount++;
                    continue;
                }

                templates.Add(new TaskTemplateDocument
                {
                    TopicId = workItem.TopicId,
                    TaskType = workItem.TaskType,
                    DifficultyBand = workItem.DifficultyBand,
                    TemplateContent = task.TemplateContent,
                    IsApproved = false,
                    AiProvider = provider.ProviderName,
                    AssignmentId = workItem.AssignmentId,
                    GenerationJobId = workItem.JobId,
                    ReviewStatus = "Pending",
                    CreatedAt = DateTime.UtcNow
                });

                generatedCount++;
            }

            if (templates.Count > 0)
            {
                await mongoDbContext.TaskTemplates.InsertManyAsync(templates, cancellationToken: cancellationToken);
            }
        }
        else
        {
            failedCount = workItem.Count;
            _logger.LogWarning(
                "Batch generation failed - JobId: {JobId}, Error: {Error}",
                workItem.JobId, response.ErrorMessage);
        }

        await UpdateJobProgressAsync(dbContext, workItem.JobId, generatedCount, failedCount, cancellationToken);

        _logger.LogInformation(
            "Batch completed - JobId: {JobId}, Generated: {Generated}, Failed: {Failed}",
            workItem.JobId, generatedCount, failedCount);
    }

    private static async Task MarkJobInProgressAsync(
        StrideDbContext dbContext, Guid jobId, CancellationToken cancellationToken)
    {
        await dbContext.TaskGenerationJobs
            .Where(j => j.Id == jobId && j.Status == TaskGenerationStatus.Pending)
            .ExecuteUpdateAsync(s => s
                .SetProperty(j => j.Status, TaskGenerationStatus.InProgress)
                .SetProperty(j => j.UpdatedAt, DateTime.UtcNow),
                cancellationToken);
    }

    private async Task UpdateJobProgressAsync(
        StrideDbContext dbContext, Guid jobId, int generated, int failed, CancellationToken cancellationToken)
    {
        var job = await dbContext.TaskGenerationJobs.FindAsync([jobId], cancellationToken);
        if (job == null) return;

        job.TasksGenerated += generated;
        job.TasksFailed += failed;
        job.UpdatedAt = DateTime.UtcNow;

        // Check if all work is done
        if (job.TasksGenerated + job.TasksFailed >= job.TotalTasksRequested)
        {
            job.CompletedAt = DateTime.UtcNow;
            job.Status = job.TasksFailed == 0
                ? TaskGenerationStatus.Completed
                : job.TasksGenerated > 0
                    ? TaskGenerationStatus.PartiallyCompleted
                    : TaskGenerationStatus.Failed;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task UpdateJobOnErrorAsync(
        Guid jobId, int failedCount, string errorMessage, CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<StrideDbContext>();

            await UpdateJobProgressAsync(dbContext, jobId, 0, failedCount, cancellationToken);

            var job = await dbContext.TaskGenerationJobs.FindAsync([jobId], cancellationToken);
            if (job != null)
            {
                job.ErrorMessage = errorMessage.Length > 2000
                    ? errorMessage[..2000]
                    : errorMessage;
                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update job {JobId} on error", jobId);
        }
    }
}
