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

// ── Middleware Pipeline ───────────────────────────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("ReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
await db.Database.MigrateAsync();

app.Run();