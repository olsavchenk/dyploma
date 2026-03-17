using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class TaskAttemptConfiguration : IEntityTypeConfiguration<TaskAttempt>
{
    public void Configure(EntityTypeBuilder<TaskAttempt> builder)
    {
        builder.ToTable("task_attempts");

        builder.HasKey(ta => ta.Id);

        builder.Property(ta => ta.TaskInstanceId)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(ta => ta.CreatedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(ta => ta.StudentId);

        builder.HasIndex(ta => ta.TopicId);

        builder.HasIndex(ta => ta.CreatedAt);

        builder.HasIndex(ta => new { ta.StudentId, ta.TopicId, ta.CreatedAt });

        // Relationships
        builder.HasOne(ta => ta.Student)
            .WithMany(s => s.TaskAttempts)
            .HasForeignKey(ta => ta.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ta => ta.Topic)
            .WithMany(t => t.TaskAttempts)
            .HasForeignKey(ta => ta.TopicId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
