using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Stride.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskGenerationJob : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "task_generation_jobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TotalTasksRequested = table.Column<int>(type: "integer", nullable: false),
                    TasksGenerated = table.Column<int>(type: "integer", nullable: false),
                    TasksFailed = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_generation_jobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_task_generation_jobs_class_assignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "class_assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_task_generation_jobs_topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_task_generation_jobs_AssignmentId",
                table: "task_generation_jobs",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_task_generation_jobs_Status",
                table: "task_generation_jobs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_task_generation_jobs_TopicId",
                table: "task_generation_jobs",
                column: "TopicId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "task_generation_jobs");
        }
    }
}
