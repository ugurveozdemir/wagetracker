using System.ComponentModel.DataAnnotations;

namespace WageTracker.API.Models.DTOs
{
    // ==================== AUTH DTOs ====================
    
    public class RegisterRequest
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Full name is required")]
        public string FullName { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public decimal? WeeklyGoalAmount { get; set; }
        public string BillingCustomerId { get; set; } = string.Empty;
        public SubscriptionSummaryDto Subscription { get; set; } = new();
        public FeatureAccessDto Access { get; set; } = new();
    }

    public class SubscriptionSummaryDto
    {
        public bool IsPremium { get; set; }
        public string Status { get; set; } = "free";
        public string? ProductId { get; set; }
        public string PlanTerm { get; set; } = "none";
        public string Store { get; set; } = "unknown";
        public DateTime? ExpiresAt { get; set; }
        public bool WillRenew { get; set; }
        public DateTime LastSyncedAt { get; set; }
    }

    public class FeatureAccessDto
    {
        public int MaxUnlockedJobs { get; set; }
        public int UnlockedJobCount { get; set; }
        public bool CanUseGoals { get; set; }
        public bool CanUseExpenses { get; set; }
        public bool HasLockedJobs { get; set; }
    }

    public class UpdateWeeklyGoalRequest
    {
        [Range(0, 1000000, ErrorMessage = "Weekly goal must be between $0 and $1,000,000")]
        public decimal? TargetAmount { get; set; }
    }

    // ==================== JOB DTOs ====================

    public class CreateJobRequest
    {
        [Required(ErrorMessage = "Job title is required")]
        [MinLength(1, ErrorMessage = "Job title cannot be empty")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Hourly rate is required")]
        [Range(0.01, 10000, ErrorMessage = "Hourly rate must be between $0.01 and $10,000")]
        public decimal HourlyRate { get; set; }

        public DayOfWeek FirstDayOfWeek { get; set; }
    }

    public class UpdateJobRequest
    {
        [Required(ErrorMessage = "Job title is required")]
        [MinLength(1, ErrorMessage = "Job title cannot be empty")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Hourly rate is required")]
        [Range(0.01, 10000, ErrorMessage = "Hourly rate must be between $0.01 and $10,000")]
        public decimal HourlyRate { get; set; }

        public DayOfWeek FirstDayOfWeek { get; set; }
    }

    public class JobResponse
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal HourlyRate { get; set; }
        public DayOfWeek FirstDayOfWeek { get; set; }
        public decimal TotalEarnings { get; set; }
        public decimal TotalHours { get; set; }
        public bool IsLocked { get; set; }
        public string? LockedReason { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ==================== DAILY ENTRY DTOs ====================

    public class CreateEntryRequest
    {
        [Required(ErrorMessage = "Job ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Invalid Job ID")]
        public int JobId { get; set; }

        [Required(ErrorMessage = "Date is required")]
        public DateTime Date { get; set; }

        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }

        [Range(0.01, 24, ErrorMessage = "Total hours must be between 0.01 and 24")]
        public decimal? TotalHours { get; set; }

        [Range(0, 100000, ErrorMessage = "Tip must be between $0 and $100,000")]
        public decimal Tip { get; set; }

        [MaxLength(500, ErrorMessage = "Note cannot exceed 500 characters")]
        public string? Note { get; set; }
    }

    public class UpdateEntryRequest
    {
        [Required(ErrorMessage = "Date is required")]
        public DateTime Date { get; set; }

        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }

        [Range(0.01, 24, ErrorMessage = "Total hours must be between 0.01 and 24")]
        public decimal? TotalHours { get; set; }

        [Range(0, 100000, ErrorMessage = "Tip must be between $0 and $100,000")]
        public decimal Tip { get; set; }

        [MaxLength(500, ErrorMessage = "Note cannot exceed 500 characters")]
        public string? Note { get; set; }
    }

    public class EntryResponse
    {
        public int Id { get; set; }
        public int JobId { get; set; }
        public DateTime Date { get; set; }
        public string DayOfWeek { get; set; } = string.Empty;
        public int DayOfMonth { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public decimal TotalHours { get; set; }
        public decimal HourlyRateSnapshot { get; set; }
        public decimal TotalEarnings { get; set; }
        public decimal Tip { get; set; }
        public string? Note { get; set; }
        public decimal OvertimeHours { get; set; }
        public bool HasOvertime { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ==================== WEEKLY GROUPING DTOs ====================

    public class WeeklyGroupResponse
    {
        public string WeekStart { get; set; } = string.Empty;
        public string WeekEnd { get; set; } = string.Empty;
        public decimal TotalHours { get; set; }
        public decimal RegularHours { get; set; }
        public decimal OvertimeHours { get; set; }
        public decimal TotalEarnings { get; set; }
        public decimal OvertimeBonus { get; set; }
        public List<EntryResponse> Entries { get; set; } = new();
    }

    public class JobDetailsResponse
    {
        public JobResponse Job { get; set; } = null!;
        public List<WeeklyGroupResponse> Weeks { get; set; } = new();
    }

    // ==================== EXPENSE DTOs ====================

    public class CreateExpenseRequest
    {
        [Required(ErrorMessage = "Amount is required")]
        [Range(0.01, 1000000, ErrorMessage = "Amount must be between $0.01 and $1,000,000")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "Category is required")]
        public int Category { get; set; }

        [Required(ErrorMessage = "Date is required")]
        public DateTime Date { get; set; }

        [MaxLength(250, ErrorMessage = "Description cannot exceed 250 characters")]
        public string? Description { get; set; }
    }

    public class UpdateExpenseRequest
    {
        [Required(ErrorMessage = "Amount is required")]
        [Range(0.01, 1000000, ErrorMessage = "Amount must be between $0.01 and $1,000,000")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "Category is required")]
        public int Category { get; set; }

        [Required(ErrorMessage = "Date is required")]
        public DateTime Date { get; set; }

        [MaxLength(250, ErrorMessage = "Description cannot exceed 250 characters")]
        public string? Description { get; set; }
    }

    public class ConfirmReceiptScanExpenseRequest
    {
        [Required(ErrorMessage = "Amount is required")]
        [Range(0.01, 1000000, ErrorMessage = "Amount must be between $0.01 and $1,000,000")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "Category is required")]
        public int Category { get; set; }

        [Required(ErrorMessage = "Date is required")]
        public DateTime Date { get; set; }

        [MaxLength(250, ErrorMessage = "Description cannot exceed 250 characters")]
        public string? Description { get; set; }
    }

    public class ReceiptScanDraftResponse
    {
        public decimal? Amount { get; set; }
        public DateTime? Date { get; set; }
        public int Category { get; set; } = 7;
        public string? Description { get; set; }
        public decimal Confidence { get; set; }
        public List<string> Warnings { get; set; } = new();
    }

    public class ExpenseResponse
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public int Category { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string? Description { get; set; }
        public string Source { get; set; } = "Manual";
        public string? ReceiptImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class WeeklyExpenseGroupResponse
    {
        public DateTime WeekStart { get; set; }
        public DateTime WeekEnd { get; set; }
        public decimal TotalAmount { get; set; }
        public List<ExpenseResponse> Expenses { get; set; } = new();
    }

    // ==================== DASHBOARD DTOs ====================

    public class DailyEarningsPointResponse
    {
        public DateTime Date { get; set; }
        public string DayLabel { get; set; } = string.Empty;
        public decimal TotalEarnings { get; set; }
    }

    public class DashboardSummaryResponse
    {
        // All-time totals (Overview ekranı için de kullanılır)
        public decimal TotalEarnings { get; set; }
        public decimal TotalHours { get; set; }
        public decimal TotalExpenses { get; set; }
        public int ActiveJobsCount { get; set; }
        public List<JobResponse> Jobs { get; set; } = new();

        // Weekly summary (Dashboard haftalık özet)
        public decimal WeeklyEarnings { get; set; }
        public decimal WeeklyExpenses { get; set; }
        public decimal WeeklyNet { get; set; }
        public decimal WeeklyHours { get; set; }
        public WeeklyGoalStatusResponse? WeeklyGoal { get; set; }
        public List<DailyEarningsPointResponse> DailyEarningsSinceMonday { get; set; } = new();

        // Son giderler (Dashboard'da gösterilecek)
        public List<ExpenseResponse> RecentExpenses { get; set; } = new();
    }

    public class WeeklyGoalStatusResponse
    {
        public decimal? TargetAmount { get; set; }
        public decimal CurrentAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public decimal ProgressPercent { get; set; }
        public bool IsReached { get; set; }
        public DateTime WeekStart { get; set; }
        public DateTime WeekEnd { get; set; }
    }
}
