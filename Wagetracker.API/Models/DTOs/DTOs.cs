namespace WageTracker.API.Models.DTOs
{
    // ==================== AUTH DTOs ====================
    
    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
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
    }

    // ==================== JOB DTOs ====================

    public class CreateJobRequest
    {
        public string Title { get; set; } = string.Empty;
        public decimal HourlyRate { get; set; }
        public DayOfWeek FirstDayOfWeek { get; set; }
    }

    public class UpdateJobRequest
    {
        public string Title { get; set; } = string.Empty;
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
        public DateTime CreatedAt { get; set; }
    }

    // ==================== DAILY ENTRY DTOs ====================

    public class CreateEntryRequest
    {
        public int JobId { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public decimal? TotalHours { get; set; }
        public decimal Tip { get; set; }
        public string? Note { get; set; }
    }

    public class UpdateEntryRequest
    {
        public DateTime Date { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public decimal? TotalHours { get; set; }
        public decimal Tip { get; set; }
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

    // ==================== DASHBOARD DTOs ====================

    public class DashboardSummaryResponse
    {
        public decimal TotalEarnings { get; set; }
        public decimal TotalHours { get; set; }
        public int ActiveJobsCount { get; set; }
        public List<JobResponse> Jobs { get; set; } = new();
    }
}
