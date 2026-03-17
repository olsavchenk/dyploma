using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(u => u.DisplayName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Role)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(u => u.AvatarUrl)
            .HasMaxLength(500);

        builder.Property(u => u.GoogleId)
            .HasMaxLength(255);

        builder.Property(u => u.PasswordResetToken)
            .HasMaxLength(500);

        builder.Property(u => u.CreatedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");

        builder.HasIndex(u => u.GoogleId)
            .IsUnique()
            .HasFilter("\"GoogleId\" IS NOT NULL");

        // Relationships
        builder.HasOne(u => u.StudentProfile)
            .WithOne(sp => sp.User)
            .HasForeignKey<StudentProfile>(sp => sp.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(u => u.TeacherProfile)
            .WithOne(tp => tp.User)
            .HasForeignKey<TeacherProfile>(tp => tp.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
