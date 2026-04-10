using Microsoft.EntityFrameworkCore;
using WageTracker.API.Data;
using WageTracker.API.Models.DTOs;

namespace WageTracker.API.Services
{
    public class ProfileService : IProfileService
    {
        private readonly AppDbContext _context;
        private readonly ISubscriptionService _subscriptionService;

        public ProfileService(AppDbContext context, ISubscriptionService subscriptionService)
        {
            _context = context;
            _subscriptionService = subscriptionService;
        }

        public async Task<UserDto> GetProfileAsync(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            return await _subscriptionService.BuildUserDtoAsync(user);
        }

        public async Task<UserDto> UpdateWeeklyGoalAsync(int userId, UpdateWeeklyGoalRequest request)
        {
            await _subscriptionService.EnsureGoalsAccessAsync(userId);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            user.WeeklyGoalAmount = request.TargetAmount;
            await _context.SaveChangesAsync();

            return await _subscriptionService.BuildUserDtoAsync(user);
        }
    }
}
