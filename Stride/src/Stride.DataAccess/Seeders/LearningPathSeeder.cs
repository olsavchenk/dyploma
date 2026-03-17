using Microsoft.EntityFrameworkCore;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;

namespace Stride.DataAccess.Seeders;

public class LearningPathSeeder
{
    private readonly StrideDbContext _dbContext;

    public LearningPathSeeder(StrideDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task SeedAsync()
    {
        // Check if learning paths already exist
        if (await _dbContext.LearningPaths.AnyAsync())
        {
            return; // Already seeded
        }

        var now = DateTime.UtcNow;

        // Get subjects and topics
        var subjects = await _dbContext.Subjects.ToListAsync();
        var topics = await _dbContext.Topics.ToListAsync();

        var mathematics = subjects.FirstOrDefault(s => s.Slug == "mathematics");
        var ukrainian = subjects.FirstOrDefault(s => s.Slug == "ukrainian-language");
        var english = subjects.FirstOrDefault(s => s.Slug == "english-language");
        var science = subjects.FirstOrDefault(s => s.Slug == "natural-sciences");

        if (mathematics == null || ukrainian == null || english == null || science == null)
        {
            return; // Subjects not found, cannot seed learning paths
        }

        var learningPaths = new List<LearningPath>();
        var learningPathSteps = new List<LearningPathStep>();

        // 1. Mathematics Learning Paths

        // Grade 5-6 Mathematics
        var mathGrade5Path = new LearningPath
        {
            Id = Guid.NewGuid(),
            SubjectId = mathematics.Id,
            Name = "Математика 5-6 класу",
            Description = "Базова математика для учнів 5-6 класів: натуральні числа, дроби та відсотки",
            GradeLevel = 5,
            IsPublished = true,
            CreatedAt = now
        };
        learningPaths.Add(mathGrade5Path);

        var mathGrade5Topics = topics.Where(t =>
            t.SubjectId == mathematics.Id &&
            (t.Slug == "natural-numbers" || t.Slug == "fractions" || t.Slug == "percentages"))
            .OrderBy(t => t.SortOrder)
            .ToList();

        for (int i = 0; i < mathGrade5Topics.Count; i++)
        {
            learningPathSteps.Add(new LearningPathStep
            {
                Id = Guid.NewGuid(),
                LearningPathId = mathGrade5Path.Id,
                TopicId = mathGrade5Topics[i].Id,
                StepOrder = i + 1
            });
        }

        // Grade 7-8 Mathematics
        var mathGrade7Path = new LearningPath
        {
            Id = Guid.NewGuid(),
            SubjectId = mathematics.Id,
            Name = "Математика 7-8 класу",
            Description = "Алгебра та геометрія для учнів 7-8 класів: вирази, рівняння, площі та об'єми",
            GradeLevel = 7,
            IsPublished = true,
            CreatedAt = now
        };
        learningPaths.Add(mathGrade7Path);

        var mathGrade7Topics = topics.Where(t =>
            t.SubjectId == mathematics.Id &&
            (t.Slug == "algebraic-expressions" || t.Slug == "equations" || t.Slug == "geometry-areas-volumes"))
            .OrderBy(t => t.SortOrder)
            .ToList();

        for (int i = 0; i < mathGrade7Topics.Count; i++)
        {
            learningPathSteps.Add(new LearningPathStep
            {
                Id = Guid.NewGuid(),
                LearningPathId = mathGrade7Path.Id,
                TopicId = mathGrade7Topics[i].Id,
                StepOrder = i + 1
            });
        }

        // 2. Ukrainian Language Learning Paths

        // Grade 5-6 Ukrainian
        var ukrainianGrade5Path = new LearningPath
        {
            Id = Guid.NewGuid(),
            SubjectId = ukrainian.Id,
            Name = "Українська мова 5-6 класу",
            Description = "Основи української мови: орфографія та частини мови",
            GradeLevel = 5,
            IsPublished = true,
            CreatedAt = now
        };
        learningPaths.Add(ukrainianGrade5Path);

        var ukrainianGrade5Topics = topics.Where(t =>
            t.SubjectId == ukrainian.Id &&
            (t.Slug == "orthography" || t.Slug == "parts-of-speech"))
            .OrderBy(t => t.SortOrder)
            .ToList();

        for (int i = 0; i < ukrainianGrade5Topics.Count; i++)
        {
            learningPathSteps.Add(new LearningPathStep
            {
                Id = Guid.NewGuid(),
                LearningPathId = ukrainianGrade5Path.Id,
                TopicId = ukrainianGrade5Topics[i].Id,
                StepOrder = i + 1
            });
        }

        // Grade 7-8 Ukrainian
        var ukrainianGrade7Path = new LearningPath
        {
            Id = Guid.NewGuid(),
            SubjectId = ukrainian.Id,
            Name = "Українська мова 7-8 класу",
            Description = "Поглиблене вивчення української мови: синтаксис та пунктуація",
            GradeLevel = 7,
            IsPublished = true,
            CreatedAt = now
        };
        learningPaths.Add(ukrainianGrade7Path);

        var ukrainianGrade7Topics = topics.Where(t =>
            t.SubjectId == ukrainian.Id &&
            (t.Slug == "syntax" || t.Slug == "punctuation"))
            .OrderBy(t => t.SortOrder)
            .ToList();

        for (int i = 0; i < ukrainianGrade7Topics.Count; i++)
        {
            learningPathSteps.Add(new LearningPathStep
            {
                Id = Guid.NewGuid(),
                LearningPathId = ukrainianGrade7Path.Id,
                TopicId = ukrainianGrade7Topics[i].Id,
                StepOrder = i + 1
            });
        }

        // 3. English Language Learning Paths

        // Grade 5-6 English
        var englishGrade5Path = new LearningPath
        {
            Id = Guid.NewGuid(),
            SubjectId = english.Id,
            Name = "English для початківців",
            Description = "Основи англійської граматики: Present та Past Simple",
            GradeLevel = 5,
            IsPublished = true,
            CreatedAt = now
        };
        learningPaths.Add(englishGrade5Path);

        var englishGrade5Topics = topics.Where(t =>
            t.SubjectId == english.Id &&
            (t.Slug == "present-simple" || t.Slug == "past-simple"))
            .OrderBy(t => t.SortOrder)
            .ToList();

        for (int i = 0; i < englishGrade5Topics.Count; i++)
        {
            learningPathSteps.Add(new LearningPathStep
            {
                Id = Guid.NewGuid(),
                LearningPathId = englishGrade5Path.Id,
                TopicId = englishGrade5Topics[i].Id,
                StepOrder = i + 1
            });
        }

        // Grade 7-8 English
        var englishGrade7Path = new LearningPath
        {
            Id = Guid.NewGuid(),
            SubjectId = english.Id,
            Name = "English середній рівень",
            Description = "Поглиблена граматика: модальні дієслова та умовні речення",
            GradeLevel = 7,
            IsPublished = true,
            CreatedAt = now
        };
        learningPaths.Add(englishGrade7Path);

        var englishGrade7Topics = topics.Where(t =>
            t.SubjectId == english.Id &&
            (t.Slug == "modal-verbs" || t.Slug == "conditionals"))
            .OrderBy(t => t.SortOrder)
            .ToList();

        for (int i = 0; i < englishGrade7Topics.Count; i++)
        {
            learningPathSteps.Add(new LearningPathStep
            {
                Id = Guid.NewGuid(),
                LearningPathId = englishGrade7Path.Id,
                TopicId = englishGrade7Topics[i].Id,
                StepOrder = i + 1
            });
        }

        // 4. Science Learning Paths

        // Grade 5-6 Science
        var scienceGrade5Path = new LearningPath
        {
            Id = Guid.NewGuid(),
            SubjectId = science.Id,
            Name = "Природознавство 5-6 класу",
            Description = "Основи біології: рослини та тварини",
            GradeLevel = 5,
            IsPublished = true,
            CreatedAt = now
        };
        learningPaths.Add(scienceGrade5Path);

        var scienceGrade5Topics = topics.Where(t =>
            t.SubjectId == science.Id &&
            (t.Slug == "plant-structure" || t.Slug == "animal-world"))
            .OrderBy(t => t.SortOrder)
            .ToList();

        for (int i = 0; i < scienceGrade5Topics.Count; i++)
        {
            learningPathSteps.Add(new LearningPathStep
            {
                Id = Guid.NewGuid(),
                LearningPathId = scienceGrade5Path.Id,
                TopicId = scienceGrade5Topics[i].Id,
                StepOrder = i + 1
            });
        }

        // Grade 7-8 Science
        var scienceGrade7Path = new LearningPath
        {
            Id = Guid.NewGuid(),
            SubjectId = science.Id,
            Name = "Природознавство 7-8 класу",
            Description = "Фізика та хімія: явища та реакції",
            GradeLevel = 7,
            IsPublished = true,
            CreatedAt = now
        };
        learningPaths.Add(scienceGrade7Path);

        var scienceGrade7Topics = topics.Where(t =>
            t.SubjectId == science.Id &&
            (t.Slug == "physical-phenomena" || t.Slug == "chemical-reactions"))
            .OrderBy(t => t.SortOrder)
            .ToList();

        for (int i = 0; i < scienceGrade7Topics.Count; i++)
        {
            learningPathSteps.Add(new LearningPathStep
            {
                Id = Guid.NewGuid(),
                LearningPathId = scienceGrade7Path.Id,
                TopicId = scienceGrade7Topics[i].Id,
                StepOrder = i + 1
            });
        }

        // Add to database
        await _dbContext.LearningPaths.AddRangeAsync(learningPaths);
        await _dbContext.LearningPathSteps.AddRangeAsync(learningPathSteps);
        await _dbContext.SaveChangesAsync();
    }
}
