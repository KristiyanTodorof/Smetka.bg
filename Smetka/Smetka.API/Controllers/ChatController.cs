using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smetka.API.DTOs.Chat;
using SmetkaApp.API.Services;

namespace SmetkaApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly ChatService _chat;

    public ChatController(ChatService chat)
    {
        _chat = chat;
    }

    private int UserId => int.Parse(
        User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] ChatRequest req)
    {
        var response = await _chat.SendMessageAsync(UserId, req.Message);
        return Ok(response);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int limit = 50)
    {
        var history = await _chat.GetHistoryAsync(UserId, limit);
        return Ok(history);
    }

    [HttpDelete("history")]
    public async Task<IActionResult> ClearHistory()
    {
        await _chat.ClearHistoryAsync(UserId);
        return NoContent();
    }
}