using Smetka.API.DTOs.Bill;
using Smetka.Core.Interfaces;
using Smetka.Data.Entities;

namespace SmetkaApp.API.Services;

public class BillService
{
    private readonly IUnitOfWork _uow;

    public BillService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<List<BillResponse>> GetBillsAsync(int userId, string? type = null)
    {
        var bills = await _uow.Bills.FindAsync(b =>
            b.UserId == userId &&
            (type == null || b.Type == type));

        return bills
            .OrderByDescending(b => b.Year)
            .ThenByDescending(b => b.Month)
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<List<BillSummaryResponse>> GetSummaryAsync(int userId)
    {
        var bills = await _uow.Bills.FindAsync(b => b.UserId == userId);

        var ordered = bills
            .OrderByDescending(b => b.Year)
            .ThenByDescending(b => b.Month)
            .ToList();

        var result = new List<BillSummaryResponse>();

        foreach (var type in new[] { "electricity", "water", "gas" })
        {
            var typeBills = ordered.Where(b => b.Type == type).ToList();
            if (!typeBills.Any()) continue;

            var latest = typeBills.First();
            var previous = typeBills.Skip(1).FirstOrDefault();

            double? changePercent = null;
            if (previous is not null && previous.Amount > 0)
                changePercent = Math.Round(
                    (double)(latest.Amount - previous.Amount) / (double)previous.Amount * 100, 1);

            result.Add(new BillSummaryResponse(
                latest.Type,
                latest.Month,
                latest.Year,
                latest.Amount,
                previous?.Amount,
                changePercent
            ));
        }

        return result;
    }

    public async Task<BillResponse> CreateBillAsync(int userId, CreateBillRequest req)
    {
        // Ако вече има сметка за този тип/месец/година — обновяваме
        var existing = await _uow.Bills.FirstOrDefaultAsync(b =>
            b.UserId == userId &&
            b.Type == req.Type &&
            b.Month == req.Month &&
            b.Year == req.Year);

        if (existing is not null)
        {
            existing.Amount = req.Amount;
            existing.Consumption = req.Consumption;
            existing.Unit = req.Unit;
            existing.Notes = req.Notes;
            _uow.Bills.Update(existing);
            await _uow.SaveChangesAsync();
            return MapToResponse(existing);
        }

        var bill = new Bill
        {
            UserId = userId,
            Type = req.Type,
            Month = req.Month,
            Year = req.Year,
            Amount = req.Amount,
            Consumption = req.Consumption,
            Unit = req.Unit,
            Notes = req.Notes
        };

        await _uow.Bills.AddAsync(bill);
        await _uow.SaveChangesAsync();

        return MapToResponse(bill);
    }

    public async Task<bool> DeleteBillAsync(int userId, int billId)
    {
        var bill = await _uow.Bills.FirstOrDefaultAsync(b =>
            b.Id == billId && b.UserId == userId);

        if (bill is null) return false;

        _uow.Bills.Delete(bill); // soft delete
        await _uow.SaveChangesAsync();
        return true;
    }

    // Изгражда текстов контекст за AI-то с историята на сметките
    public async Task<string> BuildAiContextAsync(int userId)
    {
        var bills = await _uow.Bills.FindAsync(b => b.UserId == userId);

        var ordered = bills
            .OrderByDescending(b => b.Year)
            .ThenByDescending(b => b.Month)
            .Take(24)
            .ToList();

        if (!ordered.Any())
            return "Потребителят все още няма въведени сметки.";

        var lines = new List<string> { "История на сметките (последните записи):" };

        foreach (var type in new[] { "electricity", "water", "gas" })
        {
            var typeBills = ordered.Where(b => b.Type == type).ToList();
            if (!typeBills.Any()) continue;

            var typeName = type switch
            {
                "electricity" => "Ток",
                "water" => "Вода",
                "gas" => "Газ",
                _ => type
            };

            lines.Add($"\n{typeName}:");
            foreach (var b in typeBills)
            {
                var consumption = b.Consumption.HasValue
                    ? $", {b.Consumption} {b.Unit}"
                    : "";
                lines.Add($"  {b.Month:D2}/{b.Year}: {b.Amount} €{consumption}");
            }
        }

        return string.Join("\n", lines);
    }

    private static BillResponse MapToResponse(Bill b) => new(
        b.Id, b.Type, b.Month, b.Year,
        b.Amount, b.Consumption, b.Unit,
        b.Notes, b.CreatedAt, b.ModifiedAt
    );
}