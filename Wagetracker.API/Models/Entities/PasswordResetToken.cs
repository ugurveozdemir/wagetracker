using System.ComponentModel.DataAnnotations;

namespace WageTracker.API.Models.Entities
{
    public class PasswordResetToken
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(128)]
        public string CodeHash { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UsedAt { get; set; }

        public int FailedAttempts { get; set; }

        public User User { get; set; } = null!;
    }
}
