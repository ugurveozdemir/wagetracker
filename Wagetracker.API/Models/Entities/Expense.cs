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

    public enum PurchaseType
    {
        Single = 0,
        MultiItem = 1
    }

    public enum ExpenseItemKind
    {
        Product = 0,
        Tax = 1,
        Discount = 2,
        Fee = 3,
        Adjustment = 4
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

        public PurchaseType PurchaseType { get; set; } = PurchaseType.Single;

        [MaxLength(160)]
        public string? MerchantName { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? SubtotalAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? TaxAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? DiscountAmount { get; set; }

        [Column(TypeName = "decimal(5,4)")]
        public decimal? ReceiptScanConfidence { get; set; }

        public string? ReceiptWarningsJson { get; set; }

        [MaxLength(500)]
        public string? ReceiptImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<ExpenseItem> Items { get; set; } = new();
    }

    public class ExpenseItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int ExpenseId { get; set; }

        [ForeignKey("ExpenseId")]
        public Expense? Expense { get; set; }

        [Required]
        [MaxLength(160)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal? Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? UnitPrice { get; set; }

        [Required]
        public ExpenseCategory Category { get; set; } = ExpenseCategory.Other;

        [Required]
        [MaxLength(40)]
        public string Tag { get; set; } = "other";

        [Required]
        public ExpenseItemKind Kind { get; set; } = ExpenseItemKind.Product;

        [Column(TypeName = "decimal(5,4)")]
        public decimal? Confidence { get; set; }

        public int SortOrder { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
