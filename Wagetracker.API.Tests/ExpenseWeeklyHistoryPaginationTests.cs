using WageTracker.API.Models.Entities;
using WageTracker.API.Services;

namespace Wagetracker.API.Tests;

public class ExpenseWeeklyHistoryPaginationTests
{
    [Fact]
    public void BuildWeeklyExpenseGroupsPageResponse_ReturnsWeeksByCursorPage()
    {
        var expenses = new List<Expense>
        {
            Expense(id: 1, amount: 10m, day: 13),
            Expense(id: 2, amount: 20m, day: 7),
            Expense(id: 3, amount: 30m, day: 1),
            Expense(id: 4, amount: 40m, month: 3, day: 24),
            Expense(id: 5, amount: 50m, month: 3, day: 17),
        };

        var firstPage = ExpenseService.BuildWeeklyExpenseGroupsPageResponse(expenses, beforeWeekStart: null, take: 2);
        var secondPage = ExpenseService.BuildWeeklyExpenseGroupsPageResponse(expenses, firstPage.NextCursor, take: 2);
        var thirdPage = ExpenseService.BuildWeeklyExpenseGroupsPageResponse(expenses, secondPage.NextCursor, take: 2);

        Assert.True(firstPage.HasMore);
        Assert.Equal(new DateTime(2026, 4, 6), firstPage.NextCursor);
        Assert.Equal([new DateTime(2026, 4, 13), new DateTime(2026, 4, 6)], firstPage.Groups.Select(g => g.WeekStart).ToArray());
        Assert.Equal([10m, 20m], firstPage.Groups.Select(g => g.TotalAmount).ToArray());

        Assert.True(secondPage.HasMore);
        Assert.Equal(new DateTime(2026, 3, 23), secondPage.NextCursor);
        Assert.Equal([new DateTime(2026, 3, 30), new DateTime(2026, 3, 23)], secondPage.Groups.Select(g => g.WeekStart).ToArray());
        Assert.Equal([30m, 40m], secondPage.Groups.Select(g => g.TotalAmount).ToArray());

        Assert.False(thirdPage.HasMore);
        Assert.Null(thirdPage.NextCursor);
        Assert.Equal([new DateTime(2026, 3, 16)], thirdPage.Groups.Select(g => g.WeekStart).ToArray());
        Assert.Equal([50m], thirdPage.Groups.Select(g => g.TotalAmount).ToArray());
    }

    private static Expense Expense(int id, decimal amount, int day, int month = 4)
    {
        return new Expense
        {
            Id = id,
            UserId = 1,
            Amount = amount,
            Category = ExpenseCategory.Other,
            Date = new DateTime(2026, month, day),
            CreatedAt = new DateTime(2026, month, day, 8, 0, 0, DateTimeKind.Utc),
        };
    }
}
