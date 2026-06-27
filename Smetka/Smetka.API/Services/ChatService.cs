using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Smetka.API.DTOs.Chat;
using Smetka.Core.Interfaces;
using Smetka.Data.Entities;

namespace SmetkaApp.API.Services;

public class ChatService
{
    private readonly IUnitOfWork _uow;
    private readonly BillService _billService;
    private readonly IConfiguration _config;
    private readonly System.Net.Http.HttpClient _http;

    private const string SystemPrompt = """
        Ти си експертен AI асистент за анализ на комунални сметки в България — ток, вода и газ.
        
        ТВОИТЕ ВЪЗМОЖНОСТИ:
        1. Анализираш сметките на потребителя и обясняваш аномалии.
        2. Когато потребителят спомене конкретни уреди (климатик, хладилник, пералня и т.н.),
           търсиш в интернет реалната им консумация и изчисляваш колко струват на месец.
        3. Търсиш актуални тарифи на българските доставчици (ЧЕЗ, ЕнергоПро, EVN, ВиК и т.н.).
        4. Даваш конкретни съвети базирани на реални данни — не общи приказки.
        5. Сравняваш разходите със средните стойности за България.
        6. Предлагаш конкретни начини за пестене с реални числа (напр. "ще спестиш ~15€/месец").
        
        КОГАТО ПОТРЕБИТЕЛЯТ СПОМЕНЕ УРЕДИ:
        - Потърси реалната консумация на конкретния модел в интернет
        - Изчисли месечния разход базиран на типично ползване
        - Сравни с общата сметка и посочи кое харчи най-много
        - Предложи по-икономични алтернативи ако има такива
        
        ФОРМАТ НА ОТГОВОРА:
        - Говори на ясен, разбираем български
        - Използвай конкретни числа и евро (€)
        - Структурирай отговора с точки когато изброяваш
        - Бъди конкретен, не общ
        
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

        // 4. Изпращаме към Anthropic API с Web Search
        var requestBody = new
        {
            model = "claude-sonnet-4-6",
            max_tokens = 2048,
            system = systemPrompt,
            tools = new[]
            {
                new
                {
                    type = "web_search_20250305",
                    name = "web_search"
                }
            },
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

        // 5. Извличаме текстовия отговор (може да има и tool_use блокове)
        var reply = string.Empty;
        foreach (var block in doc.RootElement.GetProperty("content").EnumerateArray())
        {
            if (block.GetProperty("type").GetString() == "text")
            {
                reply = block.GetProperty("text").GetString() ?? string.Empty;
                break;
            }
        }

        if (string.IsNullOrEmpty(reply))
            reply = "Съжалявам, възникна грешка при обработката.";

        // 6. Запазваме и двете съобщения в историята
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