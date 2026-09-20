using System.Data;
using System.Security.Claims;
using KKND.Infrastructure;
using KKND.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace KKND.Api.Controllers.Assets;

/// <summary>
/// Server and Network Device assets (Sprint 2 scope — the other 4 categories follow in
/// Sprint 3). Uses the existing stored procedures for the two operations that need
/// concurrency safety or cross-table cleanup rather than re-implementing them in C#:
/// sp_generate_asset_tag (UPDLOCK-guarded sequence) and sp_soft_delete_asset (also
/// releases software seats per FR-AS-10).
/// </summary>
[ApiController]
[Route("api/assets")]
[Authorize(Policy = "AnyRole")]
public sealed class AssetsController : ControllerBase
{
    private const int MaxPageSize = 100;
    private static readonly string[] ServerAndNetworkCodes = ["SRV", "NET"];

    private readonly KkndDbContext _db;

    public AssetsController(KkndDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AssetListItem>>> List(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] int? statusId,
        [FromQuery] int? departmentId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = _db.Assets.Where(a => !a.IsDeleted);

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(a => a.Category.Code == category);
        }

        if (statusId.HasValue)
        {
            query = query.Where(a => a.StatusId == statusId);
        }

        if (departmentId.HasValue)
        {
            query = query.Where(a => a.DepartmentId == departmentId);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            // FR-SE-01 — ค้นหาข้าม Asset Tag, Serial, Hostname (IP/VLAN search ยังไม่รวมในรอบนี้)
            var needle = search.Trim();
            query = query.Where(a =>
                EF.Functions.Like(a.AssetTag, $"%{needle}%") ||
                EF.Functions.Like(a.Name, $"%{needle}%") ||
                (a.SerialNumber != null && EF.Functions.Like(a.SerialNumber, $"%{needle}%")) ||
                (a.ServerDetailAsset != null && a.ServerDetailAsset.Hostname != null && EF.Functions.Like(a.ServerDetailAsset.Hostname, $"%{needle}%")) ||
                (a.NetworkDetailAsset != null && a.NetworkDetailAsset.Hostname != null && EF.Functions.Like(a.NetworkDetailAsset.Hostname, $"%{needle}%")));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(a => a.UpdatedAt ?? a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AssetListItem(
                a.AssetId, a.AssetTag, a.Name,
                a.Category.Code, a.Category.Name,
                a.Status.Code, a.Status.Name, a.Status.ColorToken,
                a.Manufacturer != null ? a.Manufacturer.Name : null, a.Model, a.SerialNumber,
                a.ServerDetailAsset != null ? a.ServerDetailAsset.Hostname
                    : a.NetworkDetailAsset != null ? a.NetworkDetailAsset.Hostname : null,
                a.Location != null ? a.Location.Name : null,
                a.Department != null ? a.Department.Name : null,
                a.OwnerUser != null ? a.OwnerUser.FullName : null,
                a.UpdatedAt))
            .ToListAsync(ct);

        return Ok(new PagedResult<AssetListItem>(items, totalCount, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AssetDetail>> Get(int id, CancellationToken ct)
    {
        var asset = await _db.Assets
            .Include(a => a.Category)
            .Include(a => a.ServerDetailAsset)
            .Include(a => a.NetworkDetailAsset)
            .SingleOrDefaultAsync(a => a.AssetId == id && !a.IsDeleted, ct);

        if (asset is null) return NotFound();

        return Ok(ToDetail(asset));
    }

    [HttpPost]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<ActionResult<AssetDetail>> Create([FromBody] AssetCreateRequest request, CancellationToken ct)
    {
        var category = await _db.AssetCategories.FindAsync([request.CategoryId], ct);
        if (category is null)
        {
            return BadRequest(new { error = "invalid_category", message = "Category does not exist." });
        }

        if (!ServerAndNetworkCodes.Contains(category.Code))
        {
            return BadRequest(new { error = "unsupported_category", message = "Only Server and Network Device assets can be created here for now." });
        }

        if (category.Code == "SRV" && request.ServerDetails is null)
        {
            return BadRequest(new { error = "missing_server_details", message = "Server Details are required for a Server asset." });
        }

        if (category.Code == "NET" && request.NetworkDetails is null)
        {
            return BadRequest(new { error = "missing_network_details", message = "Network Details are required for a Network Device asset." });
        }

        var assetTag = await GenerateAssetTagAsync(request.CategoryId, ct);
        var userId = CurrentUserId();

        var asset = new Asset
        {
            AssetTag = assetTag,
            CategoryId = request.CategoryId,
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

        if (category.Code == "SRV" && request.ServerDetails is { } sd)
        {
            asset.ServerDetailAsset = new ServerDetail
            {
                Hostname = sd.Hostname,
                MacAddress = sd.MacAddress,
                CpuModel = sd.CpuModel,
                CpuSocketCount = sd.CpuSocketCount,
                RamGb = sd.RamGb,
                OsName = sd.OsName,
                OsVersion = sd.OsVersion,
                OsInstallDate = sd.OsInstallDate,
                LastPatchDate = sd.LastPatchDate,
                ParentHostAssetId = sd.ParentHostAssetId,
            };
        }
        else if (category.Code == "NET" && request.NetworkDetails is { } nd)
        {
            asset.NetworkDetailAsset = new NetworkDetail
            {
                Hostname = nd.Hostname,
                MacAddress = nd.MacAddress,
                PortSpeed = nd.PortSpeed,
                PoeSupport = nd.PoeSupport,
                FirmwareVersion = nd.FirmwareVersion,
                FirmwareUpdatedAt = nd.FirmwareUpdatedAt,
                StackInfo = nd.StackInfo,
                UplinkAssetId = nd.UplinkAssetId,
            };
        }

        _db.Assets.Add(asset);
        await _db.SaveChangesAsync(ct);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "CREATE",
            EntityType = "asset",
            EntityId = asset.AssetId,
            EntityLabel = assetTag,
        });
        await _db.SaveChangesAsync(ct);

        var created = await _db.Assets
            .Include(a => a.Category)
            .Include(a => a.ServerDetailAsset)
            .Include(a => a.NetworkDetailAsset)
            .SingleAsync(a => a.AssetId == asset.AssetId, ct);

        return CreatedAtAction(nameof(Get), new { id = asset.AssetId }, ToDetail(created));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetUpdateRequest request, CancellationToken ct)
    {
        var asset = await _db.Assets
            .Include(a => a.Category)
            .Include(a => a.ServerDetailAsset)
            .Include(a => a.NetworkDetailAsset)
            .SingleOrDefaultAsync(a => a.AssetId == id && !a.IsDeleted, ct);

        if (asset is null) return NotFound();

        var userId = CurrentUserId();

        asset.Name = request.Name.Trim();
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

        if (asset.Category.Code == "SRV" && request.ServerDetails is { } sd)
        {
            asset.ServerDetailAsset ??= new ServerDetail { AssetId = asset.AssetId };
            asset.ServerDetailAsset.Hostname = sd.Hostname;
            asset.ServerDetailAsset.MacAddress = sd.MacAddress;
            asset.ServerDetailAsset.CpuModel = sd.CpuModel;
            asset.ServerDetailAsset.CpuSocketCount = sd.CpuSocketCount;
            asset.ServerDetailAsset.RamGb = sd.RamGb;
            asset.ServerDetailAsset.OsName = sd.OsName;
            asset.ServerDetailAsset.OsVersion = sd.OsVersion;
            asset.ServerDetailAsset.OsInstallDate = sd.OsInstallDate;
            asset.ServerDetailAsset.LastPatchDate = sd.LastPatchDate;
            asset.ServerDetailAsset.ParentHostAssetId = sd.ParentHostAssetId;
        }
        else if (asset.Category.Code == "NET" && request.NetworkDetails is { } nd)
        {
            asset.NetworkDetailAsset ??= new NetworkDetail { AssetId = asset.AssetId };
            asset.NetworkDetailAsset.Hostname = nd.Hostname;
            asset.NetworkDetailAsset.MacAddress = nd.MacAddress;
            asset.NetworkDetailAsset.PortSpeed = nd.PortSpeed;
            asset.NetworkDetailAsset.PoeSupport = nd.PoeSupport;
            asset.NetworkDetailAsset.FirmwareVersion = nd.FirmwareVersion;
            asset.NetworkDetailAsset.FirmwareUpdatedAt = nd.FirmwareUpdatedAt;
            asset.NetworkDetailAsset.StackInfo = nd.StackInfo;
            asset.NetworkDetailAsset.UplinkAssetId = nd.UplinkAssetId;
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "UPDATE",
            EntityType = "asset",
            EntityId = asset.AssetId,
            EntityLabel = asset.AssetTag,
        });

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "ItStaffOrAbove")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var asset = await _db.Assets.SingleOrDefaultAsync(a => a.AssetId == id && !a.IsDeleted, ct);
        if (asset is null) return NotFound();

        var userId = CurrentUserId() ?? throw new InvalidOperationException("Authenticated user has no numeric id.");

        // sp_soft_delete_asset ทำ Soft Delete + คืน Seat ของ Software ที่ติดตั้งบนเครื่องนี้ (FR-AS-10)
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $"EXEC dbo.sp_soft_delete_asset @asset_id={id}, @user_id={userId}", ct);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "DELETE",
            EntityType = "asset",
            EntityId = id,
            EntityLabel = asset.AssetTag,
        });
        await _db.SaveChangesAsync(ct);

        return NoContent();
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

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }

    private static AssetDetail ToDetail(Asset a) => new(
        a.AssetId, a.AssetTag, a.Name, a.CategoryId, a.Category.Code, a.Category.Name,
        a.ManufacturerId, a.Model, a.SerialNumber,
        a.StatusId, a.LocationId, a.DepartmentId, a.OwnerUserId, a.VendorId,
        a.PoNumber, a.PurchaseDate, a.PurchasePrice, a.Currency,
        a.ReceivedDate, a.InstallDate, a.ServiceStartDate,
        a.FixedAssetNo, a.ServiceTag, a.SystemUuid, a.CostCenter, a.Notes,
        a.CreatedAt, a.UpdatedAt,
        a.ServerDetailAsset is { } sd ? new ServerDetailsDto(
            sd.Hostname, sd.MacAddress, sd.CpuModel, sd.CpuSocketCount, sd.RamGb,
            sd.OsName, sd.OsVersion, sd.OsInstallDate, sd.LastPatchDate, sd.ParentHostAssetId) : null,
        a.NetworkDetailAsset is { } nd ? new NetworkDetailsDto(
            nd.Hostname, nd.MacAddress, nd.PortSpeed, nd.PoeSupport,
            nd.FirmwareVersion, nd.FirmwareUpdatedAt, nd.StackInfo, nd.UplinkAssetId) : null);
}
