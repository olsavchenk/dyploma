using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");

        builder.HasKey(rt => rt.Id);

        builder.Property(rt => rt.Token)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(rt => rt.ExpiresAt)
            .IsRequired();

        builder.Property(rt => rt.CreatedAt)
            .IsRequired();

        builder.Property(rt => rt.IsRevoked)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(rt => rt.CreatedByIp)
            .HasMaxLength(50);

        builder.Property(rt => rt.RevokedByIp)
            .HasMaxLength(50);

        // Relationships
        builder.HasOne(rt => rt.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(rt => rt.Token)
            .IsUnique();

        builder.HasIndex(rt => rt.UserId);

        builder.HasIndex(rt => rt.ExpiresAt);
    }
}
