using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Stride.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class _20260512100000_AddStudentTimeZone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TimeZoneId",
                table: "student_profiles",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TimeZoneId",
                table: "student_profiles");
        }
    }
}
