using WageTracker.API.Models.DTOs;

namespace WageTracker.API.Services
{
    public interface IExpenseService
    {
        Task<ExpenseResponse> CreateAsync(int userId, CreateExpenseRequest request);
        Task<ReceiptScanDraftResponse> ScanReceiptAsync(int userId, IFormFile receiptImage, CancellationToken cancellationToken = default);
        Task<ExpenseResponse> ConfirmReceiptScanAsync(int userId, ConfirmReceiptScanExpenseRequest request);
        Task<ExpenseResponse> UpdateAsync(int userId, int expenseId, UpdateExpenseRequest request);
        Task DeleteAsync(int userId, int expenseId);
        Task<ExpenseResponse> GetByIdAsync(int userId, int expenseId);
        Task<List<ExpenseResponse>> GetUserExpensesAsync(int userId);
        Task<ExpenseSummaryResponse> GetSummaryAsync(int userId);
        Task<List<WeeklyExpenseGroupResponse>> GetWeeklyExpenseGroupsAsync(int userId);
        Task<PagedWeeklyExpenseGroupsResponse> GetWeeklyExpenseGroupsPageAsync(int userId, DateTime? beforeWeekStart, int take);
    }
}
