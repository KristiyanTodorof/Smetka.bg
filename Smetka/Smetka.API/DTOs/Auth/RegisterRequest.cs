using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Smetka.API.DTOs.Auth
{
    public record RegisterRequest(
    [Required(ErrorMessage = "Името е задължително")]
    [MaxLength(128, ErrorMessage = "Името не може да е по-дълго от 128 символа")]
    string Name,

    [Required(ErrorMessage = "Имейлът е задължителен")]
    [EmailAddress(ErrorMessage = "Невалиден имейл адрес")]
    string Email,

    [Required(ErrorMessage = "Паролата е задължителна")]
    [MinLength(6, ErrorMessage = "Паролата трябва да е поне 6 символа")]
    string Password
);
}
