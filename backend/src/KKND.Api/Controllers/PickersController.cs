using KKND.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KKND.Api.Controllers;

/// <summary>
/// Minimal id+label lists for form dropdowns (Asset create/edit and similar). Read-only,
/// available to every role — unlike the Lookups CRUD endpoints, which are Admin-only.
/// </summary>
[ApiController]
[Route("api/pickers")]
[Authorize(Policy = "AnyRole")]
public sealed class PickersController : ControllerBase
{
    private readonly KkndDbContext _db;

    public PickersController(KkndDbContext db)
    {
        _db = db;
    }

    public sealed record Option(int Id, string Label);

    [HttpGet("departments")]
    public async Task<ActionResult<IEnumerable<Option>>> Departments(CancellationToken ct) =>
        Ok(await _db.Departments.Where(d => d.IsActive).OrderBy(d => d.Name)
            .Select(d => new Option(d.DepartmentId, d.Name)).ToListAsync(ct));

    [HttpGet("locations")]
    public async Task<ActionResult<IEnumerable<Option>>> Locations(CancellationToken ct) =>
        Ok(await _db.Locations.Where(l => l.IsActive).OrderBy(l => l.Name)
            .Select(l => new Option(l.LocationId, l.Name)).ToListAsync(ct));

    [HttpGet("vendors")]
    public async Task<ActionResult<IEnumerable<Option>>> Vendors(CancellationToken ct) =>
        Ok(await _db.Vendors.Where(v => v.IsActive).OrderBy(v => v.Name)
            .Select(v => new Option(v.VendorId, v.Name)).ToListAsync(ct));

    [HttpGet("manufacturers")]
    public async Task<ActionResult<IEnumerable<Option>>> Manufacturers(CancellationToken ct) =>
        Ok(await _db.Manufacturers.Where(m => m.IsActive).OrderBy(m => m.Name)
            .Select(m => new Option(m.ManufacturerId, m.Name)).ToListAsync(ct));

    [HttpGet("asset-statuses")]
    public async Task<ActionResult<IEnumerable<Option>>> AssetStatuses(CancellationToken ct) =>
        Ok(await _db.AssetStatuses.Where(s => s.IsActive).OrderBy(s => s.SortOrder)
            .Select(s => new Option(s.StatusId, s.Name)).ToListAsync(ct));

    [HttpGet("asset-categories")]
    public async Task<ActionResult<IEnumerable<Option>>> AssetCategories(CancellationToken ct) =>
        Ok(await _db.AssetCategories.Where(c => c.IsActive).OrderBy(c => c.SortOrder)
            .Select(c => new Option(c.CategoryId, c.Name)).ToListAsync(ct));

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<Option>>> Users(CancellationToken ct) =>
        Ok(await _db.Users.Where(u => u.IsActive).OrderBy(u => u.FullName)
            .Select(u => new Option(u.UserId, u.FullName)).ToListAsync(ct));

    [HttpGet("server-roles")]
    public async Task<ActionResult<IEnumerable<Option>>> ServerRoles(CancellationToken ct) =>
        Ok(await _db.ServerRoles.Where(r => r.IsActive).OrderBy(r => r.SortOrder)
            .Select(r => new Option(r.ServerRoleId, r.Name)).ToListAsync(ct));

    [HttpGet("vlan-sites")]
    public async Task<ActionResult<IEnumerable<Option>>> VlanSites(CancellationToken ct) =>
        Ok(await _db.VlanSites.Where(s => s.IsActive).OrderBy(s => s.SortOrder)
            .Select(s => new Option(s.SiteId, s.Name)).ToListAsync(ct));

    [HttpGet("network-zones")]
    public async Task<ActionResult<IEnumerable<Option>>> NetworkZones(CancellationToken ct) =>
        Ok(await _db.NetworkZones.Where(z => z.IsActive).OrderBy(z => z.SortOrder)
            .Select(z => new Option(z.ZoneId, z.Name)).ToListAsync(ct));

    [HttpGet("assets")]
    public async Task<ActionResult<IEnumerable<Option>>> Assets(CancellationToken ct) =>
        Ok(await _db.Assets.Where(a => !a.IsDeleted).OrderBy(a => a.AssetTag)
            .Select(a => new Option(a.AssetId, a.AssetTag + " — " + a.Name)).ToListAsync(ct));
}
