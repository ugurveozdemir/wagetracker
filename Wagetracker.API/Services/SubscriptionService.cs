using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WageTracker.API.Data;
using WageTracker.API.Models.DTOs;
using WageTracker.API.Models.Entities;

namespace WageTracker.API.Services
{
    public record JobLockState(bool IsLocked, string? LockedReason);

    public class FeatureAccessSnapshot
    {
        public bool IsPremium { get; init; }
        public int MaxUnlockedJobs { get; init; }
        public int UnlockedJobCount { get; init; }
        public bool CanUseGoals { get; init; }
        public bool CanUseExpenses { get; init; }
        public bool HasLockedJobs { get; init; }
        public HashSet<int> UnlockedJobIds { get; init; } = new();
    }

    public interface ISubscriptionService
    {
        Task<UserDto> BuildUserDtoAsync(User user, CancellationToken cancellationToken = default);
        Task<UserDto> GetUserProfileAsync(int userId, CancellationToken cancellationToken = default);
        Task<UserDto> RefreshUserSubscriptionAsync(int userId, CancellationToken cancellationToken = default);
        Task HandleRevenueCatWebhookAsync(string payload, string? authorizationHeader, string? xAuthorizationHeader, CancellationToken cancellationToken = default);
        Task<FeatureAccessSnapshot> GetFeatureAccessSnapshotAsync(int userId, CancellationToken cancellationToken = default);
        Task<Dictionary<int, JobLockState>> GetJobLockStatesAsync(int userId, CancellationToken cancellationToken = default);
        Task<JobLockState> GetJobLockStateAsync(int userId, int jobId, CancellationToken cancellationToken = default);
        Task EnsureGoalsAccessAsync(int userId, CancellationToken cancellationToken = default);
        Task EnsureExpensesAccessAsync(int userId, CancellationToken cancellationToken = default);
        Task EnsureCanCreateJobAsync(int userId, CancellationToken cancellationToken = default);
        Task EnsureJobUnlockedAsync(int userId, int jobId, CancellationToken cancellationToken = default);
    }

    public class SubscriptionService : ISubscriptionService
    {
        private const int FreeJobLimit = 2;
        private readonly AppDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public SubscriptionService(AppDbContext context, HttpClient httpClient, IConfiguration configuration)
        {
            _context = context;
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<UserDto> BuildUserDtoAsync(User user, CancellationToken cancellationToken = default)
        {
            await EnsureBillingCustomerIdAsync(user, cancellationToken);

            var access = await GetFeatureAccessSnapshotAsync(user.Id, cancellationToken);
            var subscription = await _context.UserSubscriptions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == user.Id, cancellationToken);
            var hasCompletedRegistrationSurvey = await _context.UserRegistrationSurveys
                .AsNoTracking()
                .AnyAsync(s => s.UserId == user.Id, cancellationToken);

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                WeeklyGoalAmount = user.WeeklyGoalAmount,
                WeeklyGoalMotivationQuote = user.WeeklyGoalMotivationQuote,
                BillingCustomerId = user.BillingCustomerId ?? string.Empty,
                Subscription = MapSubscription(subscription),
                Access = MapAccess(access),
                HasCompletedRegistrationSurvey = hasCompletedRegistrationSurvey
            };
        }

        public async Task<UserDto> GetUserProfileAsync(int userId, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            return await BuildUserDtoAsync(user, cancellationToken);
        }

        public async Task<UserDto> RefreshUserSubscriptionAsync(int userId, CancellationToken cancellationToken = default)
        {
            EnsureRevenueCatConfigured();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            await EnsureBillingCustomerIdAsync(user, cancellationToken);
            await SyncSubscriptionSnapshotAsync(user.Id, user.BillingCustomerId!, cancellationToken);
            return await BuildUserDtoAsync(user, cancellationToken);
        }

        public async Task HandleRevenueCatWebhookAsync(string payload, string? authorizationHeader, string? xAuthorizationHeader, CancellationToken cancellationToken = default)
        {
            EnsureRevenueCatConfigured();
            ValidateWebhookSecret(authorizationHeader, xAuthorizationHeader);

            using var document = JsonDocument.Parse(payload);
            var root = document.RootElement;
            var eventNode = root.TryGetProperty("event", out var innerEvent) ? innerEvent : root;
            var eventId = ReadString(eventNode, "id") ?? ReadString(root, "id");
            var eventType = ReadString(eventNode, "type") ?? ReadString(root, "type") ?? "unknown";
            var appUserId = ReadString(eventNode, "app_user_id") ?? ReadString(root, "app_user_id");

            RevenueCatWebhookEvent? savedEvent = null;
            if (!string.IsNullOrWhiteSpace(eventId))
            {
                var existing = await _context.RevenueCatWebhookEvents
                    .AsNoTracking()
                    .AnyAsync(e => e.EventId == eventId, cancellationToken);

                if (existing)
                {
                    return;
                }

                savedEvent = new RevenueCatWebhookEvent
                {
                    EventId = eventId,
                    EventType = eventType,
                    AppUserId = appUserId,
                    Payload = payload,
                    ReceivedAt = DateTime.UtcNow
                };

                _context.RevenueCatWebhookEvents.Add(savedEvent);
                await _context.SaveChangesAsync(cancellationToken);
            }

            if (!string.IsNullOrWhiteSpace(appUserId))
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.BillingCustomerId == appUserId, cancellationToken);
                if (user != null)
                {
                    await SyncSubscriptionSnapshotAsync(user.Id, appUserId, cancellationToken);
                }
            }

            if (savedEvent != null)
            {
                savedEvent.ProcessedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        public async Task<FeatureAccessSnapshot> GetFeatureAccessSnapshotAsync(int userId, CancellationToken cancellationToken = default)
        {
            var jobs = await _context.Jobs
                .AsNoTracking()
                .Where(j => j.UserId == userId)
                .OrderBy(j => j.CreatedAt)
                .ThenBy(j => j.Id)
                .Select(j => j.Id)
                .ToListAsync(cancellationToken);

            var subscription = await _context.UserSubscriptions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

            var isPremium = IsSubscriptionPremium(subscription);
            var unlockedIds = isPremium
                ? jobs.ToHashSet()
                : jobs.Take(FreeJobLimit).ToHashSet();

            return new FeatureAccessSnapshot
            {
                IsPremium = isPremium,
                MaxUnlockedJobs = isPremium ? int.MaxValue : FreeJobLimit,
                UnlockedJobCount = unlockedIds.Count,
                CanUseGoals = isPremium,
                CanUseExpenses = isPremium,
                HasLockedJobs = !isPremium && jobs.Count > FreeJobLimit,
                UnlockedJobIds = unlockedIds
            };
        }

        public async Task<Dictionary<int, JobLockState>> GetJobLockStatesAsync(int userId, CancellationToken cancellationToken = default)
        {
            var jobs = await _context.Jobs
                .AsNoTracking()
                .Where(j => j.UserId == userId)
                .OrderBy(j => j.CreatedAt)
                .ThenBy(j => j.Id)
                .Select(j => j.Id)
                .ToListAsync(cancellationToken);

            var access = await GetFeatureAccessSnapshotAsync(userId, cancellationToken);
            return jobs.ToDictionary(
                id => id,
                id => access.UnlockedJobIds.Contains(id)
                    ? new JobLockState(false, null)
                    : new JobLockState(true, "Upgrade to unlock this job again.")
            );
        }

        public async Task<JobLockState> GetJobLockStateAsync(int userId, int jobId, CancellationToken cancellationToken = default)
        {
            var map = await GetJobLockStatesAsync(userId, cancellationToken);
            return map.TryGetValue(jobId, out var lockState)
                ? lockState
                : new JobLockState(false, null);
        }

        public async Task EnsureGoalsAccessAsync(int userId, CancellationToken cancellationToken = default)
        {
            var access = await GetFeatureAccessSnapshotAsync(userId, cancellationToken);
            if (!access.CanUseGoals)
            {
                throw new SubscriptionAccessException("SUBSCRIPTION_REQUIRED", "Subscription required to use weekly goals.");
            }
        }

        public async Task EnsureExpensesAccessAsync(int userId, CancellationToken cancellationToken = default)
        {
            var access = await GetFeatureAccessSnapshotAsync(userId, cancellationToken);
            if (!access.CanUseExpenses)
            {
                throw new SubscriptionAccessException("SUBSCRIPTION_REQUIRED", "Subscription required to use expenses.");
            }
        }

        public async Task EnsureCanCreateJobAsync(int userId, CancellationToken cancellationToken = default)
        {
            var access = await GetFeatureAccessSnapshotAsync(userId, cancellationToken);
            if (access.IsPremium)
            {
                return;
            }

            var currentJobCount = await _context.Jobs.CountAsync(j => j.UserId == userId, cancellationToken);
            if (currentJobCount >= FreeJobLimit)
            {
                throw new SubscriptionAccessException("FREE_JOB_LIMIT_REACHED", "Free accounts can only keep 2 unlocked jobs.");
            }
        }

        public async Task EnsureJobUnlockedAsync(int userId, int jobId, CancellationToken cancellationToken = default)
        {
            var lockState = await GetJobLockStateAsync(userId, jobId, cancellationToken);
            if (lockState.IsLocked)
            {
                throw new SubscriptionAccessException("JOB_LOCKED_BY_SUBSCRIPTION", lockState.LockedReason ?? "This job is locked by the free tier limit.");
            }
        }

        private async Task EnsureBillingCustomerIdAsync(User user, CancellationToken cancellationToken)
        {
            if (!string.IsNullOrWhiteSpace(user.BillingCustomerId))
            {
                return;
            }

            string candidate;
            do
            {
                candidate = $"wt_{Guid.NewGuid():N}";
            }
            while (await _context.Users.AnyAsync(u => u.BillingCustomerId == candidate, cancellationToken));

            user.BillingCustomerId = candidate;
            await _context.SaveChangesAsync(cancellationToken);
        }

        private async Task SyncSubscriptionSnapshotAsync(int userId, string billingCustomerId, CancellationToken cancellationToken)
        {
            var responseJson = await FetchSubscriberAsync(billingCustomerId, cancellationToken);
            using var document = JsonDocument.Parse(responseJson);
            await UpsertSubscriptionSnapshotAsync(userId, document.RootElement, cancellationToken);
        }

        private async Task<string> FetchSubscriberAsync(string billingCustomerId, CancellationToken cancellationToken)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.revenuecat.com/v1/subscribers/{Uri.EscapeDataString(billingCustomerId)}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GetRevenueCatApiKey());

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync(cancellationToken);
        }

        private async Task UpsertSubscriptionSnapshotAsync(int userId, JsonElement root, CancellationToken cancellationToken)
        {
            var subscriber = root.TryGetProperty("subscriber", out var subscriberNode) ? subscriberNode : root;
            var entitlementId = GetEntitlementId();
            var now = DateTime.UtcNow;
            var entitlement = TryGetObjectProperty(subscriber, "entitlements", entitlementId);
            var latestSubscription = GetLatestSubscription(subscriber);

            var snapshot = await _context.UserSubscriptions
                .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

            if (snapshot == null)
            {
                snapshot = new UserSubscription
                {
                    UserId = userId,
                    EntitlementId = entitlementId
                };
                _context.UserSubscriptions.Add(snapshot);
            }

            snapshot.EntitlementId = entitlementId;
            snapshot.ProductId = ReadString(entitlement, "product_identifier") ?? latestSubscription.ProductId;
            snapshot.ExpiresAt = ParseDateTime(ReadString(entitlement, "expires_date")) ?? latestSubscription.ExpiresAt;
            snapshot.Store = ParseStore(ReadString(latestSubscription.SubscriptionNode, "store"));
            snapshot.PlanTerm = ParsePlanTerm(snapshot.ProductId);
            snapshot.LastSyncedAt = now;

            var isPremium = snapshot.ExpiresAt == null || snapshot.ExpiresAt > now;
            snapshot.IsPremium = entitlement.HasValue && isPremium;
            snapshot.WillRenew = snapshot.IsPremium && ReadString(latestSubscription.SubscriptionNode, "unsubscribe_detected_at") == null;
            snapshot.Status = DetermineStatus(entitlement, latestSubscription.SubscriptionNode, snapshot.IsPremium, snapshot.ExpiresAt);

            await _context.SaveChangesAsync(cancellationToken);
        }

        private SubscriptionStatus DetermineStatus(JsonElement? entitlement, JsonElement? subscription, bool isPremium, DateTime? expiresAt)
        {
            if (!entitlement.HasValue || !isPremium)
            {
                return expiresAt.HasValue ? SubscriptionStatus.Expired : SubscriptionStatus.Free;
            }

            var entitlementNode = entitlement.Value;
            if (ParseDateTime(ReadString(entitlementNode, "grace_period_expires_date")) is DateTime gracePeriodExpiresAt
                && gracePeriodExpiresAt > DateTime.UtcNow)
            {
                return SubscriptionStatus.GracePeriod;
            }

            if (subscription.HasValue && ReadString(subscription.Value, "billing_issues_detected_at") != null)
            {
                return SubscriptionStatus.BillingIssue;
            }

            if (subscription.HasValue && ReadString(subscription.Value, "unsubscribe_detected_at") != null)
            {
                return SubscriptionStatus.Cancelled;
            }

            return SubscriptionStatus.Active;
        }

        private bool IsSubscriptionPremium(UserSubscription? subscription)
        {
            if (subscription == null || !subscription.IsPremium)
            {
                return false;
            }

            return !subscription.ExpiresAt.HasValue || subscription.ExpiresAt > DateTime.UtcNow;
        }

        private SubscriptionSummaryDto MapSubscription(UserSubscription? subscription)
        {
            if (subscription == null)
            {
                return new SubscriptionSummaryDto
                {
                    IsPremium = false,
                    Status = "free",
                    PlanTerm = "none",
                    Store = "unknown",
                    LastSyncedAt = DateTime.UtcNow
                };
            }

            return new SubscriptionSummaryDto
            {
                IsPremium = IsSubscriptionPremium(subscription),
                Status = subscription.Status.ToString().ToLowerInvariant(),
                ProductId = subscription.ProductId,
                PlanTerm = subscription.PlanTerm switch
                {
                    SubscriptionPlanTerm.Monthly => "monthly",
                    SubscriptionPlanTerm.SixMonth => "six_month",
                    SubscriptionPlanTerm.Annual => "annual",
                    _ => "none"
                },
                Store = subscription.Store switch
                {
                    SubscriptionStore.AppStore => "app_store",
                    SubscriptionStore.PlayStore => "play_store",
                    _ => "unknown"
                },
                ExpiresAt = subscription.ExpiresAt,
                WillRenew = subscription.WillRenew,
                LastSyncedAt = subscription.LastSyncedAt
            };
        }

        private FeatureAccessDto MapAccess(FeatureAccessSnapshot access)
        {
            return new FeatureAccessDto
            {
                MaxUnlockedJobs = access.MaxUnlockedJobs,
                UnlockedJobCount = access.UnlockedJobCount,
                CanUseGoals = access.CanUseGoals,
                CanUseExpenses = access.CanUseExpenses,
                HasLockedJobs = access.HasLockedJobs
            };
        }

        private SubscriptionPlanTerm ParsePlanTerm(string? productId)
        {
            if (string.IsNullOrWhiteSpace(productId))
            {
                return SubscriptionPlanTerm.None;
            }

            var configuredMonthly = _configuration["RevenueCat:Products:Monthly"];
            var configuredSixMonth = _configuration["RevenueCat:Products:SixMonth"];
            var configuredAnnual = _configuration["RevenueCat:Products:Annual"];

            if (productId.Equals(configuredMonthly, StringComparison.OrdinalIgnoreCase))
            {
                return SubscriptionPlanTerm.Monthly;
            }

            if (productId.Equals(configuredSixMonth, StringComparison.OrdinalIgnoreCase))
            {
                return SubscriptionPlanTerm.SixMonth;
            }

            if (productId.Equals(configuredAnnual, StringComparison.OrdinalIgnoreCase))
            {
                return SubscriptionPlanTerm.Annual;
            }

            var normalized = productId.ToLowerInvariant();
            if (normalized.Contains("annual") || normalized.Contains("year"))
            {
                return SubscriptionPlanTerm.Annual;
            }

            if (normalized.Contains("6") || normalized.Contains("six"))
            {
                return SubscriptionPlanTerm.SixMonth;
            }

            if (normalized.Contains("month"))
            {
                return SubscriptionPlanTerm.Monthly;
            }

            return SubscriptionPlanTerm.None;
        }

        private SubscriptionStore ParseStore(string? store)
        {
            return store?.ToLowerInvariant() switch
            {
                "app_store" => SubscriptionStore.AppStore,
                "play_store" => SubscriptionStore.PlayStore,
                _ => SubscriptionStore.Unknown
            };
        }

        private void EnsureRevenueCatConfigured()
        {
            if (string.IsNullOrWhiteSpace(GetRevenueCatApiKey()))
            {
                throw new InvalidOperationException("RevenueCat integration is not configured.");
            }
        }

        private void ValidateWebhookSecret(string? authorizationHeader, string? xAuthorizationHeader)
        {
            var expectedSecret = _configuration["RevenueCat:WebhookSecret"];
            if (string.IsNullOrWhiteSpace(expectedSecret))
            {
                throw new InvalidOperationException("RevenueCat webhook secret is not configured.");
            }

            var providedSecret = authorizationHeader?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true
                ? authorizationHeader["Bearer ".Length..].Trim()
                : xAuthorizationHeader?.Trim();

            if (!string.Equals(expectedSecret, providedSecret, StringComparison.Ordinal))
            {
                throw new UnauthorizedAccessException("Invalid RevenueCat webhook secret.");
            }
        }

        private string GetRevenueCatApiKey()
        {
            return _configuration["RevenueCat:ApiKey"] ?? string.Empty;
        }

        private string GetEntitlementId()
        {
            return _configuration["RevenueCat:EntitlementId"] ?? "pro";
        }

        private static string? ReadString(JsonElement? element, string propertyName)
        {
            if (!element.HasValue || element.Value.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            return element.Value.TryGetProperty(propertyName, out var property) && property.ValueKind != JsonValueKind.Null
                ? property.GetString()
                : null;
        }

        private static string? ReadString(JsonElement element, string propertyName)
        {
            return ReadString((JsonElement?)element, propertyName);
        }

        private static DateTime? ParseDateTime(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return DateTime.TryParse(value, out var parsed)
                ? DateTime.SpecifyKind(parsed, DateTimeKind.Utc)
                : null;
        }

        private static JsonElement? TryGetObjectProperty(JsonElement node, string propertyName, string nestedPropertyName)
        {
            if (!node.TryGetProperty(propertyName, out var property) || property.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            return property.TryGetProperty(nestedPropertyName, out var nested) && nested.ValueKind == JsonValueKind.Object
                ? nested
                : null;
        }

        private static (string? ProductId, DateTime? ExpiresAt, JsonElement? SubscriptionNode) GetLatestSubscription(JsonElement subscriber)
        {
            if (!subscriber.TryGetProperty("subscriptions", out var subscriptions)
                || subscriptions.ValueKind != JsonValueKind.Object)
            {
                return (null, null, null);
            }

            string? latestProductId = null;
            DateTime? latestExpiry = null;
            JsonElement? latestNode = null;

            foreach (var property in subscriptions.EnumerateObject())
            {
                var expiresAt = ParseDateTime(ReadString(property.Value, "expires_date"));
                if (latestExpiry == null || (expiresAt ?? DateTime.MinValue) > latestExpiry)
                {
                    latestProductId = property.Name;
                    latestExpiry = expiresAt;
                    latestNode = property.Value;
                }
            }

            return (latestProductId, latestExpiry, latestNode);
        }
    }
}
