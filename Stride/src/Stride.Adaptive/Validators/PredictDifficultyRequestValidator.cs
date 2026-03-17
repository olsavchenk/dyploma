using FluentValidation;
using Stride.Adaptive.Models.DTOs;

namespace Stride.Adaptive.Validators;

public class PredictDifficultyRequestValidator : AbstractValidator<PredictDifficultyRequest>
{
    public PredictDifficultyRequestValidator()
    {
        RuleFor(x => x.StudentId)
            .NotEmpty()
            .WithMessage("Student ID is required");

        RuleFor(x => x.TopicId)
            .NotEmpty()
            .WithMessage("Topic ID is required");
    }
}
