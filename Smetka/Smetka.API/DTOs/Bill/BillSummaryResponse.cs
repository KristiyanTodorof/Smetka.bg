using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Smetka.API.DTOs.Bill
{
    public record BillSummaryResponse(
    string Type,
    int Month,
    int Year,
    decimal Amount,
    decimal? PreviousAmount,
    double? ChangePercent      // напр. +42.5 или -8.3
);
}
