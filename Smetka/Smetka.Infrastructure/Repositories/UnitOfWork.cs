using Microsoft.EntityFrameworkCore.Storage;
using Smetka.Core.Interfaces;
using Smetka.Data.Entities;
using SmetkaApp.Infrastructure.Data;

namespace SmetkaApp.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IDbContextTransaction? _transaction;

    // ── Репозитории (lazy — създават се само при нужда) ───────────────────────
    private IRepository<User>? _users;
    private IRepository<Bill>? _bills;
    private IRepository<ChatMessage>? _chatMessages;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public IRepository<User> Users
        => _users ??= new GenericRepository<User>(_context);

    public IRepository<Bill> Bills
        => _bills ??= new GenericRepository<Bill>(_context);

    public IRepository<ChatMessage> ChatMessages
        => _chatMessages ??= new GenericRepository<ChatMessage>(_context);

    // ── Запазване ─────────────────────────────────────────────────────────────
    public async Task<int> SaveChangesAsync()
        => await _context.SaveChangesAsync();

    // ── Транзакции ────────────────────────────────────────────────────────────
    public async Task BeginTransactionAsync()
        => _transaction = await _context.Database.BeginTransactionAsync();

    public async Task CommitAsync()
    {
        if (_transaction is null) return;
        await _transaction.CommitAsync();
        await _transaction.DisposeAsync();
        _transaction = null;
    }

    public async Task RollbackAsync()
    {
        if (_transaction is null) return;
        await _transaction.RollbackAsync();
        await _transaction.DisposeAsync();
        _transaction = null;
    }

    // ── Dispose ───────────────────────────────────────────────────────────────
    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}