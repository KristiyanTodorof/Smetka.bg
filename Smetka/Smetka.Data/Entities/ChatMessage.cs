using Smetka.Data.BaseEntities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Smetka.Data.Entities
{
    public class ChatMessage : BaseEntity
    {
        public int UserId { get; set; }

        // Кой е изпратил съобщението: "user" | "assistant"
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;

        // Връзка към потребителя
        public User User { get; set; } = null!;
    }
}
