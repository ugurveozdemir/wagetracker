using WageTracker.API.Models.Entities;
using WageTracker.API.Services;

namespace Wagetracker.API.Tests;

public class GeneralSummaryTests
{
    [Fact]
    public void BuildGeneralSummaryResponse_ReturnsAllTimeMonthlyJobAndInsightTotals()
    {
        var jobs = new List<Job>
        {
            Job(id: 1, title: "Cafe", createdAt: new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc)),
            Job(id: 2, title: "Hotel", createdAt: new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc)),
        };

        var entries = new List<DailyEntry>
        {
            Entry(id: 1, jobId: 1, date: new DateTime(2026, 4, 6), hours: 10m, earnings: 150m),
            Entry(id: 2, jobId: 1, date: new DateTime(2026, 4, 8), hours: 6m, earnings: 90m),
            Entry(id: 3, jobId: 1, date: new DateTime(2026, 4, 13), hours: 20m, earnings: 300m),
            Entry(id: 4, jobId: 2, date: new DateTime(2026, 3, 30), hours: 8m, earnings: 128m),
        };

        var expenses = new List<Expense>
        {
            Expense(id: 1, amount: 40m, date: new DateTime(2026, 4, 7), createdAt: new DateTime(2026, 4, 7, 8, 0, 0, DateTimeKind.Utc), description: "Groceries"),
            Expense(
                id: 2,
                amount: 72m,
                date: new DateTime(2026, 4, 8),
                createdAt: new DateTime(2026, 4, 8, 8, 0, 0, DateTimeKind.Utc),
                merchantName: "Market Basket",
                purchaseType: PurchaseType.MultiItem,
                items:
                [
                    new ExpenseItem { Id = 20, Name = "Receipt line", TotalAmount = 999m, Category = ExpenseCategory.Shopping },
                ]),
            Expense(id: 3, amount: 20m, date: new DateTime(2026, 3, 31), createdAt: new DateTime(2026, 3, 31, 8, 0, 0, DateTimeKind.Utc)),
        };

        var summary = DashboardService.BuildGeneralSummaryResponse(jobs, entries, expenses);

        Assert.Equal(668m, summary.TotalEarnings);
        Assert.Equal(132m, summary.TotalExpenses);
        Assert.Equal(536m, summary.NetEarnings);
        Assert.Equal(44m, summary.TotalHours);
        Assert.Equal(14.67m, summary.AverageWeeklyHours);

        Assert.Equal([1, 2], summary.Jobs.Select(j => j.JobId).ToArray());
        Assert.Equal([540m, 128m], summary.Jobs.Select(j => j.TotalEarnings).ToArray());
        Assert.Equal([36m, 8m], summary.Jobs.Select(j => j.TotalHours).ToArray());

        Assert.Equal(["Apr 2026", "Mar 2026"], summary.Months.Select(m => m.MonthLabel).ToArray());
        Assert.Equal([540m, 128m], summary.Months.Select(m => m.Earnings).ToArray());
        Assert.Equal([112m, 20m], summary.Months.Select(m => m.Expenses).ToArray());
        Assert.Equal([428m, 108m], summary.Months.Select(m => m.NetEarnings).ToArray());

        Assert.Equal(["Cafe", "Hotel"], summary.MonthlyJobs.Select(j => j.JobTitle).ToArray());
        Assert.Equal([540m, 128m], summary.MonthlyJobs.Select(j => j.Earnings).ToArray());

        Assert.NotNull(summary.LargestPurchase);
        Assert.Equal(2, summary.LargestPurchase.ExpenseId);
        Assert.Equal(72m, summary.LargestPurchase.Amount);
        Assert.Equal("Market Basket", summary.LargestPurchase.Title);

        Assert.Equal([18m, 8m], summary.AverageWeeklyHoursByJob.Select(j => j.AverageWeeklyHours).ToArray());
    }

    private static Job Job(int id, string title, DateTime createdAt)
    {
        return new Job
        {
            Id = id,
            UserId = 1,
            Title = title,
            HourlyRate = 15m,
            CreatedAt = createdAt,
        };
    }

    private static DailyEntry Entry(int id, int jobId, DateTime date, decimal hours, decimal earnings)
    {
        return new DailyEntry
        {
            Id = id,
            UserId = 1,
            JobId = jobId,
            Date = date,
            TotalHours = hours,
            HourlyRateSnapshot = hours == 0 ? 0 : Math.Round(earnings / hours, 2),
            TotalEarnings = earnings,
        };
    }

    private static Expense Expense(
        int id,
        decimal amount,
        DateTime date,
        DateTime createdAt,
        string? description = null,
        string? merchantName = null,
        PurchaseType purchaseType = PurchaseType.Single,
        List<ExpenseItem>? items = null)
    {
        return new Expense
        {
            Id = id,
            UserId = 1,
            Amount = amount,
            Category = ExpenseCategory.Other,
            Date = date,
            CreatedAt = createdAt,
            Description = description,
            MerchantName = merchantName,
            PurchaseType = purchaseType,
            Items = items ?? new List<ExpenseItem>(),
        };
    }
}
