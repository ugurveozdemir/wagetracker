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
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly IWebHostEnvironment _environment;

        public DashboardController(IDashboardService dashboardService, IWebHostEnvironment environment)
        {
            _dashboardService = dashboardService;
            _environment = environment;
        }

        private int GetUserId()
        {
            // DEV-ONLY: Bypass auth for mobile development
            if (_environment.IsDevelopment())
                return 1; // Test user ID
            
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? throw new UnauthorizedAccessException());
        }

        [HttpGet("summary")]
        public async Task<ActionResult<DashboardSummaryResponse>> GetSummary()
        {
            var userId = GetUserId();
            var summary = await _dashboardService.GetDashboardSummaryAsync(userId);
            return Ok(summary);
        }
    }
}
