using System.Security.Claims;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.ServerApplications;

/// <summary>
/// v1.6 module (docs/database/15-module-v1.6-server-applications.sql): applications
/// running on a Server asset, deliberately separate from dbo.server_role_assignments
/// (one row per Role per server) — this table allows several independently-named
/// applications on the same server. Unlike most tables in this schema it has no
/// is_deleted column (that choice was made in the schema itself), so Delete here is a
/// genuine hard delete, not soft-delete.
/// </summary>
[ApiController]
[Authorize(Policy = "AnyRole")]
public sealed class ServerApplicationsController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public ServerApplicationsController(IsInventoryDbContext db)
    {
        _db = db;
    }

    [HttpGet("api/assets/{assetId:int}/applications")]
    public async Task<ActionResult<IReadOnlyList<ServerApplicationListItem>>> List(int assetId, CancellationToken ct)
    {
        var items = await _db.VwServerApplications
            .Where(v => v.AssetId == assetId)
            .OrderBy(v => v.ApplicationName)
            .Select(v => new ServerApplicationListItem(
                v.ApplicationId, v.AssetId, null, v.ServerTypeName,
                v.ApplicationName, v.PortNumber, v.LinkUrl, v.InchargeName,
                null, v.DepartmentName, 0, v.SiteName, v.IsActive, v.Notes))
            .ToListAsync(ct);

        // The view doesn't carry raw FK ids (only the joined names) — fill them in from
        // the base table so the edit form can preselect the right dropdown option.
        var raw = await _db.ServerApplications
            .Where(a => a.AssetId == assetId)
            .Select(a => new { a.ApplicationId, a.ServerTypeId, a.DepartmentId, a.SiteId })
            .ToDictionaryAsync(a => a.ApplicationId, ct);

        var withIds = items.Select(i => raw.TryGetValue(i.ApplicationId, out var r)
            ? i with { ServerTypeId = r.ServerTypeId, DepartmentId = r.DepartmentId, SiteId = r.SiteId }
            : i).ToList();

        return Ok(withIds);
    }

    [HttpPost("api/assets/{assetId:int}/applications")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<ServerApplicationListItem>> Create(int assetId, [FromBody] ServerApplicationRequest request, CancellationToken ct)
    {
        var asset = await _db.Assets.Include(a => a.Category)
            .FirstOrDefaultAsync(a => a.AssetId == assetId && !a.IsDeleted, ct);
        if (asset is null)
        {
            return NotFound(new { message = "Asset not found." });
        }
        if (asset.Category.Code != "SRV")
        {
            return BadRequest(new { message = "Applications can only be attached to a Server asset." });
        }

        var entity = new ServerApplication { AssetId = assetId };
        Apply(entity, request);
        entity.CreatedAt = DateTimeOffset.UtcNow;
        entity.CreatedBy = CurrentUserId();
        _db.ServerApplications.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = $"\"{request.ApplicationName}\" is already registered on this server." });
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = entity.CreatedBy,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "CREATE",
            EntityType = "server_application",
            EntityId = entity.ApplicationId,
            EntityLabel = entity.ApplicationName,
        });
        await _db.SaveChangesAsync(ct);

        return await GetOne(entity.ApplicationId, ct);
    }

    [HttpPut("api/applications/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<ServerApplicationListItem>> Update(int id, [FromBody] ServerApplicationRequest request, CancellationToken ct)
    {
        var entity = await _db.ServerApplications.FirstOrDefaultAsync(a => a.ApplicationId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        Apply(entity, request);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        entity.UpdatedBy = CurrentUserId();

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = $"\"{request.ApplicationName}\" is already registered on this server." });
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = entity.UpdatedBy,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "UPDATE",
            EntityType = "server_application",
            EntityId = entity.ApplicationId,
            EntityLabel = entity.ApplicationName,
        });
        await _db.SaveChangesAsync(ct);

        return await GetOne(entity.ApplicationId, ct);
    }

    [HttpDelete("api/applications/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.ServerApplications.FirstOrDefaultAsync(a => a.ApplicationId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        _db.ServerApplications.Remove(entity);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "DELETE",
            EntityType = "server_application",
            EntityId = entity.ApplicationId,
            EntityLabel = entity.ApplicationName,
        });
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    private async Task<ActionResult<ServerApplicationListItem>> GetOne(int id, CancellationToken ct)
    {
        var item = await _db.VwServerApplications
            .Where(v => v.ApplicationId == id)
            .Select(v => new ServerApplicationListItem(
                v.ApplicationId, v.AssetId, null, v.ServerTypeName,
                v.ApplicationName, v.PortNumber, v.LinkUrl, v.InchargeName,
                null, v.DepartmentName, 0, v.SiteName, v.IsActive, v.Notes))
            .FirstAsync(ct);

        var raw = await _db.ServerApplications.Where(a => a.ApplicationId == id)
            .Select(a => new { a.ServerTypeId, a.DepartmentId, a.SiteId }).FirstAsync(ct);

        return item with { ServerTypeId = raw.ServerTypeId, DepartmentId = raw.DepartmentId, SiteId = raw.SiteId };
    }

    private static void Apply(ServerApplication e, ServerApplicationRequest d)
    {
        e.ServerTypeId = d.ServerTypeId;
        e.ApplicationName = d.ApplicationName.Trim();
        e.PortNumber = string.IsNullOrWhiteSpace(d.PortNumber) ? null : d.PortNumber.Trim();
        e.LinkUrl = string.IsNullOrWhiteSpace(d.LinkUrl) ? null : d.LinkUrl.Trim();
        e.InchargeName = string.IsNullOrWhiteSpace(d.InchargeName) ? null : d.InchargeName.Trim();
        e.DepartmentId = d.DepartmentId;
        e.SiteId = d.SiteId;
        e.IsActive = d.IsActive;
        e.Notes = string.IsNullOrWhiteSpace(d.Notes) ? null : d.Notes.Trim();
    }

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sqlEx && (sqlEx.Number == 2601 || sqlEx.Number == 2627);
}
