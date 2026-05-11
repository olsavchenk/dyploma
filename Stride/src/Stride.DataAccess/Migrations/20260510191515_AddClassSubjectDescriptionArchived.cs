using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Stride.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddClassSubjectDescriptionArchived : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "classes",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "classes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Subject",
                table: "classes",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "Subject",
                table: "classes");
        }
    }
}
