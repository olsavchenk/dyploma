using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class StudentPerformanceConfiguration : IEntityTypeConfiguration<StudentPerformance>
{
    public void Configure(EntityTypeBuilder<StudentPerformance> builder)
    {
        builder.ToTable("student_performances");

        builder.HasKey(sp => sp.Id);

        builder.Property(sp => sp.StreakDirection)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(sp => sp.RollingAccuracy)
            .HasPrecision(5, 4);

        builder.Property(sp => sp.TopicMastery)
            .HasPrecision(5, 4);

        builder.Property(sp => sp.CreatedAt)
            .IsRequired();

        builder.Property(sp => sp.UpdatedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(sp => new { sp.StudentId, sp.TopicId })
            .IsUnique();

        builder.HasIndex(sp => sp.LastActiveAt);

        // Relationships
        builder.HasOne(sp => sp.Student)
            .WithMany(s => s.Performances)
            .HasForeignKey(sp => sp.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(sp => sp.Topic)
            .WithMany(t => t.StudentPerformances)
            .HasForeignKey(sp => sp.TopicId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
