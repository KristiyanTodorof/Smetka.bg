using Smetka.Data.BaseEntities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Smetka.Core.Interfaces
{
    public interface IRepository<T> where T : BaseEntity
    {
        // ── Read ──────────────────────────────────────────────────────────────────
        Task<T?> GetByIdAsync(int id);
        Task<IEnumerable<T>> GetAllAsync();
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
        Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);

        // ── Write ─────────────────────────────────────────────────────────────────
        Task AddAsync(T entity);
        void Update(T entity);
        void Delete(T entity);         // soft delete - слага IsDeleted = true
        void HardDelete(T entity);     // физическо изтриване от базата
    }
}
