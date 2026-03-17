using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Services.Interfaces;
using Stride.Services.Models.Class;
using System.Security.Claims;

namespace Stride.Api.Controllers;

[ApiController]
[Route("api/v1/classes")]
[Authorize]
public class ClassController : ControllerBase
{
    private readonly IClassService _classService;
    private readonly ILogger<ClassController> _logger;

    public ClassController(
        IClassService classService,
        ILogger<ClassController> logger)
    {
        _classService = classService;
        _logger = logger;
    }

    /// <summary>
    /// Get quick stats for the current teacher (total classes, students, active this week)
    /// </summary>
    /// <returns>Teacher's class quick stats</returns>
    [HttpGet("stats")]
    [Authorize(Policy = "TeacherAccess")]
    [ProducesResponseType(typeof(ClassQuickStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetTeacherStats()
    {
        var teacherId = GetTeacherProfileId();

        if (teacherId == null)
        {
            return BadRequest(new { message = "Teacher profile not found" });
        }

        var stats = await _classService.GetTeacherQuickStatsAsync(teacherId.Value);

        return Ok(stats);
    }

    /// <summary>
    /// Create a new class (Teacher only)
    /// </summary>
    /// <param name="request">Class creation details</param>
    /// <returns>Created class details with generated join code</returns>
    [HttpPost]
    [Authorize(Policy = "TeacherAccess")]
    [ProducesResponseType(typeof(ClassDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassRequest request)
    {
        try
        {
            var teacherId = GetTeacherProfileId();

            if (teacherId == null)
            {
                _logger.LogWarning("User {UserId} attempted to create class without teacher profile", GetCurrentUserId());
                return BadRequest(new { message = "Teacher profile not found" });
            }

            var classDto = await _classService.CreateClassAsync(teacherId.Value, request);

            _logger.LogInformation("Class {ClassName} created by teacher {TeacherId}", classDto.Name, teacherId);

            return CreatedAtAction(nameof(GetClassById), new { id = classDto.Id }, classDto);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to create class: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get all classes for the current teacher
    /// </summary>
    /// <returns>List of teacher's classes</returns>
    [HttpGet]
    [Authorize(Policy = "TeacherAccess")]
    [ProducesResponseType(typeof(List<ClassDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetTeacherClasses()
    {
        var teacherId = GetTeacherProfileId();

        if (teacherId == null)
        {
            return BadRequest(new { message = "Teacher profile not found" });
        }

        var classes = await _classService.GetTeacherClassesAsync(teacherId.Value);

        _logger.LogInformation("Retrieved {Count} classes for teacher {TeacherId}", classes.Count, teacherId);

        return Ok(classes);
    }

    /// <summary>
    /// Get class by ID (accessible to teacher owner and class members)
    /// </summary>
    /// <param name="id">Class ID</param>
    /// <returns>Class details</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ClassDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetClassById(Guid id)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        var classDto = await _classService.GetClassByIdAsync(id, userId.Value);

        if (classDto == null)
        {
            _logger.LogWarning("Class {ClassId} not found or user {UserId} doesn't have access", id, userId);
            return NotFound(new { message = "Class not found or you don't have access" });
        }

        return Ok(classDto);
    }

    /// <summary>
    /// Get classes the current student is enrolled in, with subjects derived from assignments
    /// </summary>
    /// <returns>List of student's enrolled classes with their subjects</returns>
    [HttpGet("my")]
    [Authorize(Policy = "StudentAccess")]
    [ProducesResponseType(typeof(List<StudentClassDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMyClasses()
    {
        var studentId = GetStudentProfileId();

        if (studentId == null)
        {
            _logger.LogWarning("User {UserId} attempted to get classes without student profile", GetCurrentUserId());
            return BadRequest(new { message = "Student profile not found" });
        }

        var classes = await _classService.GetStudentClassesAsync(studentId.Value);

        _logger.LogInformation("Retrieved {Count} classes for student {StudentId}", classes.Count, studentId);

        return Ok(classes);
    }

    /// <summary>
    /// Join a class using join code (Student only)
    /// </summary>
    /// <param name="request">Join code</param>
    /// <returns>Success message with class name</returns>
    [HttpPost("join")]
    [Authorize(Policy = "StudentAccess")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> JoinClass([FromBody] JoinClassRequest request)
    {
        try
        {
            var studentId = GetStudentProfileId();

            if (studentId == null)
            {
                _logger.LogWarning("User {UserId} attempted to join class without student profile", GetCurrentUserId());
                return BadRequest(new { message = "Student profile not found" });
            }

            var className = await _classService.JoinClassAsync(studentId.Value, request.JoinCode);

            _logger.LogInformation("Student {StudentId} joined class with code {JoinCode}", studentId, request.JoinCode);

            return Ok(new { message = $"Successfully joined class: {className}", className });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to join class with code {JoinCode}: {Message}", request.JoinCode, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get students in a class (Teacher only, must own the class)
    /// </summary>
    /// <param name="id">Class ID</param>
    /// <returns>List of students with their stats</returns>
    [HttpGet("{id:guid}/students")]
    [Authorize(Policy = "TeacherAccess")]
    [ProducesResponseType(typeof(List<StudentRosterDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetClassStudents(Guid id)
    {
        try
        {
            var teacherId = GetTeacherProfileId();

            if (teacherId == null)
            {
                return BadRequest(new { message = "Teacher profile not found" });
            }

            var students = await _classService.GetClassStudentsAsync(id, teacherId.Value);

            _logger.LogInformation("Retrieved {Count} students for class {ClassId}", students.Count, id);

            return Ok(students);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to get students for class {ClassId}: {Message}", id, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get assignments for a class (Teacher only, must own the class)
    /// </summary>
    /// <param name="id">Class ID</param>
    /// <returns>List of assignments</returns>
    [HttpGet("{id:guid}/assignments")]
    [Authorize(Policy = "TeacherAccess")]
    [ProducesResponseType(typeof(List<AssignmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetClassAssignments(Guid id)
    {
        try
        {
            var teacherId = GetTeacherProfileId();

            if (teacherId == null)
            {
                return BadRequest(new { message = "Teacher profile not found" });
            }

            var assignments = await _classService.GetClassAssignmentsAsync(id, teacherId.Value);

            _logger.LogInformation("Retrieved {Count} assignments for class {ClassId}", assignments.Count, id);

            return Ok(assignments);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to get assignments for class {ClassId}: {Message}", id, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Create assignment for a class (Teacher only)
    /// </summary>
    /// <param name="id">Class ID</param>
    /// <param name="request">Assignment details</param>
    /// <returns>Created assignment</returns>
    [HttpPost("{id:guid}/assignments")]
    [Authorize(Policy = "TeacherAccess")]
    [ProducesResponseType(typeof(AssignmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateAssignment(Guid id, [FromBody] CreateAssignmentRequest request)
    {
        try
        {
            var teacherId = GetTeacherProfileId();

            if (teacherId == null)
            {
                return BadRequest(new { message = "Teacher profile not found" });
            }

            var assignment = await _classService.CreateAssignmentAsync(id, teacherId.Value, request);

            _logger.LogInformation(
                "Assignment {AssignmentTitle} created for class {ClassId} by teacher {TeacherId}",
                assignment.Title,
                id,
                teacherId);

            return CreatedAtAction(nameof(GetClassById), new { id }, assignment);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to create assignment for class {ClassId}: {Message}", id, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get class analytics (Teacher only, must own the class)
    /// </summary>
    /// <param name="id">Class ID</param>
    /// <returns>Class analytics with performance data</returns>
    [HttpGet("{id:guid}/analytics")]
    [Authorize(Policy = "TeacherAccess")]
    [ProducesResponseType(typeof(ClassAnalyticsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetClassAnalytics(Guid id)
    {
        try
        {
            var teacherId = GetTeacherProfileId();

            if (teacherId == null)
            {
                return BadRequest(new { message = "Teacher profile not found" });
            }

            var analytics = await _classService.GetClassAnalyticsAsync(id, teacherId.Value);

            _logger.LogInformation("Retrieved analytics for class {ClassId}", id);

            return Ok(analytics);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to get analytics for class {ClassId}: {Message}", id, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get individual student performance detail (Teacher only, must own the class)
    /// </summary>
    /// <param name="id">Class ID</param>
    /// <param name="studentId">Student ID</param>
    /// <returns>Detailed student performance data</returns>
    [HttpGet("{id:guid}/students/{studentId:guid}")]
    [Authorize(Policy = "TeacherAccess")]
    [ProducesResponseType(typeof(StudentPerformanceDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetStudentPerformanceDetail(Guid id, Guid studentId)
    {
        try
        {
            var teacherId = GetTeacherProfileId();

            if (teacherId == null)
            {
                return BadRequest(new { message = "Teacher profile not found" });
            }

            var performance = await _classService.GetStudentPerformanceDetailAsync(id, studentId, teacherId.Value);

            _logger.LogInformation(
                "Retrieved performance detail for student {StudentId} in class {ClassId}",
                studentId,
                id);

            return Ok(performance);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(
                "Failed to get student {StudentId} performance for class {ClassId}: {Message}",
                studentId,
                id,
                ex.Message);
            return BadRequest(new { message = ex.Message });
        }
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return null;
        }

        return userId;
    }

    private Guid? GetTeacherProfileId()
    {
        var teacherIdClaim = User.FindFirst("TeacherProfileId")?.Value;

        if (string.IsNullOrEmpty(teacherIdClaim) || !Guid.TryParse(teacherIdClaim, out var teacherId))
        {
            return null;
        }

        return teacherId;
    }

    private Guid? GetStudentProfileId()
    {
        var studentIdClaim = User.FindFirst("StudentProfileId")?.Value;

        if (string.IsNullOrEmpty(studentIdClaim) || !Guid.TryParse(studentIdClaim, out var studentId))
        {
            return null;
        }

        return studentId;
    }
}


