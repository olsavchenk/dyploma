using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class StudentProfileConfiguration : IEntityTypeConfiguration<StudentProfile>
{
    public void Configure(EntityTypeBuilder<StudentProfile> builder)
    {
        builder.ToTable("student_profiles");

        builder.HasKey(sp => sp.Id);

        builder.Property(sp => sp.League)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(sp => sp.CreatedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(sp => sp.UserId)
            .IsUnique();

        builder.HasIndex(sp => new { sp.League, sp.TotalXp });
    }
}
