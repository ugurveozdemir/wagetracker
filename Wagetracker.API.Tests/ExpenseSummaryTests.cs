using WageTracker.API.Models.Entities;
using WageTracker.API.Services;

namespace Wagetracker.API.Tests;

public class ExpenseSummaryTests
{
    [Fact]
    public void BuildSummaryResponse_UsesBackendRulesForTotalsCategoriesAndRecentExpenses()
    {
        var expenses = new List<Expense>
        {
            Expense(
                id: 1,
                amount: 10m,
                category: ExpenseCategory.FoodAndDrinks,
                date: new DateTime(2026, 4, 10),
                createdAt: new DateTime(2026, 4, 10, 8, 0, 0, DateTimeKind.Utc)),
            Expense(
                id: 2,
                amount: 30m,
                category: ExpenseCategory.Other,
                date: new DateTime(2026, 4, 12),
                createdAt: new DateTime(2026, 4, 12, 8, 0, 0, DateTimeKind.Utc),
                purchaseType: PurchaseType.MultiItem,
                items:
                [
                    Item(id: 20, amount: 12m, category: ExpenseCategory.FoodAndDrinks),
                    Item(id: 21, amount: 18m, category: ExpenseCategory.Shopping),
                ]),
            Expense(
                id: 3,
                amount: 7m,
                category: ExpenseCategory.Transport,
                date: new DateTime(2026, 4, 11),
                createdAt: new DateTime(2026, 4, 11, 8, 0, 0, DateTimeKind.Utc)),
            Expense(
                id: 4,
                amount: 5m,
                category: ExpenseCategory.Health,
                date: new DateTime(2026, 4, 12),
                createdAt: new DateTime(2026, 4, 12, 9, 0, 0, DateTimeKind.Utc)),
            Expense(
                id: 5,
                amount: 3m,
                category: ExpenseCategory.Education,
                date: new DateTime(2026, 4, 9),
                createdAt: new DateTime(2026, 4, 9, 8, 0, 0, DateTimeKind.Utc)),
        };

        var summary = ExpenseService.BuildSummaryResponse(expenses);

        Assert.Equal(55m, summary.TotalSpending);
        Assert.Equal([0, 2, 1, 5, 6], summary.CategoryTotals.Select(c => c.Category).ToArray());
        Assert.Equal([22m, 18m, 7m, 5m, 3m], summary.CategoryTotals.Select(c => c.Amount).ToArray());
        Assert.Equal([4, 2, 3, 1], summary.RecentExpenses.Select(e => e.Id).ToArray());
    }

    private static Expense Expense(
        int id,
        decimal amount,
        ExpenseCategory category,
        DateTime date,
        DateTime createdAt,
        PurchaseType purchaseType = PurchaseType.Single,
        List<ExpenseItem>? items = null)
    {
        return new Expense
        {
            Id = id,
            UserId = 1,
            Amount = amount,
            Category = category,
            Date = date,
            CreatedAt = createdAt,
            PurchaseType = purchaseType,
            Items = items ?? new List<ExpenseItem>(),
        };
    }

    private static ExpenseItem Item(int id, decimal amount, ExpenseCategory category)
    {
        return new ExpenseItem
        {
            Id = id,
            Name = $"Item {id}",
            TotalAmount = amount,
            Category = category,
            SortOrder = id,
        };
    }
}
