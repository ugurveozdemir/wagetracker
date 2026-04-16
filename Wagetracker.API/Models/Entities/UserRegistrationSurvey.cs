using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WageTracker.API.Models.Entities
{
    public class UserRegistrationSurvey
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int UserId { get; set; }

        [Required]
        [MaxLength(60)]
        public string PrimaryGoal { get; set; } = string.Empty;

        [Required]
        [MaxLength(60)]
        public string PlannedJobCount { get; set; } = string.Empty;

        [Required]
        [MaxLength(60)]
        public string SpendingHabit { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
    }
}
