using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Smetka.API.DTOs.Auth
{
    public record LoginRequest(
    [Required(ErrorMessage = "Имейлът е задължителен")]
    [EmailAddress(ErrorMessage = "Невалиден имейл адрес")]
    string Email,

    [Required(ErrorMessage = "Паролата е задължителна")]
    string Password
);
}
