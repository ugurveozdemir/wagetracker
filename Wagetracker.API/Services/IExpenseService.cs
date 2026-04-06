using WageTracker.API.Models.DTOs;

namespace WageTracker.API.Services
{
    public interface IExpenseService
    {
        Task<ExpenseResponse> CreateAsync(int userId, CreateExpenseRequest request);
        Task<ExpenseResponse> UpdateAsync(int userId, int expenseId, UpdateExpenseRequest request);
        Task DeleteAsync(int userId, int expenseId);
        Task<ExpenseResponse> GetByIdAsync(int userId, int expenseId);
        Task<List<ExpenseResponse>> GetUserExpensesAsync(int userId);
    }
}
