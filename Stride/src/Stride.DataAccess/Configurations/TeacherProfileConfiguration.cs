using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class TeacherProfileConfiguration : IEntityTypeConfiguration<TeacherProfile>
{
    public void Configure(EntityTypeBuilder<TeacherProfile> builder)
    {
        builder.ToTable("teacher_profiles");

        builder.HasKey(tp => tp.Id);

        builder.Property(tp => tp.School)
            .HasMaxLength(200);

        builder.Property(tp => tp.GradesTaught)
            .HasMaxLength(100);

        builder.Property(tp => tp.SubjectsExpertise)
            .HasMaxLength(500);

        builder.Property(tp => tp.CreatedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(tp => tp.UserId)
            .IsUnique();
    }
}
