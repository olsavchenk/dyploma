using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class SubjectConfiguration : IEntityTypeConfiguration<Subject>
{
    public void Configure(EntityTypeBuilder<Subject> builder)
    {
        builder.ToTable("subjects");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Slug)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(s => s.IconUrl)
            .HasMaxLength(500);

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(s => s.Slug)
            .IsUnique();

        builder.HasIndex(s => s.SortOrder);
    }
}
