using MongoDB.Bson;
using Stride.Core.Documents;
using Stride.Services.Interfaces;
using System.Data;
using System.Text.RegularExpressions;

namespace Stride.Services.Implementations;

public class TemplateRenderer : ITemplateRenderer
{
    private static readonly Regex _placeholderRegex = new(@"\{\{([^}]+)\}\}", RegexOptions.Compiled);

    public TaskContent RenderTemplate(TaskTemplateDocument template, int difficulty)
    {
        var context = new RenderContext(difficulty);
        var renderedContent = new TaskContent();

        // Extract template content
        var templateDoc = template.TemplateContent;

        // Render question
        if (templateDoc.Contains("question"))
        {
            renderedContent.Question = RenderString(templateDoc["question"].AsString, context);
        }

        // Render options (for multiple choice, true/false)
        if (templateDoc.Contains("options") && templateDoc["options"].IsBsonArray)
        {
            renderedContent.Options = templateDoc["options"].AsBsonArray
                .Select(o => RenderString(o.AsString, context))
                .ToList();
        }

        // Render answer
        if (templateDoc.Contains("answer"))
        {
            var answer = templateDoc["answer"];
            if (answer.IsString)
            {
                renderedContent.Answer = RenderString(answer.AsString, context);
            }
            else if (answer.IsBsonArray)
            {
                var renderedArray = new BsonArray(
                    answer.AsBsonArray.Select(a => BsonValue.Create(RenderString(a.AsString, context)))
                );
                renderedContent.Answer = renderedArray;
            }
            else
            {
                renderedContent.Answer = answer;
            }
        }

        // Render explanation
        if (templateDoc.Contains("explanation"))
        {
            renderedContent.Explanation = RenderString(templateDoc["explanation"].AsString, context);
        }

        // Render hints
        if (templateDoc.Contains("hints") && templateDoc["hints"].IsBsonArray)
        {
            renderedContent.Hints = templateDoc["hints"].AsBsonArray
                .Select(h => RenderString(h.AsString, context))
                .ToList();
        }

        return renderedContent;
    }

    public bool ValidateTemplate(string templateContent)
    {
        try
        {
            var matches = _placeholderRegex.Matches(templateContent);
            foreach (Match match in matches)
            {
                var expression = match.Groups[1].Value.Trim();
                
                // Check for valid variable or range syntax
                if (!IsValidExpression(expression))
                {
                    return false;
                }
            }
            return true;
        }
        catch
        {
            return false;
        }
    }

    private string RenderString(string template, RenderContext context)
    {
        return _placeholderRegex.Replace(template, match =>
        {
            var expression = match.Groups[1].Value.Trim();
            return EvaluateExpression(expression, context);
        });
    }

    private string EvaluateExpression(string expression, RenderContext context)
    {
        // Preserve {{blank}} placeholder for fill-blank tasks
        if (expression.Equals("blank", StringComparison.OrdinalIgnoreCase))
        {
            return "{{blank}}";
        }

        // Check if it's a variable reference
        if (context.Variables.TryGetValue(expression, out var value))
        {
            return value.ToString() ?? expression;
        }

        // Check for range syntax: range:min-max or range:min-max:var
        if (expression.StartsWith("range:", StringComparison.OrdinalIgnoreCase))
        {
            return HandleRange(expression, context);
        }

        // Check for choice syntax: choice:opt1,opt2,opt3
        if (expression.StartsWith("choice:", StringComparison.OrdinalIgnoreCase))
        {
            return HandleChoice(expression, context);
        }

        // Check for variable assignment: var=expression
        if (expression.Contains('='))
        {
            return HandleAssignment(expression, context);
        }

        // Try to evaluate as math expression
        return EvaluateMathExpression(expression, context);
    }

    private string HandleRange(string expression, RenderContext context)
    {
        // Format: range:min-max or range:min-max:varName
        var parts = expression.Split(':');
        if (parts.Length < 2)
        {
            return expression;
        }

        var rangePart = parts[1];
        var varName = parts.Length > 2 ? parts[2] : null;

        var rangeBounds = rangePart.Split('-');
        if (rangeBounds.Length != 2)
        {
            return expression;
        }

        if (!int.TryParse(rangeBounds[0], out var min) || !int.TryParse(rangeBounds[1], out var max))
        {
            return expression;
        }

        // Adjust range based on difficulty
        var range = max - min;
        var adjustedMin = min + (int)(range * context.DifficultyFactor * 0.3);
        var adjustedMax = max - (int)(range * (1 - context.DifficultyFactor) * 0.3);

        var value = Random.Shared.Next(Math.Max(min, adjustedMin), Math.Min(max, adjustedMax) + 1);

        if (!string.IsNullOrEmpty(varName))
        {
            context.Variables[varName] = value;
        }

        return value.ToString();
    }

    private string HandleChoice(string expression, RenderContext context)
    {
        // Format: choice:opt1,opt2,opt3
        var parts = expression.Split(':', 2);
        if (parts.Length < 2)
        {
            return expression;
        }

        var choices = parts[1].Split(',').Select(c => c.Trim()).ToArray();
        if (choices.Length == 0)
        {
            return expression;
        }

        var chosen = choices[Random.Shared.Next(choices.Length)];
        // Try to evaluate the chosen option as a math expression (returns as-is on failure)
        return EvaluateMathExpression(chosen, context);
    }

    private string HandleAssignment(string expression, RenderContext context)
    {
        // Format: varName=expression
        var parts = expression.Split('=', 2);
        if (parts.Length != 2)
        {
            return expression;
        }

        var varName = parts[0].Trim();
        var varExpression = parts[1].Trim();

        var result = EvaluateExpression(varExpression, context);
        
        if (int.TryParse(result, out var intValue))
        {
            context.Variables[varName] = intValue;
        }

        return result;
    }

    private string EvaluateMathExpression(string expression, RenderContext context)
    {
        try
        {
            // Replace variables with their values using word-boundary matching
            // to avoid corrupting substrings (e.g. replacing 'a' inside 'range')
            var processedExpression = expression;
            foreach (var kvp in context.Variables)
            {
                processedExpression = Regex.Replace(
                    processedExpression,
                    @"\b" + Regex.Escape(kvp.Key) + @"\b",
                    kvp.Value.ToString() ?? string.Empty);
            }

            // Resolve any embedded range:N-M sub-expressions (e.g. from "a+range:10-30")
            processedExpression = Regex.Replace(
                processedExpression,
                @"range:(\d+)-(\d+)",
                m =>
                {
                    var min = int.Parse(m.Groups[1].Value);
                    var max = int.Parse(m.Groups[2].Value);
                    return Random.Shared.Next(min, max + 1).ToString();
                });

            // Evaluate simple math expressions
            // Support +, -, *, /, %, parentheses
            var dataTable = new DataTable();
            var result = dataTable.Compute(processedExpression, null);
            
            return result.ToString() ?? expression;
        }
        catch
        {
            return expression;
        }
    }

    private bool IsValidExpression(string expression)
    {
        if (string.IsNullOrWhiteSpace(expression))
        {
            return false;
        }

        // Valid patterns: variable names, range:, choice:, assignments, math expressions
        if (expression.StartsWith("range:", StringComparison.OrdinalIgnoreCase) ||
            expression.StartsWith("choice:", StringComparison.OrdinalIgnoreCase) ||
            expression.Contains('=') ||
            Regex.IsMatch(expression, @"^[a-zA-Z0-9+\-*/%()\s]+$"))
        {
            return true;
        }

        return false;
    }

    private class RenderContext
    {
        public Dictionary<string, object> Variables { get; } = new();
        public double DifficultyFactor { get; }

        public RenderContext(int difficulty)
        {
            // Normalize difficulty to 0-1 range
            DifficultyFactor = Math.Clamp(difficulty / 100.0, 0, 1);
        }
    }
}
