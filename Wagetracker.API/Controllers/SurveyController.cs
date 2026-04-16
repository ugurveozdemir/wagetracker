using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WageTracker.API.Models.DTOs;
using WageTracker.API.Services;

namespace WageTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SurveyController : ControllerBase
    {
        private readonly ISurveyService _surveyService;
        private readonly IWebHostEnvironment _environment;

        public SurveyController(ISurveyService surveyService, IWebHostEnvironment environment)
        {
            _surveyService = surveyService;
            _environment = environment;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException();
            }

            return userId;
        }

        [HttpPost("registration")]
        public async Task<ActionResult<UserDto>> SubmitRegistrationSurvey([FromBody] SubmitRegistrationSurveyRequest request)
        {
            try
            {
                var userId = GetUserId();
                var user = await _surveyService.SubmitRegistrationSurveyAsync(userId, request);
                return Ok(user);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("registration")]
        public async Task<ActionResult<UserDto>> ResetRegistrationSurvey()
        {
            if (!_environment.IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                var userId = GetUserId();
                var user = await _surveyService.ResetRegistrationSurveyAsync(userId);
                return Ok(user);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
