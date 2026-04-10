using Microsoft.EntityFrameworkCore;
using WageTracker.API.Data;
using WageTracker.API.Models.DTOs;
using WageTracker.API.Models.Entities;
using WageTracker.API.Utilities;

namespace WageTracker.API.Services
{
    public class DailyEntryService : IDailyEntryService
    {
        private readonly AppDbContext _context;
        private readonly ISubscriptionService _subscriptionService;

        public DailyEntryService(AppDbContext context, ISubscriptionService subscriptionService)
        {
            _context = context;
            _subscriptionService = subscriptionService;
        }

        public async Task<EntryResponse> CreateEntryAsync(int userId, CreateEntryRequest request)
        {
            // Get the job and verify ownership
            var job = await _context.Jobs
                .FirstOrDefaultAsync(j => j.Id == request.JobId && j.UserId == userId);

            if (job == null)
            {
                throw new UnauthorizedAccessException("Job not found or access denied");
            }

            await _subscriptionService.EnsureJobUnlockedAsync(userId, job.Id);

            // Calculate TotalHours if StartTime and EndTime are provided
            decimal totalHours;
            if (request.StartTime.HasValue && request.EndTime.HasValue)
            {
                var duration = request.EndTime.Value - request.StartTime.Value;
                
                // Handle overnight shifts
                if (duration.TotalHours < 0)
                {
                    duration = duration.Add(TimeSpan.FromDays(1));
                }
                
                totalHours = (decimal)duration.TotalHours;
            }
            else if (request.TotalHours.HasValue)
            {
                totalHours = request.TotalHours.Value;
            }
            else
            {
                throw new InvalidOperationException("Either TotalHours or both StartTime and EndTime must be provided");
            }

            // Create entry
            var entry = new DailyEntry
            {
                UserId = userId,
                JobId = request.JobId,
                Date = request.Date.Date, // Ensure date only
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                TotalHours = totalHours,
                HourlyRateSnapshot = job.HourlyRate, // Copy current rate
                Tip = request.Tip,
                Note = request.Note,
                CreatedAt = DateTime.UtcNow,
                TotalEarnings = 0 // Will be calculated below
            };

            _context.DailyEntries.Add(entry);
            await _context.SaveChangesAsync();

            // Recalculate all entries for this week
            await RecalculateWeekEntriesAsync(job, entry.Date);

            // Reload entry to get updated earnings
            var savedEntry = await _context.DailyEntries
                .FirstAsync(e => e.Id == entry.Id);

            return MapToEntryResponse(savedEntry);
        }

        public async Task<EntryResponse> UpdateEntryAsync(int userId, int entryId, UpdateEntryRequest request)
        {
            var entry = await _context.DailyEntries
                .Include(e => e.Job)
                .FirstOrDefaultAsync(e => e.Id == entryId && e.UserId == userId);

            if (entry == null)
            {
                throw new UnauthorizedAccessException("Entry not found or access denied");
            }

            await _subscriptionService.EnsureJobUnlockedAsync(userId, entry.JobId);

            var oldDate = entry.Date;

            // Calculate TotalHours
            decimal totalHours;
            if (request.StartTime.HasValue && request.EndTime.HasValue)
            {
                var duration = request.EndTime.Value - request.StartTime.Value;
                if (duration.TotalHours < 0)
                {
                    duration = duration.Add(TimeSpan.FromDays(1));
                }
                totalHours = (decimal)duration.TotalHours;
            }
            else if (request.TotalHours.HasValue)
            {
                totalHours = request.TotalHours.Value;
            }
            else
            {
                throw new InvalidOperationException("Either TotalHours or both StartTime and EndTime must be provided");
            }

            // Update entry
            entry.Date = request.Date.Date;
            entry.StartTime = request.StartTime;
            entry.EndTime = request.EndTime;
            entry.TotalHours = totalHours;
            entry.Tip = request.Tip;
            entry.Note = request.Note;

            await _context.SaveChangesAsync();

            // Recalculate affected weeks
            await RecalculateWeekEntriesAsync(entry.Job!, oldDate);
            if (!WeekCalculator.AreDatesInSameWeek(oldDate, entry.Date, entry.Job!.FirstDayOfWeek))
            {
                await RecalculateWeekEntriesAsync(entry.Job, entry.Date);
            }

            // Reload entry
            var updatedEntry = await _context.DailyEntries.FirstAsync(e => e.Id == entryId);
            return MapToEntryResponse(updatedEntry);
        }

        public async Task DeleteEntryAsync(int userId, int entryId)
        {
            var entry = await _context.DailyEntries
                .Include(e => e.Job)
                .FirstOrDefaultAsync(e => e.Id == entryId && e.UserId == userId);

            if (entry == null)
            {
                throw new UnauthorizedAccessException("Entry not found or access denied");
            }

            await _subscriptionService.EnsureJobUnlockedAsync(userId, entry.JobId);

            var job = entry.Job!;
            var entryDate = entry.Date;

            _context.DailyEntries.Remove(entry);
            await _context.SaveChangesAsync();

            // Recalculate the week
            await RecalculateWeekEntriesAsync(job, entryDate);
        }

        public async Task<EntryResponse> GetEntryByIdAsync(int userId, int entryId)
        {
            var entry = await _context.DailyEntries
                .FirstOrDefaultAsync(e => e.Id == entryId && e.UserId == userId);

            if (entry == null)
            {
                throw new UnauthorizedAccessException("Entry not found or access denied");
            }

            return MapToEntryResponse(entry);
        }

        public async Task<List<EntryResponse>> GetUserEntriesAsync(int userId)
        {
            var entries = await _context.DailyEntries
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.Date)
                .ToListAsync();

            return entries.Select(MapToEntryResponse).ToList();
        }

        public async Task<JobDetailsResponse> GetJobDetailsWithWeeklyGroupingAsync(int userId, int jobId)
        {
            var job = await _context.Jobs
                .FirstOrDefaultAsync(j => j.Id == jobId && j.UserId == userId);

            if (job == null)
            {
                throw new UnauthorizedAccessException("Job not found or access denied");
            }

            var lockState = await _subscriptionService.GetJobLockStateAsync(userId, jobId);

            var entries = await _context.DailyEntries
                .Where(e => e.JobId == jobId)
                .OrderByDescending(e => e.Date)
                .ToListAsync();

            // Group by week
            var weekGroups = entries
                .GroupBy(e => WeekCalculator.GetWeekKey(e.Date, job.FirstDayOfWeek))
                .Select(g =>
                {
                    var weekEntries = g.OrderByDescending(e => e.Date).ToList();
                    var firstEntry = weekEntries.First();
                    var (weekStart, weekEnd) = WeekCalculator.GetWeekRange(firstEntry.Date, job.FirstDayOfWeek);

                    var (totalHours, regularHours, overtimeHours, totalEarnings, overtimeBonus) =
                        OvertimeCalculator.CalculateWeeklySummary(weekEntries, job.HourlyRate);

                    return new WeeklyGroupResponse
                    {
                        WeekStart = weekStart.ToString("yyyy-MM-dd"),
                        WeekEnd = weekEnd.ToString("yyyy-MM-dd"),
                        TotalHours = totalHours,
                        RegularHours = regularHours,
                        OvertimeHours = overtimeHours,
                        TotalEarnings = totalEarnings,
                        OvertimeBonus = overtimeBonus,
                        Entries = weekEntries.Select(MapToEntryResponse).ToList()
                    };
                })
                .OrderByDescending(w => w.WeekStart)
                .ToList();

            var totalJobEarnings = entries.Sum(e => e.TotalEarnings);
            var totalJobHours = entries.Sum(e => e.TotalHours);

            return new JobDetailsResponse
            {
                Job = new JobResponse
                {
                    Id = job.Id,
                    Title = job.Title,
                    HourlyRate = job.HourlyRate,
                    FirstDayOfWeek = job.FirstDayOfWeek,
                    TotalEarnings = totalJobEarnings,
                    TotalHours = totalJobHours,
                    IsLocked = lockState.IsLocked,
                    LockedReason = lockState.LockedReason,
                    CreatedAt = job.CreatedAt
                },
                Weeks = weekGroups
            };
        }

        // ==================== PRIVATE HELPER METHODS ====================

        private async Task RecalculateWeekEntriesAsync(Job job, DateTime dateInWeek)
        {
            var (weekStart, weekEnd) = WeekCalculator.GetWeekRange(dateInWeek, job.FirstDayOfWeek);

            var weekEntries = await _context.DailyEntries
                .Where(e => e.JobId == job.Id && e.Date >= weekStart && e.Date <= weekEnd)
                .OrderBy(e => e.Date)
                .ToListAsync();

            if (weekEntries.Count == 0) return;

            // Recalculate earnings with overtime
            var recalculated = OvertimeCalculator.RecalculateWeekEntries(weekEntries, job.HourlyRate);

            await _context.SaveChangesAsync();
        }

        private static EntryResponse MapToEntryResponse(DailyEntry entry)
        {
            // Calculate overtime hours for this specific entry
            // Note: This is an approximation for display purposes
            var overtimeHours = 0m;
            var hasOvertime = false;

            // You could enhance this by storing overtime info in the entry or recalculating
            // For now, we'll leave it as 0 and calculate it properly in weekly grouping

            return new EntryResponse
            {
                Id = entry.Id,
                JobId = entry.JobId,
                Date = entry.Date,
                DayOfWeek = entry.Date.ToString("ddd").ToUpper(),
                DayOfMonth = entry.Date.Day,
                StartTime = entry.StartTime,
                EndTime = entry.EndTime,
                TotalHours = entry.TotalHours,
                HourlyRateSnapshot = entry.HourlyRateSnapshot,
                TotalEarnings = entry.TotalEarnings,
                Tip = entry.Tip,
                Note = entry.Note,
                OvertimeHours = overtimeHours,
                HasOvertime = hasOvertime,
                CreatedAt = entry.CreatedAt
            };
        }
    }
}
