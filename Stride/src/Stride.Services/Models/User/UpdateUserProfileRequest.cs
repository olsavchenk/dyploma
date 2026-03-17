namespace Stride.Services.Models.User;

public class UpdateUserProfileRequest
{
    public string? DisplayName { get; set; }
    
    // Teacher-specific fields
    public string? School { get; set; }
    public string? GradesTaught { get; set; }
    public string? SubjectsExpertise { get; set; }
}
