using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class LearningPathStepConfiguration : IEntityTypeConfiguration<LearningPathStep>
{
    public void Configure(EntityTypeBuilder<LearningPathStep> builder)
    {
        builder.ToTable("learning_path_steps");

        builder.HasKey(lps => lps.Id);

        // Indexes
        builder.HasIndex(lps => new { lps.LearningPathId, lps.StepOrder })
            .IsUnique();

        // Relationships
        builder.HasOne(lps => lps.LearningPath)
            .WithMany(lp => lp.Steps)
            .HasForeignKey(lps => lps.LearningPathId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(lps => lps.Topic)
            .WithMany(t => t.LearningPathSteps)
            .HasForeignKey(lps => lps.TopicId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
