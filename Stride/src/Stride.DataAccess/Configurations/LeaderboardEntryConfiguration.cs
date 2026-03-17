using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stride.Core.Entities;

namespace Stride.DataAccess.Configurations;

public class LeaderboardEntryConfiguration : IEntityTypeConfiguration<LeaderboardEntry>
{
    public void Configure(EntityTypeBuilder<LeaderboardEntry> builder)
    {
        builder.ToTable("leaderboard_entries");

        builder.HasKey(le => le.Id);

        builder.Property(le => le.League)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(le => le.CreatedAt)
            .IsRequired();

        builder.Property(le => le.UpdatedAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(le => new { le.StudentId, le.Year, le.WeekNumber })
            .IsUnique();

        builder.HasIndex(le => new { le.League, le.Year, le.WeekNumber, le.Rank });

        // Relationships
        builder.HasOne(le => le.Student)
            .WithMany(s => s.LeaderboardEntries)
            .HasForeignKey(le => le.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
