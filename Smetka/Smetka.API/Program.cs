using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Swagger;
using SmetkaApp.API.Extensions;
using SmetkaApp.API.Middleware;
using SmetkaApp.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// ── Регистрация на Services ───────────────────────────────────────────────────
builder.Services
    .AddDatabase(builder.Configuration)
    .AddRepositories()
    .AddApplicationServices()
    .AddAnthropicClient(builder.Configuration)
    .AddJwtAuthentication(builder.Configuration)
    .AddCorsPolicy()
    .AddSwagger()
    .AddControllers();

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
    context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    context.Response.Headers.Append("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 200;
        await context.Response.CompleteAsync();
        return;
    }

    await next();
});

// ── Middleware Pipeline ───────────────────────────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
await db.Database.MigrateAsync();

app.Run();