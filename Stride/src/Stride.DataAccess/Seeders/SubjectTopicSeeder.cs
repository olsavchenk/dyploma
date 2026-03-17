using Microsoft.EntityFrameworkCore;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;

namespace Stride.DataAccess.Seeders;

public class SubjectTopicSeeder
{
    private readonly StrideDbContext _dbContext;

    public SubjectTopicSeeder(StrideDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task SeedAsync()
    {
        // Check if subjects already exist
        if (await _dbContext.Subjects.AnyAsync())
        {
            return; // Already seeded
        }

        var now = DateTime.UtcNow;

        // 1. Mathematics
        var mathematics = new Subject
        {
            Id = Guid.NewGuid(),
            Name = "Математика",
            Slug = "mathematics",
            Description = "Вивчайте математику від базових операцій до складних рівнянь та геометрії",
            IconUrl = "/assets/subjects/mathematics.svg",
            SortOrder = 1,
            IsActive = true,
            CreatedAt = now
        };

        var mathTopics = new List<Topic>
        {
            // Grade 5-6
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = mathematics.Id,
                Name = "Натуральні числа",
                Slug = "natural-numbers",
                Description = "Основні операції з натуральними числами: додавання, віднімання, множення, ділення",
                GradeLevel = 5,
                SortOrder = 1,
                IsActive = true,
                CreatedAt = now
            },
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = mathematics.Id,
                Name = "Дроби",
                Slug = "fractions",
                Description = "Звичайні та десяткові дроби, операції з дробами",
                GradeLevel = 5,
                SortOrder = 2,
                IsActive = true,
                CreatedAt = now
            },
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = mathematics.Id,
                Name = "Відсотки",
                Slug = "percentages",
                Description = "Розуміння відсотків, обчислення відсотків від числа",
                GradeLevel = 6,
                SortOrder = 3,
                IsActive = true,
                CreatedAt = now
            },
            // Grade 7-8
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = mathematics.Id,
                Name = "Алгебраїчні вирази",
                Slug = "algebraic-expressions",
                Description = "Змінні, вирази, спрощення виразів",
                GradeLevel = 7,
                SortOrder = 4,
                IsActive = true,
                CreatedAt = now
            },
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = mathematics.Id,
                Name = "Рівняння",
                Slug = "equations",
                Description = "Лінійні рівняння та системи рівнянь",
                GradeLevel = 7,
                SortOrder = 5,
                IsActive = true,
                CreatedAt = now
            },
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = mathematics.Id,
                Name = "Геометрія: площі та об'єми",
                Slug = "geometry-areas-volumes",
                Description = "Обчислення площ фігур та об'ємів тіл",
                GradeLevel = 8,
                SortOrder = 6,
                IsActive = true,
                CreatedAt = now
            }
        };

        // 2. Ukrainian Language
        var ukrainian = new Subject
        {
            Id = Guid.NewGuid(),
            Name = "Українська мова",
            Slug = "ukrainian-language",
            Description = "Вивчайте граматику, орфографію та пунктуацію української мови",
            IconUrl = "/assets/subjects/ukrainian.svg",
            SortOrder = 2,
            IsActive = true,
            CreatedAt = now
        };

        var ukrainianTopics = new List<Topic>
        {
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = ukrainian.Id,
                Name = "Орфографія",
                Slug = "orthography",
                Description = "Правила написання слів, правопис",
                GradeLevel = 5,
                SortOrder = 1,
                IsActive = true,
                CreatedAt = now
            },
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = ukrainian.Id,
                Name = "Частини мови",
                Slug = "parts-of-speech",
                Description = "Іменник, прикметник, дієслово та інші частини мови",
                GradeLevel = 6,
                SortOrder = 2,
                IsActive = true,
                CreatedAt = now
            },
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = ukrainian.Id,
                Name = "Синтаксис",
                Slug = "syntax",
                Description = "Будова речень, члени речення",
                GradeLevel = 7,
                SortOrder = 3,
                IsActive = true,
                CreatedAt = now
            },
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = ukrainian.Id,
                Name = "Пунктуація",
                Slug = "punctuation",
                Description = "Розділові знаки та правила їх вживання",
                GradeLevel = 8,
                SortOrder = 4,
                IsActive = true,
                CreatedAt = now
            }
        };

        // 3. English Language
        var english = new Subject
        {
            Id = Guid.NewGuid(),
            Name = "Англійська мова",
            Slug = "english-language",
            Description = "Вивчайте англійську мову: граматику, лексику, читання та письмо",
            IconUrl = "/assets/subjects/english.svg",
            SortOrder = 3,
            IsActive = true,
            CreatedAt = now
        };

        var englishTopics = new List<Topic>
        {
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = english.Id,
                Name = "Present Simple Tense",
                Slug = "present-simple",
                Description = "Теперішній простий час: утворення, вживання",
                GradeLevel = 5,
                SortOrder = 1,
                IsActive = true,
                CreatedAt = now
            },
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = english.Id,
                Name = "Past Simple Tense",
                Slug = "past-simple",
                Description = "Минулий простий час: правильні та неправильні дієслова",
                GradeLevel = 6,
                SortOrder = 2,
                IsActive = true,
                CreatedAt = now
            },
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = english.Id,
                Name = "Modal Verbs",
                Slug = "modal-verbs",
                Description = "Модальні дієслова: can, could, may, might, must, should",
                GradeLevel = 7,
                SortOrder = 3,
                IsActive = true,
                CreatedAt = now
            },
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = english.Id,
                Name = "Conditional Sentences",
                Slug = "conditionals",
                Description = "Умовні речення: нульовий, перший, другий типи",
                GradeLevel = 8,
                SortOrder = 4,
                IsActive = true,
                CreatedAt = now
            }
        };

        // 4. Science (Natural Sciences)
        var science = new Subject
        {
            Id = Guid.NewGuid(),
            Name = "Природознавство",
            Slug = "natural-sciences",
            Description = "Вивчайте природу: біологію, фізику, хімію та екологію",
            IconUrl = "/assets/subjects/science.svg",
            SortOrder = 4,
            IsActive = true,
            CreatedAt = now
        };

        var scienceTopics = new List<Topic>
        {
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = science.Id,
                Name = "Будова рослин",
                Slug = "plant-structure",
                Description = "Корінь, стебло, листя, квітка: будова та функції",
                GradeLevel = 5,
                SortOrder = 1,
                IsActive = true,
                CreatedAt = now
            },
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = science.Id,
                Name = "Тваринний світ",
                Slug = "animal-world",
                Description = "Класифікація тварин, їх особливості",
                GradeLevel = 6,
                SortOrder = 2,
                IsActive = true,
                CreatedAt = now
            },
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = science.Id,
                Name = "Фізичні явища",
                Slug = "physical-phenomena",
                Description = "Рух, сила, енергія, теплота",
                GradeLevel = 7,
                SortOrder = 3,
                IsActive = true,
                CreatedAt = now
            },
            new Topic
            {
                Id = Guid.NewGuid(),
                SubjectId = science.Id,
                Name = "Хімічні реакції",
                Slug = "chemical-reactions",
                Description = "Типи хімічних реакцій, закони збереження",
                GradeLevel = 8,
                SortOrder = 4,
                IsActive = true,
                CreatedAt = now
            }
        };

        // Add to database
        await _dbContext.Subjects.AddRangeAsync(new[] { mathematics, ukrainian, english, science });
        await _dbContext.Topics.AddRangeAsync(mathTopics);
        await _dbContext.Topics.AddRangeAsync(ukrainianTopics);
        await _dbContext.Topics.AddRangeAsync(englishTopics);
        await _dbContext.Topics.AddRangeAsync(scienceTopics);

        await _dbContext.SaveChangesAsync();
    }
}
