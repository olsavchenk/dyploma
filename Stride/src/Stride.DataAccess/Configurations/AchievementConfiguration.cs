using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class AchievementConfiguration : IEntityTypeConfiguration<Achievement>
{
    public void Configure(EntityTypeBuilder<Achievement> builder)
    {
        builder.ToTable("achievements");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Code)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(a => a.IconUrl)
            .HasMaxLength(500);

        builder.Property(a => a.CreatedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(a => a.Code)
            .IsUnique();
    }
}
