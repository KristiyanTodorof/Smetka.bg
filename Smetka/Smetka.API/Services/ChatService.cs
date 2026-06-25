using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using Smetka.API.DTOs.Chat;
using Smetka.Core.Interfaces;
using Smetka.Data.Entities;

namespace SmetkaApp.API.Services;

public class ChatService
{
    private readonly IUnitOfWork _uow;
    private readonly BillService _billService;
    private readonly IConfiguration _config;
    private readonly HttpClient _http;

    private const string SystemPrompt = """
        Ти си AI асистент за анализ на комунални сметки — ток, вода и газ.
        Помагаш на хората да разберат защо сметките им се повишават или намаляват.

        Твоите задачи:
        1. Обясняваш причините за промени (сезонност, тарифни промени, навици, уреди).
        2. Даваш конкретни съвети за намаляване на разходите.
        3. Предупреждаваш при необичайни аномалии.

        Говори кратко и ясно на разбираем български. Без технически жаргон.

        Данни за сметките на потребителя:
        {BILL_CONTEXT}
        """;

    public ChatService(
        IUnitOfWork uow,
        BillService billService,
        IConfiguration config,
        System.Net.Http.IHttpClientFactory httpFactory)
    {
        _uow = uow;
        _billService = billService;
        _config = config;
        _http = httpFactory.CreateClient("anthropic");
    }

    public async Task<ChatResponse> SendMessageAsync(int userId, string userMessage)
    {
        // 1. Вземаме контекст от сметките
        var billContext = await _billService.BuildAiContextAsync(userId);
        var systemPrompt = SystemPrompt.Replace("{BILL_CONTEXT}", billContext);

        // 2. Последните 10 съобщения за история на разговора
        var history = await _uow.ChatMessages.FindAsync(m => m.UserId == userId);
        var recentHistory = history
            .OrderBy(m => m.CreatedAt)
            .TakeLast(10)
            .Select(m => new { role = m.Role, content = m.Content })
            .ToList();

        // 3. Добавяме новото съобщение
        var messages = recentHistory
            .Cast<object>()
            .Append(new { role = "user", content = userMessage })
            .ToList();

        // 4. Изпращаме към Anthropic API
        var requestBody = new
        {
            model = "claude-sonnet-4-6",
            max_tokens = 1024,
            system = systemPrompt,
            messages
        };

        var json = JsonSerializer.Serialize(requestBody);
        var response = await _http.PostAsync(
            "https://api.anthropic.com/v1/messages",
            new StringContent(json, Encoding.UTF8, "application/json")
        );

        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseJson);
        var reply = doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? "Съжалявам, възникна грешка.";

        // 5. Запазваме и двете съобщения в историята
        await _uow.ChatMessages.AddAsync(new ChatMessage
        {
            UserId = userId,
            Role = "user",
            Content = userMessage
        });

        await _uow.ChatMessages.AddAsync(new ChatMessage
        {
            UserId = userId,
            Role = "assistant",
            Content = reply
        });

        await _uow.SaveChangesAsync();

        return new ChatResponse(reply, DateTime.UtcNow);
    }

    public async Task<List<ChatHistoryItem>> GetHistoryAsync(int userId, int limit = 50)
    {
        var messages = await _uow.ChatMessages.FindAsync(m => m.UserId == userId);

        return messages
            .OrderBy(m => m.CreatedAt)
            .TakeLast(limit)
            .Select(m => new ChatHistoryItem(m.Role, m.Content, m.CreatedAt))
            .ToList();
    }

    public async Task ClearHistoryAsync(int userId)
    {
        var messages = await _uow.ChatMessages.FindAsync(m => m.UserId == userId);
        foreach (var message in messages)
            _uow.ChatMessages.Delete(message);

        await _uow.SaveChangesAsync();
    }
}