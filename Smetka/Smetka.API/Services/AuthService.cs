using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Smetka.API.DTOs.Auth;
using Smetka.Core.Interfaces;
using Smetka.Data.Entities;

namespace SmetkaApp.API.Services;

public class AuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;

    public AuthService(IUnitOfWork uow, IConfiguration config)
    {
        _uow = uow;
        _config = config;
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest req)
    {
        // Проверка дали имейлът вече съществува
        var exists = await _uow.Users.ExistsAsync(u => u.Email == req.Email);
        if (exists) return null;

        var user = new User
        {
            Name = req.Name,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };

        await _uow.Users.AddAsync(user);
        await _uow.SaveChangesAsync();

        return new AuthResponse(GenerateToken(user), user.Name, user.Email);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest req)
    {
        var user = await _uow.Users.FirstOrDefaultAsync(u => u.Email == req.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return null;

        return new AuthResponse(GenerateToken(user), user.Name, user.Email);
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name)
            },
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}