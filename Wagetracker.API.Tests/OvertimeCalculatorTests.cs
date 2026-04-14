using WageTracker.API.Models.Entities;
using WageTracker.API.Utilities;

namespace Wagetracker.API.Tests;

public class OvertimeCalculatorTests
{
    [Fact]
    public void RecalculateWeekEntries_MatchesScreenshotOvertimeMath()
    {
        var entries = new List<DailyEntry>
        {
            Entry(id: 1, day: 8, hours: 8, hourlyRateSnapshot: 12, tip: 10),
            Entry(id: 2, day: 9, hours: 12, hourlyRateSnapshot: 12, tip: 10),
            Entry(id: 3, day: 10, hours: 16, hourlyRateSnapshot: 12, tip: 10),
            Entry(id: 4, day: 11, hours: 12, hourlyRateSnapshot: 12, tip: 10),
        };

        OvertimeCalculator.RecalculateWeekEntries(entries);
        var summary = OvertimeCalculator.CalculateWeeklySummary(entries);

        Assert.Equal(106m, entries[0].TotalEarnings);
        Assert.Equal(154m, entries[1].TotalEarnings);
        Assert.Equal(202m, entries[2].TotalEarnings);
        Assert.Equal(202m, entries[3].TotalEarnings);
        Assert.Equal(48m, summary.totalHours);
        Assert.Equal(40m, summary.regularHours);
        Assert.Equal(8m, summary.overtimeHours);
        Assert.Equal(664m, summary.totalEarnings);
        Assert.Equal(48m, summary.overtimeBonus);
    }

    [Fact]
    public void RecalculateWeekEntries_UsesEachEntryHourlyRateSnapshot()
    {
        var entries = new List<DailyEntry>
        {
            Entry(id: 1, day: 8, hours: 30, hourlyRateSnapshot: 10),
            Entry(id: 2, day: 9, hours: 10, hourlyRateSnapshot: 20),
            Entry(id: 3, day: 10, hours: 5, hourlyRateSnapshot: 20),
        };

        OvertimeCalculator.RecalculateWeekEntries(entries);
        var summary = OvertimeCalculator.CalculateWeeklySummary(entries);

        Assert.Equal(300m, entries[0].TotalEarnings);
        Assert.Equal(200m, entries[1].TotalEarnings);
        Assert.Equal(150m, entries[2].TotalEarnings);
        Assert.Equal(650m, summary.totalEarnings);
        Assert.Equal(50m, summary.overtimeBonus);
    }

    [Fact]
    public void RecalculateWeekEntries_OrdersSameDayEntriesByCreatedAtThenId()
    {
        var laterEntry = Entry(id: 2, day: 8, hours: 2, hourlyRateSnapshot: 100, createdHour: 9);
        var earlierEntry = Entry(id: 1, day: 8, hours: 39, hourlyRateSnapshot: 10, createdHour: 8);
        var entries = new List<DailyEntry> { laterEntry, earlierEntry };

        var recalculated = OvertimeCalculator.RecalculateWeekEntries(entries);
        var summary = OvertimeCalculator.CalculateWeeklySummary(entries);

        Assert.Equal([1, 2], recalculated.Select(e => e.Id).ToArray());
        Assert.Equal(390m, earlierEntry.TotalEarnings);
        Assert.Equal(250m, laterEntry.TotalEarnings);
        Assert.Equal(50m, summary.overtimeBonus);
    }

    private static DailyEntry Entry(
        int id,
        int day,
        decimal hours,
        decimal hourlyRateSnapshot,
        decimal tip = 0,
        int createdHour = 8)
    {
        return new DailyEntry
        {
            Id = id,
            Date = new DateTime(2026, 4, day),
            TotalHours = hours,
            HourlyRateSnapshot = hourlyRateSnapshot,
            Tip = tip,
            CreatedAt = new DateTime(2026, 4, day, createdHour, 0, 0, DateTimeKind.Utc),
        };
    }
}
