using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;
using Stride.Core.Documents;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;
using Stride.DataAccess.Repositories;

namespace Stride.DataAccess.Seeders;

public class TaskTemplateSeeder
{
    private readonly StrideDbContext _dbContext;
    private readonly ITaskTemplateRepository _templateRepository;

    public TaskTemplateSeeder(StrideDbContext dbContext, ITaskTemplateRepository templateRepository)
    {
        _dbContext = dbContext;
        _templateRepository = templateRepository;
    }

    public async Task SeedAsync()
    {
        // Check if templates already exist
        var existingCount = await _templateRepository.GetTotalCountAsync();
        if (existingCount > 0)
        {
            return; // Already seeded
        }

        var templates = new List<TaskTemplateDocument>();

        // Get topics from database
        var mathTopics = await _dbContext.Topics
            .Where(t => t.Subject.Slug == "mathematics")
            .ToDictionaryAsync(t => t.Slug, t => t.Id);

        var ukrainianTopics = await _dbContext.Topics
            .Where(t => t.Subject.Slug == "ukrainian-language")
            .ToDictionaryAsync(t => t.Slug, t => t.Id);

        var englishTopics = await _dbContext.Topics
            .Where(t => t.Subject.Slug == "english-language")
            .ToDictionaryAsync(t => t.Slug, t => t.Id);

        var scienceTopics = await _dbContext.Topics
            .Where(t => t.Subject.Slug == "natural-sciences")
            .ToDictionaryAsync(t => t.Slug, t => t.Id);

        // Mathematics templates
        if (mathTopics.ContainsKey("natural-numbers"))
        {
            templates.AddRange(CreateNaturalNumbersTemplates(mathTopics["natural-numbers"]));
        }

        if (mathTopics.ContainsKey("fractions"))
        {
            templates.AddRange(CreateFractionsTemplates(mathTopics["fractions"]));
        }

        if (mathTopics.ContainsKey("percentages"))
        {
            templates.AddRange(CreatePercentagesTemplates(mathTopics["percentages"]));
        }

        if (mathTopics.ContainsKey("algebraic-expressions"))
        {
            templates.AddRange(CreateAlgebraicExpressionsTemplates(mathTopics["algebraic-expressions"]));
        }

        if (mathTopics.ContainsKey("equations"))
        {
            templates.AddRange(CreateEquationsTemplates(mathTopics["equations"]));
        }

        // Ukrainian language templates
        if (ukrainianTopics.ContainsKey("orthography"))
        {
            templates.AddRange(CreateOrthographyTemplates(ukrainianTopics["orthography"]));
        }

        if (ukrainianTopics.ContainsKey("parts-of-speech"))
        {
            templates.AddRange(CreatePartsOfSpeechTemplates(ukrainianTopics["parts-of-speech"]));
        }

        // English language templates
        if (englishTopics.ContainsKey("present-simple"))
        {
            templates.AddRange(CreatePresentSimpleTemplates(englishTopics["present-simple"]));
        }

        if (englishTopics.ContainsKey("past-simple"))
        {
            templates.AddRange(CreatePastSimpleTemplates(englishTopics["past-simple"]));
        }

        // Bulk insert all templates
        if (templates.Any())
        {
            await _templateRepository.BulkCreateAsync(templates);
        }
    }

    private List<TaskTemplateDocument> CreateNaturalNumbersTemplates(Guid topicId)
    {
        var templates = new List<TaskTemplateDocument>();

        // Difficulty Band 1-2: Simple addition
        for (int band = 1; band <= 2; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Обчисліть: {{a=range:1-20}} + {{b=range:1-20}}" },
                    { "options", new BsonArray
                        {
                            "{{a+b}}",
                            "{{a+b+1}}",
                            "{{a+b-1}}",
                            "{{a+b+2}}"
                        }
                    },
                    { "answer", "{{a+b}}" },
                    { "explanation", "{{a}} + {{b}} = {{a+b}}" }
                }
            });

            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "fill_blank",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "{{a=range:5-25}} + {{blank}} = {{c=a+range:10-30}}" },
                    { "answer", "{{c-a}}" },
                    { "explanation", "Щоб знайти невідоме доданок, треба від суми відняти відомий доданок: {{c}} - {{a}} = {{c-a}}" }
                }
            });
        }

        // Difficulty Band 3-4: Subtraction
        for (int band = 3; band <= 4; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Обчисліть: {{a=range:30-100}} - {{b=range:10-50}}" },
                    { "options", new BsonArray
                        {
                            "{{a-b}}",
                            "{{a-b+5}}",
                            "{{a-b-5}}",
                            "{{a+b}}"
                        }
                    },
                    { "answer", "{{a-b}}" },
                    { "explanation", "{{a}} - {{b}} = {{a-b}}" }
                }
            });

            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "fill_blank",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "{{a=range:50-150}} - {{blank}} = {{c=range:20-60}}" },
                    { "answer", "{{a-c}}" },
                    { "explanation", "Щоб знайти від'ємник, треба від зменшуваного відняти різницю: {{a}} - {{c}} = {{a-c}}" }
                }
            });

            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Яке число потрібно додати до {{a=range:25-75}}, щоб отримати {{b=a+range:30-80}}?" },
                    { "options", new BsonArray
                        {
                            "{{b-a}}",
                            "{{b+a}}",
                            "{{a-b}}",
                            "{{b-a-10}}"
                        }
                    },
                    { "answer", "{{b-a}}" },
                    { "explanation", "{{a}} + X = {{b}}, тому X = {{b}} - {{a}} = {{b-a}}" }
                }
            });

            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "true_false",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Чи правильно, що {{a=range:60-120}} - {{b=range:20-50}} = {{choice:a-b,a-b+3}}?" },
                    { "answer", "choice:true,false" },
                    { "explanation", "{{a}} - {{b}} = {{a-b}}" }
                }
            });

            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Знайдіть різницю чисел {{a=range:100-200}} і {{b=range:40-90}}" },
                    { "options", new BsonArray
                        {
                            "{{a-b}}",
                            "{{a+b}}",
                            "{{b-a}}",
                            "{{a-b-10}}"
                        }
                    },
                    { "answer", "{{a-b}}" },
                    { "explanation", "Різниця = {{a}} - {{b}} = {{a-b}}" }
                }
            });
        }

        // Difficulty Band 5-6: Multiplication
        for (int band = 5; band <= 6; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Обчисліть: {{a=range:5-15}} × {{b=range:2-12}}" },
                    { "options", new BsonArray
                        {
                            "{{a*b}}",
                            "{{a*b+a}}",
                            "{{a*b-b}}",
                            "{{a+b}}"
                        }
                    },
                    { "answer", "{{a*b}}" },
                    { "explanation", "{{a}} × {{b}} = {{a*b}}" }
                }
            });

            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "true_false",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Чи правильно, що {{a=range:3-9}} × {{b=range:3-9}} = {{choice:a*b,a*b+1}}?" },
                    { "answer", "choice:true,false" },
                    { "explanation", "{{a}} × {{b}} = {{a*b}}" }
                }
            });
        }

        // Difficulty Band 7-8: Division
        for (int band = 7; band <= 8; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "fill_blank",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "{{a=range:5-12}} × {{blank}} = {{c=a*range:3-9}}" },
                    { "answer", "{{c/a}}" },
                    { "explanation", "Щоб знайти невідомий множник, треба добуток поділити на відомий множник: {{c}} ÷ {{a}} = {{c/a}}" }
                }
            });
        }

        // Difficulty Band 9-10: Complex expressions
        for (int band = 9; band <= 10; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Обчисліть: ({{a=range:5-15}} + {{b=range:5-15}}) × {{c=range:2-5}}" },
                    { "options", new BsonArray
                        {
                            "{{(a+b)*c}}",
                            "{{a+b+c}}",
                            "{{a*c+b}}",
                            "{{(a+b)+c}}"
                        }
                    },
                    { "answer", "{{(a+b)*c}}" },
                    { "explanation", "Спочатку виконуємо дії в дужках: {{a}} + {{b}} = {{a+b}}, потім множимо: {{a+b}} × {{c}} = {{(a+b)*c}}" }
                }
            });
        }

        return templates;
    }

    private List<TaskTemplateDocument> CreateFractionsTemplates(Guid topicId)
    {
        var templates = new List<TaskTemplateDocument>();

        // Difficulty Band 1-3: Simple fractions
        for (int band = 1; band <= 3; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Яка частка фігури зафарбована, якщо з {{a=range:4-12}} частин зафарбовано {{b=range:1-3}}?" },
                    { "options", new BsonArray
                        {
                            "{{b}}/{{a}}",
                            "{{a}}/{{b}}",
                            "{{b+1}}/{{a}}",
                            "{{b}}/{{a+1}}"
                        }
                    },
                    { "answer", "{{b}}/{{a}}" },
                    { "explanation", "Зафарбовано {{b}} частин з {{a}}, тобто {{b}}/{{a}}" }
                }
            });
        }

        // Difficulty Band 4-6: Comparing fractions
        for (int band = 4; band <= 6; band++)
        {
            // a > b: numerator a is larger
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Порівняйте дроби: {{a=range:4-8}}/{{d=range:6-12}} і {{b=range:1-3}}/{{d}}" },
                    { "options", new BsonArray { ">", "<", "=" } },
                    { "answer", ">" },
                    { "explanation", "Дроби мають однаковий знаменник {{d}}: {{a}} > {{b}}, тому {{a}}/{{d}} > {{b}}/{{d}}" }
                }
            });

            // a < b: numerator a is smaller
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Порівняйте дроби: {{a=range:1-3}}/{{d=range:6-12}} і {{b=range:4-8}}/{{d}}" },
                    { "options", new BsonArray { ">", "<", "=" } },
                    { "answer", "<" },
                    { "explanation", "Дроби мають однаковий знаменник {{d}}: {{a}} < {{b}}, тому {{a}}/{{d}} < {{b}}/{{d}}" }
                }
            });
        }

        // Difficulty Band 7-10: Operations with fractions
        for (int band = 7; band <= 10; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "fill_blank",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Перетворіть неправильний дріб {{a=range:10-30}}/{{b=range:2-8}} у мішане число" },
                    { "answer", "{{a/b}} {{a%b}}/{{b}}" },
                    { "explanation", "Ділимо {{a}} на {{b}}: ціла частина {{a/b}}, залишок {{a%b}}" }
                }
            });
        }

        return templates;
    }

    private List<TaskTemplateDocument> CreatePercentagesTemplates(Guid topicId)
    {
        var templates = new List<TaskTemplateDocument>();

        // Difficulty Band 1-4: Basic percentages
        for (int band = 1; band <= 4; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Скільки відсотків становить число {{a=range:10-50}} від {{b=range:100-200}}?" },
                    { "options", new BsonArray
                        {
                            "{{a*100/b}}%",
                            "{{a/b}}%",
                            "{{b/a}}%",
                            "{{a+b}}%"
                        }
                    },
                    { "answer", "{{a*100/b}}%" },
                    { "explanation", "Щоб знайти відсоток: ({{a}} / {{b}}) × 100 = {{a*100/b}}%" }
                }
            });
        }

        // Difficulty Band 5-8: Calculating percentages
        for (int band = 5; band <= 8; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "fill_blank",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Обчисліть {{p=range:10-50}}% від {{n=range:100-500}}" },
                    { "answer", "{{p*n/100}}" },
                    { "explanation", "{{p}}% від {{n}} = {{p}} × {{n}} ÷ 100 = {{p*n/100}}" }
                }
            });
        }

        // Difficulty Band 9-10: Complex percentage problems
        for (int band = 9; band <= 10; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Товар коштував {{p=range:500-2000}} грн. Після знижки {{d=range:10-30}}% він коштує..." },
                    { "options", new BsonArray
                        {
                            "{{p-p*d/100}} грн",
                            "{{p+p*d/100}} грн",
                            "{{p*d/100}} грн",
                            "{{p-d}} грн"
                        }
                    },
                    { "answer", "{{p-p*d/100}} грн" },
                    { "explanation", "Знижка: {{p}} × {{d}}% = {{p*d/100}} грн. Нова ціна: {{p}} - {{p*d/100}} = {{p-p*d/100}} грн" }
                }
            });
        }

        return templates;
    }

    private List<TaskTemplateDocument> CreateAlgebraicExpressionsTemplates(Guid topicId)
    {
        var templates = new List<TaskTemplateDocument>();

        // Difficulty Band 1-3: Simple expressions
        for (int band = 1; band <= 3; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "fill_blank",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Обчисліть значення виразу {{a=range:2-5}}x + {{b=range:3-10}} при x = {{x=range:1-5}}" },
                    { "answer", "{{a*x+b}}" },
                    { "explanation", "Підставляємо x = {{x}}: {{a}} × {{x}} + {{b}} = {{a*x}} + {{b}} = {{a*x+b}}" }
                }
            });
        }

        // Difficulty Band 4-7: Simplification
        for (int band = 4; band <= 7; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Спростіть вираз: {{a=range:2-8}}x + {{b=range:2-8}}x" },
                    { "options", new BsonArray
                        {
                            "{{a+b}}x",
                            "{{a*b}}x",
                            "{{a}}x + {{b}}",
                            "{{a+b}}"
                        }
                    },
                    { "answer", "{{a+b}}x" },
                    { "explanation", "Додаємо коефіцієнти: {{a}}x + {{b}}x = {{a+b}}x" }
                }
            });
        }

        return templates;
    }

    private List<TaskTemplateDocument> CreateEquationsTemplates(Guid topicId)
    {
        var templates = new List<TaskTemplateDocument>();

        // Difficulty Band 1-5: Simple linear equations
        for (int band = 1; band <= 5; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "fill_blank",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Розв'яжіть рівняння: x + {{a=range:5-30}} = {{b=range:40-80}}" },
                    { "answer", "{{b-a}}" },
                    { "explanation", "x = {{b}} - {{a}} = {{b-a}}" }
                }
            });

            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Розв'яжіть рівняння: {{a=range:2-8}}x = {{b=range:20-80}}" },
                    { "options", new BsonArray
                        {
                            "x = {{b/a}}",
                            "x = {{b-a}}",
                            "x = {{b+a}}",
                            "x = {{a*b}}"
                        }
                    },
                    { "answer", "x = {{b/a}}" },
                    { "explanation", "x = {{b}} ÷ {{a}} = {{b/a}}" }
                }
            });
        }

        // Difficulty Band 6-10: More complex equations
        for (int band = 6; band <= 10; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "fill_blank",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Розв'яжіть рівняння: {{a=range:2-5}}x + {{b=range:5-15}} = {{c=range:30-60}}" },
                    { "answer", "{{(c-b)/a}}" },
                    { "explanation", "{{a}}x = {{c}} - {{b}} = {{c-b}}, x = {{c-b}} ÷ {{a}} = {{(c-b)/a}}" }
                }
            });
        }

        return templates;
    }

    private List<TaskTemplateDocument> CreateOrthographyTemplates(Guid topicId)
    {
        var templates = new List<TaskTemplateDocument>();

        // Sample templates for Ukrainian orthography
        for (int band = 1; band <= 5; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Оберіть правильний варіант написання слова:" },
                    { "options", new BsonArray { "життя", "житя", "жіття", "життя" } },
                    { "answer", "життя" },
                    { "explanation", "Правильно пишеться 'життя' з подвоєною літерою 'т'" }
                }
            });
        }

        return templates;
    }

    private List<TaskTemplateDocument> CreatePartsOfSpeechTemplates(Guid topicId)
    {
        var templates = new List<TaskTemplateDocument>();

        for (int band = 1; band <= 5; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "До якої частини мови належить слово 'бігти'?" },
                    { "options", new BsonArray { "Дієслово", "Іменник", "Прикметник", "Прислівник" } },
                    { "answer", "Дієслово" },
                    { "explanation", "'Бігти' — це дієслово, яке означає дію" }
                }
            });
        }

        return templates;
    }

    private List<TaskTemplateDocument> CreatePresentSimpleTemplates(Guid topicId)
    {
        var templates = new List<TaskTemplateDocument>();

        for (int band = 1; band <= 5; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "fill_blank",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Complete: He {{blank}} (play) football every day." },
                    { "answer", "plays" },
                    { "explanation", "With 'he/she/it' we add '-s' or '-es' to the verb in Present Simple" }
                }
            });

            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Choose the correct form: She {{blank}} English." },
                    { "options", new BsonArray { "speaks", "speak", "speaking", "to speak" } },
                    { "answer", "speaks" },
                    { "explanation", "Third person singular (she) requires 's' at the end: speaks" }
                }
            });
        }

        return templates;
    }

    private List<TaskTemplateDocument> CreatePastSimpleTemplates(Guid topicId)
    {
        var templates = new List<TaskTemplateDocument>();

        for (int band = 1; band <= 5; band++)
        {
            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "multiple_choice",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Choose the Past Simple form of 'go':" },
                    { "options", new BsonArray { "went", "goed", "goes", "going" } },
                    { "answer", "went" },
                    { "explanation", "'Go' is an irregular verb. Past Simple: went" }
                }
            });

            templates.Add(new TaskTemplateDocument
            {
                TopicId = topicId,
                TaskType = "fill_blank",
                DifficultyBand = band,
                IsApproved = true,
                TemplateContent = new BsonDocument
                {
                    { "question", "Complete: I {{blank}} (visit) my grandmother yesterday." },
                    { "answer", "visited" },
                    { "explanation", "'Visit' is a regular verb. Add '-ed' for Past Simple: visited" }
                }
            });
        }

        return templates;
    }
}
