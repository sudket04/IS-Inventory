using IsInventory.Api.Authorization;
using IsInventory.Domain.Security;
using System.Data;
using System.Security.Claims;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Servers;

/// <summary>
/// v1.7 Server Domain — "Server Inventory (Hardware)": physical Server assets (asset_types
/// under SRV with is_virtual=0 only — a VM has no physical form so never appears here) plus
/// all Storage (STG) assets, combined into one hardware-focused register. This is now the
/// *only* way to create/edit SRV or STG assets — AssetsController (api/assets) rejects both
/// category codes (see ManagedElsewhereCategoryCodes there) and only lists/reads them for
/// cross-category browsing. CPU/Memory/Local Disk are entered here for Physical Server
/// hardware and simply appear read-only on the matching Server List entry (same asset row —
/// see ServerListController), per the user's explicit design ("Physical: Criticality กรอกที่
/// Hardware ก่อน... Server List ดึงข้อมูลจาก Hardware มาเลย").
/// </summary>
[ApiController]
[Route("api/server-inventory")]
[Authorize]
[RequiresPermission("server_inventory", PermissionAction.View)]
public sealed class ServerInventoryController : ControllerBase
{
    private static readonly string[] AllowedCategoryCodes = ["SRV", "STG"];

    private readonly IsInventoryDbContext _db;

    public ServerInventoryController(IsInventoryDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ServerInventoryListItem>>> List(
        [FromQuery] string? category, [FromQuery] string? search, CancellationToken ct)
    {
        var query = _db.Assets
            .Where(a => !a.IsDeleted && AllowedCategoryCodes.Contains(a.Category.Code))
            .Where(a => a.Category.Code != "SRV" || (a.AssetType != null && !a.AssetType.IsVirtual));

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(a => a.Category.Code == category);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim();
            query = query.Where(a =>
                EF.Functions.Like(a.AssetTag, $"%{needle}%") ||
                EF.Functions.Like(a.Name, $"%{needle}%") ||
                (a.SerialNumber != null && EF.Functions.Like(a.SerialNumber, $"%{needle}%")));
        }

        var coverage = _db.VwExpiringAssets;

        var items = await query
            .OrderByDescending(a => a.UpdatedAt ?? a.CreatedAt)
            .Select(a => new
            {
                a.AssetId, a.AssetTag, a.Name, CategoryCode = a.Category.Code, CategoryName = a.Category.Name,
                AssetTypeName = a.AssetType != null ? a.AssetType.Name : null,
                ManufacturerName = a.Manufacturer != null ? a.Manufacturer.Name : null,
                a.Model, a.SerialNumber,
                StatusCode = a.Status.Code, StatusName = a.Status.Name, StatusColorToken = a.Status.ColorToken,
                LocationName = a.Location != null ? a.Location.Name : null,
                a.PurchaseDate, a.FixedAssetNo, a.CostCenter,
                InUseByServerList = a.ServerDetail != null && a.ServerDetail.ServerStatusId != null,
                WarrantyUntil = coverage.Where(c => c.AssetId == a.AssetId).Select(c => (DateOnly?)c.CoverageEndDate).FirstOrDefault(),
            })
            .ToListAsync(ct);

        return Ok(items.Select(a => new ServerInventoryListItem(
            a.AssetId, a.AssetTag, a.Name, a.CategoryCode, a.CategoryName, a.AssetTypeName,
            a.ManufacturerName, a.Model, a.SerialNumber, a.StatusCode, a.StatusName, a.StatusColorToken,
            a.LocationName, a.PurchaseDate, a.FixedAssetNo, a.WarrantyUntil, a.CostCenter, a.InUseByServerList)));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ServerInventoryDetail>> Get(int id, CancellationToken ct)
    {
        var asset = await LoadAssetAsync(id, ct);
        if (asset is null) return NotFound();

        return Ok(await ToDetailAsync(asset, ct));
    }

    [HttpPost]
    [RequiresPermission("server_inventory", PermissionAction.Create)]
    public async Task<ActionResult<ServerInventoryDetail>> Create([FromBody] ServerInventoryRequest request, CancellationToken ct)
    {
        var category = await _db.AssetCategories.FindAsync([request.CategoryId], ct);
        if (category is null || !AllowedCategoryCodes.Contains(category.Code))
        {
            return BadRequest(new { error = "invalid_category", message = "Category must be Server or Storage." });
        }

        var assetType = await _db.VwAssetTypeTrees.FirstOrDefaultAsync(t => t.AssetTypeId == request.AssetTypeId, ct);
        if (assetType is null || assetType.CategoryCode != category.Code)
        {
            return BadRequest(new { error = "invalid_asset_type", message = "Asset Type does not belong to the selected category." });
        }
        if (category.Code == "SRV" && assetType.IsVirtual)
        {
            return BadRequest(new { error = "virtual_type_not_allowed", message = "Virtual Machine / Virtual Appliance types are created from Server List, not Server Inventory." });
        }

        var assetTag = await GenerateAssetTagAsync(request.CategoryId, ct);
        var userId = CurrentUserId();

        var asset = new Asset
        {
            AssetTag = assetTag,
            CategoryId = request.CategoryId,
            AssetTypeId = request.AssetTypeId,
            Name = request.Name.Trim(),
            ManufacturerId = request.ManufacturerId,
            Model = request.Model,
            SerialNumber = request.SerialNumber,
            StatusId = request.StatusId,
            LocationId = request.LocationId,
            DepartmentId = request.DepartmentId,
            OwnerUserId = request.OwnerUserId,
            VendorId = request.VendorId,
            PoNumber = request.PoNumber,
            PurchaseDate = request.PurchaseDate,
            PurchasePrice = request.PurchasePrice,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "THB" : request.Currency,
            ReceivedDate = request.ReceivedDate,
            InstallDate = request.InstallDate,
            ServiceStartDate = request.ServiceStartDate,
            FixedAssetNo = request.FixedAssetNo,
            ServiceTag = request.ServiceTag,
            SystemUuid = request.SystemUuid,
            CostCenter = request.CostCenter,
            Notes = request.Notes,
            CreatedBy = userId,
        };

        if (category.Code == "SRV")
        {
            asset.ServerDetail = new ServerDetail
            {
                Hostname = request.Hostname,
                MacAddress = request.MacAddress,
                OsInstallDate = request.OsInstallDate,
                LastPatchDate = request.LastPatchDate,
                Criticality = request.Criticality,
            };
        }
        else
        {
            asset.StorageDetail = new StorageDetail
            {
                MgmtUrl = request.StorageMgmtUrl,
                ControllerCount = request.ControllerCount,
                DiskBayTotal = request.DiskBayTotal,
                DiskBayUsed = request.DiskBayUsed,
                RawCapacityTb = request.RawCapacityTb,
                UsableCapacityTb = request.UsableCapacityTb,
                CacheGb = request.CacheGb,
                SupportedProtocols = request.SupportedProtocols,
                HasDedup = request.HasDedup,
                HasCompression = request.HasCompression,
                HasSnapshot = request.HasSnapshot,
                HasReplication = request.HasReplication,
            };
        }

        _db.Assets.Add(asset);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { error = "duplicate", message = "An asset with this Serial Number or Asset Tag already exists." });
        }

        if (category.Code == "SRV")
        {
            ReplaceHardwareChildren(asset.AssetId, request.Cpus, request.MemoryModules, request.LocalDisks, userId);
            try
            {
                await _db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (TryGetFriendlyMessage(ex, out var msg))
            {
                return BadRequest(new { error = "validation", message = msg });
            }
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "CREATE",
            EntityType = "server_inventory",
            EntityId = asset.AssetId,
            EntityLabel = assetTag,
        });
        await _db.SaveChangesAsync(ct);

        var created = await LoadAssetAsync(asset.AssetId, ct);
        return CreatedAtAction(nameof(Get), new { id = asset.AssetId }, await ToDetailAsync(created!, ct));
    }

    [HttpPut("{id:int}")]
    [RequiresPermission("server_inventory", PermissionAction.Edit)]
    public async Task<ActionResult<ServerInventoryDetail>> Update(int id, [FromBody] ServerInventoryRequest request, CancellationToken ct)
    {
        var asset = await LoadAssetAsync(id, ct);
        if (asset is null) return NotFound();
        if (!AllowedCategoryCodes.Contains(asset.Category.Code)) return NotFound();

        var userId = CurrentUserId();

        asset.Name = request.Name.Trim();
        asset.AssetTypeId = request.AssetTypeId;
        asset.ManufacturerId = request.ManufacturerId;
        asset.Model = request.Model;
        asset.SerialNumber = request.SerialNumber;
        asset.StatusId = request.StatusId;
        asset.LocationId = request.LocationId;
        asset.DepartmentId = request.DepartmentId;
        asset.OwnerUserId = request.OwnerUserId;
        asset.VendorId = request.VendorId;
        asset.PoNumber = request.PoNumber;
        asset.PurchaseDate = request.PurchaseDate;
        asset.PurchasePrice = request.PurchasePrice;
        asset.Currency = string.IsNullOrWhiteSpace(request.Currency) ? asset.Currency : request.Currency;
        asset.ReceivedDate = request.ReceivedDate;
        asset.InstallDate = request.InstallDate;
        asset.ServiceStartDate = request.ServiceStartDate;
        asset.FixedAssetNo = request.FixedAssetNo;
        asset.ServiceTag = request.ServiceTag;
        asset.SystemUuid = request.SystemUuid;
        asset.CostCenter = request.CostCenter;
        asset.Notes = request.Notes;
        asset.UpdatedAt = DateTimeOffset.UtcNow;
        asset.UpdatedBy = userId;

        if (asset.Category.Code == "SRV")
        {
            asset.ServerDetail ??= new ServerDetail { AssetId = asset.AssetId };
            asset.ServerDetail.Hostname = request.Hostname;
            asset.ServerDetail.MacAddress = request.MacAddress;
            asset.ServerDetail.OsInstallDate = request.OsInstallDate;
            asset.ServerDetail.LastPatchDate = request.LastPatchDate;
            asset.ServerDetail.Criticality = request.Criticality;

            ReplaceHardwareChildren(asset.AssetId, request.Cpus, request.MemoryModules, request.LocalDisks, userId);
        }
        else if (asset.StorageDetail is { } gd)
        {
            gd.MgmtUrl = request.StorageMgmtUrl;
            gd.ControllerCount = request.ControllerCount;
            gd.DiskBayTotal = request.DiskBayTotal;
            gd.DiskBayUsed = request.DiskBayUsed;
            gd.RawCapacityTb = request.RawCapacityTb;
            gd.UsableCapacityTb = request.UsableCapacityTb;
            gd.CacheGb = request.CacheGb;
            gd.SupportedProtocols = request.SupportedProtocols;
            gd.HasDedup = request.HasDedup;
            gd.HasCompression = request.HasCompression;
            gd.HasSnapshot = request.HasSnapshot;
            gd.HasReplication = request.HasReplication;
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "UPDATE",
            EntityType = "server_inventory",
            EntityId = asset.AssetId,
            EntityLabel = asset.AssetTag,
        });

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (TryGetFriendlyMessage(ex, out var msg))
        {
            return BadRequest(new { error = "validation", message = msg });
        }

        var updated = await LoadAssetAsync(id, ct);
        return Ok(await ToDetailAsync(updated!, ct));
    }

    [HttpDelete("{id:int}")]
    [RequiresPermission("server_inventory", PermissionAction.Delete)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var asset = await _db.Assets.Include(a => a.Category)
            .SingleOrDefaultAsync(a => a.AssetId == id && !a.IsDeleted, ct);
        if (asset is null || !AllowedCategoryCodes.Contains(asset.Category.Code)) return NotFound();

        var userId = CurrentUserId() ?? throw new InvalidOperationException("Authenticated user has no numeric id.");

        await _db.Database.ExecuteSqlInterpolatedAsync(
            $"EXEC dbo.sp_soft_delete_asset @asset_id={id}, @user_id={userId}", ct);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "DELETE",
            EntityType = "server_inventory",
            EntityId = id,
            EntityLabel = asset.AssetTag,
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

    private Task<Asset?> LoadAssetAsync(int id, CancellationToken ct) =>
        _db.Assets
            .Include(a => a.Category)
            .Include(a => a.AssetType)
            .Include(a => a.ServerDetail)
            .Include(a => a.StorageDetail)
            .SingleOrDefaultAsync(a => a.AssetId == id && !a.IsDeleted, ct)!;

    private async Task<ServerInventoryDetail> ToDetailAsync(Asset a, CancellationToken ct)
    {
        var warrantyUntil = await _db.VwExpiringAssets.Where(c => c.AssetId == a.AssetId)
            .Select(c => (DateOnly?)c.CoverageEndDate).FirstOrDefaultAsync(ct);

        HardwareSummary? summary = null;
        IReadOnlyList<CpuItem>? cpus = null;
        IReadOnlyList<MemoryItem>? memory = null;
        IReadOnlyList<DiskItem>? disks = null;
        var inUseByServerList = false;

        if (a.Category.Code == "SRV")
        {
            var s = await _db.VwServerHardwareSummaries.FirstOrDefaultAsync(v => v.AssetId == a.AssetId, ct);
            summary = new HardwareSummary(s?.CpuSocketCount ?? 0, s?.CpuTotalCores ?? 0, s?.TotalRamGb ?? 0, s?.TotalStorageGb ?? 0);
            cpus = await _db.ServerCpus.Where(c => c.AssetId == a.AssetId).OrderBy(c => c.SortOrder)
                .Select(c => new CpuItem(c.ServerCpuId, c.CpuModel, c.CoreCount)).ToListAsync(ct);
            memory = await _db.ServerMemoryModules.Where(m => m.AssetId == a.AssetId).OrderBy(m => m.SortOrder)
                .Select(m => new MemoryItem(m.MemoryModuleId, m.CapacityGb, m.MemoryType)).ToListAsync(ct);
            disks = await _db.ServerLocalDisks.Where(d => d.AssetId == a.AssetId).OrderBy(d => d.SortOrder)
                .Select(d => new DiskItem(d.LocalDiskId, d.DiskLabel, d.CapacityGb, d.DiskType)).ToListAsync(ct);
            inUseByServerList = a.ServerDetail?.ServerStatusId is not null;
        }

        return new ServerInventoryDetail(
            a.AssetId, a.AssetTag, a.Name, a.CategoryId, a.Category.Code, a.Category.Name,
            a.AssetTypeId, a.AssetType?.Name,
            a.ManufacturerId, a.Model, a.SerialNumber,
            a.StatusId, a.LocationId, a.DepartmentId, a.OwnerUserId, a.VendorId,
            a.PoNumber, a.PurchaseDate, a.PurchasePrice, a.Currency,
            a.ReceivedDate, a.InstallDate, a.ServiceStartDate,
            a.FixedAssetNo, a.ServiceTag, a.SystemUuid, a.CostCenter, a.Notes,
            warrantyUntil, a.CreatedAt, a.UpdatedAt,
            a.ServerDetail?.Hostname, a.ServerDetail?.MacAddress, a.ServerDetail?.OsInstallDate, a.ServerDetail?.LastPatchDate, a.ServerDetail?.Criticality,
            summary, cpus, memory, disks,
            a.StorageDetail?.Hostname, a.StorageDetail?.MgmtUrl, a.StorageDetail?.ControllerCount, a.StorageDetail?.DiskBayTotal, a.StorageDetail?.DiskBayUsed,
            a.StorageDetail?.RawCapacityTb, a.StorageDetail?.UsableCapacityTb, a.StorageDetail?.CacheGb, a.StorageDetail?.SupportedProtocols,
            inUseByServerList);
    }

    private async Task<string> GenerateAssetTagAsync(int categoryId, CancellationToken ct)
    {
        var connection = _db.Database.GetDbConnection();
        var wasClosed = connection.State != ConnectionState.Open;
        if (wasClosed) await connection.OpenAsync(ct);

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "dbo.sp_generate_asset_tag";
            command.CommandType = CommandType.StoredProcedure;

            var categoryParam = new SqlParameter("@category_id", SqlDbType.Int) { Value = categoryId };
            var tagParam = new SqlParameter("@asset_tag", SqlDbType.VarChar, 20) { Direction = ParameterDirection.Output };
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

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException { Number: 2601 or 2627 };

    private static bool TryGetFriendlyMessage(DbUpdateException ex, out string message)
    {
        if (ex.InnerException is SqlException { Number: 547 })
        {
            message = "This request violates a data rule (e.g. RAM/Core Count/Storage cannot be negative or zero-out-of-range).";
            return true;
        }
        if (IsUniqueViolation(ex))
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
