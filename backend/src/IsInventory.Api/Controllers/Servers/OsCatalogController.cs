using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Servers;

/// <summary>
/// OS Type / OS Version — v1.7 Server Domain. The only Master Data in the project with an
/// inline "+" quick-add straight from the consuming form (Server List), per explicit user
/// request, rather than the usual Admin &gt; Master Data page. Reads stay AnyRole like every
/// other picker; writes need ItStaffOrAbove same as everywhere else that edits Server data.
/// </summary>
[ApiController]
[Route("api/os-types")]
[Authorize(Policy = "AnyRole")]
public sealed class OsCatalogController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public OsCatalogController(IsInventoryDbContext db)
    {
        _db = db;
    }

    public sealed record OsTypeOption(int Id, string Code, string Name);
    public sealed record OsVersionOption(int Id, int OsTypeId, string Name);
    public sealed record CreateOsTypeRequest(string Name);
    public sealed record CreateOsVersionRequest(int OsTypeId, string Name);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OsTypeOption>>> ListTypes(CancellationToken ct) =>
        Ok(await _db.OsTypes.Where(t => t.IsActive).OrderBy(t => t.SortOrder)
            .Select(t => new OsTypeOption(t.OsTypeId, t.Code, t.Name)).ToListAsync(ct));

    [HttpPost]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<OsTypeOption>> CreateType([FromBody] CreateOsTypeRequest request, CancellationToken ct)
    {
        var name = request.Name.Trim();
        if (name.Length == 0) return BadRequest(new { message = "Name is required." });

        var existing = await _db.OsTypes.FirstOrDefaultAsync(t => t.Name == name, ct);
        if (existing is not null) return Ok(new OsTypeOption(existing.OsTypeId, existing.Code, existing.Name));

        var code = name.ToUpperInvariant().Replace(" ", "_");
        var maxSort = await _db.OsTypes.MaxAsync(t => (int?)t.SortOrder, ct) ?? 0;
        var entity = new OsType { Code = code, Name = name, SortOrder = maxSort + 1, IsActive = true };
        _db.OsTypes.Add(entity);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(ListTypes), new OsTypeOption(entity.OsTypeId, entity.Code, entity.Name));
    }

    [HttpGet("~/api/os-versions")]
    public async Task<ActionResult<IEnumerable<OsVersionOption>>> ListVersions([FromQuery] int? osTypeId, CancellationToken ct)
    {
        var query = _db.OsVersions.Where(v => v.IsActive);
        if (osTypeId.HasValue) query = query.Where(v => v.OsTypeId == osTypeId.Value);
        return Ok(await query.OrderBy(v => v.SortOrder)
            .Select(v => new OsVersionOption(v.OsVersionId, v.OsTypeId, v.Name)).ToListAsync(ct));
    }

    [HttpPost("~/api/os-versions")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<OsVersionOption>> CreateVersion([FromBody] CreateOsVersionRequest request, CancellationToken ct)
    {
        var name = request.Name.Trim();
        if (name.Length == 0) return BadRequest(new { message = "Name is required." });

        if (!await _db.OsTypes.AnyAsync(t => t.OsTypeId == request.OsTypeId, ct))
        {
            return BadRequest(new { message = "OS Type not found." });
        }

        var existing = await _db.OsVersions.FirstOrDefaultAsync(v => v.OsTypeId == request.OsTypeId && v.Name == name, ct);
        if (existing is not null) return Ok(new OsVersionOption(existing.OsVersionId, existing.OsTypeId, existing.Name));

        var maxSort = await _db.OsVersions.Where(v => v.OsTypeId == request.OsTypeId).MaxAsync(v => (int?)v.SortOrder, ct) ?? 0;
        var entity = new OsVersion { OsTypeId = request.OsTypeId, Name = name, SortOrder = maxSort + 1, IsActive = true };
        _db.OsVersions.Add(entity);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(ListVersions), new OsVersionOption(entity.OsVersionId, entity.OsTypeId, entity.Name));
    }
}
