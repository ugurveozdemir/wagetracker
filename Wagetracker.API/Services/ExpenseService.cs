using Microsoft.EntityFrameworkCore;
using WageTracker.API.Data;
using WageTracker.API.Models.DTOs;
using WageTracker.API.Models.Entities;

namespace WageTracker.API.Services
{
    public class ExpenseService : IExpenseService
    {
        private readonly AppDbContext _context;

        // Kategori isim mapping'i (enum int → string)
        private static readonly Dictionary<int, string> CategoryNames = new()
        {
            { 0, "Food & Drinks" },
            { 1, "Transport" },
            { 2, "Shopping" },
            { 3, "Bills & Utilities" },
            { 4, "Entertainment" },
            { 5, "Health" },
            { 6, "Education" },
            { 7, "Other" }
        };

        public ExpenseService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ExpenseResponse> CreateAsync(int userId, CreateExpenseRequest request)
        {
            // Validate category
            if (!Enum.IsDefined(typeof(ExpenseCategory), request.Category))
            {
                throw new ArgumentException("Invalid expense category");
            }

            var expense = new Expense
            {
                UserId = userId,
                Amount = request.Amount,
                Category = (ExpenseCategory)request.Category,
                Date = request.Date,
                Description = request.Description,
                Source = ExpenseSource.Manual,
                CreatedAt = DateTime.UtcNow
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            return MapToResponse(expense);
        }

        public async Task<ExpenseResponse> UpdateAsync(int userId, int expenseId, UpdateExpenseRequest request)
        {
            var expense = await _context.Expenses
                .FirstOrDefaultAsync(e => e.Id == expenseId && e.UserId == userId);

            if (expense == null)
            {
                throw new UnauthorizedAccessException("Expense not found or access denied");
            }

            // Validate category
            if (!Enum.IsDefined(typeof(ExpenseCategory), request.Category))
            {
                throw new ArgumentException("Invalid expense category");
            }

            expense.Amount = request.Amount;
            expense.Category = (ExpenseCategory)request.Category;
            expense.Date = request.Date;
            expense.Description = request.Description;

            await _context.SaveChangesAsync();

            return MapToResponse(expense);
        }

        public async Task DeleteAsync(int userId, int expenseId)
        {
            var expense = await _context.Expenses
                .FirstOrDefaultAsync(e => e.Id == expenseId && e.UserId == userId);

            if (expense == null)
            {
                throw new UnauthorizedAccessException("Expense not found or access denied");
            }

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();
        }

        public async Task<ExpenseResponse> GetByIdAsync(int userId, int expenseId)
        {
            var expense = await _context.Expenses
                .FirstOrDefaultAsync(e => e.Id == expenseId && e.UserId == userId);

            if (expense == null)
            {
                throw new UnauthorizedAccessException("Expense not found or access denied");
            }

            return MapToResponse(expense);
        }

        public async Task<List<ExpenseResponse>> GetUserExpensesAsync(int userId)
        {
            var expenses = await _context.Expenses
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.Date)
                .ThenByDescending(e => e.CreatedAt)
                .ToListAsync();

            return expenses.Select(MapToResponse).ToList();
        }

        public async Task<List<WeeklyExpenseGroupResponse>> GetWeeklyExpenseGroupsAsync(int userId)
        {
            var expenses = await _context.Expenses
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.Date)
                .ThenByDescending(e => e.CreatedAt)
                .ToListAsync();

            return expenses
                .GroupBy(e => GetWeekStartMonday(e.Date.Date))
                .OrderByDescending(group => group.Key)
                .Select(group => new WeeklyExpenseGroupResponse
                {
                    WeekStart = group.Key,
                    WeekEnd = group.Key.AddDays(6),
                    TotalAmount = group.Sum(e => e.Amount),
                    Expenses = group
                        .OrderByDescending(e => e.Date)
                        .ThenByDescending(e => e.CreatedAt)
                        .Select(MapToResponse)
                        .ToList()
                })
                .ToList();
        }

        // Static helper: Kategori int'inden isim döndürür (DashboardService'ten de kullanılır)
        public static string GetCategoryName(int category)
        {
            return CategoryNames.TryGetValue(category, out var name) ? name : "Other";
        }

        private static DateTime GetWeekStartMonday(DateTime date)
        {
            var daysSinceMonday = ((int)date.DayOfWeek + 6) % 7;
            return date.AddDays(-daysSinceMonday);
        }

        private static ExpenseResponse MapToResponse(Expense expense)
        {
            return new ExpenseResponse
            {
                Id = expense.Id,
                Amount = expense.Amount,
                Category = (int)expense.Category,
                CategoryName = GetCategoryName((int)expense.Category),
                Date = expense.Date,
                Description = expense.Description,
                Source = expense.Source.ToString(),
                ReceiptImageUrl = expense.ReceiptImageUrl,
                CreatedAt = expense.CreatedAt
            };
        }
    }
}
