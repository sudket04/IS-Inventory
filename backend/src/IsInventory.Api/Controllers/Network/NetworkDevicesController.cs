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

namespace IsInventory.Api.Controllers.Network;

/// <summary>
/// "Network Hardware": switches, firewalls, access points, and other network devices
/// (asset category "NET"), broken out into its own module and menu — parallel to Server
/// Inventory — rather than living inside the generic Assets flow. Category/Sub-category
/// classification reuses the existing asset_types NET_* taxonomy (api/pickers/asset-types)
/// so it stays the single source of truth for device classification already shared with
/// Assets/Dashboard/Reports. Management IP is not a raw column on network_details — like
/// Server List's Primary/Management IP, it's synthesized from dbo.ip_addresses (ip_purpose
/// = MANAGEMENT), the system's one IPAM source of truth.
/// </summary>
[ApiController]
[Route("api/network-devices")]
[Authorize]
[RequiresPermission("network_hardware", PermissionAction.View)]
public sealed class NetworkDevicesController : ControllerBase
{
    private const string CategoryCode = "NET";

    private readonly IsInventoryDbContext _db;

    public NetworkDevicesController(IsInventoryDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NetworkDeviceListItem>>> List(
        [FromQuery] string? search, CancellationToken ct)
    {
        var query = _db.Assets.Where(a => !a.IsDeleted && a.Category.Code == CategoryCode);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim();
            query = query.Where(a =>
                EF.Functions.Like(a.AssetTag, $"%{needle}%") ||
                EF.Functions.Like(a.Name, $"%{needle}%") ||
                (a.SerialNumber != null && EF.Functions.Like(a.SerialNumber, $"%{needle}%")) ||
                (a.NetworkDetailAsset != null && a.NetworkDetailAsset.MacAddress != null && EF.Functions.Like(a.NetworkDetailAsset.MacAddress, $"%{needle}%")));
        }

        var items = await query
            .OrderByDescending(a => a.UpdatedAt ?? a.CreatedAt)
            .Select(a => new
            {
                a.AssetId, a.AssetTag, a.Name,
                AssetTypeName = a.AssetType != null ? a.AssetType.Name : null,
                ManufacturerName = a.Manufacturer != null ? a.Manufacturer.Name : null,
                a.Model, a.SerialNumber,
                StatusCode = a.Status.Code, StatusName = a.Status.Name, StatusColorToken = a.Status.ColorToken,
                MacAddress = a.NetworkDetailAsset != null ? a.NetworkDetailAsset.MacAddress : null,
                StackInfo = a.NetworkDetailAsset != null ? a.NetworkDetailAsset.StackInfo : null,
                LocationName = a.Location != null ? a.Location.Name : null,
                EolDate = a.RetireDate,
            })
            .ToListAsync(ct);

        var mgmtIps = await _db.IpAddresses
            .Where(i => i.IpPurpose == "MANAGEMENT" && i.ReleasedDate == null && i.AssetId != null)
            .Select(i => new { i.AssetId, i.IpAddress1 })
            .ToListAsync(ct);
        var mgmtIpByAsset = mgmtIps.GroupBy(i => i.AssetId!.Value).ToDictionary(g => g.Key, g => g.First().IpAddress1);

        return Ok(items.Select(a => new NetworkDeviceListItem(
            a.AssetId, a.AssetTag, a.Name, a.AssetTypeName, a.ManufacturerName, a.Model, a.SerialNumber,
            a.StatusCode, a.StatusName, a.StatusColorToken, a.MacAddress,
            mgmtIpByAsset.GetValueOrDefault(a.AssetId), a.StackInfo, a.LocationName, a.EolDate)));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<NetworkDeviceDetail>> Get(int id, CancellationToken ct)
    {
        var asset = await LoadAssetAsync(id, ct);
        if (asset is null) return NotFound();

        return Ok(await ToDetailAsync(asset, ct));
    }

    [HttpPost]
    [RequiresPermission("network_hardware", PermissionAction.Create)]
    public async Task<ActionResult<NetworkDeviceDetail>> Create([FromBody] NetworkDeviceRequest request, CancellationToken ct)
    {
        var category = await _db.AssetCategories.SingleOrDefaultAsync(c => c.Code == CategoryCode, ct);
        if (category is null)
        {
            return Problem("Network asset category is not seeded.", statusCode: 500);
        }

        var assetType = await _db.VwAssetTypeTrees.FirstOrDefaultAsync(t => t.AssetTypeId == request.AssetTypeId, ct);
        if (assetType is null || assetType.CategoryCode != CategoryCode)
        {
            return BadRequest(new { error = "invalid_asset_type", message = "Asset Type does not belong to the Network category." });
        }

        var assetTag = await GenerateAssetTagAsync(category.CategoryId, ct);
        var userId = CurrentUserId();

        var asset = new Asset
        {
            AssetTag = assetTag,
            CategoryId = category.CategoryId,
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
            CostCenter = request.CostCenter,
            Notes = request.Notes,
            RetireDate = request.EolDate,
            CreatedBy = userId,
            NetworkDetailAsset = new NetworkDetail
            {
                Hostname = request.Hostname,
                MacAddress = request.MacAddress,
                PortCount = request.PortCount,
                PortSpeed = request.PortSpeed,
                PoeSupport = request.PoeSupport,
                FirmwareVersion = request.FirmwareVersion,
                FirmwareUpdatedAt = request.FirmwareUpdatedAt,
                StackInfo = request.StackInfo,
                UplinkAssetId = request.UplinkAssetId,
            },
        };

        _db.Assets.Add(asset);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { error = "duplicate", message = "A network device with this Serial Number, MAC Address, or Asset Tag already exists." });
        }

        await UpsertManagementIpAsync(asset.AssetId, request.ManagementIpAddress, userId, ct);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "CREATE",
            EntityType = "network_hardware",
            EntityId = asset.AssetId,
            EntityLabel = assetTag,
        });
        await _db.SaveChangesAsync(ct);

        var created = await LoadAssetAsync(asset.AssetId, ct);
        return CreatedAtAction(nameof(Get), new { id = asset.AssetId }, await ToDetailAsync(created!, ct));
    }

    [HttpPut("{id:int}")]
    [RequiresPermission("network_hardware", PermissionAction.Edit)]
    public async Task<ActionResult<NetworkDeviceDetail>> Update(int id, [FromBody] NetworkDeviceRequest request, CancellationToken ct)
    {
        var asset = await LoadAssetAsync(id, ct);
        if (asset is null) return NotFound();
        if (asset.Category.Code != CategoryCode) return NotFound();

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
        asset.CostCenter = request.CostCenter;
        asset.Notes = request.Notes;
        asset.RetireDate = request.EolDate;
        asset.UpdatedAt = DateTimeOffset.UtcNow;
        asset.UpdatedBy = userId;

        asset.NetworkDetailAsset ??= new NetworkDetail { AssetId = asset.AssetId };
        asset.NetworkDetailAsset.Hostname = request.Hostname;
        asset.NetworkDetailAsset.MacAddress = request.MacAddress;
        asset.NetworkDetailAsset.PortCount = request.PortCount;
        asset.NetworkDetailAsset.PortSpeed = request.PortSpeed;
        asset.NetworkDetailAsset.PoeSupport = request.PoeSupport;
        asset.NetworkDetailAsset.FirmwareVersion = request.FirmwareVersion;
        asset.NetworkDetailAsset.FirmwareUpdatedAt = request.FirmwareUpdatedAt;
        asset.NetworkDetailAsset.StackInfo = request.StackInfo;
        asset.NetworkDetailAsset.UplinkAssetId = request.UplinkAssetId;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "UPDATE",
            EntityType = "network_hardware",
            EntityId = asset.AssetId,
            EntityLabel = asset.AssetTag,
        });

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return Conflict(new { error = "duplicate", message = "A network device with this Serial Number, MAC Address, or Asset Tag already exists." });
        }

        await UpsertManagementIpAsync(asset.AssetId, request.ManagementIpAddress, userId, ct);

        var updated = await LoadAssetAsync(id, ct);
        return Ok(await ToDetailAsync(updated!, ct));
    }

    [HttpDelete("{id:int}")]
    [RequiresPermission("network_hardware", PermissionAction.Delete)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var asset = await _db.Assets.Include(a => a.Category)
            .SingleOrDefaultAsync(a => a.AssetId == id && !a.IsDeleted, ct);
        if (asset is null || asset.Category.Code != CategoryCode) return NotFound();

        var userId = CurrentUserId() ?? throw new InvalidOperationException("Authenticated user has no numeric id.");

        await _db.Database.ExecuteSqlInterpolatedAsync(
            $"EXEC dbo.sp_soft_delete_asset @asset_id={id}, @user_id={userId}", ct);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "DELETE",
            EntityType = "network_hardware",
            EntityId = id,
            EntityLabel = asset.AssetTag,
        });
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    // ---------- helpers ----------

    /// <summary>
    /// Raw SQL by design, same rationale as ServerListController.UpsertIpAsync: runs after a
    /// SaveChangesAsync already flushed on this DbContext, so tracked-entity failures here
    /// won't resurface on a later, unrelated save. IP here is optional metadata only (the
    /// VLAN/IPAM module is the source of truth for real allocation).
    /// </summary>
    private async Task UpsertManagementIpAsync(int assetId, string? ipAddress, int? userId, CancellationToken ct)
    {
        try
        {
            await _db.Database.ExecuteSqlInterpolatedAsync($@"
                UPDATE dbo.ip_addresses SET status = 'RELEASED', released_date = CAST(SYSUTCDATETIME() AS DATE),
                    updated_at = SYSDATETIMEOFFSET(), updated_by = {userId}
                WHERE asset_id = {assetId} AND ip_purpose = 'MANAGEMENT' AND released_date IS NULL", ct);

            if (!string.IsNullOrWhiteSpace(ipAddress))
            {
                await _db.Database.ExecuteSqlInterpolatedAsync($@"
                    INSERT INTO dbo.ip_addresses (ip_address, asset_id, ip_purpose, assignment_type, status, is_primary, assigned_date, created_by)
                    VALUES ({ipAddress.Trim()}, {assetId}, 'MANAGEMENT', 'STATIC', 'IN_USE', 1, CAST(SYSUTCDATETIME() AS DATE), {userId})", ct);
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
            .Include(a => a.Location)
            .Include(a => a.Status)
            .Include(a => a.NetworkDetailAsset!).ThenInclude(nd => nd.UplinkAsset)
            .SingleOrDefaultAsync(a => a.AssetId == id && !a.IsDeleted, ct)!;

    private async Task<NetworkDeviceDetail> ToDetailAsync(Asset a, CancellationToken ct)
    {
        var warrantyUntil = await _db.VwExpiringAssets.Where(c => c.AssetId == a.AssetId)
            .Select(c => (DateOnly?)c.CoverageEndDate).FirstOrDefaultAsync(ct);
        var assetTypeFullPath = a.AssetTypeId is int typeId
            ? await _db.VwAssetTypeTrees.Where(t => t.AssetTypeId == typeId).Select(t => t.FullPath).FirstOrDefaultAsync(ct)
            : null;
        var mgmtIp = await _db.IpAddresses.Where(i => i.AssetId == a.AssetId && i.IpPurpose == "MANAGEMENT" && i.ReleasedDate == null)
            .Select(i => i.IpAddress1).FirstOrDefaultAsync(ct);

        var nd = a.NetworkDetailAsset;
        return new NetworkDeviceDetail(
            a.AssetId, a.AssetTag, a.Name, a.CategoryId, a.Category.Name,
            a.AssetTypeId, a.AssetType?.Name, assetTypeFullPath,
            a.ManufacturerId, a.Manufacturer?.Name, a.Model, a.SerialNumber,
            a.StatusId, a.Status.Code, a.Status.Name,
            a.LocationId, a.Location?.Name, a.DepartmentId, a.OwnerUserId, a.VendorId,
            a.PoNumber, a.PurchaseDate, a.PurchasePrice, a.Currency,
            a.ReceivedDate, a.InstallDate, a.ServiceStartDate,
            a.FixedAssetNo, a.CostCenter, a.Notes,
            warrantyUntil, a.RetireDate, a.CreatedAt, a.UpdatedAt,
            nd?.Hostname, nd?.MacAddress, nd?.PortCount, nd?.PortSpeed, nd?.PoeSupport,
            nd?.FirmwareVersion, nd?.FirmwareUpdatedAt, nd?.StackInfo,
            nd?.UplinkAssetId, nd?.UplinkAsset is { } up ? $"{up.AssetTag} — {up.Name}" : null, mgmtIp);
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

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }
}
