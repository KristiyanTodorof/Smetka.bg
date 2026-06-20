using Smetka.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Smetka.Core.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        // ── Репозитории ───────────────────────────────────────────────────────────
        IRepository<User> Users { get; }
        IRepository<Bill> Bills { get; }
        IRepository<ChatMessage> ChatMessages { get; }

        // ── Запазване на промените ────────────────────────────────────────────────
        Task<int> SaveChangesAsync();

        // ── Транзакции ────────────────────────────────────────────────────────────
        Task BeginTransactionAsync();
        Task CommitAsync();
        Task RollbackAsync();
    }
}
