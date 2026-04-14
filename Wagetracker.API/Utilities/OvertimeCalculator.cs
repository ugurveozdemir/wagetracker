using WageTracker.API.Models.Entities;

namespace WageTracker.API.Utilities
{
    /// <summary>
    /// Utility class for calculating overtime based on 40-hour weekly threshold with 1.5x multiplier
    /// </summary>
    public static class OvertimeCalculator
    {
        private const decimal OVERTIME_THRESHOLD = 40m;
        private const decimal OVERTIME_MULTIPLIER = 1.5m;

        /// <summary>
        /// Calculates earnings for a single entry considering weekly overtime
        /// </summary>
        /// <param name="entryHours">Hours for this entry</param>
        /// <param name="accumulatedWeeklyHours">Hours already worked this week (before this entry)</param>
        /// <param name="hourlyRate">Base hourly rate</param>
        /// <param name="tip">Tip amount</param>
        /// <returns>Tuple of (totalEarnings, regularHours, overtimeHours)</returns>
        public static (decimal totalEarnings, decimal regularHours, decimal overtimeHours) CalculateEntryEarnings(
            decimal entryHours,
            decimal accumulatedWeeklyHours,
            decimal hourlyRate,
            decimal tip = 0)
        {
            decimal regularHours = entryHours;
            decimal overtimeHours = 0;

            // Check if we've already hit the 40-hour threshold
            if (accumulatedWeeklyHours >= OVERTIME_THRESHOLD)
            {
                // Entire entry is overtime
                regularHours = 0;
                overtimeHours = entryHours;
            }
            else if (accumulatedWeeklyHours + entryHours > OVERTIME_THRESHOLD)
            {
                // Split entry between regular and overtime
                regularHours = OVERTIME_THRESHOLD - accumulatedWeeklyHours;
                overtimeHours = entryHours - regularHours;
            }

            // Calculate earnings
            var regularEarnings = regularHours * hourlyRate;
            var overtimeEarnings = overtimeHours * hourlyRate * OVERTIME_MULTIPLIER;
            var totalEarnings = regularEarnings + overtimeEarnings + tip;

            return (totalEarnings, regularHours, overtimeHours);
        }

        /// <summary>
        /// Calculates the overtime bonus amount (extra earnings from 1.5x multiplier)
        /// </summary>
        public static decimal CalculateOvertimeBonus(decimal overtimeHours, decimal hourlyRate)
        {
            // Overtime bonus is the extra 0.5x on top of regular rate
            return overtimeHours * hourlyRate * (OVERTIME_MULTIPLIER - 1);
        }

        /// <summary>
        /// Recalculates all entries for a week to ensure overtime is correctly distributed
        /// </summary>
        /// <param name="weekEntries">All entries for the week</param>
        /// <returns>List of entries with updated earnings</returns>
        public static List<DailyEntry> RecalculateWeekEntries(List<DailyEntry> weekEntries)
        {
            var sortedEntries = SortChronologically(weekEntries);

            decimal accumulatedHours = 0;

            foreach (var entry in sortedEntries)
            {
                var (totalEarnings, _, _) = CalculateEntryEarnings(
                    entry.TotalHours,
                    accumulatedHours,
                    entry.HourlyRateSnapshot,
                    entry.Tip
                );

                entry.TotalEarnings = totalEarnings;
                
                // Update accumulated hours for next entry
                accumulatedHours += entry.TotalHours;
            }

            return sortedEntries;
        }

        /// <summary>
        /// Calculates weekly summary statistics
        /// </summary>
        public static (decimal totalHours, decimal regularHours, decimal overtimeHours, decimal totalEarnings, decimal overtimeBonus) 
            CalculateWeeklySummary(List<DailyEntry> weekEntries)
        {
            var totalHours = weekEntries.Sum(e => e.TotalHours);
            var regularHours = Math.Min(totalHours, OVERTIME_THRESHOLD);
            var overtimeHours = Math.Max(totalHours - OVERTIME_THRESHOLD, 0);
            var totalEarnings = weekEntries.Sum(e => e.TotalEarnings);
            var overtimeBonus = CalculateWeeklyOvertimeBonus(weekEntries);

            return (totalHours, regularHours, overtimeHours, totalEarnings, overtimeBonus);
        }

        private static decimal CalculateWeeklyOvertimeBonus(List<DailyEntry> weekEntries)
        {
            var sortedEntries = SortChronologically(weekEntries);
            decimal accumulatedHours = 0;
            decimal overtimeBonus = 0;

            foreach (var entry in sortedEntries)
            {
                var (_, _, overtimeHours) = CalculateEntryEarnings(
                    entry.TotalHours,
                    accumulatedHours,
                    entry.HourlyRateSnapshot,
                    entry.Tip
                );

                overtimeBonus += CalculateOvertimeBonus(overtimeHours, entry.HourlyRateSnapshot);
                accumulatedHours += entry.TotalHours;
            }

            return overtimeBonus;
        }

        private static List<DailyEntry> SortChronologically(List<DailyEntry> entries)
        {
            return entries
                .OrderBy(e => e.Date)
                .ThenBy(e => e.CreatedAt)
                .ThenBy(e => e.Id)
                .ToList();
        }
    }
}
