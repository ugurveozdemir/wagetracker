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
    public class EntriesController : ControllerBase
    {
        private readonly IDailyEntryService _entryService;
        private readonly IWebHostEnvironment _environment;

        public EntriesController(IDailyEntryService entryService, IWebHostEnvironment environment)
        {
            _entryService = entryService;
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

        [HttpGet]
        public async Task<ActionResult<List<EntryResponse>>> GetEntries()
        {
            var userId = GetUserId();
            var entries = await _entryService.GetUserEntriesAsync(userId);
            return Ok(entries);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<EntryResponse>> GetEntry(int id)
        {
            try
            {
                var userId = GetUserId();
                var entry = await _entryService.GetEntryByIdAsync(userId, id);
                return Ok(entry);
            }
            catch (UnauthorizedAccessException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("job/{jobId}/weekly")]
        public async Task<ActionResult<JobDetailsResponse>> GetJobDetailsWithWeekly(int jobId)
        {
            try
            {
                var userId = GetUserId();
                var details = await _entryService.GetJobDetailsWithWeeklyGroupingAsync(userId, jobId);
                return Ok(details);
            }
            catch (UnauthorizedAccessException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<EntryResponse>> CreateEntry([FromBody] CreateEntryRequest request)
        {
            try
            {
                var userId = GetUserId();
                var entry = await _entryService.CreateEntryAsync(userId, request);
                return CreatedAtAction(nameof(GetEntry), new { id = entry.Id }, entry);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<EntryResponse>> UpdateEntry(int id, [FromBody] UpdateEntryRequest request)
        {
            try
            {
                var userId = GetUserId();
                var entry = await _entryService.UpdateEntryAsync(userId, id, request);
                return Ok(entry);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteEntry(int id)
        {
            try
            {
                var userId = GetUserId();
                await _entryService.DeleteEntryAsync(userId, id);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
