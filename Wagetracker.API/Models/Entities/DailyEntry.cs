using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WageTracker.API.Models.Entities
{
    public class DailyEntry
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        // PERFORMANS İÇİN EKLENDİ:
        // Job tablosuna gitmeye gerek kalmadan "Benim tüm girişlerim" sorgusu için.
        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        public int JobId { get; set; }

        [ForeignKey("JobId")]
        public Job? Job { get; set; }

        [Required]
        public DateTime Date { get; set; }

        // Opsiyonel: Başlangıç saati (kullanıcı girerse TotalHours otomatik hesaplanır)
        public TimeSpan? StartTime { get; set; }

        // Opsiyonel: Bitiş saati (kullanıcı girerse TotalHours otomatik hesaplanır)
        public TimeSpan? EndTime { get; set; }

        // Kaç saat çalıştığı (Örn: 8.5)
        // StartTime ve EndTime girilirse otomatik hesaplanır, yoksa manuel girilir
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalHours { get; set; }

        // Job'dan kopyalanan saatlik ücret (historical data için)
        // Entry oluşturulduğunda Job.HourlyRate buraya kopyalanır
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal HourlyRateSnapshot { get; set; }

        // Hesaplanan toplam kazanç (TotalHours × HourlyRateSnapshot + Tip)
        // Service katmanında hesaplanıp kaydedilir
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalEarnings { get; set; }

        // İŞTE İSTEDİĞİN BAHŞİŞ (TIP) ALANI:
        // Varsayılan 0.
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Tip { get; set; } = 0;

        [MaxLength(250)]
        public string? Note { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}