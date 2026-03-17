using Microsoft.EntityFrameworkCore;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;

namespace Stride.DataAccess.Seeders;

public class AchievementSeeder
{
    private readonly StrideDbContext _dbContext;

    public AchievementSeeder(StrideDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task SeedAsync()
    {
        // Check if achievements already exist
        if (await _dbContext.Achievements.AnyAsync())
        {
            return; // Already seeded
        }

        var now = DateTime.UtcNow;

        var achievements = new List<Achievement>
        {
            // First steps
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "first_task",
                Name = "Перші кроки",
                Description = "Виконайте своє перше завдання",
                IconUrl = "/assets/achievements/first_task.svg",
                XpReward = 50,
                IsHidden = false,
                CreatedAt = now
            },

            // Streak achievements
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "streak_7",
                Name = "Тижнева звичка",
                Description = "Підтримуйте щоденну активність протягом 7 днів",
                IconUrl = "/assets/achievements/streak_7.svg",
                XpReward = 100,
                IsHidden = false,
                CreatedAt = now
            },
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "streak_30",
                Name = "Місячна відданість",
                Description = "Підтримуйте щоденну активність протягом 30 днів",
                IconUrl = "/assets/achievements/streak_30.svg",
                XpReward = 500,
                IsHidden = false,
                CreatedAt = now
            },
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "streak_100",
                Name = "Легенда послідовності",
                Description = "Підтримуйте щоденну активність протягом 100 днів",
                IconUrl = "/assets/achievements/streak_100.svg",
                XpReward = 2000,
                IsHidden = true,
                CreatedAt = now
            },

            // Level achievements
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "level_10",
                Name = "Початківець",
                Description = "Досягніть 10-го рівня",
                IconUrl = "/assets/achievements/level_10.svg",
                XpReward = 200,
                IsHidden = false,
                CreatedAt = now
            },
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "level_25",
                Name = "Досвідчений учень",
                Description = "Досягніть 25-го рівня",
                IconUrl = "/assets/achievements/level_25.svg",
                XpReward = 500,
                IsHidden = false,
                CreatedAt = now
            },
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "level_50",
                Name = "Майстер знань",
                Description = "Досягніть 50-го рівня",
                IconUrl = "/assets/achievements/level_50.svg",
                XpReward = 1000,
                IsHidden = true,
                CreatedAt = now
            },

            // XP milestones
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "xp_1000",
                Name = "Колекціонер досвіду",
                Description = "Зібрайте 1000 XP",
                IconUrl = "/assets/achievements/xp_1000.svg",
                XpReward = 100,
                IsHidden = false,
                CreatedAt = now
            },
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "xp_5000",
                Name = "Майстер досвіду",
                Description = "Зібрайте 5000 XP",
                IconUrl = "/assets/achievements/xp_5000.svg",
                XpReward = 300,
                IsHidden = false,
                CreatedAt = now
            },
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "xp_10000",
                Name = "Легенда досвіду",
                Description = "Зібрайте 10000 XP",
                IconUrl = "/assets/achievements/xp_10000.svg",
                XpReward = 500,
                IsHidden = true,
                CreatedAt = now
            },

            // Task completion milestones
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "tasks_10",
                Name = "Активний учень",
                Description = "Виконайте 10 завдань",
                IconUrl = "/assets/achievements/tasks_10.svg",
                XpReward = 75,
                IsHidden = false,
                CreatedAt = now
            },
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "tasks_50",
                Name = "Ентузіаст навчання",
                Description = "Виконайте 50 завдань",
                IconUrl = "/assets/achievements/tasks_50.svg",
                XpReward = 200,
                IsHidden = false,
                CreatedAt = now
            },
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "tasks_100",
                Name = "Завзятий студент",
                Description = "Виконайте 100 завдань",
                IconUrl = "/assets/achievements/tasks_100.svg",
                XpReward = 400,
                IsHidden = false,
                CreatedAt = now
            },
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "tasks_500",
                Name = "Непереможний",
                Description = "Виконайте 500 завдань",
                IconUrl = "/assets/achievements/tasks_500.svg",
                XpReward = 1500,
                IsHidden = true,
                CreatedAt = now
            },

            // Accuracy achievement
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "accuracy_master",
                Name = "Майстер точності",
                Description = "Досягніть 70%+ точності на 20+ завданнях",
                IconUrl = "/assets/achievements/accuracy_master.svg",
                XpReward = 300,
                IsHidden = false,
                CreatedAt = now
            },

            // Perfect streak achievement
            new Achievement
            {
                Id = Guid.NewGuid(),
                Code = "perfect_10",
                Name = "Бездоганна серія",
                Description = "Виконайте 10 завдань поспіль без помилок",
                IconUrl = "/assets/achievements/perfect_10.svg",
                XpReward = 250,
                IsHidden = false,
                CreatedAt = now
            }
        };

        await _dbContext.Achievements.AddRangeAsync(achievements);
        await _dbContext.SaveChangesAsync();
    }
}
