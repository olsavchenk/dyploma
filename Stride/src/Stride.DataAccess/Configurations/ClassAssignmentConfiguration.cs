using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class ClassAssignmentConfiguration : IEntityTypeConfiguration<ClassAssignment>
{
    public void Configure(EntityTypeBuilder<ClassAssignment> builder)
    {
        builder.ToTable("class_assignments");

        builder.HasKey(ca => ca.Id);

        builder.Property(ca => ca.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(ca => ca.Description)
            .HasMaxLength(2000);

        builder.Property(ca => ca.SubjectName)
            .IsRequired()
            .HasMaxLength(200)
            .HasDefaultValue(string.Empty);

        builder.Property(ca => ca.TopicName)
            .IsRequired()
            .HasMaxLength(200)
            .HasDefaultValue(string.Empty);

        builder.Property(ca => ca.CreatedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(ca => ca.ClassId);

        builder.HasIndex(ca => ca.TopicId);

        builder.HasIndex(ca => ca.DueDate);

        // Relationships
        builder.HasOne(ca => ca.Class)
            .WithMany(c => c.Assignments)
            .HasForeignKey(ca => ca.ClassId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ca => ca.Topic)
            .WithMany(t => t.ClassAssignments)
            .HasForeignKey(ca => ca.TopicId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
