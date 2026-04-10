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
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfileController(IProfileService profileService)
        {
            _profileService = profileService;
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

        [HttpPut("weekly-goal")]
        public async Task<ActionResult<UserDto>> UpdateWeeklyGoal([FromBody] UpdateWeeklyGoalRequest request)
        {
            try
            {
                var userId = GetUserId();
                var user = await _profileService.UpdateWeeklyGoalAsync(userId, request);
                return Ok(user);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (SubscriptionAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { code = ex.Code, message = ex.Message });
            }
        }

        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetProfile()
        {
            try
            {
                var userId = GetUserId();
                var user = await _profileService.GetProfileAsync(userId);
                return Ok(user);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
