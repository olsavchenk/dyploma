using Microsoft.EntityFrameworkCore;
using Stride.Core.Entities;
using Stride.DataAccess.Contexts;

namespace Stride.DataAccess.Seeders;

public class ClassSeeder
{
    private readonly StrideDbContext _dbContext;

    public ClassSeeder(StrideDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task SeedAsync()
    {
        // Skip if the test class already exists
        if (await _dbContext.Classes.AnyAsync(c => c.JoinCode == "TEST01"))
        {
            return;
        }

        var now = DateTime.UtcNow;

        // --- Teacher ---
        var existingTeacherUser = await _dbContext.Users
            .Include(u => u.TeacherProfile)
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == "teacher@test.com");

        User teacherUser;
        TeacherProfile teacherProfile;

        if (existingTeacherUser?.TeacherProfile != null)
        {
            teacherUser = existingTeacherUser;
            teacherProfile = existingTeacherUser.TeacherProfile;
        }
        else
        {
            teacherUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "teacher@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test1234!"),
                DisplayName = "Test Teacher",
                Role = "Teacher",
                GdprConsent = true,
                CreatedAt = now
            };

            teacherProfile = new TeacherProfile
            {
                Id = Guid.NewGuid(),
                UserId = teacherUser.Id,
                School = "Test School",
                GradesTaught = "5,6,7,8",
                SubjectsExpertise = "Mathematics",
                CreatedAt = now
            };

            await _dbContext.Users.AddAsync(teacherUser);
            await _dbContext.TeacherProfiles.AddAsync(teacherProfile);
        }

        // --- Student ---
        var existingStudentUser = await _dbContext.Users
            .Include(u => u.StudentProfile)
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == "student@test.com");

        User studentUser;
        StudentProfile studentProfile;

        if (existingStudentUser?.StudentProfile != null)
        {
            studentUser = existingStudentUser;
            studentProfile = existingStudentUser.StudentProfile;
        }
        else
        {
            studentUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "student@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test1234!"),
                DisplayName = "Test Student",
                Role = "Student",
                GdprConsent = true,
                CreatedAt = now
            };

            studentProfile = new StudentProfile
            {
                Id = Guid.NewGuid(),
                UserId = studentUser.Id,
                TotalXp = 0,
                CurrentLevel = 1,
                CurrentStreak = 0,
                LongestStreak = 0,
                League = "Bronze",
                CreatedAt = now
            };

            await _dbContext.Users.AddAsync(studentUser);
            await _dbContext.StudentProfiles.AddAsync(studentProfile);
        }

        // --- Class ---
        // Save profiles first so the FK for TeacherId resolves
        await _dbContext.SaveChangesAsync();

        var testClass = new Class
        {
            Id = Guid.NewGuid(),
            TeacherId = teacherProfile.Id,
            Name = "Test Class 7A",
            JoinCode = "TEST01",
            GradeLevel = 7,
            IsActive = true,
            CreatedAt = now
        };

        await _dbContext.Classes.AddAsync(testClass);
        await _dbContext.SaveChangesAsync();

        // --- Assignment ---
        // Try to link to the seeded grade-7 equations topic
        var topic = await _dbContext.Topics
            .Include(t => t.Subject)
            .FirstOrDefaultAsync(t => t.Slug == "equations" && t.Subject.Slug == "mathematics");

        var assignment = new ClassAssignment
        {
            Id = Guid.NewGuid(),
            ClassId = testClass.Id,
            TopicId = topic?.Id,
            SubjectName = topic?.Subject.Name ?? "Математика",
            TopicName = topic?.Name ?? "Рівняння",
            Title = "Лінійні рівняння — домашнє завдання",
            Description = "Розв'яжіть набір лінійних рівнянь різної складності.",
            DueDate = now.AddDays(7),
            TaskCount = 10,
            MinDifficulty = 1,
            MaxDifficulty = 50,
            CreatedAt = now
        };

        await _dbContext.ClassAssignments.AddAsync(assignment);
        await _dbContext.SaveChangesAsync();
    }
}
