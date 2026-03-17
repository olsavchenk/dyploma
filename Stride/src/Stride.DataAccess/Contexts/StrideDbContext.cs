using Microsoft.EntityFrameworkCore;
using Stride.Core.Entities;

namespace Stride.DataAccess.Contexts;

public class StrideDbContext : DbContext
{
    public StrideDbContext(DbContextOptions<StrideDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
    public DbSet<TeacherProfile> TeacherProfiles => Set<TeacherProfile>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Topic> Topics => Set<Topic>();
    public DbSet<LearningPath> LearningPaths => Set<LearningPath>();
    public DbSet<LearningPathStep> LearningPathSteps => Set<LearningPathStep>();
    public DbSet<StudentPerformance> StudentPerformances => Set<StudentPerformance>();
    public DbSet<TaskAttempt> TaskAttempts => Set<TaskAttempt>();
    public DbSet<Achievement> Achievements => Set<Achievement>();
    public DbSet<StudentAchievement> StudentAchievements => Set<StudentAchievement>();
    public DbSet<LeaderboardEntry> LeaderboardEntries => Set<LeaderboardEntry>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<ClassMembership> ClassMemberships => Set<ClassMembership>();
    public DbSet<ClassAssignment> ClassAssignments => Set<ClassAssignment>();
    public DbSet<TaskGenerationJob> TaskGenerationJobs => Set<TaskGenerationJob>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations from assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(StrideDbContext).Assembly);

        // Global query filter for soft-deleted users
        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
    }
}
