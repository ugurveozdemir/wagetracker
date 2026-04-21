using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WageTracker.API.Models.Entities
{
    public enum SubscriptionStatus
    {
        Free = 0,
        Active = 1,
        GracePeriod = 2,
        BillingIssue = 3,
        Cancelled = 4,
        Expired = 5,
        Unknown = 6
    }

    public enum SubscriptionPlanTerm
    {
        None = 0,
        Monthly = 1,
        SixMonth = 2,
        Annual = 3
    }

    public enum SubscriptionStore
    {
        Unknown = 0,
        AppStore = 1,
        PlayStore = 2
    }

    public class UserSubscription
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string EntitlementId { get; set; } = "pro";

        [MaxLength(150)]
        public string? ProductId { get; set; }

        public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Free;

        public SubscriptionPlanTerm PlanTerm { get; set; } = SubscriptionPlanTerm.None;

        public SubscriptionStore Store { get; set; } = SubscriptionStore.Unknown;

        public bool IsPremium { get; set; }

        public bool WillRenew { get; set; }

        public DateTime? ExpiresAt { get; set; }

        public DateTime LastSyncedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
    }

    public class RevenueCatWebhookEvent
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string EventId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string EventType { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? AppUserId { get; set; }

        [Required]
        public string Payload { get; set; } = string.Empty;

        public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ProcessedAt { get; set; }
    }
}
