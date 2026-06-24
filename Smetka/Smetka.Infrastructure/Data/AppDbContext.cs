using Microsoft.EntityFrameworkCore;
using Smetka.Data.BaseEntities;
using Smetka.Data.Entities;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace SmetkaApp.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── Global Query Filters ───────────────────────────────────────────────
        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
        modelBuilder.Entity<Bill>().HasQueryFilter(b => !b.IsDeleted);
        modelBuilder.Entity<ChatMessage>().HasQueryFilter(m => !m.IsDeleted);

        // ── User ──────────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(256).IsRequired();
            e.Property(u => u.Name).HasMaxLength(128).IsRequired();
            e.Property(u => u.PasswordHash).IsRequired();
        });

        // ── Bill ──────────────────────────────────────────────────────────────
        modelBuilder.Entity<Bill>(e =>
        {
            e.HasOne(b => b.User)
             .WithMany(u => u.Bills)
             .HasForeignKey(b => b.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.Property(b => b.Type).HasMaxLength(32).IsRequired();
            e.Property(b => b.Amount).HasPrecision(10, 2);
            e.Property(b => b.Consumption).HasPrecision(10, 3);
            e.Property(b => b.Unit).HasMaxLength(16);

            e.HasIndex(b => new { b.UserId, b.Type, b.Month, b.Year }).IsUnique();
        });

        // ── ChatMessage ───────────────────────────────────────────────────────
        modelBuilder.Entity<ChatMessage>(e =>
        {
            e.HasOne(m => m.User)
             .WithMany(u => u.ChatMessages)
             .HasForeignKey(m => m.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.Property(m => m.Role).HasMaxLength(16).IsRequired();
            e.Property(m => m.Content).IsRequired();
        });
    }

    // ── Автоматично задава ModifiedAt при SaveChanges ─────────────────────────
    public override int SaveChanges()
    {
        SetModifiedAt();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        SetModifiedAt();
        return base.SaveChangesAsync(ct);
    }

    private void SetModifiedAt()
    {
        var modified = ChangeTracker.Entries<
            BaseEntity>()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in modified)
            entry.Entity.ModifiedAt = DateTime.UtcNow;
    }
}