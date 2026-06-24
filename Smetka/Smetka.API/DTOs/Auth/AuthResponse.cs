using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Smetka.API.DTOs.Auth
{
    public record AuthResponse(
    string Token,
    string Name,
    string Email
);
}
