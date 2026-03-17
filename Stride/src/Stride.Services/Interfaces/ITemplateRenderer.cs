using Stride.Core.Documents;

namespace Stride.Services.Interfaces;

public interface ITemplateRenderer
{
    /// <summary>
    /// Renders a task template by replacing parameterized placeholders with generated values
    /// </summary>
    /// <param name="template">The task template to render</param>
    /// <param name="difficulty">Target difficulty (1-100) to adjust complexity</param>
    /// <returns>Rendered task instance with concrete values</returns>
    TaskContent RenderTemplate(TaskTemplateDocument template, int difficulty);

    /// <summary>
    /// Validates if a template has valid syntax for rendering
    /// </summary>
    /// <param name="templateContent">The template content to validate</param>
    /// <returns>True if template is valid, false otherwise</returns>
    bool ValidateTemplate(string templateContent);
}
