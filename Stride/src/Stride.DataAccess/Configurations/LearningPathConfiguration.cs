using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class LearningPathConfiguration : IEntityTypeConfiguration<LearningPath>
{
    public void Configure(EntityTypeBuilder<LearningPath> builder)
    {
        builder.ToTable("learning_paths");

        builder.HasKey(lp => lp.Id);

        builder.Property(lp => lp.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(lp => lp.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(lp => lp.CreatedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(lp => lp.SubjectId);

        builder.HasIndex(lp => new { lp.SubjectId, lp.GradeLevel });

        // Relationships
        builder.HasOne(lp => lp.Subject)
            .WithMany(s => s.LearningPaths)
            .HasForeignKey(lp => lp.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
