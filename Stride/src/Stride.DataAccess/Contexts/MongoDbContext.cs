using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Stride.Core.Documents;

namespace Stride.DataAccess.Contexts;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        _database = client.GetDatabase(settings.Value.DatabaseName);
    }

    public IMongoCollection<TaskTemplateDocument> TaskTemplates =>
        _database.GetCollection<TaskTemplateDocument>("task_templates");

    public IMongoCollection<TaskInstanceDocument> TaskInstances =>
        _database.GetCollection<TaskInstanceDocument>("task_instances");

    public IMongoCollection<AIGenerationLogDocument> AIGenerationLogs =>
        _database.GetCollection<AIGenerationLogDocument>("ai_generation_logs");

    public async Task InitializeIndexesAsync()
    {
        // TaskTemplates indexes
        var taskTemplateIndexes = new[]
        {
            new CreateIndexModel<TaskTemplateDocument>(
                Builders<TaskTemplateDocument>.IndexKeys
                    .Ascending(t => t.TopicId)
                    .Ascending(t => t.DifficultyBand)),
            new CreateIndexModel<TaskTemplateDocument>(
                Builders<TaskTemplateDocument>.IndexKeys.Ascending(t => t.IsApproved)),
            new CreateIndexModel<TaskTemplateDocument>(
                Builders<TaskTemplateDocument>.IndexKeys.Ascending(t => t.TaskType))
        };
        await TaskTemplates.Indexes.CreateManyAsync(taskTemplateIndexes);

        // TaskInstances indexes
        var taskInstanceIndexes = new[]
        {
            new CreateIndexModel<TaskInstanceDocument>(
                Builders<TaskInstanceDocument>.IndexKeys
                    .Ascending(t => t.TopicId)
                    .Ascending(t => t.Difficulty)),
            new CreateIndexModel<TaskInstanceDocument>(
                Builders<TaskInstanceDocument>.IndexKeys.Ascending(t => t.TemplateId)),
            new CreateIndexModel<TaskInstanceDocument>(
                Builders<TaskInstanceDocument>.IndexKeys.Ascending(t => t.ExpiresAt),
                new CreateIndexOptions { ExpireAfter = TimeSpan.Zero }) // TTL index
        };
        await TaskInstances.Indexes.CreateManyAsync(taskInstanceIndexes);

        // AIGenerationLogs indexes
        var aiLogIndexes = new[]
        {
            new CreateIndexModel<AIGenerationLogDocument>(
                Builders<AIGenerationLogDocument>.IndexKeys.Descending(l => l.CreatedAt)),
            new CreateIndexModel<AIGenerationLogDocument>(
                Builders<AIGenerationLogDocument>.IndexKeys.Ascending(l => l.TopicId)),
            new CreateIndexModel<AIGenerationLogDocument>(
                Builders<AIGenerationLogDocument>.IndexKeys.Ascending(l => l.Provider)),
            new CreateIndexModel<AIGenerationLogDocument>(
                Builders<AIGenerationLogDocument>.IndexKeys.Ascending(l => l.Success))
        };
        await AIGenerationLogs.Indexes.CreateManyAsync(aiLogIndexes);
    }
}
