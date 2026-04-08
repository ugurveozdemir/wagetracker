using System.ComponentModel.DataAnnotations; // Key, Required gibi attribute'lar için
using System.ComponentModel.DataAnnotations.Schema; // Database generate optionlar için

namespace WageTracker.API.Models.Entities
{
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        // DİKKAT: Şifreyi asla buraya '123456' diye kaydetmeyeceğiz.
        // Hash'lenmiş (şifrelenmiş) halini tutacağız.
        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? WeeklyGoalAmount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
