using Microsoft.EntityFrameworkCore;
using Smetka.Core.Interfaces;
using Smetka.Data.BaseEntities;
using Smetka.Data.Entities;
using SmetkaApp.Infrastructure.Data;
using System.Collections.Generic;
using System.Linq.Expressions;

namespace SmetkaApp.Infrastructure.Repositories;

public class GenericRepository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public GenericRepository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    // ── Read ──────────────────────────────────────────────────────────────────
    public async Task<T?> GetByIdAsync(int id)
        => await _dbSet.FirstOrDefaultAsync(e => e.Id == id);

    public async Task<IEnumerable<T>> GetAllAsync()
        => await _dbSet.ToListAsync();

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        => await _dbSet.Where(predicate).ToListAsync();

    public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate)
        => await _dbSet.FirstOrDefaultAsync(predicate);

    public async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
        => await _dbSet.AnyAsync(predicate);

    // ── Write ─────────────────────────────────────────────────────────────────
    public async Task AddAsync(T entity)
        => await _dbSet.AddAsync(entity);

    public void Update(T entity)
        => _dbSet.Update(entity);

    public void Delete(T entity)
    {
        // Soft delete — само маркираме, не изтриваме физически
        entity.IsDeleted = true;
        entity.ModifiedAt = DateTime.UtcNow;
        _dbSet.Update(entity);
    }

    public void HardDelete(T entity)
        => _dbSet.Remove(entity);
}