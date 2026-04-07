using Microsoft.EntityFrameworkCore;
using WageTracker.API.Data;
using WageTracker.API.Models.DTOs;
using WageTracker.API.Models.Entities;

namespace WageTracker.API.Services
{
    public class JobService : IJobService
    {
        private readonly AppDbContext _context;

        public JobService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<JobResponse> CreateJobAsync(int userId, CreateJobRequest request)
        {
            var job = new Job
            {
                UserId = userId,
                Title = request.Title,
                HourlyRate = request.HourlyRate,
                FirstDayOfWeek = request.FirstDayOfWeek,
                CreatedAt = DateTime.UtcNow
            };

            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();

            return await MapToJobResponseAsync(job);
        }

        public async Task<JobResponse> UpdateJobAsync(int userId, int jobId, UpdateJobRequest request)
        {
            var job = await _context.Jobs
                .FirstOrDefaultAsync(j => j.Id == jobId && j.UserId == userId);

            if (job == null)
            {
                throw new UnauthorizedAccessException("Job not found or access denied");
            }

            job.Title = request.Title;
            job.HourlyRate = request.HourlyRate;
            job.FirstDayOfWeek = request.FirstDayOfWeek;

            await _context.SaveChangesAsync();

            return await MapToJobResponseAsync(job);
        }

        public async Task DeleteJobAsync(int userId, int jobId)
        {
            var job = await _context.Jobs
                .FirstOrDefaultAsync(j => j.Id == jobId && j.UserId == userId);

            if (job == null)
            {
                throw new UnauthorizedAccessException("Job not found or access denied");
            }

            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();
        }

        public async Task<JobResponse> GetJobByIdAsync(int userId, int jobId)
        {
            var job = await _context.Jobs
                .FirstOrDefaultAsync(j => j.Id == jobId && j.UserId == userId);

            if (job == null)
            {
                throw new UnauthorizedAccessException("Job not found or access denied");
            }

            return await MapToJobResponseAsync(job);
        }

        public async Task<List<JobResponse>> GetUserJobsAsync(int userId)
        {
            var jobs = await _context.Jobs
                .Where(j => j.UserId == userId)
                .OrderByDescending(j => j.CreatedAt)
                .ToListAsync();

            var responses = new List<JobResponse>();
            foreach (var job in jobs)
            {
                responses.Add(await MapToJobResponseAsync(job));
            }

            return responses;
        }

        private async Task<JobResponse> MapToJobResponseAsync(Job job)
        {
            var entries = await _context.DailyEntries
                .Where(e => e.JobId == job.Id)
                .ToListAsync();

            var totalEarnings = entries.Sum(e => e.TotalEarnings);
            var totalHours = entries.Sum(e => e.TotalHours);

            return new JobResponse
            {
                Id = job.Id,
                Title = job.Title,
                HourlyRate = job.HourlyRate,
                FirstDayOfWeek = job.FirstDayOfWeek,
                TotalEarnings = totalEarnings,
                TotalHours = totalHours,
                CreatedAt = job.CreatedAt
            };
        }
    }

    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardSummaryResponse> GetDashboardSummaryAsync(int userId)
        {
            // --- All-time data ---
            var jobs = await _context.Jobs
                .Where(j => j.UserId == userId)
                .ToListAsync();

            var allEntries = await _context.DailyEntries
                .Where(e => e.UserId == userId)
                .ToListAsync();

            var allExpenses = await _context.Expenses
                .Where(e => e.UserId == userId)
                .ToListAsync();

            var totalEarnings = allEntries.Sum(e => e.TotalEarnings);
            var totalHours = allEntries.Sum(e => e.TotalHours);
            var totalExpenses = allExpenses.Sum(e => e.Amount);

            // --- Weekly calculations (Monday-Sunday) ---
            var today = DateTime.UtcNow.Date;
            var daysSinceMonday = ((int)today.DayOfWeek + 6) % 7; // Monday=0, Sunday=6
            var weekStart = today.AddDays(-daysSinceMonday); // This Monday
            var weekEnd = weekStart.AddDays(7); // Next Monday (exclusive)

            var weeklyEntries = allEntries
                .Where(e => e.Date.Date >= weekStart && e.Date.Date < weekEnd)
                .ToList();

            var weeklyExpensesList = allExpenses
                .Where(e => e.Date.Date >= weekStart && e.Date.Date < weekEnd)
                .ToList();

            var weeklyEarnings = weeklyEntries.Sum(e => e.TotalEarnings);
            var weeklyHours = weeklyEntries.Sum(e => e.TotalHours);
            var weeklyExpensesTotal = weeklyExpensesList.Sum(e => e.Amount);
            var weeklyNet = weeklyEarnings - weeklyExpensesTotal;

            var dailyEarningsSinceMonday = Enumerable.Range(0, 7)
                .Select(offset =>
                {
                    var dayDate = weekStart.AddDays(offset);
                    var dayTotal = weeklyEntries
                        .Where(e => e.Date.Date == dayDate)
                        .Sum(e => e.TotalEarnings);

                    return new DailyEarningsPointResponse
                    {
                        Date = dayDate,
                        DayLabel = dayDate.ToString("ddd"),
                        TotalEarnings = dayTotal
                    };
                })
                .ToList();

            // --- Recent expenses (son 5 gider) ---
            var recentExpenses = allExpenses
                .OrderByDescending(e => e.Date)
                .ThenByDescending(e => e.CreatedAt)
                .Take(5)
                .Select(e => new ExpenseResponse
                {
                    Id = e.Id,
                    Amount = e.Amount,
                    Category = (int)e.Category,
                    CategoryName = ExpenseService.GetCategoryName((int)e.Category),
                    Date = e.Date,
                    Description = e.Description,
                    Source = e.Source.ToString(),
                    ReceiptImageUrl = e.ReceiptImageUrl,
                    CreatedAt = e.CreatedAt
                })
                .ToList();

            // --- Job responses ---
            var jobResponses = new List<JobResponse>();
            foreach (var job in jobs)
            {
                var jobEntries = allEntries.Where(e => e.JobId == job.Id).ToList();
                jobResponses.Add(new JobResponse
                {
                    Id = job.Id,
                    Title = job.Title,
                    HourlyRate = job.HourlyRate,
                    FirstDayOfWeek = job.FirstDayOfWeek,
                    TotalEarnings = jobEntries.Sum(e => e.TotalEarnings),
                    TotalHours = jobEntries.Sum(e => e.TotalHours),
                    CreatedAt = job.CreatedAt
                });
            }

            return new DashboardSummaryResponse
            {
                // All-time
                TotalEarnings = totalEarnings,
                TotalHours = totalHours,
                TotalExpenses = totalExpenses,
                ActiveJobsCount = jobs.Count,
                Jobs = jobResponses.OrderByDescending(j => j.CreatedAt).ToList(),

                // Weekly
                WeeklyEarnings = weeklyEarnings,
                WeeklyExpenses = weeklyExpensesTotal,
                WeeklyNet = weeklyNet,
                WeeklyHours = weeklyHours,
                DailyEarningsSinceMonday = dailyEarningsSinceMonday,

                // Recent
                RecentExpenses = recentExpenses
            };
        }
    }
}

