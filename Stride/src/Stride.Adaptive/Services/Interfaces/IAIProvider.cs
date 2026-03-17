using Stride.Adaptive.Models.DTOs;

namespace Stride.Adaptive.Services.Interfaces;

public interface IAIProvider
{
    string ProviderName { get; }
    
    Task<AITaskGenerationResponse> GenerateTaskTemplateAsync(
        AITaskGenerationRequest request,
        CancellationToken cancellationToken = default);

    Task<AIBatchGenerationResponse> GenerateTaskBatchAsync(
        AIBatchGenerationRequest request,
        CancellationToken cancellationToken = default);
    
    Task<bool> ValidateResponseAsync(
        AITaskGenerationResponse response,
        CancellationToken cancellationToken = default);
}
