using IsInventory.Api.Authorization;
using IsInventory.Domain.Security;
using System.Security.Claims;
using IsInventory.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.AuditLogs;

/// <summary>
/// Read-only view over dbo.audit_logs (decision #3: the table is append-only — every
/// write path elsewhere in the API inserts rows, nothing ever updates or deletes them).
/// </summary>
[ApiController]
[Route("api/audit-logs")]
[Authorize]
[RequiresPermission("audit_logs", PermissionAction.View)]
public sealed class AuditLogsController : ControllerBase
{
    private const int MaxPageSize = 100;

    private readonly IsInventoryDbContext _db;

    public AuditLogsController(IsInventoryDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AuditLogListItem>>> List(
        [FromQuery] string? entityType,
        [FromQuery] string? action,
        [FromQuery] int? userId,
        [FromQuery] string? search,
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = _db.AuditLogs.AsQueryable();

        // PRD §5.2 Permission Matrix: IT Staff may only see audit entries they themselves
        // made — Admin and Auditor see everything. Enforced server-side regardless of what
        // the caller passes in `userId`, since that's client input and can't be trusted.
        if (User.IsInRole("IT_STAFF") && !User.IsInRole("ADMIN"))
        {
            query = query.Where(a => a.UserId == CurrentUserId());
        }

        if (!string.IsNullOrWhiteSpace(entityType))
        {
            query = query.Where(a => a.EntityType == entityType);
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(a => a.Action == action);
        }

        if (userId.HasValue)
        {
            query = query.Where(a => a.UserId == userId);
        }

        if (dateFrom.HasValue)
        {
            var from = dateFrom.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(a => a.OccurredAt >= from);
        }

        if (dateTo.HasValue)
        {
            var to = dateTo.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(a => a.OccurredAt <= to);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search.Trim()}%";
            query = query.Where(a =>
                EF.Functions.Like(a.UsernameSnapshot, term) ||
                EF.Functions.Like(a.EntityLabel, term));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(a => a.OccurredAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogListItem(
                a.AuditId, a.OccurredAt, a.UserId, a.UsernameSnapshot,
                a.Action, a.EntityType, a.EntityId, a.EntityLabel,
                a.ChangedFields, a.IpAddress))
            .ToListAsync(ct);

        return Ok(new PagedResult<AuditLogListItem>(items, totalCount, page, pageSize));
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<AuditLogDetail>> Get(long id, CancellationToken ct)
    {
        var query = _db.AuditLogs.Where(a => a.AuditId == id);

        if (User.IsInRole("IT_STAFF") && !User.IsInRole("ADMIN"))
        {
            query = query.Where(a => a.UserId == CurrentUserId());
        }

        var entry = await query
            .Select(a => new AuditLogDetail(
                a.AuditId, a.OccurredAt, a.UserId, a.UsernameSnapshot,
                a.Action, a.EntityType, a.EntityId, a.EntityLabel,
                a.BeforeJson, a.AfterJson, a.ChangedFields,
                a.IpAddress, a.UserAgent, a.BatchUid))
            .FirstOrDefaultAsync(ct);

        return entry is null ? NotFound() : Ok(entry);
    }

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }
}
