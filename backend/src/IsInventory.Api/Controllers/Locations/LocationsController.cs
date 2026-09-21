using System.Security.Claims;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Locations;

/// <summary>
/// dbo.locations (docs/database/02-schema-sqlserver.sql §"locations"): self-referencing
/// SITE/BUILDING/FLOOR/ROOM/RACK hierarchy. Master data like the Lookups controllers, but
/// kept as its own controller (not LookupsControllerBase) because of the parent/children tree
/// shape and to avoid serializing the entity's self-referencing navigation properties.
/// No is_deleted column — deletes are genuine hard deletes, guarded by the table's own FK
/// (parent_location_id self-FK) and by every other table that references location_id.
/// </summary>
[ApiController]
[Authorize(Policy = "AnyRole")]
public sealed class LocationsController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public LocationsController(IsInventoryDbContext db)
    {
        _db = db;
    }

    [HttpGet("api/locations/tree")]
    public async Task<ActionResult<IReadOnlyList<LocationTreeNode>>> Tree(CancellationToken ct)
    {
        var flat = await _db.Locations
            .OrderBy(l => l.SortOrder).ThenBy(l => l.Name)
            .Select(l => new { l.LocationId, l.ParentLocationId, l.Code, l.Name, l.LocationType, l.Address, l.SortOrder, l.IsActive })
            .ToListAsync(ct);

        List<LocationTreeNode> BuildChildren(int? parentId) =>
            flat.Where(l => l.ParentLocationId == parentId)
                .Select(l => new LocationTreeNode(
                    l.LocationId, l.ParentLocationId, l.Code, l.Name, l.LocationType,
                    l.Address, l.SortOrder, l.IsActive, BuildChildren(l.LocationId)))
                .ToList();

        return Ok(BuildChildren(null));
    }

    [HttpGet("api/locations/{id:int}")]
    public async Task<ActionResult<LocationDetail>> Get(int id, CancellationToken ct)
    {
        var detail = await GetDetail(id, ct);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpPost("api/locations")]
    [Authorize(Policy = "Admin")]
    public async Task<ActionResult<LocationDetail>> Create([FromBody] LocationRequest request, CancellationToken ct)
    {
        if (request.ParentLocationId is int parentId && !await _db.Locations.AnyAsync(l => l.LocationId == parentId, ct))
        {
            return BadRequest(new { message = "Parent location not found." });
        }

        var entity = new Location();
        Apply(entity, request);
        entity.CreatedAt = DateTimeOffset.UtcNow;
        _db.Locations.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = $"Location code \"{request.Code}\" is already in use." });
        }
        catch (DbUpdateException ex) when (IsCheckViolation(ex))
        {
            return BadRequest(new { message = "Location type must be one of SITE, BUILDING, FLOOR, ROOM, RACK." });
        }

        await LogAsync("CREATE", entity, ct);
        return Ok(await GetDetail(entity.LocationId, ct));
    }

    [HttpPut("api/locations/{id:int}")]
    [Authorize(Policy = "Admin")]
    public async Task<ActionResult<LocationDetail>> Update(int id, [FromBody] LocationRequest request, CancellationToken ct)
    {
        var entity = await _db.Locations.FirstOrDefaultAsync(l => l.LocationId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        if (request.ParentLocationId is int parentId)
        {
            if (parentId == id)
            {
                return BadRequest(new { message = "A location cannot be its own parent." });
            }
            if (!await _db.Locations.AnyAsync(l => l.LocationId == parentId, ct))
            {
                return BadRequest(new { message = "Parent location not found." });
            }
            if (await IsDescendantAsync(id, parentId, ct))
            {
                return BadRequest(new { message = "Cannot move a location under one of its own descendants." });
            }
        }

        Apply(entity, request);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = $"Location code \"{request.Code}\" is already in use." });
        }
        catch (DbUpdateException ex) when (IsCheckViolation(ex))
        {
            return BadRequest(new { message = "Location type must be one of SITE, BUILDING, FLOOR, ROOM, RACK." });
        }

        await LogAsync("UPDATE", entity, ct);
        return Ok(await GetDetail(entity.LocationId, ct));
    }

    [HttpDelete("api/locations/{id:int}")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Locations.FirstOrDefaultAsync(l => l.LocationId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        if (await _db.Locations.AnyAsync(l => l.ParentLocationId == id, ct))
        {
            return Conflict(new { message = "This location still has sub-locations under it. Remove or move those first." });
        }

        _db.Locations.Remove(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsCheckViolation(ex))
        {
            return Conflict(new { message = "This location is still referenced by assets, racks, or clusters. Remove those first." });
        }

        await LogAsync("DELETE", entity, ct);
        return NoContent();
    }

    private async Task<bool> IsDescendantAsync(int locationId, int candidateParentId, CancellationToken ct)
    {
        var current = await _db.Locations
            .Where(l => l.LocationId == candidateParentId)
            .Select(l => l.ParentLocationId)
            .FirstOrDefaultAsync(ct);

        while (current is int p)
        {
            if (p == locationId)
            {
                return true;
            }
            current = await _db.Locations
                .Where(l => l.LocationId == p)
                .Select(l => l.ParentLocationId)
                .FirstOrDefaultAsync(ct);
        }

        return false;
    }

    private async Task<LocationDetail?> GetDetail(int id, CancellationToken ct) =>
        await _db.Locations
            .Where(l => l.LocationId == id)
            .Select(l => new LocationDetail(
                l.LocationId, l.ParentLocationId, l.ParentLocation != null ? l.ParentLocation.Name : null,
                l.Code, l.Name, l.LocationType, l.Address, l.SortOrder, l.IsActive, l.CreatedAt))
            .FirstOrDefaultAsync(ct);

    private static void Apply(Location e, LocationRequest d)
    {
        e.ParentLocationId = d.ParentLocationId;
        e.Code = d.Code.Trim();
        e.Name = d.Name.Trim();
        e.LocationType = d.LocationType;
        e.Address = string.IsNullOrWhiteSpace(d.Address) ? null : d.Address.Trim();
        e.SortOrder = d.SortOrder;
        e.IsActive = d.IsActive;
    }

    private async Task LogAsync(string action, Location entity, CancellationToken ct)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = action,
            EntityType = "location",
            EntityId = entity.LocationId,
            EntityLabel = entity.Name,
        });
        await _db.SaveChangesAsync(ct);
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
}
