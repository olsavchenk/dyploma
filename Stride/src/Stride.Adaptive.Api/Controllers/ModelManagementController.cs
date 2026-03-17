using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stride.Adaptive.Models.DTOs;
using Stride.Adaptive.Services.Interfaces;

namespace Stride.Adaptive.Api.Controllers;

[ApiController]
[Route("api/v1/adaptive/model")]
[Authorize(Policy = "AdminAccess")]
public class ModelManagementController : ControllerBase
{
    private readonly IModelTrainer _modelTrainer;
    private readonly ILogger<ModelManagementController> _logger;

    public ModelManagementController(
        IModelTrainer modelTrainer,
        ILogger<ModelManagementController> logger)
    {
        _modelTrainer = modelTrainer;
        _logger = logger;
    }

    /// <summary>
    /// Trigger model retraining on real data (admin only)
    /// </summary>
    [HttpPost("retrain")]
    [ProducesResponseType(typeof(RetrainResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RetrainModel()
    {
        try
        {
            _logger.LogInformation("Manual model retraining triggered by admin");

            var result = await _modelTrainer.RetrainOnRealDataAsync();

            return Ok(new RetrainResponse
            {
                Success = true,
                RSquared = result.RSquared,
                RootMeanSquaredError = result.RootMeanSquaredError,
                DataPointCount = result.DataPointCount,
                TrainedAt = result.TrainedAt,
                Message = "Model retrained successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during manual model retraining");
            return StatusCode(500, new RetrainResponse
            {
                Success = false,
                Message = $"Error retraining model: {ex.Message}"
            });
        }
    }

    /// <summary>
    /// Get current model status and metrics (admin only)
    /// </summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(ModelStatusResponse), StatusCodes.Status200OK)]
    public IActionResult GetModelStatus()
    {
        var metrics = _modelTrainer.GetCurrentMetrics();
        var modelPath = Path.Combine(Directory.GetCurrentDirectory(), "MLModels", "difficulty_model.zip");
        var modelExists = System.IO.File.Exists(modelPath);

        return Ok(new ModelStatusResponse
        {
            LastTrainedAt = metrics?.LastTrainedAt,
            RSquared = metrics?.RSquared,
            RootMeanSquaredError = metrics?.RootMeanSquaredError,
            DataPointCount = metrics?.DataPointCount,
            ModelPath = modelPath,
            IsModelLoaded = modelExists
        });
    }
}
