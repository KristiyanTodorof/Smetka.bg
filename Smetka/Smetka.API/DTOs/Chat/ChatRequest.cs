using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Smetka.API.DTOs.Chat
{
    public record ChatRequest(
    [Required(ErrorMessage = "Съобщението е задължително")]
    [MaxLength(2000, ErrorMessage = "Съобщението не може да е по-дълго от 2000 символа")]
    string Message
);
}
