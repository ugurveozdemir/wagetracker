using WageTracker.API.Models.DTOs;

namespace WageTracker.API.Services
{
    public interface IDailyEntryService
    {
        Task<EntryResponse> CreateEntryAsync(int userId, CreateEntryRequest request);
        Task<EntryResponse> UpdateEntryAsync(int userId, int entryId, UpdateEntryRequest request);
        Task DeleteEntryAsync(int userId, int entryId);
        Task<EntryResponse> GetEntryByIdAsync(int userId, int entryId);
        Task<List<EntryResponse>> GetUserEntriesAsync(int userId);
        Task<JobDetailsResponse> GetJobDetailsWithWeeklyGroupingAsync(int userId, int jobId);
    }
}
