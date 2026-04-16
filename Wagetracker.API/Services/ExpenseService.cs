
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using WageTracker.API.Data;
using WageTracker.API.Models.DTOs;
using WageTracker.API.Models.Entities;

namespace WageTracker.API.Services
{
    public class ExpenseService : IExpenseService
    {
        private readonly AppDbContext _context;
        private readonly ISubscriptionService _subscriptionService;
        private readonly IReceiptScanService _receiptScanService;
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

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

        public ExpenseService(AppDbContext context, ISubscriptionService subscriptionService, IReceiptScanService receiptScanService)
        {
            _context = context;
            _subscriptionService = subscriptionService;
            _receiptScanService = receiptScanService;
        }

        public async Task<ExpenseResponse> CreateAsync(int userId, CreateExpenseRequest request)
        {
            await _subscriptionService.EnsureExpensesAccessAsync(userId);

            ValidateCategory(request.Category);

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

        public async Task<ReceiptScanDraftResponse> ScanReceiptAsync(int userId, IFormFile receiptImage, CancellationToken cancellationToken = default)
        {
            await _subscriptionService.EnsureExpensesAccessAsync(userId, cancellationToken);
            return await _receiptScanService.ScanAsync(receiptImage, cancellationToken);
        }

        public async Task<ExpenseResponse> ConfirmReceiptScanAsync(int userId, ConfirmReceiptScanExpenseRequest request)
        {
            await _subscriptionService.EnsureExpensesAccessAsync(userId);
            ValidateCategory(request.Category);
            var items = NormalizeItems(request.Items);

            var expense = new Expense
            {
                UserId = userId,
                Amount = request.Amount,
                Category = (ExpenseCategory)request.Category,
                Date = request.Date,
                Description = request.Description,
                Source = ExpenseSource.ReceiptScan,
                PurchaseType = items.Count > 0 ? PurchaseType.MultiItem : PurchaseType.Single,
                MerchantName = TrimToNull(request.MerchantName, 160),
                SubtotalAmount = NormalizePositiveAmount(request.SubtotalAmount),
                TaxAmount = NormalizePositiveAmount(request.TaxAmount),
                DiscountAmount = NormalizePositiveAmount(request.DiscountAmount),
                ReceiptScanConfidence = request.ReceiptScanConfidence.HasValue
                    ? Math.Clamp(request.ReceiptScanConfidence.Value, 0, 1)
                    : null,
                ReceiptWarningsJson = request.Warnings.Count > 0
                    ? JsonSerializer.Serialize(request.Warnings.Where(w => !string.IsNullOrWhiteSpace(w)).Select(w => w.Trim()).Distinct().ToList(), JsonOptions)
                    : null,
                ReceiptImageUrl = null,
                CreatedAt = DateTime.UtcNow,
                Items = items
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            return MapToResponse(expense);
        }

        public async Task<ExpenseResponse> UpdateAsync(int userId, int expenseId, UpdateExpenseRequest request)
        {
            await _subscriptionService.EnsureExpensesAccessAsync(userId);

            var expense = await _context.Expenses
                .Include(e => e.Items)
                .FirstOrDefaultAsync(e => e.Id == expenseId && e.UserId == userId);

            if (expense == null)
            {
                throw new UnauthorizedAccessException("Expense not found or access denied");
            }

            ValidateCategory(request.Category);

            expense.Amount = request.Amount;
            expense.Category = (ExpenseCategory)request.Category;
            expense.Date = request.Date;
            expense.Description = request.Description;

            await _context.SaveChangesAsync();

            return MapToResponse(expense);
        }

        public async Task DeleteAsync(int userId, int expenseId)
        {
            await _subscriptionService.EnsureExpensesAccessAsync(userId);

            var expense = await _context.Expenses
                .Include(e => e.Items)
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
            await _subscriptionService.EnsureExpensesAccessAsync(userId);

            var expense = await _context.Expenses
                .Include(e => e.Items)
                .FirstOrDefaultAsync(e => e.Id == expenseId && e.UserId == userId);

            if (expense == null)
            {
                throw new UnauthorizedAccessException("Expense not found or access denied");
            }

            return MapToResponse(expense);
        }

        public async Task<List<ExpenseResponse>> GetUserExpensesAsync(int userId)
        {
            await _subscriptionService.EnsureExpensesAccessAsync(userId);

            var expenses = await _context.Expenses
                .Where(e => e.UserId == userId)
                .Include(e => e.Items)
                .OrderByDescending(e => e.Date)
                .ThenByDescending(e => e.CreatedAt)
                .ToListAsync();

            return expenses.Select(MapToResponse).ToList();
        }

        public async Task<List<WeeklyExpenseGroupResponse>> GetWeeklyExpenseGroupsAsync(int userId)
        {
            await _subscriptionService.EnsureExpensesAccessAsync(userId);

            var expenses = await _context.Expenses
                .Where(e => e.UserId == userId)
                .Include(e => e.Items)
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

        private static void ValidateCategory(int category)
        {
            if (!Enum.IsDefined(typeof(ExpenseCategory), category))
            {
                throw new ArgumentException("Invalid expense category");
            }
        }

        private static List<ExpenseItem> NormalizeItems(List<ReceiptScanItemDraft> requestItems)
        {
            var items = new List<ExpenseItem>();
            for (var index = 0; index < requestItems.Count; index++)
            {
                var requestItem = requestItems[index];
                var name = TrimToNull(requestItem.Name, 160);
                if (name == null || requestItem.TotalAmount == 0)
                {
                    continue;
                }

                ValidateCategory(requestItem.Category);
                var kind = ParseItemKind(requestItem.Kind);
                if (kind == ExpenseItemKind.Product && requestItem.TotalAmount <= 0)
                {
                    continue;
                }

                items.Add(new ExpenseItem
                {
                    Name = name,
                    TotalAmount = Math.Round(requestItem.TotalAmount, 2),
                    Quantity = requestItem.Quantity.HasValue && requestItem.Quantity.Value > 0
                        ? Math.Round(requestItem.Quantity.Value, 3)
                        : null,
                    UnitPrice = requestItem.UnitPrice.HasValue && requestItem.UnitPrice.Value >= 0
                        ? Math.Round(requestItem.UnitPrice.Value, 2)
                        : null,
                    Category = (ExpenseCategory)requestItem.Category,
                    Tag = NormalizeTag(requestItem.Tag, kind),
                    Kind = kind,
                    Confidence = requestItem.Confidence.HasValue
                        ? Math.Clamp(requestItem.Confidence.Value, 0, 1)
                        : null,
                    SortOrder = items.Count,
                    CreatedAt = DateTime.UtcNow
                });
            }

            return items;
        }

        private static ExpenseItemKind ParseItemKind(string? value)
        {
            return value?.Trim().ToLowerInvariant() switch
            {
                "tax" => ExpenseItemKind.Tax,
                "discount" => ExpenseItemKind.Discount,
                "fee" => ExpenseItemKind.Fee,
                "adjustment" => ExpenseItemKind.Adjustment,
                _ => ExpenseItemKind.Product
            };
        }

        private static string NormalizeTag(string? value, ExpenseItemKind kind)
        {
            var allowedTags = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "groceries",
                "snacks",
                "ready_meal",
                "household",
                "personal_care",
                "clothing",
                "school",
                "medicine",
                "electronics",
                "transport",
                "tax_fee",
                "discount",
                "adjustment",
                "other"
            };

            if (!string.IsNullOrWhiteSpace(value) && allowedTags.Contains(value.Trim()))
            {
                return value.Trim().ToLowerInvariant();
            }

            return kind switch
            {
                ExpenseItemKind.Tax or ExpenseItemKind.Fee => "tax_fee",
                ExpenseItemKind.Discount => "discount",
                ExpenseItemKind.Adjustment => "adjustment",
                _ => "other"
            };
        }

        private static string? TrimToNull(string? value, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var trimmed = value.Trim();
            return trimmed[..Math.Min(trimmed.Length, maxLength)];
        }

        private static decimal? NormalizePositiveAmount(decimal? value)
        {
            return value.HasValue && value.Value >= 0 ? Math.Round(value.Value, 2) : null;
        }

        private static DateTime GetWeekStartMonday(DateTime date)
        {
            var daysSinceMonday = ((int)date.DayOfWeek + 6) % 7;
            return date.AddDays(-daysSinceMonday);
        }

        public static ExpenseResponse MapToResponse(Expense expense)
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
                PurchaseType = expense.PurchaseType.ToString(),
                MerchantName = expense.MerchantName,
                SubtotalAmount = expense.SubtotalAmount,
                TaxAmount = expense.TaxAmount,
                DiscountAmount = expense.DiscountAmount,
                ReceiptScanConfidence = expense.ReceiptScanConfidence,
                ReceiptWarnings = DeserializeWarnings(expense.ReceiptWarningsJson),
                ItemCount = expense.Items.Count,
                Items = expense.Items
                    .OrderBy(item => item.SortOrder)
                    .ThenBy(item => item.Id)
                    .Select(item => new ExpenseItemResponse
                    {
                        Id = item.Id,
                        Name = item.Name,
                        TotalAmount = item.TotalAmount,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        Category = (int)item.Category,
                        CategoryName = GetCategoryName((int)item.Category),
                        Tag = item.Tag,
                        Kind = item.Kind.ToString(),
                        Confidence = item.Confidence,
                        SortOrder = item.SortOrder
                    })
                    .ToList(),
                ReceiptImageUrl = expense.ReceiptImageUrl,
                CreatedAt = expense.CreatedAt
            };
        }

        private static List<string> DeserializeWarnings(string? warningsJson)
        {
            if (string.IsNullOrWhiteSpace(warningsJson))
            {
                return new List<string>();
            }

            try
            {
                return JsonSerializer.Deserialize<List<string>>(warningsJson, JsonOptions) ?? new List<string>();
            }
            catch (JsonException)
            {
                return new List<string>();
            }
        }
    }
}
