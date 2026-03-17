using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class StudentAchievementConfiguration : IEntityTypeConfiguration<StudentAchievement>
{
    public void Configure(EntityTypeBuilder<StudentAchievement> builder)
    {
        builder.ToTable("student_achievements");

        builder.HasKey(sa => sa.Id);

        builder.Property(sa => sa.UnlockedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(sa => new { sa.StudentId, sa.AchievementId })
            .IsUnique();

        builder.HasIndex(sa => sa.UnlockedAt);

        // Relationships
        builder.HasOne(sa => sa.Student)
            .WithMany(s => s.Achievements)
            .HasForeignKey(sa => sa.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(sa => sa.Achievement)
            .WithMany(a => a.StudentAchievements)
            .HasForeignKey(sa => sa.AchievementId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
