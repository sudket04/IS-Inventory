using IsInventory.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers;

/// <summary>
/// Minimal id+label lists for form dropdowns (Asset create/edit and similar). Read-only,
/// available to every role — unlike the Lookups CRUD endpoints, which are Admin-only.
/// </summary>
[ApiController]
[Route("api/pickers")]
[Authorize(Policy = "AnyRole")]
public sealed class PickersController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public PickersController(IsInventoryDbContext db)
    {
        _db = db;
    }

    public sealed record Option(int Id, string Label);

    [HttpGet("departments")]
    public async Task<ActionResult<IEnumerable<Option>>> Departments(CancellationToken ct) =>
        Ok(await _db.Departments.Where(d => d.IsActive).OrderBy(d => d.Name)
            .Select(d => new Option(d.DepartmentId, d.Name)).ToListAsync(ct));

    [HttpGet("user-sites")]
    public async Task<ActionResult<IEnumerable<Option>>> UserSites(CancellationToken ct) =>
        Ok(await _db.UserSites.OrderBy(s => s.SortOrder)
            .Select(s => new Option(s.SiteId, s.Name)).ToListAsync(ct));

    [HttpGet("user-teams")]
    public async Task<ActionResult<IEnumerable<Option>>> UserTeams(CancellationToken ct) =>
        Ok(await _db.UserTeams.OrderBy(t => t.SortOrder)
            .Select(t => new Option(t.TeamId, t.Name)).ToListAsync(ct));

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

    public sealed record RelationshipTypeOption(int Id, string ForwardName, string InverseName);

    [HttpGet("relationship-types")]
    public async Task<ActionResult<IEnumerable<RelationshipTypeOption>>> RelationshipTypes(CancellationToken ct) =>
        Ok(await _db.RelationshipTypes.Where(t => t.IsActive).OrderBy(t => t.ForwardName)
            .Select(t => new RelationshipTypeOption(t.RelationshipTypeId, t.ForwardName, t.InverseName)).ToListAsync(ct));

    [HttpGet("contracts")]
    public async Task<ActionResult<IEnumerable<Option>>> Contracts(CancellationToken ct) =>
        Ok(await _db.Contracts.OrderByDescending(c => c.CreatedAt)
            .Select(c => new Option(c.ContractId, c.ContractNo)).ToListAsync(ct));

    // v1.5 Permission Control (Sprint 7) — File Shares can only be declared on Server assets
    // (trg_file_shares_validate additionally requires a FILE server_role_assignments row,
    // which FileSharesController upserts on save rather than requiring a separate screen).
    [HttpGet("file-servers")]
    public async Task<ActionResult<IEnumerable<Option>>> FileServers(CancellationToken ct) =>
        Ok(await _db.Assets.Where(a => !a.IsDeleted && a.Category.Code == "SRV").OrderBy(a => a.AssetTag)
            .Select(a => new Option(a.AssetId, a.AssetTag + " — " + a.Name)).ToListAsync(ct));

    public sealed record ClassificationOption(int Id, string Code, string NameTh, string NameEn, byte SensitivityRank, string ColorToken);

    [HttpGet("classification-levels")]
    public async Task<ActionResult<IEnumerable<ClassificationOption>>> ClassificationLevels(CancellationToken ct) =>
        Ok(await _db.FolderClassificationLevels.Where(c => c.IsActive).OrderBy(c => c.SensitivityRank)
            .Select(c => new ClassificationOption(c.ClassificationId, c.Code, c.NameTh, c.NameEn, c.SensitivityRank, c.ColorToken)).ToListAsync(ct));

    public sealed record AccessLevelOption(int Id, string Code, string NameEn, bool CanWrite, string ColorToken);

    [HttpGet("access-levels")]
    public async Task<ActionResult<IEnumerable<AccessLevelOption>>> AccessLevels(CancellationToken ct) =>
        Ok(await _db.AccessLevels.Where(a => a.IsActive).OrderBy(a => a.PrivilegeRank)
            .Select(a => new AccessLevelOption(a.AccessLevelId, a.Code, a.NameEn, a.CanWrite, a.ColorToken)).ToListAsync(ct));

    // AD Groups are populated only once the Sprint 8 Collector Agent syncs them — this list
    // stays empty until then. Forms fall back to free-text entry (ad_group_name_raw) per the
    // v1.5 proposal's explicit design (docs/database/13-permission-control-proposal.md §5.1).
    [HttpGet("ad-groups")]
    public async Task<ActionResult<IEnumerable<Option>>> AdGroups(CancellationToken ct) =>
        Ok(await _db.AdGroups.Where(g => g.IsPresentInAd).OrderBy(g => g.SamAccountName)
            .Select(g => new Option(g.AdGroupId, g.SamAccountName)).ToListAsync(ct));

    [HttpGet("web-categories")]
    public async Task<ActionResult<IEnumerable<Option>>> WebCategories(CancellationToken ct) =>
        Ok(await _db.WebCategories.Where(c => c.IsActive).OrderBy(c => c.SortOrder)
            .Select(c => new Option(c.CategoryId, c.NameEn)).ToListAsync(ct));

    // v1.7 Server Domain (Sprint) — asset_types tree already existed (Sprint 2 taxonomy) but had
    // no UI consumer until now. isVirtual filters the SRV branch: Server Inventory (Hardware)
    // only offers is_virtual=0 types (a VM has no physical form); Server List's "Virtual" create
    // path uses is_virtual=1 (SRV_VM_STD / SRV_APP_VIRT) directly, no picker needed there.
    public sealed record AssetTypeOption(int Id, string Code, string Name, string FullPath, bool IsVirtual, bool CanHostVm, int? ParentTypeId, byte TypeLevel);

    [HttpGet("asset-types")]
    public async Task<ActionResult<IEnumerable<AssetTypeOption>>> AssetTypes(
        [FromQuery] string categoryCode, [FromQuery] bool? isVirtual, CancellationToken ct)
    {
        var query = _db.VwAssetTypeTrees.Where(t => t.CategoryCode == categoryCode && t.IsActive);
        if (isVirtual.HasValue) query = query.Where(t => t.IsVirtual == isVirtual.Value);
        return Ok(await query.OrderBy(t => t.SortOrder)
            .Select(t => new AssetTypeOption(t.AssetTypeId, t.Code, t.Name, t.FullPath, t.IsVirtual, t.CanHostVm, t.ParentTypeId, t.TypeLevel))
            .ToListAsync(ct));
    }

    [HttpGet("server-statuses")]
    public async Task<ActionResult<IEnumerable<Option>>> ServerStatuses(CancellationToken ct) =>
        Ok(await _db.ServerStatuses.Where(s => s.IsActive).OrderBy(s => s.SortOrder)
            .Select(s => new Option(s.ServerStatusId, s.Name)).ToListAsync(ct));

    [HttpGet("clusters")]
    public async Task<ActionResult<IEnumerable<Option>>> Clusters(CancellationToken ct) =>
        Ok(await _db.Clusters.Where(c => c.IsActive).OrderBy(c => c.Name)
            .Select(c => new Option(c.ClusterId, c.Name)).ToListAsync(ct));

    // Network Hardware (Sprint) — Uplink picker, restricted to other Network devices so a
    // switch/firewall can't be wired up as its own uplink target by mistake. excludeAssetId
    // drops the record being edited out of its own picker.
    [HttpGet("network-devices")]
    public async Task<ActionResult<IEnumerable<Option>>> NetworkDevices([FromQuery] int? excludeAssetId, CancellationToken ct) =>
        Ok(await _db.Assets.Where(a => !a.IsDeleted && a.Category.Code == "NET" && a.AssetId != excludeAssetId)
            .OrderBy(a => a.AssetTag)
            .Select(a => new Option(a.AssetId, a.AssetTag + " — " + a.Name)).ToListAsync(ct));
}
