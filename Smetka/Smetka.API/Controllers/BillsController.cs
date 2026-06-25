using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smetka.API.DTOs.Bill;
using SmetkaApp.API.Services;

namespace SmetkaApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BillsController : ControllerBase
{
    private readonly BillService _bills;

    public BillsController(BillService bills)
    {
        _bills = bills;
    }

    private int UserId => int.Parse(
        User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> GetBills([FromQuery] string? type)
    {
        var bills = await _bills.GetBillsAsync(UserId, type);
        return Ok(bills);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var summary = await _bills.GetSummaryAsync(UserId);
        return Ok(summary);
    }

    [HttpPost]
    public async Task<IActionResult> CreateBill([FromBody] CreateBillRequest req)
    {
        var bill = await _bills.CreateBillAsync(UserId, req);
        return Ok(bill);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBill(int id)
    {
        var deleted = await _bills.DeleteBillAsync(UserId, id);

        if (!deleted)
            return NotFound(new { message = "Сметката не е намерена." });

        return NoContent();
    }
}