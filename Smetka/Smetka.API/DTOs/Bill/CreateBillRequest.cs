using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Smetka.API.DTOs.Bill
{
    public record CreateBillRequest(
    [Required(ErrorMessage = "Типът на сметката е задължителен")]
    string Type,           // "electricity" | "water" | "gas"

    [Range(1, 12, ErrorMessage = "Месецът трябва да е между 1 и 12")]
    int Month,

    [Range(2000, 2100, ErrorMessage = "Невалидна година")]
    int Year,

    [Range(0, 99999, ErrorMessage = "Невалидна сума")]
    decimal Amount,

    decimal? Consumption,  // по избор
    string? Unit,          // "kWh" | "m3"
    string? Notes
);
}
