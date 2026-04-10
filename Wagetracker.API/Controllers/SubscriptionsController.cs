using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WageTracker.API.Models.DTOs;
using WageTracker.API.Services;

namespace WageTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionsController : ControllerBase
    {
        private readonly ISubscriptionService _subscriptionService;

        public SubscriptionsController(ISubscriptionService subscriptionService)
        {
            _subscriptionService = subscriptionService;
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

        [Authorize]
        [HttpPost("refresh")]
        public async Task<ActionResult<UserDto>> Refresh()
        {
            try
            {
                var userId = GetUserId();
                var user = await _subscriptionService.RefreshUserSubscriptionAsync(userId);
                return Ok(user);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpPost("webhook")]
        public async Task<ActionResult> Webhook()
        {
            try
            {
                using var reader = new StreamReader(Request.Body);
                var payload = await reader.ReadToEndAsync();
                var authorizationHeader = Request.Headers.Authorization.ToString();
                var xAuthorizationHeader = Request.Headers["X-Authorization"].ToString();

                await _subscriptionService.HandleRevenueCatWebhookAsync(payload, authorizationHeader, xAuthorizationHeader);
                return Ok(new { received = true });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = ex.Message });
            }
        }
    }
}
