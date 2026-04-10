using WageTracker.API.Models.DTOs;

namespace WageTracker.API.Services
{
    public interface IJobService
    {
        Task<JobResponse> CreateJobAsync(int userId, CreateJobRequest request);
        Task<JobResponse> UpdateJobAsync(int userId, int jobId, UpdateJobRequest request);
        Task DeleteJobAsync(int userId, int jobId);
        Task<JobResponse> GetJobByIdAsync(int userId, int jobId);
        Task<List<JobResponse>> GetUserJobsAsync(int userId);
    }

    public interface IDashboardService
    {
        Task<DashboardSummaryResponse> GetDashboardSummaryAsync(int userId);
    }

    public interface IProfileService
    {
        Task<UserDto> GetProfileAsync(int userId);
        Task<UserDto> UpdateWeeklyGoalAsync(int userId, UpdateWeeklyGoalRequest request);
    }
}
