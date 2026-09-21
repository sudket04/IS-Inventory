using IsInventory.Api.Authorization;
using IsInventory.Domain.Security;
using System.Security.Claims;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Servers;

/// <summary>
/// v1.7 Server Domain — "Server List": every SRV asset's workload/OS view, Virtual and
/// Physical alike. Physical entries are the *same* asset row as their Server Inventory
/// (Hardware) registration — Create for Physical attaches workload fields onto an existing,
/// not-yet-activated Hardware asset rather than making a new one; CPU/Memory/Storage shown
/// here for a Physical entry are read-only (sourced from Server Inventory, same child-table
/// rows). Virtual entries have no Hardware counterpart at all — Create makes a brand-new
/// asset (asset_type defaults to SRV_VM_STD) with its own CPU/Memory/Storage entered here
/// directly, and ties to a Cluster (never to one specific physical Host — a VM can vMotion,
/// so pinning it to a Host asset would go stale immediately; see HANDOFF.md for the fuller
/// reasoning that led here, including why hosting type reads from asset_types.is_virtual
/// rather than a new column — server_type was tried once already and dropped in v1.3a).
/// </summary>
[ApiController]
[Route("api/server-list")]
[Authorize]
[RequiresPermission("server_list", PermissionAction.View)]
public sealed class ServerListController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public ServerListController(IsInventoryDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ServerListItem>>> List([FromQuery] string? hostingType, [FromQuery] string? search, CancellationToken ct)
    {
        var query = _db.Assets.Where(a => !a.IsDeleted && a.Category.Code == "SRV" && a.ServerDetail != null && a.ServerDetail.ServerStatusId != null);

        if (string.Equals(hostingType, "Virtual", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(a => a.AssetType != null && a.AssetType.IsVirtual);
        }
        else if (string.Equals(hostingType, "Physical", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(a => a.AssetType == null || !a.AssetType.IsVirtual);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim();
            query = query.Where(a =>
                EF.Functions.Like(a.Name, $"%{needle}%") ||
                (a.ServerDetail!.Hostname != null && EF.Functions.Like(a.ServerDetail.Hostname, $"%{needle}%")) ||
                (a.ServerDetail!.Fqdn != null && EF.Functions.Like(a.ServerDetail.Fqdn, $"%{needle}%")));
        }

        var items = await query
            .OrderByDescending(a => a.UpdatedAt ?? a.CreatedAt)
            .Select(a => new
            {
                a.AssetId, a.AssetTag, a.Name,
                IsVirtual = a.AssetType != null && a.AssetType.IsVirtual,
                ClusterName = a.ServerDetail!.Cluster != null ? a.ServerDetail.Cluster.Name : null,
                ManufacturerName = a.Manufacturer != null ? a.Manufacturer.Name : null, a.Model,
                a.ServerDetail.Environment, a.ServerDetail.Criticality,
                ServerStatusCode = a.ServerDetail.ServerStatus != null ? a.ServerDetail.ServerStatus.Code : null,
                ServerStatusName = a.ServerDetail.ServerStatus != null ? a.ServerDetail.ServerStatus.Name : null,
                ServerStatusColorToken = a.ServerDetail.ServerStatus != null ? a.ServerDetail.ServerStatus.ColorToken : null,
                OsTypeName = a.ServerDetail.OsType != null ? a.ServerDetail.OsType.Name : null,
                OsVersionName = a.ServerDetail.OsVersion != null ? a.ServerDetail.OsVersion.Name : null,
                OwnerFullName = a.OwnerUser != null ? a.OwnerUser.FullName : null,
                a.UpdatedAt,
            })
            .ToListAsync(ct);

        return Ok(items.Select(a => new ServerListItem(
            a.AssetId, a.AssetTag, a.Name, a.IsVirtual,
            a.ClusterName, a.IsVirtual ? null : $"{a.ManufacturerName} {a.Model}".Trim(),
            a.Environment, a.Criticality,
            a.ServerStatusCode, a.ServerStatusName, a.ServerStatusColorToken,
            a.OsTypeName, a.OsVersionName, a.OwnerFullName, a.UpdatedAt)));
    }

    [HttpGet("available-hardware")]
    public async Task<ActionResult<IReadOnlyList<AvailableHardwareItem>>> AvailableHardware(CancellationToken ct) =>
        Ok(await _db.Assets
            .Where(a => !a.IsDeleted && a.Category.Code == "SRV"
                && a.AssetType != null && !a.AssetType.IsVirtual
                && (a.ServerDetail == null || a.ServerDetail.ServerStatusId == null))
            .OrderBy(a => a.AssetTag)
            .Select(a => new AvailableHardwareItem(a.AssetId, a.AssetTag, a.Name,
                a.Manufacturer != null ? a.Manufacturer.Name : null, a.Model, a.SerialNumber))
            .ToListAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ServerListDetail>> Get(int id, CancellationToken ct)
    {
        var asset = await LoadAssetAsync(id, ct);
        if (asset is null || asset.Category.Code != "SRV" || asset.ServerDetail?.ServerStatusId is null) return NotFound();

        return Ok(await ToDetailAsync(asset, ct));
    }

    [HttpPost]
    [RequiresPermission("server_list", PermissionAction.Create)]
    public async Task<ActionResult<ServerListDetail>> Create([FromBody] ServerListCreateRequest request, CancellationToken ct)
    {
        var userId = CurrentUserId();

        if (!await _db.ServerStatuses.AnyAsync(s => s.ServerStatusId == request.ServerStatusId, ct))
        {
            return BadRequest(new { error = "invalid_status", message = "Server Status not found." });
        }

        Asset asset;

        if (request.IsVirtual)
        {
            if (request.ClusterId is null)
            {
                return BadRequest(new { error = "cluster_required", message = "A Virtual server must belong to a Cluster." });
            }
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { error = "name_required", message = "System name is required." });
            }

            var vmType = await _db.AssetTypes.FirstOrDefaultAsync(t => t.Code == "SRV_VM_STD", ct);
            if (vmType is null)
            {
                return StatusCode(500, new { message = "SRV_VM_STD asset type is missing from taxonomy seed data." });
            }

            var srvCategory = await _db.AssetCategories.FirstAsync(c => c.Code == "SRV", ct);
            var assetTag = await GenerateAssetTagAsync(srvCategory.CategoryId, ct);

            asset = new Asset
            {
                AssetTag = assetTag,
                CategoryId = srvCategory.CategoryId,
                AssetTypeId = vmType.AssetTypeId,
                Name = request.Name.Trim(),
                StatusId = request.StatusId ?? await DefaultAssetStatusIdAsync(ct),
                LocationId = request.LocationId,
                DepartmentId = request.DepartmentId,
                OwnerUserId = request.OwnerUserId,
                Notes = request.Notes,
                Currency = "THB",
                CreatedBy = userId,
                ServerDetail = new ServerDetail
                {
                    Hostname = request.Hostname,
                    MacAddress = request.MacAddress,
                    OsInstallDate = request.OsInstallDate,
                    LastPatchDate = request.LastPatchDate,
                    ClusterId = request.ClusterId,
                    SystemGroup = request.SystemGroup,
                    Fqdn = request.Fqdn,
                    ServerZoneId = request.ServerZoneId,
                    Environment = request.Environment,
                    Criticality = request.Criticality,
                    ServerStatusId = request.ServerStatusId,
                    OsTypeId = request.OsTypeId,
                    OsVersionId = request.OsVersionId,
                },
            };
            _db.Assets.Add(asset);
        }
        else
        {
            if (request.HardwareAssetId is null)
            {
                return BadRequest(new { error = "hardware_required", message = "Select a registered Server Inventory hardware asset." });
            }

            var hw = await LoadAssetAsync(request.HardwareAssetId.Value, ct);
            if (hw is null || hw.Category.Code != "SRV" || hw.AssetType is null || hw.AssetType.IsVirtual)
            {
                return BadRequest(new { error = "invalid_hardware", message = "Hardware asset not found or is not a Physical Server type." });
            }
            if (hw.ServerDetail?.ServerStatusId is not null)
            {
                return Conflict(new { error = "already_activated", message = "This hardware is already a Server List entry." });
            }

            hw.ServerDetail ??= new ServerDetail { AssetId = hw.AssetId };
            hw.ServerDetail.ClusterId = null;
            hw.ServerDetail.SystemGroup = request.SystemGroup;
            hw.ServerDetail.Fqdn = request.Fqdn;
            hw.ServerDetail.ServerZoneId = request.ServerZoneId;
            hw.ServerDetail.Environment = request.Environment;
            hw.ServerDetail.ServerStatusId = request.ServerStatusId;
            hw.ServerDetail.OsTypeId = request.OsTypeId;
            hw.ServerDetail.OsVersionId = request.OsVersionId;
            // Criticality/Hostname/MacAddress/OS install-patch dates/CPU/RAM/Storage stay
            // whatever was entered on the Hardware record — this endpoint never overwrites them.
            asset = hw;
        }

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (TryGetFriendlyMessage(ex, out var msg))
        {
            return BadRequest(new { error = "validation", message = msg });
        }

        if (request.IsVirtual)
        {
            ReplaceHardwareChildren(asset.AssetId, request.Cpus, request.MemoryModules, request.LocalDisks, userId);
            await _db.SaveChangesAsync(ct);
        }

        await UpsertIpAsync(asset.AssetId, request.PrimaryIpAddress, "SERVICE", true, userId, ct);
        await UpsertIpAsync(asset.AssetId, request.ManagementIpAddress, "MANAGEMENT", false, userId, ct);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "CREATE",
            EntityType = "server_list",
            EntityId = asset.AssetId,
            EntityLabel = asset.Name,
        });
        await _db.SaveChangesAsync(ct);

        var created = await LoadAssetAsync(asset.AssetId, ct);
        return CreatedAtAction(nameof(Get), new { id = asset.AssetId }, await ToDetailAsync(created!, ct));
    }

    [HttpPut("{id:int}")]
    [RequiresPermission("server_list", PermissionAction.Edit)]
    public async Task<ActionResult<ServerListDetail>> Update(int id, [FromBody] ServerListUpdateRequest request, CancellationToken ct)
    {
        var asset = await LoadAssetAsync(id, ct);
        if (asset is null || asset.Category.Code != "SRV" || asset.ServerDetail?.ServerStatusId is null) return NotFound();

        var userId = CurrentUserId();
        var isVirtual = asset.AssetType?.IsVirtual == true;

        if (!await _db.ServerStatuses.AnyAsync(s => s.ServerStatusId == request.ServerStatusId, ct))
        {
            return BadRequest(new { error = "invalid_status", message = "Server Status not found." });
        }

        if (isVirtual)
        {
            if (request.Name is { } n && n.Trim().Length > 0) asset.Name = n.Trim();
            if (request.StatusId.HasValue) asset.StatusId = request.StatusId.Value;
            asset.LocationId = request.LocationId;
            asset.DepartmentId = request.DepartmentId;
            asset.OwnerUserId = request.OwnerUserId;
            asset.Notes = request.Notes;
            asset.UpdatedAt = DateTimeOffset.UtcNow;
            asset.UpdatedBy = userId;

            asset.ServerDetail!.Hostname = request.Hostname;
            asset.ServerDetail.MacAddress = request.MacAddress;
            asset.ServerDetail.OsInstallDate = request.OsInstallDate;
            asset.ServerDetail.LastPatchDate = request.LastPatchDate;
            asset.ServerDetail.ClusterId = request.ClusterId;
            asset.ServerDetail.Criticality = request.Criticality;

            ReplaceHardwareChildren(asset.AssetId, request.Cpus, request.MemoryModules, request.LocalDisks, userId);
        }

        // Common workload fields — editable for both Virtual and Physical (Physical never
        // touches Hostname/MacAddress/OsInstallDate/LastPatchDate/Criticality/CPU/RAM/Storage
        // here; those stay owned by Server Inventory).
        asset.ServerDetail!.SystemGroup = request.SystemGroup;
        asset.ServerDetail.Fqdn = request.Fqdn;
        asset.ServerDetail.ServerZoneId = request.ServerZoneId;
        asset.ServerDetail.Environment = request.Environment;
        asset.ServerDetail.ServerStatusId = request.ServerStatusId;
        asset.ServerDetail.OsTypeId = request.OsTypeId;
        asset.ServerDetail.OsVersionId = request.OsVersionId;

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (TryGetFriendlyMessage(ex, out var msg))
        {
            return BadRequest(new { error = "validation", message = msg });
        }

        await UpsertIpAsync(asset.AssetId, request.PrimaryIpAddress, "SERVICE", true, userId, ct);
        await UpsertIpAsync(asset.AssetId, request.ManagementIpAddress, "MANAGEMENT", false, userId, ct);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "UPDATE",
            EntityType = "server_list",
            EntityId = asset.AssetId,
            EntityLabel = asset.Name,
        });
        await _db.SaveChangesAsync(ct);

        var updated = await LoadAssetAsync(id, ct);
        return Ok(await ToDetailAsync(updated!, ct));
    }

    [HttpDelete("{id:int}")]
    [RequiresPermission("server_list", PermissionAction.Delete)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var asset = await LoadAssetAsync(id, ct);
        if (asset is null || asset.Category.Code != "SRV" || asset.ServerDetail?.ServerStatusId is null) return NotFound();

        var userId = CurrentUserId();
        var isVirtual = asset.AssetType?.IsVirtual == true;

        if (isVirtual)
        {
            var uid = userId ?? throw new InvalidOperationException("Authenticated user has no numeric id.");
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"EXEC dbo.sp_soft_delete_asset @asset_id={id}, @user_id={uid}", ct);
        }
        else
        {
            // Detach only — the Hardware asset itself keeps living in Server Inventory,
            // just becomes available again in the "available-hardware" picker.
            asset.ServerDetail!.ClusterId = null;
            asset.ServerDetail.SystemGroup = null;
            asset.ServerDetail.Fqdn = null;
            asset.ServerDetail.ServerZoneId = null;
            asset.ServerDetail.Environment = null;
            asset.ServerDetail.ServerStatusId = null;
            asset.ServerDetail.OsTypeId = null;
            asset.ServerDetail.OsVersionId = null;
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "DELETE",
            EntityType = "server_list",
            EntityId = id,
            EntityLabel = asset.Name,
        });
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    // ---------- helpers ----------

    private void ReplaceHardwareChildren(int assetId, IReadOnlyList<CpuRequest>? cpus, IReadOnlyList<MemoryRequest>? memory, IReadOnlyList<DiskRequest>? disks, int? userId)
    {
        _db.ServerCpus.RemoveRange(_db.ServerCpus.Where(c => c.AssetId == assetId));
        _db.ServerMemoryModules.RemoveRange(_db.ServerMemoryModules.Where(m => m.AssetId == assetId));
        _db.ServerLocalDisks.RemoveRange(_db.ServerLocalDisks.Where(d => d.AssetId == assetId));

        var order = 0;
        foreach (var c in cpus ?? [])
        {
            _db.ServerCpus.Add(new ServerCpu { AssetId = assetId, CpuModel = c.CpuModel, CoreCount = c.CoreCount, SortOrder = order++, CreatedBy = userId });
        }
        order = 0;
        foreach (var m in memory ?? [])
        {
            _db.ServerMemoryModules.Add(new ServerMemoryModule { AssetId = assetId, CapacityGb = m.CapacityGb, MemoryType = m.MemoryType, SortOrder = order++, CreatedBy = userId });
        }
        order = 0;
        foreach (var d in disks ?? [])
        {
            _db.ServerLocalDisks.Add(new ServerLocalDisk { AssetId = assetId, DiskLabel = d.DiskLabel, CapacityGb = d.CapacityGb, DiskType = d.DiskType, SortOrder = order++, CreatedBy = userId });
        }
    }

    /// <summary>
    /// Raw SQL by design, not EF entity tracking — this runs right after one or two other
    /// SaveChangesAsync calls already flushed on the same DbContext in Create()/Update(), and
    /// a failed *tracked* insert/update here (bad format, already claimed elsewhere) was
    /// observed to stay in the ChangeTracker and resurface — still failing — on the next
    /// unrelated SaveChangesAsync (e.g. the audit log write), turning a soft, swallowable
    /// error into a hard 500 on an unrelated statement. Raw SQL sidesteps that entirely: each
    /// statement either commits or throws right here, nothing lingers to fail later. IP here
    /// is optional metadata only (VLAN/IPAM module is the source of truth for real
    /// allocation), so any failure is caught and skipped rather than failing the whole save.
    /// </summary>
    private async Task UpsertIpAsync(int assetId, string? ipAddress, string purpose, bool isPrimary, int? userId, CancellationToken ct)
    {
        try
        {
            await _db.Database.ExecuteSqlInterpolatedAsync($@"
                UPDATE dbo.ip_addresses SET status = 'RELEASED', released_date = CAST(SYSUTCDATETIME() AS DATE),
                    updated_at = SYSDATETIMEOFFSET(), updated_by = {userId}
                WHERE asset_id = {assetId} AND ip_purpose = {purpose} AND released_date IS NULL", ct);

            if (!string.IsNullOrWhiteSpace(ipAddress))
            {
                await _db.Database.ExecuteSqlInterpolatedAsync($@"
                    INSERT INTO dbo.ip_addresses (ip_address, asset_id, ip_purpose, assignment_type, status, is_primary, assigned_date, created_by)
                    VALUES ({ipAddress.Trim()}, {assetId}, {purpose}, 'STATIC', 'IN_USE', {isPrimary}, CAST(SYSUTCDATETIME() AS DATE), {userId})", ct);
            }
        }
        catch (SqlException)
        {
            // Invalid IP format, or already claimed (active) by another asset — skip.
        }
    }

    private Task<Asset?> LoadAssetAsync(int id, CancellationToken ct) =>
        _db.Assets
            .Include(a => a.Category)
            .Include(a => a.AssetType)
            .Include(a => a.Manufacturer)
            .Include(a => a.ServerDetail!).ThenInclude(sd => sd.Cluster)
            .Include(a => a.ServerDetail!).ThenInclude(sd => sd.ServerZone)
            .Include(a => a.ServerDetail!).ThenInclude(sd => sd.ServerStatus)
            .Include(a => a.ServerDetail!).ThenInclude(sd => sd.OsType)
            .Include(a => a.ServerDetail!).ThenInclude(sd => sd.OsVersion)
            .SingleOrDefaultAsync(a => a.AssetId == id && !a.IsDeleted, ct)!;

    private async Task<ServerListDetail> ToDetailAsync(Asset a, CancellationToken ct)
    {
        var isVirtual = a.AssetType?.IsVirtual == true;

        var s = await _db.VwServerHardwareSummaries.FirstOrDefaultAsync(v => v.AssetId == a.AssetId, ct);
        var summary = new HardwareSummary(s?.CpuSocketCount ?? 0, s?.CpuTotalCores ?? 0, s?.TotalRamGb ?? 0, s?.TotalStorageGb ?? 0);
        var cpus = await _db.ServerCpus.Where(c => c.AssetId == a.AssetId).OrderBy(c => c.SortOrder)
            .Select(c => new CpuItem(c.ServerCpuId, c.CpuModel, c.CoreCount)).ToListAsync(ct);
        var memory = await _db.ServerMemoryModules.Where(m => m.AssetId == a.AssetId).OrderBy(m => m.SortOrder)
            .Select(m => new MemoryItem(m.MemoryModuleId, m.CapacityGb, m.MemoryType)).ToListAsync(ct);
        var disks = await _db.ServerLocalDisks.Where(d => d.AssetId == a.AssetId).OrderBy(d => d.SortOrder)
            .Select(d => new DiskItem(d.LocalDiskId, d.DiskLabel, d.CapacityGb, d.DiskType)).ToListAsync(ct);

        var primaryIp = await _db.IpAddresses.Where(i => i.AssetId == a.AssetId && i.IpPurpose == "SERVICE" && i.ReleasedDate == null)
            .Select(i => i.IpAddress1).FirstOrDefaultAsync(ct);
        var mgmtIp = await _db.IpAddresses.Where(i => i.AssetId == a.AssetId && i.IpPurpose == "MANAGEMENT" && i.ReleasedDate == null)
            .Select(i => i.IpAddress1).FirstOrDefaultAsync(ct);

        var sd = a.ServerDetail!;
        return new ServerListDetail(
            a.AssetId, a.AssetTag, a.Name, isVirtual, a.AssetTypeId ?? 0, a.AssetType?.Name ?? "",
            a.StatusId, a.LocationId, a.DepartmentId, a.OwnerUserId, a.Notes,
            sd.Hostname, sd.MacAddress, sd.OsInstallDate, sd.LastPatchDate,
            sd.ClusterId, sd.Cluster?.Name, sd.SystemGroup, sd.Fqdn,
            sd.ServerZoneId, sd.ServerZone?.Name, sd.Environment, sd.Criticality,
            sd.ServerStatusId, sd.ServerStatus?.Name, sd.OsTypeId, sd.OsType?.Name, sd.OsVersionId, sd.OsVersion?.Name,
            primaryIp, mgmtIp,
            summary, cpus, memory, disks,
            a.CreatedAt, a.UpdatedAt);
    }

    private async Task<int> DefaultAssetStatusIdAsync(CancellationToken ct) =>
        (await _db.AssetStatuses.FirstAsync(s => s.Code == "IN_USE", ct)).StatusId;

    private async Task<string> GenerateAssetTagAsync(int categoryId, CancellationToken ct)
    {
        var connection = _db.Database.GetDbConnection();
        var wasClosed = connection.State != System.Data.ConnectionState.Open;
        if (wasClosed) await connection.OpenAsync(ct);

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "dbo.sp_generate_asset_tag";
            command.CommandType = System.Data.CommandType.StoredProcedure;

            var categoryParam = new SqlParameter("@category_id", System.Data.SqlDbType.Int) { Value = categoryId };
            var tagParam = new SqlParameter("@asset_tag", System.Data.SqlDbType.VarChar, 20) { Direction = System.Data.ParameterDirection.Output };
            command.Parameters.Add(categoryParam);
            command.Parameters.Add(tagParam);

            await command.ExecuteNonQueryAsync(ct);
            return (string)tagParam.Value;
        }
        finally
        {
            if (wasClosed) await connection.CloseAsync();
        }
    }

    private static bool TryGetFriendlyMessage(DbUpdateException ex, out string message)
    {
        if (ex.InnerException is SqlException { Number: 547 })
        {
            message = "This request violates a data rule (e.g. RAM/Storage cannot be negative, or a required link is missing).";
            return true;
        }
        if (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            message = "A conflicting record already exists.";
            return true;
        }
        message = "";
        return false;
    }

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }
}
