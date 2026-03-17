namespace Stride.Services.Models.Topic;

public class UpdateTopicRequest
{
    public Guid SubjectId { get; set; }
    public Guid? ParentTopicId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int GradeLevel { get; set; }
    public int SortOrder { get; set; }
}
