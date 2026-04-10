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
    public class ExpensesController : ControllerBase
    {
        private readonly IExpenseService _expenseService;

        public ExpensesController(IExpenseService expenseService)
        {
            _expenseService = expenseService;
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
        public async Task<ActionResult<List<ExpenseResponse>>> GetAll()
        {
            try
            {
                var userId = GetUserId();
                var expenses = await _expenseService.GetUserExpensesAsync(userId);
                return Ok(expenses);
            }
            catch (SubscriptionAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { code = ex.Code, message = ex.Message });
            }
        }

        [HttpGet("weekly")]
        public async Task<ActionResult<List<WeeklyExpenseGroupResponse>>> GetWeekly()
        {
            try
            {
                var userId = GetUserId();
                var weeklyGroups = await _expenseService.GetWeeklyExpenseGroupsAsync(userId);
                return Ok(weeklyGroups);
            }
            catch (SubscriptionAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { code = ex.Code, message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ExpenseResponse>> GetById(int id)
        {
            try
            {
                var userId = GetUserId();
                var expense = await _expenseService.GetByIdAsync(userId, id);
                return Ok(expense);
            }
            catch (UnauthorizedAccessException)
            {
                return NotFound(new { message = "Expense not found" });
            }
            catch (SubscriptionAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { code = ex.Code, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ExpenseResponse>> Create([FromBody] CreateExpenseRequest request)
        {
            try
            {
                var userId = GetUserId();
                var expense = await _expenseService.CreateAsync(userId, request);
                return CreatedAtAction(nameof(GetById), new { id = expense.Id }, expense);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (SubscriptionAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { code = ex.Code, message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ExpenseResponse>> Update(int id, [FromBody] UpdateExpenseRequest request)
        {
            try
            {
                var userId = GetUserId();
                var expense = await _expenseService.UpdateAsync(userId, id, request);
                return Ok(expense);
            }
            catch (UnauthorizedAccessException)
            {
                return NotFound(new { message = "Expense not found" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (SubscriptionAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { code = ex.Code, message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var userId = GetUserId();
                await _expenseService.DeleteAsync(userId, id);
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return NotFound(new { message = "Expense not found" });
            }
            catch (SubscriptionAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { code = ex.Code, message = ex.Message });
            }
        }
    }
}
