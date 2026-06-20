using Smetka.Data.BaseEntities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Smetka.Data.Entities
{
    public class Bill : BaseEntity
    {
        public int UserId { get; set; }

        // Типът на сметката: "electricity" | "water" | "gas"
        public string Type { get; set; } = string.Empty;

        public int Month { get; set; }   // 1-12
        public int Year { get; set; }    // напр. 2025

        public decimal Amount { get; set; }          // сума в лв
        public decimal? Consumption { get; set; }    // консумация (по избор)
        public string? Unit { get; set; }            // "kWh" | "m3" | "l"

        public string? Notes { get; set; }           // потребителска бележка

        // Връзка към потребителя
        public User User { get; set; } = null!;
    }
}
