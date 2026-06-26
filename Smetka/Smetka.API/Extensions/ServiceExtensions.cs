using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Smetka.Core.Interfaces;
using SmetkaApp.API.Services;
using SmetkaApp.Infrastructure.Data;
using SmetkaApp.Infrastructure.Repositories;

namespace SmetkaApp.API.Extensions;

public static class ServiceExtensions
{
    // ── База данни ────────────────────────────────────────────────────────────
    public static IServiceCollection AddDatabase(
        this IServiceCollection services,
        IConfiguration config)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(config.GetConnectionString("Default")));

        return services;
    }

    // ── Unit of Work + Repositories ───────────────────────────────────────────
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        return services;
    }

    // ── Application Services ──────────────────────────────────────────────────
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<BillService>();
        services.AddScoped<ChatService>();
        return services;
    }

    // ── HttpClient за Anthropic API ───────────────────────────────────────────
    public static IServiceCollection AddAnthropicClient(
        this IServiceCollection services,
        IConfiguration config)
    {
        services.AddHttpClient("anthropic", client =>
        {
            client.DefaultRequestHeaders.Add(
                "x-api-key", config["Anthropic:ApiKey"]);
            client.DefaultRequestHeaders.Add(
                "anthropic-version", "2023-06-01");
        });

        return services;
    }

    // ── JWT Автентикация ──────────────────────────────────────────────────────
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration config)
    {
        var secret = config["Jwt:Secret"]!;

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = config["Jwt:Issuer"],
                    ValidAudience = config["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                                                  Encoding.UTF8.GetBytes(secret))
                };
            });

        return services;
    }

    // ── CORS (React dev сървър) ───────────────────────────────────────────────
    public static IServiceCollection AddCorsPolicy(this IServiceCollection services)
    {
        services.AddCors(options =>
            options.AddPolicy("ReactApp", policy => policy
                .WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));

        return services;
    }

    // ── Swagger с JWT поддръжка ───────────────────────────────────────────────
    public static IServiceCollection AddSwagger(this IServiceCollection services)
    {
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Сметки.bg API",
                Version = "v1"
            });

            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id   = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }
}