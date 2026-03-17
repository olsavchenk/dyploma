using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class ClassMembershipConfiguration : IEntityTypeConfiguration<ClassMembership>
{
    public void Configure(EntityTypeBuilder<ClassMembership> builder)
    {
        builder.ToTable("class_memberships");

        builder.HasKey(cm => cm.Id);

        builder.Property(cm => cm.JoinedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(cm => new { cm.ClassId, cm.StudentId })
            .IsUnique();

        builder.HasIndex(cm => cm.StudentId);

        // Relationships
        builder.HasOne(cm => cm.Class)
            .WithMany(c => c.Memberships)
            .HasForeignKey(cm => cm.ClassId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cm => cm.Student)
            .WithMany(s => s.ClassMemberships)
            .HasForeignKey(cm => cm.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
