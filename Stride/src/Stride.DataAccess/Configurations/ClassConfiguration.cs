using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class ClassConfiguration : IEntityTypeConfiguration<Class>
{
    public void Configure(EntityTypeBuilder<Class> builder)
    {
        builder.ToTable("classes");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.JoinCode)
            .IsRequired()
            .HasMaxLength(6);

        builder.Property(c => c.CreatedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(c => c.JoinCode)
            .IsUnique()
            .HasFilter("\"IsActive\" = true");

        builder.HasIndex(c => c.TeacherId);

        // Relationships
        builder.HasOne(c => c.Teacher)
            .WithMany(t => t.Classes)
            .HasForeignKey(c => c.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
