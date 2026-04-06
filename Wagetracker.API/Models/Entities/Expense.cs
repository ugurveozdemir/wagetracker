using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WageTracker.API.Models.Entities
{
    public enum ExpenseCategory
    {
        FoodAndDrinks = 0,      // 🍔
        Transport = 1,           // 🚌
        Shopping = 2,            // 🛒
        BillsAndUtilities = 3,   // 💡
        Entertainment = 4,       // 🎬
        Health = 5,              // 🏥
        Education = 6,           // 📚
        Other = 7                // 📦
    }

    public enum ExpenseSource
    {
        Manual = 0,              // Kullanıcı elle girdi
        ReceiptScan = 1          // AI fiş taramasından geldi (gelecek feature)
    }

    public class Expense
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        public ExpenseCategory Category { get; set; } = ExpenseCategory.Other;

        [Required]
        public DateTime Date { get; set; }

        [MaxLength(250)]
        public string? Description { get; set; }

        // AI Receipt Scanning uyumu (gelecek feature için hazır)
        public ExpenseSource Source { get; set; } = ExpenseSource.Manual;

        [MaxLength(500)]
        public string? ReceiptImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
