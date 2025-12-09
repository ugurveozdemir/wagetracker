using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WageTracker.API.Models.Entities
{
    public class Job
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        // İlişki (Foreign Key): Bu iş kime ait?
        [Required]
        public int UserId { get; set; }

        // Navigation Property: EF Core'un ilişkiyi anlaması için gerekli referans.
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty; // Örn: "Starbucks", "Freelance"

        // Parasal işlemler için her zaman 'decimal' kullanılır.
        [Required]
        [Column(TypeName = "decimal(18,2)")] // Toplam 18 basamak, virgülden sonra 2 basamak.
        public decimal HourlyRate { get; set; }

        // Haftanın ilk günü (overtime hesaplaması için)
        // Örn: DayOfWeek.Friday ise hafta Cuma-Perşembe arası olur
        [Required]
        public DayOfWeek FirstDayOfWeek { get; set; } = DayOfWeek.Monday; // Varsayılan: Pazartesi

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}