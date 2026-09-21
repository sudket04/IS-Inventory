using System.Security.Claims;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Racks;

/// <summary>
/// v1.3b module (docs/database/11-module-v1.3b-details-rack-ipam.sql §5): physical racks
/// and what's mounted in them. Position validation (no overlap, no exceeding rack height)
/// lives in a database trigger (trg_rack_mounts_validate, custom errors 51030/51031) rather
/// than C# — this controller only translates that into a friendly response.
/// </summary>
[ApiController]
[Authorize(Policy = "AnyRole")]
public sealed class RacksController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public RacksController(IsInventoryDbContext db)
    {
        _db = db;
    }

    [HttpGet("api/racks")]
    public async Task<ActionResult<IReadOnlyList<RackListItem>>> List(CancellationToken ct)
    {
        var items = await _db.VwRackUtilizations
            .OrderBy(v => v.RackCode)
            .Select(v => new RackListItem(
                v.RackId, v.RackCode, v.RackName, v.LocationPath, v.TotalU,
                v.UsedU, v.FreeU, v.UUsedPercent, v.DeviceCount,
                v.TotalWeightKg, v.MaxWeightKg, v.WeightUsedPercent,
                v.TotalPowerKw, v.MaxPowerKw, v.PowerUsedPercent,
                v.IsOverWeight, v.IsOverPower, v.IsActive))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("api/racks/{id:int}")]
    public async Task<ActionResult<RackDetail>> Get(int id, CancellationToken ct)
    {
        var detail = await GetDetail(id, ct);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpPost("api/racks")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<RackDetail>> Create([FromBody] RackRequest request, CancellationToken ct)
    {
        var entity = new Rack();
        Apply(entity, request);
        entity.CreatedAt = DateTimeOffset.UtcNow;
        entity.CreatedBy = CurrentUserId();
        _db.Racks.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = $"Rack code \"{request.Code}\" is already in use." });
        }
        catch (DbUpdateException ex) when (IsCheckViolation(ex))
        {
            return BadRequest(new { message = "Total U must be between 1 and 60, and numbering direction must be BOTTOM_UP or TOP_DOWN." });
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = entity.CreatedBy,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "CREATE",
            EntityType = "rack",
            EntityId = entity.RackId,
            EntityLabel = entity.Name,
        });
        await _db.SaveChangesAsync(ct);

        return Ok(await GetDetail(entity.RackId, ct));
    }

    [HttpPut("api/racks/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<RackDetail>> Update(int id, [FromBody] RackRequest request, CancellationToken ct)
    {
        var entity = await _db.Racks.FirstOrDefaultAsync(r => r.RackId == id, ct);
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
            return Conflict(new { message = $"Rack code \"{request.Code}\" is already in use." });
        }
        catch (DbUpdateException ex) when (IsCheckViolation(ex))
        {
            return BadRequest(new { message = "Total U must be between 1 and 60, and numbering direction must be BOTTOM_UP or TOP_DOWN." });
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = entity.UpdatedBy,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "UPDATE",
            EntityType = "rack",
            EntityId = entity.RackId,
            EntityLabel = entity.Name,
        });
        await _db.SaveChangesAsync(ct);

        return Ok(await GetDetail(entity.RackId, ct));
    }

    [HttpDelete("api/racks/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Racks.FirstOrDefaultAsync(r => r.RackId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        _db.Racks.Remove(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsCheckViolation(ex))
        {
            return Conflict(new { message = "This rack still has devices mounted. Remove those first." });
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "DELETE",
            EntityType = "rack",
            EntityId = entity.RackId,
            EntityLabel = entity.Name,
        });
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    // --- Elevation / Mounts ---

    [HttpGet("api/racks/{rackId:int}/elevation")]
    public async Task<ActionResult<IReadOnlyList<RackMountItem>>> Elevation(int rackId, CancellationToken ct)
    {
        var items = await _db.VwRackElevations
            .Where(v => v.RackId == rackId)
            .OrderBy(v => v.StartU)
            .Select(v => new RackMountItem(
                v.RackMountId, v.RackId, v.AssetId, v.AssetTag, v.AssetName,
                v.ManufacturerName, v.ModelName, v.TypeName, v.CategoryCode,
                v.StartU, v.UHeight, v.EndU, v.MountFace, v.Orientation,
                v.StatusCode, v.StatusColor, v.PowerDrawWatt, v.WeightKg, v.MountedDate))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpPost("api/racks/{rackId:int}/mounts")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<RackMountItem>> AddMount(int rackId, [FromBody] RackMountRequest request, CancellationToken ct)
    {
        var rack = await _db.Racks.FirstOrDefaultAsync(r => r.RackId == rackId, ct);
        if (rack is null)
        {
            return NotFound(new { message = "Rack not found." });
        }

        var asset = await _db.Assets.FirstOrDefaultAsync(a => a.AssetId == request.AssetId && !a.IsDeleted, ct);
        if (asset is null)
        {
            return BadRequest(new { message = $"Asset #{request.AssetId} not found." });
        }

        var entity = new RackMount
        {
            RackId = rackId,
            AssetId = request.AssetId,
            StartU = request.StartU,
            UHeight = request.UHeight,
            MountFace = request.MountFace,
            Orientation = request.Orientation,
            MountedDate = request.MountedDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
            CreatedBy = CurrentUserId(),
        };
        _db.RackMounts.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = $"{asset.AssetTag} is already mounted somewhere else. Remove it from its current position first." });
        }
        catch (DbUpdateException ex) when (TryGetTriggerMessage(ex, out var message))
        {
            return BadRequest(new { message });
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = entity.CreatedBy,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "CREATE",
            EntityType = "rack_mount",
            EntityId = entity.RackMountId,
            EntityLabel = $"{rack.Code} / {asset.AssetTag}",
        });
        await _db.SaveChangesAsync(ct);

        return Ok(await ElevationOne(entity.RackMountId, ct));
    }

    [HttpPut("api/rack-mounts/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<RackMountItem>> UpdateMount(int id, [FromBody] RackMountUpdateRequest request, CancellationToken ct)
    {
        var entity = await _db.RackMounts.FirstOrDefaultAsync(m => m.RackMountId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        entity.StartU = request.StartU;
        entity.UHeight = request.UHeight;
        entity.MountFace = request.MountFace;
        entity.Orientation = request.Orientation;
        entity.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        entity.UpdatedBy = CurrentUserId();

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (TryGetTriggerMessage(ex, out var message))
        {
            return BadRequest(new { message });
        }

        return Ok(await ElevationOne(id, ct));
    }

    /// <summary>Marks the mount as removed (removed_date = today) rather than deleting the
    /// row, mirroring the same history-preserving pattern used for cluster membership.</summary>
    [HttpPost("api/rack-mounts/{id:int}/remove")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<IActionResult> RemoveMount(int id, CancellationToken ct)
    {
        var entity = await _db.RackMounts.FirstOrDefaultAsync(m => m.RackMountId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        entity.RemovedDate = DateOnly.FromDateTime(DateTime.UtcNow);
        await _db.SaveChangesAsync(ct);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "UPDATE",
            EntityType = "rack_mount",
            EntityId = entity.RackMountId,
            EntityLabel = "removed from rack",
        });
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpDelete("api/rack-mounts/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<IActionResult> DeleteMount(int id, CancellationToken ct)
    {
        var entity = await _db.RackMounts.FirstOrDefaultAsync(m => m.RackMountId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        _db.RackMounts.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<RackMountItem> ElevationOne(int rackMountId, CancellationToken ct) =>
        await _db.VwRackElevations
            .Where(v => v.RackMountId == rackMountId)
            .Select(v => new RackMountItem(
                v.RackMountId, v.RackId, v.AssetId, v.AssetTag, v.AssetName,
                v.ManufacturerName, v.ModelName, v.TypeName, v.CategoryCode,
                v.StartU, v.UHeight, v.EndU, v.MountFace, v.Orientation,
                v.StatusCode, v.StatusColor, v.PowerDrawWatt, v.WeightKg, v.MountedDate))
            .FirstAsync(ct);

    private async Task<RackDetail?> GetDetail(int id, CancellationToken ct) =>
        await _db.Racks
            .Where(r => r.RackId == id)
            .Select(r => new RackDetail(
                r.RackId, r.LocationId, r.Location.Name, r.Code, r.Name, r.TotalU,
                r.WidthMm, r.DepthMm, r.MaxWeightKg, r.MaxPowerKw,
                r.NumberingDirection, r.HasFrontDoor, r.HasRearDoor, r.Notes,
                r.IsActive, r.CreatedAt, r.UpdatedAt))
            .FirstOrDefaultAsync(ct);

    private static void Apply(Rack e, RackRequest d)
    {
        e.LocationId = d.LocationId;
        e.Code = d.Code.Trim();
        e.Name = d.Name.Trim();
        e.TotalU = d.TotalU;
        e.WidthMm = d.WidthMm;
        e.DepthMm = d.DepthMm;
        e.MaxWeightKg = d.MaxWeightKg;
        e.MaxPowerKw = d.MaxPowerKw;
        e.NumberingDirection = d.NumberingDirection;
        e.HasFrontDoor = d.HasFrontDoor;
        e.HasRearDoor = d.HasRearDoor;
        e.Notes = string.IsNullOrWhiteSpace(d.Notes) ? null : d.Notes.Trim();
        e.IsActive = d.IsActive;
    }

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sqlEx && (sqlEx.Number == 2601 || sqlEx.Number == 2627);

    private static bool IsCheckViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sqlEx && sqlEx.Number == 547;

    /// <summary>trg_rack_mounts_validate raises custom errors 51030 (exceeds rack height) and
    /// 51031 (overlaps another device) via THROW — their Message is already the friendly
    /// text written in the trigger, so it's passed straight through.</summary>
    private static bool TryGetTriggerMessage(DbUpdateException ex, out string message)
    {
        if (ex.InnerException is SqlException sqlEx && (sqlEx.Number == 51030 || sqlEx.Number == 51031))
        {
            message = sqlEx.Message;
            return true;
        }

        message = string.Empty;
        return false;
    }
}
