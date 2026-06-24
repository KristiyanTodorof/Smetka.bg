using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Smetka.API.DTOs.Chat
{
    public record ChatHistoryItem(
    string Role,       // "user" | "assistant"
    string Content,
    DateTime CreatedAt
);
}
