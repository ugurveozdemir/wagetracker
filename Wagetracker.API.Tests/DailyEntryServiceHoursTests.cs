using WageTracker.API.Services;

namespace Wagetracker.API.Tests;

public class DailyEntryServiceHoursTests
{
    [Fact]
    public void ResolveTotalHours_UsesManualTotalHoursWhenTimesAreMissing()
    {
        var totalHours = DailyEntryService.ResolveTotalHours(null, null, 8.5m);

        Assert.Equal(8.5m, totalHours);
    }

    [Fact]
    public void ResolveTotalHours_CalculatesOvernightShiftDuration()
    {
        var totalHours = DailyEntryService.ResolveTotalHours(
            TimeSpan.FromHours(22),
            TimeSpan.FromHours(2),
            null);

        Assert.Equal(4m, totalHours);
    }

    [Fact]
    public void ResolveTotalHours_RejectsZeroLengthShift()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            DailyEntryService.ResolveTotalHours(TimeSpan.FromHours(9), TimeSpan.FromHours(9), null));

        Assert.Equal("Total hours must be between 0.01 and 24", ex.Message);
    }

    [Fact]
    public void ResolveTotalHours_RejectsShiftLongerThanTwentyFourHours()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            DailyEntryService.ResolveTotalHours(TimeSpan.Zero, TimeSpan.FromHours(25), null));

        Assert.Equal("Total hours must be between 0.01 and 24", ex.Message);
    }

    [Fact]
    public void ResolveTotalHours_RequiresHoursOrBothTimes()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            DailyEntryService.ResolveTotalHours(TimeSpan.FromHours(9), null, null));

        Assert.Equal("Either TotalHours or both StartTime and EndTime must be provided", ex.Message);
    }
}
