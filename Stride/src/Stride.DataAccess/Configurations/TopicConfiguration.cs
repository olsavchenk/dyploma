using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class TopicConfiguration : IEntityTypeConfiguration<Topic>
{
    public void Configure(EntityTypeBuilder<Topic> builder)
    {
        builder.ToTable("topics");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Slug)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(t => t.CreatedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(t => new { t.SubjectId, t.Slug })
            .IsUnique();

        builder.HasIndex(t => t.ParentTopicId);

        builder.HasIndex(t => new { t.SubjectId, t.SortOrder });

        // Relationships
        builder.HasOne(t => t.Subject)
            .WithMany(s => s.Topics)
            .HasForeignKey(t => t.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.ParentTopic)
            .WithMany(t => t.ChildTopics)
            .HasForeignKey(t => t.ParentTopicId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
