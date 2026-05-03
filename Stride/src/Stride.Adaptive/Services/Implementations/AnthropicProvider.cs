using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using Polly;
using Polly.Retry;
using Stride.Adaptive.Configuration;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Services.Interfaces;
using Stride.Core.Documents;
using Stride.DataAccess.Contexts;

namespace Stride.Adaptive.Services.Implementations;

public class AnthropicProvider : IAIProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AnthropicProvider> _logger;
    private readonly AIProviderSettings _settings;
    private readonly MongoDbContext _mongoDbContext;
    private readonly AsyncRetryPolicy _retryPolicy;

    public string ProviderName => "anthropic";

    public AnthropicProvider(
        HttpClient httpClient,
        ILogger<AnthropicProvider> logger,
        IOptions<AIProviderSettings> settings,
        MongoDbContext mongoDbContext)
    {
        _httpClient = httpClient;
        _logger = logger;
        _settings = settings.Value;
        _mongoDbContext = mongoDbContext;

        _httpClient.Timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds);
        _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("x-api-key", _settings.Anthropic.ApiKey);
        _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("anthropic-version", "2023-06-01");

        _retryPolicy = Policy
            .Handle<HttpRequestException>()
            .Or<TaskCanceledException>(ex => !ex.CancellationToken.IsCancellationRequested)
            .WaitAndRetryAsync(
                _settings.MaxRetries,
                retryAttempt => TimeSpan.FromMilliseconds(_settings.RetryDelayMs * Math.Pow(2, retryAttempt - 1)),
                onRetry: (exception, timeSpan, retryCount, context) =>
                {
                    _logger.LogWarning(
                        exception,
                        "Retry {RetryCount}/{MaxRetries} after {DelayMs}ms for Anthropic API request",
                        retryCount,
                        _settings.MaxRetries,
                        timeSpan.TotalMilliseconds);
                });
    }

    public async Task<AITaskGenerationResponse> GenerateTaskTemplateAsync(
        AITaskGenerationRequest request,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        var response = new AITaskGenerationResponse
        {
            Success = false,
            GenerationTimeMs = 0
        };

        try
        {
            var prompt = BuildPrompt(request);
            var requestPayload = BuildAnthropicRequest(prompt);

            var httpResponse = await _retryPolicy.ExecuteAsync(async () =>
            {
                var content = new StringContent(requestPayload, Encoding.UTF8, "application/json");
                var result = await _httpClient.PostAsync(_settings.Anthropic.ApiUrl, content, cancellationToken);
                result.EnsureSuccessStatusCode();
                return result;
            });

            var responseContent = await httpResponse.Content.ReadAsStringAsync(cancellationToken);
            response.RawResponse = responseContent;
            stopwatch.Stop();
            response.GenerationTimeMs = (int)stopwatch.ElapsedMilliseconds;

            var parsedResponse = ParseAnthropicResponse(responseContent);

            if (parsedResponse != null)
            {
                response.Success = true;
                response.Question = parsedResponse.Question;
                response.Options = parsedResponse.Options;
                response.Answer = parsedResponse.Answer;
                response.Explanation = parsedResponse.Explanation;
                response.Hints = parsedResponse.Hints;
                response.TokensUsed = ExtractTokenUsage(responseContent);

                response.TemplateContent = BuildTemplateContent(parsedResponse, request.TaskType);
            }
            else
            {
                response.ErrorMessage = "Failed to parse AI response into structured task format";
            }

            await LogGenerationAsync(request, response, cancellationToken);
            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            response.GenerationTimeMs = (int)stopwatch.ElapsedMilliseconds;
            response.ErrorMessage = ex.Message;

            _logger.LogError(ex, "Failed to generate task template for topic {TopicId}, type {TaskType}, difficulty {DifficultyBand}",
                request.TopicId, request.TaskType, request.DifficultyBand);

            await LogGenerationAsync(request, response, cancellationToken);
            return response;
        }
    }

    public Task<bool> ValidateResponseAsync(
        AITaskGenerationResponse response,
        CancellationToken cancellationToken = default)
    {
        if (!response.Success || string.IsNullOrWhiteSpace(response.Question))
        {
            return Task.FromResult(false);
        }

        var hasValidAnswer = response.Answer != null;
        var hasExplanation = !string.IsNullOrWhiteSpace(response.Explanation);

        if (response.Options != null && response.Options.Any())
        {
            var hasMinimumOptions = response.Options.Count >= 2;
            var optionsNotEmpty = response.Options.All(o => !string.IsNullOrWhiteSpace(o));
            return Task.FromResult(hasValidAnswer && hasExplanation && hasMinimumOptions && optionsNotEmpty);
        }

        return Task.FromResult(hasValidAnswer && hasExplanation);
    }

    public async Task<AIBatchGenerationResponse> GenerateTaskBatchAsync(
        AIBatchGenerationRequest request,
        CancellationToken cancellationToken = default)
    {
        var count = Math.Max(1, request.Count);
        var stopwatch = Stopwatch.StartNew();
        var response = new AIBatchGenerationResponse
        {
            Success = false,
            GenerationTimeMs = 0
        };

        try
        {
            var prompt = BuildBatchPrompt(request, count);
            var neededTokens = Math.Max(_settings.Anthropic.MaxOutputTokens, count * 400);
            var requestPayload = BuildAnthropicRequest(prompt, maxOutputTokens: neededTokens);

            var httpResponse = await _retryPolicy.ExecuteAsync(async () =>
            {
                var content = new StringContent(requestPayload, Encoding.UTF8, "application/json");
                var result = await _httpClient.PostAsync(_settings.Anthropic.ApiUrl, content, cancellationToken);
                result.EnsureSuccessStatusCode();
                return result;
            });

            var responseContent = await httpResponse.Content.ReadAsStringAsync(cancellationToken);
            response.RawResponse = responseContent;
            stopwatch.Stop();
            response.GenerationTimeMs = (int)stopwatch.ElapsedMilliseconds;

            var parsedTasks = ParseBatchAnthropicResponse(responseContent);

            if (parsedTasks != null && parsedTasks.Count > 0)
            {
                response.Success = true;
                response.TotalTokensUsed = ExtractTokenUsage(responseContent);

                foreach (var parsed in parsedTasks)
                {
                    var generatedTask = new GeneratedTask
                    {
                        Question = parsed.Question,
                        Options = parsed.Options,
                        Answer = parsed.Answer,
                        Explanation = parsed.Explanation,
                        Hints = parsed.Hints,
                        TemplateContent = BuildTemplateContent(parsed, request.TaskType)
                    };
                    response.Tasks.Add(generatedTask);
                }
            }
            else
            {
                response.ErrorMessage = "Failed to parse AI batch response into structured tasks";
            }

            await LogBatchGenerationAsync(request, response, count, cancellationToken);
            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            response.GenerationTimeMs = (int)stopwatch.ElapsedMilliseconds;
            response.ErrorMessage = ex.Message;

            _logger.LogError(ex, "Failed to generate task batch for topic {TopicId}, type {TaskType}, difficulty {DifficultyBand}, count {Count}",
                request.TopicId, request.TaskType, request.DifficultyBand, count);

            await LogBatchGenerationAsync(request, response, count, cancellationToken);
            return response;
        }
    }

    private string BuildPrompt(AITaskGenerationRequest request)
    {
        var difficultyDescription = GetDifficultyDescription(request.DifficultyBand);
        var taskTypeInstructions = GetTaskTypeInstructions(request.TaskType);

        return $@"Ти — досвідчений вчитель української школи. Створи навчальне завдання українською мовою.

КОНТЕКСТ:
- Предмет: {request.SubjectName}
- Тема: {request.TopicName}
- Клас: {request.GradeLevel}
- Рівень складності: {difficultyDescription}
- Тип завдання: {taskTypeInstructions}

ВИМОГИ:
1. Питання має бути чітким, зрозумілим і відповідати рівню складності
2. Використовуй українську мову, відповідні терміни та приклади з українського контексту
3. Забезпеч, щоб правильна відповідь була однозначною
4. Надай детальне пояснення з кроками розв'язання
5. Додай 2-3 підказки, які поступово наближають до правильної відповіді

{GetTaskTypeSpecificRequirements(request.TaskType)}

Відповідь надай ВИКЛЮЧНО у форматі JSON без додаткового тексту:
{{
  ""question"": ""текст питання"",
  ""options"": [""варіант 1"", ""варіант 2"", ""варіант 3"", ""варіант 4""],
  ""answer"": ""правильна відповідь або індекс"",
  ""explanation"": ""детальне пояснення з розв'язанням"",
  ""hints"": [""підказка 1"", ""підказка 2"", ""підказка 3""]
}}";
    }

    private string GetDifficultyDescription(int difficultyBand)
    {
        return difficultyBand switch
        {
            1 => "Дуже легкий (початковий рівень, базові поняття)",
            2 => "Легкий (прості задачі, пряме застосування правил)",
            3 => "Нижче середнього (комбінування простих концепцій)",
            4 => "Середній-низький (застосування кількох правил)",
            5 => "Середній (стандартні задачі, типові підходи)",
            6 => "Середній-високий (потребує аналізу і планування)",
            7 => "Складний (комплексні задачі, нестандартні підходи)",
            8 => "Дуже складний (глибоке розуміння, творчий підхід)",
            9 => "Високої складності (олімпіадний рівень)",
            10 => "Експертний (найвищий рівень, інноваційні рішення)",
            _ => "Середній"
        };
    }

    private string GetTaskTypeInstructions(string taskType)
    {
        return taskType switch
        {
            "multiple_choice" => "Множинний вибір (чотири варіанти відповіді, один правильний)",
            "fill_blank" => "Заповнення пропусків (текст із місцями для вставки відповідей)",
            "true_false" => "Правда/Неправда (ствердження для оцінки істинності)",
            "matching" => "Встановлення відповідності (два стовпчики для з'єднання)",
            "ordering" => "Впорядкування (елементи для розташування у правильному порядку)",
            _ => "Множинний вибір"
        };
    }

    private string GetTaskTypeSpecificRequirements(string taskType)
    {
        return taskType switch
        {
            "multiple_choice" => @"
- Створи рівно 4 варіанти відповіді
- Один варіант має бути правильним
- Інші варіанти мають бути правдоподібними, але неправильними
- В answer вкажи правильний варіант (текст або індекс 0-3)",

            "fill_blank" => @"
- У питанні використовуй {blank} для позначення пропусків
- В answer надай масив правильних відповідей для кожного пропуску
- options не потрібні для цього типу",

            "true_false" => @"
- Створи ствердження, яке можна оцінити як істинне чи хибне
- В answer вкажи true або false
- options не потрібні для цього типу",

            "matching" => @"
- В options надай масив пар у форматі [""елемент лівої колонки"", ""відповідний елемент правої колонки""]
- Мінімум 4 пари
- В answer надай правильні з'єднання у форматі масиву індексів",

            "ordering" => @"
- В options надай масив елементів у випадковому порядку
- Мінімум 4 елементи
- В answer надай масив індексів у правильному порядку",

            _ => ""
        };
    }

    private string BuildAnthropicRequest(string prompt)
    {
        return BuildAnthropicRequest(prompt, maxOutputTokens: _settings.Anthropic.MaxOutputTokens);
    }

    private string BuildAnthropicRequest(string prompt, int maxOutputTokens)
    {
        var request = new
        {
            model = _settings.Anthropic.Model,
            max_tokens = maxOutputTokens,
            temperature = _settings.Anthropic.Temperature,
            messages = new[]
            {
                new
                {
                    role = "user",
                    content = prompt
                }
            },
            system = "Ти — експертний AI-асистент для створення навчальних завдань. Завжди відповідай ВИКЛЮЧНО валідним JSON без markdown-форматування, без ```json блоків, без додаткового тексту."
        };

        return JsonSerializer.Serialize(request);
    }

    private TaskContentParsed? ParseAnthropicResponse(string responseContent)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseContent);
            var root = doc.RootElement;

            if (!root.TryGetProperty("content", out var contentArray) || contentArray.GetArrayLength() == 0)
            {
                return null;
            }

            var firstBlock = contentArray[0];
            if (!firstBlock.TryGetProperty("text", out var textElement))
            {
                return null;
            }

            var jsonText = textElement.GetString();
            if (string.IsNullOrWhiteSpace(jsonText))
            {
                return null;
            }

            jsonText = ExtractJsonFromText(jsonText);

            var taskContent = JsonSerializer.Deserialize<TaskContentParsed>(jsonText, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return taskContent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse Anthropic response");
            return null;
        }
    }

    private List<TaskContentParsed>? ParseBatchAnthropicResponse(string responseContent)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseContent);
            var root = doc.RootElement;

            if (!root.TryGetProperty("content", out var contentArray) || contentArray.GetArrayLength() == 0)
                return null;

            var firstBlock = contentArray[0];
            if (!firstBlock.TryGetProperty("text", out var textElement))
                return null;

            var jsonText = textElement.GetString();
            if (string.IsNullOrWhiteSpace(jsonText))
                return null;

            jsonText = ExtractJsonFromText(jsonText);

            var tasks = JsonSerializer.Deserialize<List<TaskContentParsed>>(jsonText, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return tasks;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse Anthropic batch response");
            return null;
        }
    }

    private static string ExtractJsonFromText(string text)
    {
        var trimmed = text.Trim();

        if (trimmed.StartsWith("```json"))
            trimmed = trimmed["```json".Length..];
        else if (trimmed.StartsWith("```"))
            trimmed = trimmed[3..];

        if (trimmed.EndsWith("```"))
            trimmed = trimmed[..^3];

        return trimmed.Trim();
    }

    private int? ExtractTokenUsage(string responseContent)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseContent);
            if (doc.RootElement.TryGetProperty("usage", out var usage))
            {
                var total = 0;
                if (usage.TryGetProperty("input_tokens", out var input))
                    total += input.GetInt32();
                if (usage.TryGetProperty("output_tokens", out var output))
                    total += output.GetInt32();
                return total > 0 ? total : null;
            }
        }
        catch
        {
            // Ignore parsing errors for token usage
        }

        return null;
    }

    private BsonDocument BuildTemplateContent(TaskContentParsed parsed, string taskType)
    {
        var bsonDoc = new BsonDocument
        {
            { "question", parsed.Question },
            { "explanation", parsed.Explanation ?? "" }
        };

        if (parsed.Options != null && parsed.Options.Any())
        {
            bsonDoc.Add("options", new BsonArray(parsed.Options));
        }

        if (parsed.Answer != null)
        {
            bsonDoc.Add("answer", ConvertToBsonValue(parsed.Answer));
        }

        if (parsed.Hints != null && parsed.Hints.Any())
        {
            bsonDoc.Add("hints", new BsonArray(parsed.Hints));
        }

        bsonDoc.Add("task_type", taskType);

        return bsonDoc;
    }

    private async Task LogGenerationAsync(
        AITaskGenerationRequest request,
        AITaskGenerationResponse response,
        CancellationToken cancellationToken)
    {
        try
        {
            var log = new AIGenerationLogDocument
            {
                Provider = ProviderName,
                TopicId = request.TopicId,
                DifficultyBand = request.DifficultyBand,
                TaskType = request.TaskType,
                RequestPrompt = BuildPrompt(request),
                ResponseRaw = response.RawResponse ?? "",
                TokensUsed = response.TokensUsed,
                GenerationTimeMs = response.GenerationTimeMs,
                Success = response.Success,
                ErrorMessage = response.ErrorMessage,
                CreatedAt = DateTime.UtcNow
            };

            await _mongoDbContext.AIGenerationLogs.InsertOneAsync(log, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log AI generation to MongoDB");
        }
    }

    private async Task LogBatchGenerationAsync(
        AIBatchGenerationRequest request,
        AIBatchGenerationResponse response,
        int count,
        CancellationToken cancellationToken)
    {
        try
        {
            var log = new AIGenerationLogDocument
            {
                Provider = ProviderName,
                TopicId = request.TopicId,
                DifficultyBand = request.DifficultyBand,
                TaskType = request.TaskType,
                RequestPrompt = $"[BATCH x{count}] {request.SubjectName} / {request.TopicName} / Band {request.DifficultyBand} / {request.TaskType}",
                ResponseRaw = response.RawResponse ?? "",
                TokensUsed = response.TotalTokensUsed,
                GenerationTimeMs = response.GenerationTimeMs,
                Success = response.Success,
                ErrorMessage = response.ErrorMessage,
                CreatedAt = DateTime.UtcNow
            };

            await _mongoDbContext.AIGenerationLogs.InsertOneAsync(log, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log AI batch generation to MongoDB");
        }
    }

    private string BuildBatchPrompt(AIBatchGenerationRequest request, int count)
    {
        var difficultyDescription = GetDifficultyDescription(request.DifficultyBand);
        var taskTypeInstructions = GetTaskTypeInstructions(request.TaskType);

        return $@"Ти — досвідчений вчитель української школи. Створи {count} РІЗНИХ навчальних завдань українською мовою.

КОНТЕКСТ:
- Предмет: {request.SubjectName}
- Тема: {request.TopicName}
- Клас: {request.GradeLevel}
- Рівень складності: {difficultyDescription}
- Тип завдання: {taskTypeInstructions}

ВИМОГИ:
1. Кожне питання має бути УНІКАЛЬНИМ і не повторюватись
2. Питання мають бути чіткими, зрозумілими і відповідати рівню складності
3. Використовуй українську мову, відповідні терміни та приклади з українського контексту
4. Забезпеч, щоб правильна відповідь була однозначною
5. Надай детальне пояснення з кроками розв'язання для кожного завдання
6. Додай 2-3 підказки для кожного завдання

{GetTaskTypeSpecificRequirements(request.TaskType)}

Відповідь надай ВИКЛЮЧНО у форматі JSON масиву із {count} завдань без додаткового тексту:
[
  {{
    ""question"": ""текст питання"",
    ""options"": [""варіант 1"", ""варіант 2"", ""варіант 3"", ""варіант 4""],
    ""answer"": ""правильна відповідь або індекс"",
    ""explanation"": ""детальне пояснення з розв'язанням"",
    ""hints"": [""підказка 1"", ""підказка 2"", ""підказка 3""]
  }}
]";
    }

    private class TaskContentParsed
    {
        public string Question { get; set; } = string.Empty;
        public List<string>? Options { get; set; }
        public object? Answer { get; set; }
        public string? Explanation { get; set; }
        public List<string>? Hints { get; set; }
    }

    private static BsonValue ConvertToBsonValue(object value)
    {
        if (value is JsonElement jsonElement)
        {
            return jsonElement.ValueKind switch
            {
                JsonValueKind.String => BsonValue.Create(jsonElement.GetString()),
                JsonValueKind.Number => jsonElement.TryGetInt64(out var longVal)
                    ? BsonValue.Create(longVal)
                    : BsonValue.Create(jsonElement.GetDouble()),
                JsonValueKind.True => BsonValue.Create(true),
                JsonValueKind.False => BsonValue.Create(false),
                JsonValueKind.Array => new BsonArray(jsonElement.EnumerateArray().Select(e => ConvertToBsonValue(e))),
                JsonValueKind.Object => BsonDocument.Parse(jsonElement.GetRawText()),
                JsonValueKind.Null => BsonNull.Value,
                _ => BsonValue.Create(jsonElement.ToString())
            };
        }

        return BsonValue.Create(value);
    }
}
