using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Smetka.API.DTOs.Bill
{
    public record BillResponse(
    int Id,
    string Type,
    int Month,
    int Year,
    decimal Amount,
    decimal? Consumption,
    string? Unit,
    string? Notes,
    DateTime CreatedAt,
    DateTime? ModifiedAt
);
}
