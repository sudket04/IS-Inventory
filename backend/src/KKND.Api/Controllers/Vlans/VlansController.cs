using System.Security.Claims;
using KKND.Infrastructure;
using KKND.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace KKND.Api.Controllers.Vlans;

/// <summary>
/// v1.1.1 VLAN/IPAM module (docs/database/04-vlan-module.sql): dbo.vlans (one row per Subnet —
/// a VLAN with a Secondary subnet is two rows sharing the same vlan_number/name),
/// dbo.vlan_ip_ranges (Static/DHCP/Reserved/Excluded pools within a subnet) and
/// dbo.vlan_devices (which asset is the Gateway/DHCP server/Trunk/Access port for a VLAN).
/// Nearly every network rule (valid IPv4, subnet boundary, gateway-in-subnet, DHCP field
/// consistency, Untagged-implies-no-number) is already a CHECK constraint on dbo.vlans —
/// this controller only translates SQL error 547 into a message naming which rule failed,
/// the same "trust the database" approach used by Racks/Clusters.
/// </summary>
[ApiController]
[Authorize(Policy = "AnyRole")]
public sealed class VlansController : ControllerBase
{
    private readonly KkndDbContext _db;

    public VlansController(KkndDbContext db)
    {
        _db = db;
    }

    // --- VLAN ---

    [HttpGet("api/vlans")]
    public async Task<ActionResult<IReadOnlyList<VlanListItem>>> List(CancellationToken ct)
    {
        var items = await _db.VwVlanSummaries
            .OrderBy(v => v.SiteId).ThenBy(v => v.VlanNumber).ThenBy(v => v.VlanName)
            .Select(v => new VlanListItem(
                v.VlanId, v.VlanNumber, v.IsUntagged, v.NetworkLevel, v.VlanName,
                v.ZoneCode, v.ZoneName, v.ZoneColor, v.IsInternetFacing,
                v.Cidr, v.UsableAddresses, v.PoolCoveragePercent, v.StaticUtilizationPercent,
                v.GatewayIp, v.GatewayAssetTag, v.IpAssignmentMode, v.DhcpSourceType,
                v.SiteId, v.SiteName, v.IsActive))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("api/vlans/{id:int}")]
    public async Task<ActionResult<VlanDetail>> Get(int id, CancellationToken ct)
    {
        var detail = await GetDetail(id, ct);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpGet("api/vlans/issues")]
    public async Task<ActionResult<IReadOnlyList<VlanIssueItem>>> AllIssues(CancellationToken ct) =>
        Ok(await _db.VwVlanValidationIssues
            .Select(i => new VlanIssueItem(i.VlanId, i.VlanNumber, i.VlanName, i.IssueCode, i.Severity, i.IssueDetail))
            .ToListAsync(ct));

    [HttpGet("api/vlans/{vlanId:int}/issues")]
    public async Task<ActionResult<IReadOnlyList<VlanIssueItem>>> Issues(int vlanId, CancellationToken ct) =>
        Ok(await _db.VwVlanValidationIssues
            .Where(i => i.VlanId == vlanId)
            .Select(i => new VlanIssueItem(i.VlanId, i.VlanNumber, i.VlanName, i.IssueCode, i.Severity, i.IssueDetail))
            .ToListAsync(ct));

    [HttpPost("api/vlans")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<VlanDetail>> Create([FromBody] VlanRequest request, CancellationToken ct)
    {
        var entity = new Vlan();
        Apply(entity, request);
        entity.CreatedAt = DateTimeOffset.UtcNow;
        entity.CreatedBy = CurrentUserId();
        _db.Vlans.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = $"A VLAN already uses subnet {request.NetworkAddress}/{request.PrefixLength}, or this device already has a Primary subnet with this VLAN number." });
        }
        catch (DbUpdateException ex) when (TryGetCheckViolationMessage(ex, out var message))
        {
            return BadRequest(new { message });
        }

        await LogAsync("CREATE", entity.VlanId, entity.Name, ct);
        return Ok(await GetDetail(entity.VlanId, ct));
    }

    [HttpPut("api/vlans/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<VlanDetail>> Update(int id, [FromBody] VlanRequest request, CancellationToken ct)
    {
        var entity = await _db.Vlans.FirstOrDefaultAsync(v => v.VlanId == id, ct);
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
            return Conflict(new { message = $"A VLAN already uses subnet {request.NetworkAddress}/{request.PrefixLength}, or this device already has a Primary subnet with this VLAN number." });
        }
        catch (DbUpdateException ex) when (TryGetCheckViolationMessage(ex, out var message))
        {
            return BadRequest(new { message });
        }

        await LogAsync("UPDATE", entity.VlanId, entity.Name, ct);
        return Ok(await GetDetail(entity.VlanId, ct));
    }

    [HttpDelete("api/vlans/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Vlans.FirstOrDefaultAsync(v => v.VlanId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        _db.Vlans.Remove(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsCheckOrFkViolation(ex))
        {
            return Conflict(new { message = "This VLAN still has IP ranges, devices, or tracked IP addresses referencing it. Remove those first." });
        }

        await LogAsync("DELETE", id, entity.Name, ct);
        return NoContent();
    }

    // --- IP Ranges ---

    [HttpGet("api/vlans/{vlanId:int}/ranges")]
    public async Task<ActionResult<IReadOnlyList<VlanIpRangeItem>>> Ranges(int vlanId, CancellationToken ct) =>
        Ok(await RangeQuery(_db.VlanIpRanges.Where(r => r.VlanId == vlanId)).ToListAsync(ct));

    [HttpPost("api/vlans/{vlanId:int}/ranges")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<VlanIpRangeItem>> AddRange(int vlanId, [FromBody] VlanIpRangeRequest request, CancellationToken ct)
    {
        if (!await _db.Vlans.AnyAsync(v => v.VlanId == vlanId, ct))
        {
            return NotFound(new { message = "VLAN not found." });
        }
        if (request.DhcpServerAssetId is int assetId && !await _db.Assets.AnyAsync(a => a.AssetId == assetId && !a.IsDeleted, ct))
        {
            return BadRequest(new { message = $"Asset #{assetId} not found." });
        }

        var entity = new VlanIpRange { VlanId = vlanId };
        ApplyRange(entity, request);
        entity.CreatedAt = DateTimeOffset.UtcNow;
        entity.CreatedBy = CurrentUserId();
        _db.VlanIpRanges.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (TryGetCheckViolationMessage(ex, out var message))
        {
            return BadRequest(new { message });
        }

        return Ok(await RangeQuery(_db.VlanIpRanges.Where(r => r.RangeId == entity.RangeId)).FirstAsync(ct));
    }

    [HttpPut("api/vlan-ranges/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<VlanIpRangeItem>> UpdateRange(int id, [FromBody] VlanIpRangeRequest request, CancellationToken ct)
    {
        var entity = await _db.VlanIpRanges.FirstOrDefaultAsync(r => r.RangeId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }
        if (request.DhcpServerAssetId is int assetId && !await _db.Assets.AnyAsync(a => a.AssetId == assetId && !a.IsDeleted, ct))
        {
            return BadRequest(new { message = $"Asset #{assetId} not found." });
        }

        ApplyRange(entity, request);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (TryGetCheckViolationMessage(ex, out var message))
        {
            return BadRequest(new { message });
        }

        return Ok(await RangeQuery(_db.VlanIpRanges.Where(r => r.RangeId == id)).FirstAsync(ct));
    }

    [HttpDelete("api/vlan-ranges/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<IActionResult> DeleteRange(int id, CancellationToken ct)
    {
        var entity = await _db.VlanIpRanges.FirstOrDefaultAsync(r => r.RangeId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        _db.VlanIpRanges.Remove(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsCheckOrFkViolation(ex))
        {
            return Conflict(new { message = "This range still has tracked IP addresses referencing it. Remove those first." });
        }

        return NoContent();
    }

    // --- Devices ---

    [HttpGet("api/vlans/{vlanId:int}/devices")]
    public async Task<ActionResult<IReadOnlyList<VlanDeviceItem>>> Devices(int vlanId, CancellationToken ct) =>
        Ok(await DeviceQuery(_db.VlanDevices.Where(d => d.VlanId == vlanId)).ToListAsync(ct));

    [HttpPost("api/vlans/{vlanId:int}/devices")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<VlanDeviceItem>> AddDevice(int vlanId, [FromBody] VlanDeviceRequest request, CancellationToken ct)
    {
        if (!await _db.Vlans.AnyAsync(v => v.VlanId == vlanId, ct))
        {
            return NotFound(new { message = "VLAN not found." });
        }
        var asset = await _db.Assets.FirstOrDefaultAsync(a => a.AssetId == request.AssetId && !a.IsDeleted, ct);
        if (asset is null)
        {
            return BadRequest(new { message = $"Asset #{request.AssetId} not found." });
        }

        var entity = new VlanDevice
        {
            VlanId = vlanId,
            AssetId = request.AssetId,
            DeviceRole = request.DeviceRole,
            InterfaceName = string.IsNullOrWhiteSpace(request.InterfaceName) ? null : request.InterfaceName.Trim(),
            IsTagged = request.IsTagged,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
            CreatedBy = CurrentUserId(),
        };
        _db.VlanDevices.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { message = $"{asset.AssetTag} is already linked to this VLAN with the role \"{request.DeviceRole}\"." });
        }
        catch (DbUpdateException ex) when (TryGetCheckViolationMessage(ex, out var message))
        {
            return BadRequest(new { message });
        }

        return Ok(await DeviceQuery(_db.VlanDevices.Where(d => d.VlanDeviceId == entity.VlanDeviceId)).FirstAsync(ct));
    }

    [HttpDelete("api/vlan-devices/{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<IActionResult> DeleteDevice(int id, CancellationToken ct)
    {
        var entity = await _db.VlanDevices.FirstOrDefaultAsync(d => d.VlanDeviceId == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        _db.VlanDevices.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // --- Helpers ---

    /// <summary>
    /// Any filter must be applied to `source` (the entity queryable) BEFORE calling this —
    /// composing .Where/.First on the IQueryable&lt;VlanIpRangeItem&gt; this returns doesn't
    /// translate to SQL once the Select has a conditional navigation property in it (EF Core
    /// tries to push the predicate into the projection lambda and fails); confirmed by testing
    /// against real SQL Server, not from documentation.
    /// </summary>
    private static IQueryable<VlanIpRangeItem> RangeQuery(IQueryable<VlanIpRange> source) =>
        source
            .OrderBy(r => r.StartNumeric)
            .Select(r => new VlanIpRangeItem(
                r.RangeId, r.VlanId, r.RangeType, r.StartIp, r.EndIp,
                r.DhcpSourceType, r.DhcpServerAsset != null ? r.DhcpServerAsset.AssetTag : null,
                r.DhcpServerAsset != null ? r.DhcpServerAsset.Name : null,
                r.Description, r.IsActive));

    /// <summary>Same caveat as <see cref="RangeQuery"/> — filter `source` first.</summary>
    private static IQueryable<VlanDeviceItem> DeviceQuery(IQueryable<VlanDevice> source) =>
        source
            .OrderBy(d => d.DeviceRole)
            .Select(d => new VlanDeviceItem(
                d.VlanDeviceId, d.VlanId, d.AssetId, d.Asset.AssetTag, d.Asset.Name,
                d.DeviceRole, d.InterfaceName, d.IsTagged, d.Notes));

    private async Task<VlanDetail?> GetDetail(int id, CancellationToken ct)
    {
        var summary = await _db.VwVlanSummaries.FirstOrDefaultAsync(v => v.VlanId == id, ct);
        if (summary is null)
        {
            return null;
        }

        var core = await _db.Vlans
            .Where(v => v.VlanId == id)
            .Select(v => new { v.ZoneId, v.GatewayAssetId, v.DhcpServerAssetId, v.CreatedAt, v.UpdatedAt })
            .FirstAsync(ct);

        return new VlanDetail(
            summary.VlanId, summary.VlanNumber, summary.IsUntagged, summary.VlanName, summary.Description,
            core.ZoneId, summary.ZoneName, summary.NetworkLevel,
            summary.NetworkAddress, summary.PrefixLength, summary.Cidr, summary.SubnetMask,
            summary.BroadcastAddress, summary.FirstUsableIp, summary.LastUsableIp,
            summary.TotalAddresses, summary.UsableAddresses,
            summary.GatewayIp, summary.GatewayDeviceRole, core.GatewayAssetId, summary.GatewayAssetTag,
            summary.GatewayInterface,
            summary.IpAssignmentMode, summary.DhcpSourceType, core.DhcpServerAssetId, summary.DhcpServerAssetTag,
            summary.DhcpServerNameRaw, summary.DhcpRelayIp, summary.DhcpLeaseHours,
            summary.DnsPrimary, summary.DnsSecondary, summary.DomainName,
            summary.SiteId, summary.SiteName, summary.IsActive, summary.Notes,
            core.CreatedAt, core.UpdatedAt);
    }

    private static void Apply(Vlan e, VlanRequest d)
    {
        e.VlanNumber = d.IsUntagged ? null : d.VlanNumber;
        e.IsUntagged = d.IsUntagged;
        e.Name = d.Name.Trim();
        e.Description = string.IsNullOrWhiteSpace(d.Description) ? null : d.Description.Trim();
        e.ZoneId = d.ZoneId;
        e.NetworkLevel = d.NetworkLevel;
        e.NetworkAddress = d.NetworkAddress.Trim();
        e.PrefixLength = d.PrefixLength;
        e.GatewayIp = string.IsNullOrWhiteSpace(d.GatewayIp) ? null : d.GatewayIp.Trim();
        e.GatewayDeviceRole = string.IsNullOrWhiteSpace(d.GatewayDeviceRole) ? null : d.GatewayDeviceRole;
        e.GatewayAssetId = d.GatewayAssetId;
        e.GatewayInterface = string.IsNullOrWhiteSpace(d.GatewayInterface) ? null : d.GatewayInterface.Trim();
        e.IpAssignmentMode = d.IpAssignmentMode;
        e.DhcpSourceType = d.IpAssignmentMode == "STATIC_ONLY" ? null : d.DhcpSourceType;
        e.DhcpServerAssetId = d.IpAssignmentMode == "STATIC_ONLY" ? null : d.DhcpServerAssetId;
        e.DhcpServerNameRaw = d.IpAssignmentMode == "STATIC_ONLY" || string.IsNullOrWhiteSpace(d.DhcpServerNameRaw) ? null : d.DhcpServerNameRaw.Trim();
        e.DhcpRelayIp = d.IpAssignmentMode == "STATIC_ONLY" || string.IsNullOrWhiteSpace(d.DhcpRelayIp) ? null : d.DhcpRelayIp.Trim();
        e.DhcpLeaseHours = d.IpAssignmentMode == "STATIC_ONLY" ? null : d.DhcpLeaseHours;
        e.DnsPrimary = string.IsNullOrWhiteSpace(d.DnsPrimary) ? null : d.DnsPrimary.Trim();
        e.DnsSecondary = string.IsNullOrWhiteSpace(d.DnsSecondary) ? null : d.DnsSecondary.Trim();
        e.DomainName = string.IsNullOrWhiteSpace(d.DomainName) ? null : d.DomainName.Trim();
        e.SiteId = d.SiteId;
        e.IsActive = d.IsActive;
        e.Notes = string.IsNullOrWhiteSpace(d.Notes) ? null : d.Notes.Trim();
    }

    private static void ApplyRange(VlanIpRange e, VlanIpRangeRequest d)
    {
        e.RangeType = d.RangeType;
        e.StartIp = d.StartIp.Trim();
        e.EndIp = d.EndIp.Trim();
        e.DhcpSourceType = d.RangeType == "DHCP" ? d.DhcpSourceType : null;
        e.DhcpServerAssetId = d.RangeType == "DHCP" ? d.DhcpServerAssetId : null;
        e.Description = string.IsNullOrWhiteSpace(d.Description) ? null : d.Description.Trim();
        e.IsActive = d.IsActive;
    }

    private async Task LogAsync(string action, int vlanId, string label, CancellationToken ct)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = action,
            EntityType = "vlan",
            EntityId = vlanId,
            EntityLabel = label,
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

    private static bool IsCheckOrFkViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException sqlEx && sqlEx.Number == 547;

    /// <summary>
    /// dbo.vlans/dbo.vlan_ip_ranges have ~20 CHECK constraints enforcing network rules
    /// (valid IPv4, subnet boundary, gateway-in-subnet, DHCP field consistency, etc. — see
    /// docs/database/04-vlan-module.sql §3–4). SQL Server's own error text names the
    /// constraint but isn't user-friendly, so this maps the constraint name it reports back
    /// to the same message this codebase already shows for that rule (asset-form.tsx isn't
    /// involved — this is purely a server-side translation, same idea as the Rack trigger).
    /// </summary>
    private static bool TryGetCheckViolationMessage(DbUpdateException ex, out string message)
    {
        if (ex.InnerException is not SqlException sqlEx || sqlEx.Number != 547)
        {
            message = string.Empty;
            return false;
        }

        var text = sqlEx.Message;
        message = text switch
        {
            _ when text.Contains("CK_vlans_untagged_consistency") =>
                "An untagged VLAN must not have a VLAN number, and a VLAN with a number must not be marked untagged.",
            _ when text.Contains("CK_vlans_network_boundary") =>
                "Network address must be the subnet's base address, not a host address (e.g. 10.10.20.0/24, not 10.10.20.5/24).",
            _ when text.Contains("CK_vlans_gateway_in_subnet") =>
                "Gateway IP must fall within this VLAN's own subnet.",
            _ when text.Contains("CK_vlans_number_range") =>
                "VLAN number must be between 1 and 4094.",
            _ when text.Contains("CK_vlans_prefix") =>
                "Prefix length must be between 8 and 32.",
            _ when text.Contains("CK_vlans_level") =>
                "Subnet level must be PRIMARY or SECONDARY.",
            _ when text.Contains("CK_vlans_gw_role") =>
                "Gateway device role must be FIREWALL, CORE_SWITCH, L3_SWITCH, ROUTER, or OTHER.",
            _ when text.Contains("CK_vlans_mode") =>
                "IP assignment mode must be STATIC_ONLY, DHCP_ONLY, or MIXED.",
            _ when text.Contains("CK_vlans_dhcp_source") =>
                "DHCP source type is not one of the recognized options.",
            _ when text.Contains("CK_vlans_dhcp_consistency") =>
                "DHCP fields must be left empty for STATIC_ONLY, and DHCP source must be set for DHCP_ONLY/MIXED.",
            _ when text.Contains("CK_vlans_lease") =>
                "DHCP lease hours must be greater than zero.",
            _ when text.Contains("CK_ranges_order") =>
                "Range start IP must not be greater than the end IP.",
            _ when text.Contains("CK_ranges_type") =>
                "Range type must be STATIC, DHCP, RESERVED, or EXCLUDED.",
            _ when text.Contains("CK_ranges_dhcp_only") =>
                "Only DHCP ranges may specify a DHCP source.",
            _ when text.Contains("CK_vlandev_role") =>
                "Device role must be GATEWAY, DHCP_SERVER, DHCP_RELAY, TRUNK, or ACCESS.",
            _ when text.Contains("_ip") || text.Contains("dns") =>
                "One or more IP address fields are not valid IPv4 addresses.",
            _ => "This VLAN configuration violates a network rule. Check IP formats, VLAN number range, and DHCP settings.",
        };
        return true;
    }
}
