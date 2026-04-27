using Microsoft.EntityFrameworkCore;
using System.Globalization;
using WageTracker.API.Data;
using WageTracker.API.Models.DTOs;
using WageTracker.API.Utilities;
using WageTracker.API.Models.Entities;

namespace WageTracker.API.Services
{
    public class JobService : IJobService
    {
        private readonly AppDbContext _context;
        private readonly ISubscriptionService _subscriptionService;

        public JobService(AppDbContext context, ISubscriptionService subscriptionService)
        {
            _context = context;
            _subscriptionService = subscriptionService;
        }

        public async Task<JobResponse> CreateJobAsync(int userId, CreateJobRequest request)
        {
            await _subscriptionService.EnsureCanCreateJobAsync(userId);

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

            await _subscriptionService.EnsureJobUnlockedAsync(userId, jobId);

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

            var lockState = await _subscriptionService.GetJobLockStateAsync(userId, job.Id);
            return await MapToJobResponseAsync(job, lockState);
        }

        public async Task<List<JobResponse>> GetUserJobsAsync(int userId)
        {
            var jobs = await _context.Jobs
                .Where(j => j.UserId == userId)
                .OrderBy(j => j.CreatedAt)
                .ThenBy(j => j.Id)
                .ToListAsync();

            var lockStates = await _subscriptionService.GetJobLockStatesAsync(userId);
            var responses = new List<JobResponse>();
            foreach (var job in jobs)
            {
                var lockState = lockStates.TryGetValue(job.Id, out var state)
                    ? state
                    : new JobLockState(false, null);
                responses.Add(await MapToJobResponseAsync(job, lockState));
            }

            return responses;
        }

        private async Task<JobResponse> MapToJobResponseAsync(Job job, JobLockState? lockState = null)
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
                IsLocked = lockState?.IsLocked ?? false,
                LockedReason = lockState?.LockedReason,
                CreatedAt = job.CreatedAt
            };
        }
    }

    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;
        private readonly ISubscriptionService _subscriptionService;

        public DashboardService(AppDbContext context, ISubscriptionService subscriptionService)
        {
            _context = context;
            _subscriptionService = subscriptionService;
        }

        public async Task<DashboardSummaryResponse> GetDashboardSummaryAsync(int userId)
        {
            // --- All-time data ---
            var jobs = await _context.Jobs
                .Where(j => j.UserId == userId)
                .ToListAsync();

            var user = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => new
                {
                    u.WeeklyGoalAmount,
                    u.WeeklyGoalMotivationQuote
                })
                .FirstAsync();

            var allEntries = await _context.DailyEntries
                .Where(e => e.UserId == userId)
                .ToListAsync();

            var allExpenses = await _context.Expenses
                .Where(e => e.UserId == userId)
                .Include(e => e.Items)
                .ToListAsync();

            var access = await _subscriptionService.GetFeatureAccessSnapshotAsync(userId);
            var lockStates = await _subscriptionService.GetJobLockStatesAsync(userId);

            var totalEarnings = allEntries.Sum(e => e.TotalEarnings);
            var totalHours = allEntries.Sum(e => e.TotalHours);
            var totalExpenses = access.CanUseExpenses ? allExpenses.Sum(e => e.Amount) : 0;

            // --- Weekly calculations (Monday-Sunday) ---
            var today = DateTime.UtcNow.Date;
            var (weekStart, weekEndInclusive) = WeekCalculator.GetWeekRange(today, DayOfWeek.Monday);
            var weekEndExclusive = weekEndInclusive.AddDays(1);

            var weeklyEntries = allEntries
                .Where(e => e.Date.Date >= weekStart && e.Date.Date < weekEndExclusive)
                .ToList();

            var weeklyExpensesList = allExpenses
                .Where(e => e.Date.Date >= weekStart && e.Date.Date < weekEndExclusive)
                .ToList();

            var weeklyEarnings = weeklyEntries.Sum(e => e.TotalEarnings);
            var weeklyHours = weeklyEntries.Sum(e => e.TotalHours);
            var weeklyExpensesTotal = access.CanUseExpenses ? weeklyExpensesList.Sum(e => e.Amount) : 0;
            var weeklyNet = weeklyEarnings - weeklyExpensesTotal;
            var weeklyGoalTarget = access.CanUseGoals ? user.WeeklyGoalAmount : null;
            var weeklyGoalRemaining = weeklyGoalTarget.HasValue
                ? Math.Max(0, weeklyGoalTarget.Value - weeklyEarnings)
                : 0;
            var weeklyGoalProgress = weeklyGoalTarget.HasValue && weeklyGoalTarget.Value > 0
                ? Math.Min(100, Math.Round((weeklyEarnings / weeklyGoalTarget.Value) * 100, 2))
                : 0;

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
            var recentExpenses = access.CanUseExpenses
                ? allExpenses
                    .OrderByDescending(e => e.Date)
                    .ThenByDescending(e => e.CreatedAt)
                    .Take(5)
                    .Select(ExpenseService.MapToResponse)
                    .ToList()
                : new List<ExpenseResponse>();

            // --- Job responses ---
            var jobResponses = new List<JobResponse>();
            foreach (var job in jobs)
            {
                var jobEntries = allEntries.Where(e => e.JobId == job.Id).ToList();
                var lockState = lockStates.TryGetValue(job.Id, out var state)
                    ? state
                    : new JobLockState(false, null);
                jobResponses.Add(new JobResponse
                {
                    Id = job.Id,
                    Title = job.Title,
                    HourlyRate = job.HourlyRate,
                    FirstDayOfWeek = job.FirstDayOfWeek,
                    TotalEarnings = jobEntries.Sum(e => e.TotalEarnings),
                    TotalHours = jobEntries.Sum(e => e.TotalHours),
                    IsLocked = lockState.IsLocked,
                    LockedReason = lockState.LockedReason,
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
                Jobs = jobResponses
                    .OrderBy(j => j.CreatedAt)
                    .ThenBy(j => j.Id)
                    .ToList(),

                // Weekly
                WeeklyEarnings = weeklyEarnings,
                WeeklyExpenses = weeklyExpensesTotal,
                WeeklyNet = weeklyNet,
                WeeklyHours = weeklyHours,
                WeeklyGoal = access.CanUseGoals
                    ? new WeeklyGoalStatusResponse
                    {
                        TargetAmount = weeklyGoalTarget,
                        MotivationQuote = user.WeeklyGoalMotivationQuote,
                        CurrentAmount = weeklyEarnings,
                        RemainingAmount = weeklyGoalRemaining,
                        ProgressPercent = weeklyGoalProgress,
                        IsReached = weeklyGoalTarget.HasValue && weeklyGoalTarget.Value > 0 && weeklyEarnings >= weeklyGoalTarget.Value,
                        WeekStart = weekStart,
                        WeekEnd = weekEndInclusive
                    }
                    : null,
                DailyEarningsSinceMonday = dailyEarningsSinceMonday,

                // Recent
                RecentExpenses = recentExpenses
            };
        }

        public async Task<GeneralSummaryResponse> GetGeneralSummaryAsync(int userId)
        {
            await _subscriptionService.EnsureExpensesAccessAsync(userId);

            var jobs = await _context.Jobs
                .AsNoTracking()
                .Where(j => j.UserId == userId)
                .OrderBy(j => j.CreatedAt)
                .ThenBy(j => j.Id)
                .ToListAsync();

            var entries = await _context.DailyEntries
                .AsNoTracking()
                .Where(e => e.UserId == userId)
                .ToListAsync();

            var expenses = await _context.Expenses
                .AsNoTracking()
                .Where(e => e.UserId == userId)
                .ToListAsync();

            return BuildGeneralSummaryResponse(jobs, entries, expenses);
        }

        public static GeneralSummaryResponse BuildGeneralSummaryResponse(
            IEnumerable<Job> jobs,
            IEnumerable<DailyEntry> entries,
            IEnumerable<Expense> expenses)
        {
            var jobList = jobs.OrderBy(j => j.CreatedAt).ThenBy(j => j.Id).ToList();
            var entryList = entries.ToList();
            var expenseList = expenses.ToList();
            var jobTitleById = jobList.ToDictionary(j => j.Id, j => j.Title);

            var totalEarnings = entryList.Sum(e => e.TotalEarnings);
            var totalExpenses = expenseList.Sum(e => e.Amount);
            var totalHours = entryList.Sum(e => e.TotalHours);

            return new GeneralSummaryResponse
            {
                TotalEarnings = totalEarnings,
                TotalExpenses = totalExpenses,
                NetEarnings = totalEarnings - totalExpenses,
                TotalHours = totalHours,
                AverageWeeklyHours = CalculateAverageWeeklyHours(entryList),
                LargestPurchase = BuildLargestPurchase(expenseList),
                Jobs = BuildJobSummaries(jobList, entryList),
                Months = BuildMonthlySummaries(entryList, expenseList),
                MonthlyJobs = BuildMonthlyJobSummaries(entryList, jobTitleById),
                AverageWeeklyHoursByJob = BuildAverageWeeklyHoursByJob(jobList, entryList)
            };
        }

        private static decimal CalculateAverageWeeklyHours(IEnumerable<DailyEntry> entries)
        {
            var weekTotals = entries
                .GroupBy(e => WeekCalculator.GetWeekRange(e.Date.Date, DayOfWeek.Monday).weekStart)
                .Select(g => g.Sum(e => e.TotalHours))
                .ToList();

            return weekTotals.Count == 0 ? 0 : Math.Round(weekTotals.Average(), 2);
        }

        private static GeneralSummaryPurchaseResponse? BuildLargestPurchase(IEnumerable<Expense> expenses)
        {
            var expense = expenses
                .OrderByDescending(e => e.Amount)
                .ThenByDescending(e => e.Date)
                .ThenByDescending(e => e.CreatedAt)
                .FirstOrDefault();

            if (expense == null)
            {
                return null;
            }

            return new GeneralSummaryPurchaseResponse
            {
                ExpenseId = expense.Id,
                Amount = expense.Amount,
                Date = expense.Date,
                Title = !string.IsNullOrWhiteSpace(expense.MerchantName)
                    ? expense.MerchantName
                    : !string.IsNullOrWhiteSpace(expense.Description)
                        ? expense.Description
                        : ExpenseService.GetCategoryName((int)expense.Category),
                CategoryName = ExpenseService.GetCategoryName((int)expense.Category)
            };
        }

        private static List<GeneralSummaryJobResponse> BuildJobSummaries(
            IEnumerable<Job> jobs,
            IEnumerable<DailyEntry> entries)
        {
            var entriesByJob = entries
                .GroupBy(e => e.JobId)
                .ToDictionary(g => g.Key, g => g.ToList());

            return jobs.Select(job =>
            {
                entriesByJob.TryGetValue(job.Id, out var jobEntries);
                jobEntries ??= new List<DailyEntry>();

                return new GeneralSummaryJobResponse
                {
                    JobId = job.Id,
                    JobTitle = job.Title,
                    TotalEarnings = jobEntries.Sum(e => e.TotalEarnings),
                    TotalHours = jobEntries.Sum(e => e.TotalHours)
                };
            }).ToList();
        }

        private static List<GeneralSummaryMonthResponse> BuildMonthlySummaries(
            IEnumerable<DailyEntry> entries,
            IEnumerable<Expense> expenses)
        {
            var earningsByMonth = entries
                .GroupBy(e => new { e.Date.Year, e.Date.Month })
                .ToDictionary(g => (g.Key.Year, g.Key.Month), g => g.Sum(e => e.TotalEarnings));

            var expensesByMonth = expenses
                .GroupBy(e => new { e.Date.Year, e.Date.Month })
                .ToDictionary(g => (g.Key.Year, g.Key.Month), g => g.Sum(e => e.Amount));

            return earningsByMonth.Keys
                .Concat(expensesByMonth.Keys)
                .Distinct()
                .OrderByDescending(k => k.Year)
                .ThenByDescending(k => k.Month)
                .Select(key =>
                {
                    var earnings = earningsByMonth.GetValueOrDefault(key);
                    var expenseTotal = expensesByMonth.GetValueOrDefault(key);
                    return new GeneralSummaryMonthResponse
                    {
                        Year = key.Year,
                        Month = key.Month,
                        MonthLabel = FormatMonthLabel(key.Year, key.Month),
                        Earnings = earnings,
                        Expenses = expenseTotal,
                        NetEarnings = earnings - expenseTotal
                    };
                })
                .ToList();
        }

        private static List<GeneralSummaryMonthlyJobResponse> BuildMonthlyJobSummaries(
            IEnumerable<DailyEntry> entries,
            IReadOnlyDictionary<int, string> jobTitleById)
        {
            return entries
                .GroupBy(e => new { e.JobId, e.Date.Year, e.Date.Month })
                .OrderByDescending(g => g.Key.Year)
                .ThenByDescending(g => g.Key.Month)
                .ThenBy(g => jobTitleById.GetValueOrDefault(g.Key.JobId) ?? "Job")
                .Select(g => new GeneralSummaryMonthlyJobResponse
                {
                    JobId = g.Key.JobId,
                    JobTitle = jobTitleById.GetValueOrDefault(g.Key.JobId) ?? "Job",
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    MonthLabel = FormatMonthLabel(g.Key.Year, g.Key.Month),
                    Earnings = g.Sum(e => e.TotalEarnings)
                })
                .ToList();
        }

        private static List<GeneralSummaryJobHoursResponse> BuildAverageWeeklyHoursByJob(
            IEnumerable<Job> jobs,
            IEnumerable<DailyEntry> entries)
        {
            var entriesByJob = entries
                .GroupBy(e => e.JobId)
                .ToDictionary(g => g.Key, g => g.ToList());

            return jobs.Select(job =>
            {
                entriesByJob.TryGetValue(job.Id, out var jobEntries);
                jobEntries ??= new List<DailyEntry>();

                return new GeneralSummaryJobHoursResponse
                {
                    JobId = job.Id,
                    JobTitle = job.Title,
                    AverageWeeklyHours = CalculateAverageWeeklyHours(jobEntries)
                };
            }).ToList();
        }

        private static string FormatMonthLabel(int year, int month)
        {
            return new DateTime(year, month, 1).ToString("MMM yyyy", CultureInfo.InvariantCulture);
        }
    }
}
