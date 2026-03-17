using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class TaskGenerationJobConfiguration : IEntityTypeConfiguration<TaskGenerationJob>
{
    public void Configure(EntityTypeBuilder<TaskGenerationJob> builder)
    {
        builder.ToTable("task_generation_jobs");

        builder.HasKey(j => j.Id);

        builder.Property(j => j.Status)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(j => j.ErrorMessage)
            .HasMaxLength(2000);

        builder.Property(j => j.CreatedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(j => j.AssignmentId);
        builder.HasIndex(j => j.TopicId);
        builder.HasIndex(j => j.Status);

        // Relationships
        builder.HasOne(j => j.Assignment)
            .WithMany()
            .HasForeignKey(j => j.AssignmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(j => j.Topic)
            .WithMany()
            .HasForeignKey(j => j.TopicId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
