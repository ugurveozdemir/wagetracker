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
    public class JobsController : ControllerBase
    {
        private readonly IJobService _jobService;

        public JobsController(IJobService jobService)
        {
            _jobService = jobService;
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

        [HttpGet]
        public async Task<ActionResult<List<JobResponse>>> GetJobs()
        {
            var userId = GetUserId();
            var jobs = await _jobService.GetUserJobsAsync(userId);
            return Ok(jobs);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<JobResponse>> GetJob(int id)
        {
            try
            {
                var userId = GetUserId();
                var job = await _jobService.GetJobByIdAsync(userId, id);
                return Ok(job);
            }
            catch (UnauthorizedAccessException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<JobResponse>> CreateJob([FromBody] CreateJobRequest request)
        {
            var userId = GetUserId();
            var job = await _jobService.CreateJobAsync(userId, request);
            return CreatedAtAction(nameof(GetJob), new { id = job.Id }, job);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<JobResponse>> UpdateJob(int id, [FromBody] UpdateJobRequest request)
        {
            try
            {
                var userId = GetUserId();
                var job = await _jobService.UpdateJobAsync(userId, id, request);
                return Ok(job);
            }
            catch (UnauthorizedAccessException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteJob(int id)
        {
            try
            {
                var userId = GetUserId();
                await _jobService.DeleteJobAsync(userId, id);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
