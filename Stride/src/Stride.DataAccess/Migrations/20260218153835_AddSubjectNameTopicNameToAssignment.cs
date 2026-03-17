using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Stride.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddSubjectNameTopicNameToAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "TopicId",
                table: "class_assignments",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "SubjectName",
                table: "class_assignments",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TopicName",
                table: "class_assignments",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SubjectName",
                table: "class_assignments");

            migrationBuilder.DropColumn(
                name: "TopicName",
                table: "class_assignments");

            migrationBuilder.AlterColumn<Guid>(
                name: "TopicId",
                table: "class_assignments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
