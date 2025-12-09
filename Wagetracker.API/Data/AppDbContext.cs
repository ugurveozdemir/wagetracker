using Microsoft.EntityFrameworkCore;
using WageTracker.API.Models.Entities;

namespace WageTracker.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Job> Jobs { get; set; }
        public DbSet<DailyEntry> DailyEntries { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User Configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(255);
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired();
            });

            // Job Configuration
            modelBuilder.Entity<Job>(entity =>
            {
                entity.ToTable("Jobs");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId);
                
                entity.Property(e => e.Title).IsRequired().HasMaxLength(100);
                entity.Property(e => e.HourlyRate).IsRequired().HasColumnType("decimal(18,2)");
                entity.Property(e => e.FirstDayOfWeek).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();

                // Relationship: Job -> User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // DailyEntry Configuration
            modelBuilder.Entity<DailyEntry>(entity =>
            {
                entity.ToTable("DailyEntries");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.JobId);
                entity.HasIndex(e => e.Date);
                
                // Composite index for common queries
                entity.HasIndex(e => new { e.UserId, e.Date });
                entity.HasIndex(e => new { e.JobId, e.Date });

                entity.Property(e => e.Date).IsRequired();
                entity.Property(e => e.TotalHours).IsRequired().HasColumnType("decimal(18,2)");
                entity.Property(e => e.HourlyRateSnapshot).IsRequired().HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalEarnings).IsRequired().HasColumnType("decimal(18,2)");
                entity.Property(e => e.Tip).IsRequired().HasColumnType("decimal(18,2)");
                entity.Property(e => e.Note).HasMaxLength(250);
                entity.Property(e => e.CreatedAt).IsRequired();

                // Relationships
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Job)
                    .WithMany()
                    .HasForeignKey(e => e.JobId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
