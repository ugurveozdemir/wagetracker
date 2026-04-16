using Microsoft.EntityFrameworkCore;
using WageTracker.API.Data;
using WageTracker.API.Models.DTOs;
using WageTracker.API.Models.Entities;

namespace WageTracker.API.Services
{
    public interface ISurveyService
    {
        Task<UserDto> SubmitRegistrationSurveyAsync(int userId, SubmitRegistrationSurveyRequest request, CancellationToken cancellationToken = default);
        Task<UserDto> ResetRegistrationSurveyAsync(int userId, CancellationToken cancellationToken = default);
    }

    public class SurveyService : ISurveyService
    {
        private static readonly HashSet<string> PrimaryGoals =
        [
            "travel_savings",
            "new_experiences",
            "education_costs",
            "save_money"
        ];

        private static readonly HashSet<string> PlannedJobCounts =
        [
            "one_job",
            "two_jobs",
            "three_or_more",
            "undecided"
        ];

        private static readonly HashSet<string> SpendingHabits =
        [
            "frugal",
            "balanced",
            "experience_focused",
            "no_tracking"
        ];

        private readonly AppDbContext _context;
        private readonly ISubscriptionService _subscriptionService;

        public SurveyService(AppDbContext context, ISubscriptionService subscriptionService)
        {
            _context = context;
            _subscriptionService = subscriptionService;
        }

        public async Task<UserDto> SubmitRegistrationSurveyAsync(int userId, SubmitRegistrationSurveyRequest request, CancellationToken cancellationToken = default)
        {
            ValidateAnswer("Primary goal", request.PrimaryGoal, PrimaryGoals);
            ValidateAnswer("Planned job count", request.PlannedJobCount, PlannedJobCounts);
            ValidateAnswer("Spending habit", request.SpendingHabit, SpendingHabits);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            var now = DateTime.UtcNow;
            var existing = await _context.UserRegistrationSurveys
                .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

            if (existing == null)
            {
                _context.UserRegistrationSurveys.Add(new UserRegistrationSurvey
                {
                    UserId = userId,
                    PrimaryGoal = request.PrimaryGoal,
                    PlannedJobCount = request.PlannedJobCount,
                    SpendingHabit = request.SpendingHabit,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
            else
            {
                existing.PrimaryGoal = request.PrimaryGoal;
                existing.PlannedJobCount = request.PlannedJobCount;
                existing.SpendingHabit = request.SpendingHabit;
                existing.UpdatedAt = now;
            }

            await _context.SaveChangesAsync(cancellationToken);
            return await _subscriptionService.BuildUserDtoAsync(user, cancellationToken);
        }

        public async Task<UserDto> ResetRegistrationSurveyAsync(int userId, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            var existing = await _context.UserRegistrationSurveys
                .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

            if (existing != null)
            {
                _context.UserRegistrationSurveys.Remove(existing);
                await _context.SaveChangesAsync(cancellationToken);
            }

            return await _subscriptionService.BuildUserDtoAsync(user, cancellationToken);
        }

        private static void ValidateAnswer(string fieldName, string value, HashSet<string> allowedValues)
        {
            if (!allowedValues.Contains(value))
            {
                throw new ArgumentException($"{fieldName} is invalid.");
            }
        }
    }
}
