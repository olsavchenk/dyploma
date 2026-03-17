using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Stride.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "achievements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IconUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    XpReward = table.Column<int>(type: "integer", nullable: false),
                    IsHidden = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_achievements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "subjects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    IconUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subjects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    DisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    GoogleId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    GdprConsent = table.Column<bool>(type: "boolean", nullable: false),
                    FailedLoginAttempts = table.Column<int>(type: "integer", nullable: false),
                    LockoutEndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PasswordResetToken = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PasswordResetTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "learning_paths",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SubjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    GradeLevel = table.Column<int>(type: "integer", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_learning_paths", x => x.Id);
                    table.ForeignKey(
                        name: "FK_learning_paths_subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "topics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SubjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentTopicId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    GradeLevel = table.Column<int>(type: "integer", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_topics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_topics_subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_topics_topics_ParentTopicId",
                        column: x => x.ParentTopicId,
                        principalTable: "topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Token = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsRevoked = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByIp = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RevokedByIp = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refresh_tokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_refresh_tokens_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TotalXp = table.Column<int>(type: "integer", nullable: false),
                    CurrentLevel = table.Column<int>(type: "integer", nullable: false),
                    CurrentStreak = table.Column<int>(type: "integer", nullable: false),
                    LongestStreak = table.Column<int>(type: "integer", nullable: false),
                    StreakFreezes = table.Column<int>(type: "integer", nullable: false),
                    LastActiveDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    League = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_student_profiles_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "teacher_profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    School = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    GradesTaught = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SubjectsExpertise = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_teacher_profiles_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "learning_path_steps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LearningPathId = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicId = table.Column<Guid>(type: "uuid", nullable: false),
                    StepOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_learning_path_steps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_learning_path_steps_learning_paths_LearningPathId",
                        column: x => x.LearningPathId,
                        principalTable: "learning_paths",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_learning_path_steps_topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "leaderboard_entries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    League = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    WeekNumber = table.Column<int>(type: "integer", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    WeeklyXp = table.Column<int>(type: "integer", nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_leaderboard_entries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_leaderboard_entries_student_profiles_StudentId",
                        column: x => x.StudentId,
                        principalTable: "student_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_achievements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    AchievementId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnlockedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_achievements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_student_achievements_achievements_AchievementId",
                        column: x => x.AchievementId,
                        principalTable: "achievements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_achievements_student_profiles_StudentId",
                        column: x => x.StudentId,
                        principalTable: "student_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_performances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicId = table.Column<Guid>(type: "uuid", nullable: false),
                    CurrentDifficulty = table.Column<int>(type: "integer", nullable: false),
                    RollingAccuracy = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    CurrentStreak = table.Column<int>(type: "integer", nullable: false),
                    StreakDirection = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TopicMastery = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    TotalAttempted = table.Column<int>(type: "integer", nullable: false),
                    LastActiveAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_performances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_student_performances_student_profiles_StudentId",
                        column: x => x.StudentId,
                        principalTable: "student_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_performances_topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "task_attempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaskInstanceId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TopicId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsCorrect = table.Column<bool>(type: "boolean", nullable: false),
                    ResponseTimeMs = table.Column<int>(type: "integer", nullable: false),
                    DifficultyAtTime = table.Column<int>(type: "integer", nullable: false),
                    XpEarned = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_attempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_task_attempts_student_profiles_StudentId",
                        column: x => x.StudentId,
                        principalTable: "student_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_task_attempts_topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "classes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TeacherId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    JoinCode = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: false),
                    GradeLevel = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_classes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_classes_teacher_profiles_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "teacher_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "class_assignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TaskCount = table.Column<int>(type: "integer", nullable: false),
                    MinDifficulty = table.Column<int>(type: "integer", nullable: false),
                    MaxDifficulty = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_class_assignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_class_assignments_classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_class_assignments_topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "class_memberships",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_class_memberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_class_memberships_classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_class_memberships_student_profiles_StudentId",
                        column: x => x.StudentId,
                        principalTable: "student_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_achievements_Code",
                table: "achievements",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_class_assignments_ClassId",
                table: "class_assignments",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_class_assignments_DueDate",
                table: "class_assignments",
                column: "DueDate");

            migrationBuilder.CreateIndex(
                name: "IX_class_assignments_TopicId",
                table: "class_assignments",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_class_memberships_ClassId_StudentId",
                table: "class_memberships",
                columns: new[] { "ClassId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_class_memberships_StudentId",
                table: "class_memberships",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_classes_JoinCode",
                table: "classes",
                column: "JoinCode",
                unique: true,
                filter: "\"IsActive\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_classes_TeacherId",
                table: "classes",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_leaderboard_entries_League_Year_WeekNumber_Rank",
                table: "leaderboard_entries",
                columns: new[] { "League", "Year", "WeekNumber", "Rank" });

            migrationBuilder.CreateIndex(
                name: "IX_leaderboard_entries_StudentId_Year_WeekNumber",
                table: "leaderboard_entries",
                columns: new[] { "StudentId", "Year", "WeekNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_learning_path_steps_LearningPathId_StepOrder",
                table: "learning_path_steps",
                columns: new[] { "LearningPathId", "StepOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_learning_path_steps_TopicId",
                table: "learning_path_steps",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_learning_paths_SubjectId",
                table: "learning_paths",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_learning_paths_SubjectId_GradeLevel",
                table: "learning_paths",
                columns: new[] { "SubjectId", "GradeLevel" });

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_ExpiresAt",
                table: "refresh_tokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_Token",
                table: "refresh_tokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_UserId",
                table: "refresh_tokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_student_achievements_AchievementId",
                table: "student_achievements",
                column: "AchievementId");

            migrationBuilder.CreateIndex(
                name: "IX_student_achievements_StudentId_AchievementId",
                table: "student_achievements",
                columns: new[] { "StudentId", "AchievementId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_achievements_UnlockedAt",
                table: "student_achievements",
                column: "UnlockedAt");

            migrationBuilder.CreateIndex(
                name: "IX_student_performances_LastActiveAt",
                table: "student_performances",
                column: "LastActiveAt");

            migrationBuilder.CreateIndex(
                name: "IX_student_performances_StudentId_TopicId",
                table: "student_performances",
                columns: new[] { "StudentId", "TopicId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_performances_TopicId",
                table: "student_performances",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_student_profiles_League_TotalXp",
                table: "student_profiles",
                columns: new[] { "League", "TotalXp" });

            migrationBuilder.CreateIndex(
                name: "IX_student_profiles_UserId",
                table: "student_profiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_subjects_Slug",
                table: "subjects",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_subjects_SortOrder",
                table: "subjects",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "IX_task_attempts_CreatedAt",
                table: "task_attempts",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_task_attempts_StudentId",
                table: "task_attempts",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_task_attempts_StudentId_TopicId_CreatedAt",
                table: "task_attempts",
                columns: new[] { "StudentId", "TopicId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_task_attempts_TopicId",
                table: "task_attempts",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_teacher_profiles_UserId",
                table: "teacher_profiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_topics_ParentTopicId",
                table: "topics",
                column: "ParentTopicId");

            migrationBuilder.CreateIndex(
                name: "IX_topics_SubjectId_Slug",
                table: "topics",
                columns: new[] { "SubjectId", "Slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_topics_SubjectId_SortOrder",
                table: "topics",
                columns: new[] { "SubjectId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_users_GoogleId",
                table: "users",
                column: "GoogleId",
                unique: true,
                filter: "\"GoogleId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "class_assignments");

            migrationBuilder.DropTable(
                name: "class_memberships");

            migrationBuilder.DropTable(
                name: "leaderboard_entries");

            migrationBuilder.DropTable(
                name: "learning_path_steps");

            migrationBuilder.DropTable(
                name: "refresh_tokens");

            migrationBuilder.DropTable(
                name: "student_achievements");

            migrationBuilder.DropTable(
                name: "student_performances");

            migrationBuilder.DropTable(
                name: "task_attempts");

            migrationBuilder.DropTable(
                name: "classes");

            migrationBuilder.DropTable(
                name: "learning_paths");

            migrationBuilder.DropTable(
                name: "achievements");

            migrationBuilder.DropTable(
                name: "student_profiles");

            migrationBuilder.DropTable(
                name: "topics");

            migrationBuilder.DropTable(
                name: "teacher_profiles");

            migrationBuilder.DropTable(
                name: "subjects");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
