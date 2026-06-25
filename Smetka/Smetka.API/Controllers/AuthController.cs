using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Smetka.API.DTOs.Auth;
using SmetkaApp.API.Services;
using System.Runtime.InteropServices;

namespace SmetkaApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;

    public AuthController(AuthService auth)
    {
        _auth = auth;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var result = await _auth.RegisterAsync(req);

        if (result is null)
            return Conflict(new { message = "Имейл адресът вече е регистриран." });

        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var result = await _auth.LoginAsync(req);

        if (result is null)
            return StatusCode(StatusCodes.Status401Unauthorized,
             new { message = "Грешен имейл или парола." });

        return Ok(result);
    }
}