namespace WageTracker.API.Utilities
{
    /// <summary>
    /// Utility class for calculating week ranges based on a custom first day of week
    /// </summary>
    public static class WeekCalculator
    {
        /// <summary>
        /// Gets the start and end date of the week for a given date
        /// </summary>
        /// <param name="date">The date to find the week for</param>
        /// <param name="firstDayOfWeek">First day of the week (0=Sunday, 1=Monday, etc.)</param>
        /// <returns>Tuple of (weekStart, weekEnd)</returns>
        public static (DateTime weekStart, DateTime weekEnd) GetWeekRange(DateTime date, DayOfWeek firstDayOfWeek)
        {
            var dayOfWeek = (int)date.DayOfWeek;
            var firstDay = (int)firstDayOfWeek;
            
            // Calculate days from the first day of week
            var diff = dayOfWeek - firstDay;
            if (diff < 0) diff += 7;
            
            // Get week start (set time to midnight)
            var weekStart = date.AddDays(-diff).Date;
            
            // Get week end (6 days after start)
            var weekEnd = weekStart.AddDays(6);
            
            return (weekStart, weekEnd);
        }

        /// <summary>
        /// Gets a unique key for the week (ISO string of week start date)
        /// </summary>
        public static string GetWeekKey(DateTime date, DayOfWeek firstDayOfWeek)
        {
            var (weekStart, _) = GetWeekRange(date, firstDayOfWeek);
            return weekStart.ToString("yyyy-MM-dd");
        }

        /// <summary>
        /// Checks if two dates are in the same week
        /// </summary>
        public static bool AreDatesInSameWeek(DateTime date1, DateTime date2, DayOfWeek firstDayOfWeek)
        {
            var key1 = GetWeekKey(date1, firstDayOfWeek);
            var key2 = GetWeekKey(date2, firstDayOfWeek);
            return key1 == key2;
        }
    }
}
