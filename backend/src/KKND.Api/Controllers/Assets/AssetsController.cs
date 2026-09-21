using System.Data;
using System.Security.Claims;
using KKND.Domain.Security;
using KKND.Infrastructure;
using KKND.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace KKND.Api.Controllers.Assets;

/// <summary>
/// Covers all 8 asset categories (Server, Network Device, Computer, Storage,
/// Power &amp; Cooling, Peripheral, Mobile &amp; IoT/OT, Software License). Software
/// License (SFT) joined in Sprint 4 once seat-counting moved to contract_assets.seat_count
/// (v1.4) and license_key_encrypted got an application-side AES-256-GCM protector
/// (ILicenseKeyProtector) — see SoftwareInstallationsController for the seat-tracking
/// sub-resource. Uses the existing stored procedures for the two operations that need
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
    private static readonly string[] SupportedCategoryCodes = ["SRV", "NET", "PC", "STG", "PWR", "PER", "IOT", "SFT"];

    private readonly KkndDbContext _db;
    private readonly ILicenseKeyProtector _licenseKeyProtector;

    public AssetsController(KkndDbContext db, ILicenseKeyProtector licenseKeyProtector)
    {
        _db = db;
        _licenseKeyProtector = licenseKeyProtector;
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
                (a.NetworkDetailAsset != null && a.NetworkDetailAsset.Hostname != null && EF.Functions.Like(a.NetworkDetailAsset.Hostname, $"%{needle}%")) ||
                (a.ComputerDetail != null && a.ComputerDetail.Hostname != null && EF.Functions.Like(a.ComputerDetail.Hostname, $"%{needle}%")) ||
                (a.StorageDetail != null && a.StorageDetail.Hostname != null && EF.Functions.Like(a.StorageDetail.Hostname, $"%{needle}%")) ||
                (a.MobileIotDetail != null && a.MobileIotDetail.Hostname != null && EF.Functions.Like(a.MobileIotDetail.Hostname, $"%{needle}%")));
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
                    : a.NetworkDetailAsset != null ? a.NetworkDetailAsset.Hostname
                    : a.ComputerDetail != null ? a.ComputerDetail.Hostname
                    : a.StorageDetail != null ? a.StorageDetail.Hostname
                    : a.MobileIotDetail != null ? a.MobileIotDetail.Hostname : null,
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
            .Include(a => a.ComputerDetail)
            .Include(a => a.StorageDetail)
            .Include(a => a.PowerDetail)
            .Include(a => a.PeripheralDetail)
            .Include(a => a.MobileIotDetail)
            .Include(a => a.SoftwareDetail)
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

        if (!SupportedCategoryCodes.Contains(category.Code))
        {
            return BadRequest(new { error = "unsupported_category", message = "This asset category is not supported here yet." });
        }

        var detailsError = category.Code switch
        {
            "SRV" when request.ServerDetails is null => "Server Details are required for a Server asset.",
            "NET" when request.NetworkDetails is null => "Network Device Details are required for a Network Device asset.",
            "PC" when request.ComputerDetails is null => "Computer Details are required for a Computer asset.",
            "STG" when request.StorageDetails is null => "Storage Details are required for a Storage asset.",
            "PWR" when request.PowerDetails is null => "Power & Cooling Details are required for a Power & Cooling asset.",
            "PER" when request.PeripheralDetails is null => "Peripheral Details are required for a Peripheral asset.",
            "IOT" when request.MobileIotDetails is null => "Mobile & IoT/OT Details are required for a Mobile & IoT/OT asset.",
            "SFT" when request.SoftwareDetails is null => "Software Details are required for a Software License asset.",
            _ => null,
        };
        if (detailsError is not null)
        {
            return BadRequest(new { error = "missing_details", message = detailsError });
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

        switch (category.Code)
        {
            case "SRV" when request.ServerDetails is { } sd:
                asset.ServerDetailAsset = new ServerDetail();
                Apply(asset.ServerDetailAsset, sd);
                break;
            case "NET" when request.NetworkDetails is { } nd:
                asset.NetworkDetailAsset = new NetworkDetail();
                Apply(asset.NetworkDetailAsset, nd);
                break;
            case "PC" when request.ComputerDetails is { } cd:
                asset.ComputerDetail = new ComputerDetail();
                Apply(asset.ComputerDetail, cd);
                break;
            case "STG" when request.StorageDetails is { } gd:
                asset.StorageDetail = new StorageDetail();
                Apply(asset.StorageDetail, gd);
                break;
            case "PWR" when request.PowerDetails is { } pd:
                asset.PowerDetail = new PowerDetail();
                Apply(asset.PowerDetail, pd);
                break;
            case "PER" when request.PeripheralDetails is { } rd:
                asset.PeripheralDetail = new PeripheralDetail();
                Apply(asset.PeripheralDetail, rd);
                break;
            case "IOT" when request.MobileIotDetails is { } id_:
                asset.MobileIotDetail = new MobileIotDetail();
                Apply(asset.MobileIotDetail, id_);
                break;
            case "SFT" when request.SoftwareDetails is { } swd:
                asset.SoftwareDetail = new SoftwareDetail();
                Apply(asset.SoftwareDetail, swd, _licenseKeyProtector);
                break;
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
            .Include(a => a.ComputerDetail)
            .Include(a => a.StorageDetail)
            .Include(a => a.PowerDetail)
            .Include(a => a.PeripheralDetail)
            .Include(a => a.MobileIotDetail)
            .Include(a => a.SoftwareDetail)
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
            .Include(a => a.ComputerDetail)
            .Include(a => a.StorageDetail)
            .Include(a => a.PowerDetail)
            .Include(a => a.PeripheralDetail)
            .Include(a => a.MobileIotDetail)
            .Include(a => a.SoftwareDetail)
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

        switch (asset.Category.Code)
        {
            case "SRV" when request.ServerDetails is { } sd:
                asset.ServerDetailAsset ??= new ServerDetail { AssetId = asset.AssetId };
                Apply(asset.ServerDetailAsset, sd);
                break;
            case "NET" when request.NetworkDetails is { } nd:
                asset.NetworkDetailAsset ??= new NetworkDetail { AssetId = asset.AssetId };
                Apply(asset.NetworkDetailAsset, nd);
                break;
            case "PC" when request.ComputerDetails is { } cd:
                asset.ComputerDetail ??= new ComputerDetail { AssetId = asset.AssetId };
                Apply(asset.ComputerDetail, cd);
                break;
            case "STG" when request.StorageDetails is { } gd:
                asset.StorageDetail ??= new StorageDetail { AssetId = asset.AssetId };
                Apply(asset.StorageDetail, gd);
                break;
            case "PWR" when request.PowerDetails is { } pd:
                asset.PowerDetail ??= new PowerDetail { AssetId = asset.AssetId };
                Apply(asset.PowerDetail, pd);
                break;
            case "PER" when request.PeripheralDetails is { } rd:
                asset.PeripheralDetail ??= new PeripheralDetail { AssetId = asset.AssetId };
                Apply(asset.PeripheralDetail, rd);
                break;
            case "IOT" when request.MobileIotDetails is { } id_:
                asset.MobileIotDetail ??= new MobileIotDetail { AssetId = asset.AssetId };
                Apply(asset.MobileIotDetail, id_);
                break;
            case "SFT" when request.SoftwareDetails is { } swd:
                asset.SoftwareDetail ??= new SoftwareDetail { AssetId = asset.AssetId };
                Apply(asset.SoftwareDetail, swd, _licenseKeyProtector);
                break;
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

    private static void Apply(ServerDetail e, ServerDetailsDto d)
    {
        e.Hostname = d.Hostname;
        e.MacAddress = d.MacAddress;
        e.CpuModel = d.CpuModel;
        e.CpuSocketCount = d.CpuSocketCount;
        e.RamGb = d.RamGb;
        e.OsName = d.OsName;
        e.OsVersion = d.OsVersion;
        e.OsInstallDate = d.OsInstallDate;
        e.LastPatchDate = d.LastPatchDate;
        e.ParentHostAssetId = d.ParentHostAssetId;
    }

    private static void Apply(NetworkDetail e, NetworkDetailsDto d)
    {
        e.Hostname = d.Hostname;
        e.MacAddress = d.MacAddress;
        e.PortSpeed = d.PortSpeed;
        e.PoeSupport = d.PoeSupport;
        e.FirmwareVersion = d.FirmwareVersion;
        e.FirmwareUpdatedAt = d.FirmwareUpdatedAt;
        e.StackInfo = d.StackInfo;
        e.UplinkAssetId = d.UplinkAssetId;
    }

    private static void Apply(ComputerDetail e, ComputerDetailsDto d)
    {
        e.Hostname = d.Hostname;
        e.MacAddress = d.MacAddress;
        e.CpuModel = d.CpuModel;
        e.RamGb = d.RamGb;
        e.StorageConfig = d.StorageConfig;
        e.OsName = d.OsName;
        e.OsVersion = d.OsVersion;
        e.AssignedDate = d.AssignedDate;
        e.AssignedToName = d.AssignedToName;
        e.DomainJoined = d.DomainJoined;
    }

    private static void Apply(StorageDetail e, StorageDetailsDto d)
    {
        e.Hostname = d.Hostname;
        e.MgmtUrl = d.MgmtUrl;
        e.ControllerCount = d.ControllerCount;
        e.DiskBayTotal = d.DiskBayTotal;
        e.DiskBayUsed = d.DiskBayUsed;
        e.RawCapacityTb = d.RawCapacityTb;
        e.UsableCapacityTb = d.UsableCapacityTb;
        e.CacheGb = d.CacheGb;
        e.SupportedProtocols = d.SupportedProtocols;
        e.ExpansionShelfCount = d.ExpansionShelfCount;
        e.FirmwareVersion = d.FirmwareVersion;
        e.FirmwareUpdatedAt = d.FirmwareUpdatedAt;
        e.HasDedup = d.HasDedup;
        e.HasCompression = d.HasCompression;
        e.HasSnapshot = d.HasSnapshot;
        e.HasReplication = d.HasReplication;
    }

    private static void Apply(PowerDetail e, PowerDetailsDto d)
    {
        e.CapacityKva = d.CapacityKva;
        e.CapacityKw = d.CapacityKw;
        e.InputPhase = d.InputPhase;
        e.InputVoltage = d.InputVoltage;
        e.OutputVoltage = d.OutputVoltage;
        e.OutletCount = d.OutletCount;
        e.OutletType = d.OutletType;
        e.BatteryCount = d.BatteryCount;
        e.BatteryModel = d.BatteryModel;
        e.BatteryInstallDate = d.BatteryInstallDate;
        e.BatteryReplaceDue = d.BatteryReplaceDue;
        e.RuntimeMinutesFullLoad = d.RuntimeMinutesFullLoad;
        e.CurrentLoadPercent = d.CurrentLoadPercent;
        e.LoadMeasuredAt = d.LoadMeasuredAt;
        e.HasBypass = d.HasBypass;
        e.HasSnmpCard = d.HasSnmpCard;
        e.FirmwareVersion = d.FirmwareVersion;
        e.CoolingCapacityBtu = d.CoolingCapacityBtu;
        e.RefrigerantType = d.RefrigerantType;
        e.LastServiceDate = d.LastServiceDate;
    }

    private static void Apply(PeripheralDetail e, PeripheralDetailsDto d)
    {
        e.ConnectionType = d.ConnectionType;
        e.FirmwareVersion = d.FirmwareVersion;
        e.PrintTechnology = d.PrintTechnology;
        e.IsColor = d.IsColor;
        e.MaxPaperSize = d.MaxPaperSize;
        e.HasDuplex = d.HasDuplex;
        e.HasAdf = d.HasAdf;
        e.PageCounterMono = d.PageCounterMono;
        e.PageCounterColor = d.PageCounterColor;
        e.CounterReadDate = d.CounterReadDate;
        e.TonerModel = d.TonerModel;
        e.ScreenSizeInch = d.ScreenSizeInch;
        e.Resolution = d.Resolution;
        e.PanelType = d.PanelType;
        e.RefreshRateHz = d.RefreshRateHz;
        e.HasSpeaker = d.HasSpeaker;
        e.MountType = d.MountType;
    }

    private static void Apply(MobileIotDetail e, MobileIotDetailsDto d)
    {
        e.Imei = d.Imei;
        e.PhoneNumber = d.PhoneNumber;
        e.SimProvider = d.SimProvider;
        e.OsName = d.OsName;
        e.OsVersion = d.OsVersion;
        e.IsMdmEnrolled = d.IsMdmEnrolled;
        e.MdmPlatform = d.MdmPlatform;
        e.Hostname = d.Hostname;
        e.MacAddress = d.MacAddress;
        e.FirmwareVersion = d.FirmwareVersion;
        e.DeviceProtocol = d.DeviceProtocol;
        e.ControllerModel = d.ControllerModel;
        e.IoPointCount = d.IoPointCount;
        e.Resolution = d.Resolution;
        e.HasPtz = d.HasPtz;
        e.HasIr = d.HasIr;
        e.StorageType = d.StorageType;
        e.AssignedToName = d.AssignedToName;
        e.AssignedDate = d.AssignedDate;
    }

    private static void Apply(SoftwareDetail e, SoftwareDetailsDto d, ILicenseKeyProtector protector)
    {
        e.Publisher = d.Publisher;
        e.Version = d.Version;
        e.Edition = d.Edition;
        e.LicenseType = d.LicenseType;
        e.IsPerDevice = d.IsPerDevice ?? true;
        e.SupportLevel = d.SupportLevel;
        e.AutoRenew = d.AutoRenew ?? false;
        e.LicensePortalUrl = d.LicensePortalUrl;

        // Write-only: a blank/omitted key on Update leaves the stored key untouched.
        if (!string.IsNullOrWhiteSpace(d.LicenseKey))
        {
            e.LicenseKeyEncrypted = protector.Encrypt(d.LicenseKey);
        }
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
            nd.FirmwareVersion, nd.FirmwareUpdatedAt, nd.StackInfo, nd.UplinkAssetId) : null,
        a.ComputerDetail is { } cd ? new ComputerDetailsDto(
            cd.Hostname, cd.MacAddress, cd.CpuModel, cd.RamGb, cd.StorageConfig,
            cd.OsName, cd.OsVersion, cd.AssignedDate, cd.AssignedToName, cd.DomainJoined) : null,
        a.StorageDetail is { } gd ? new StorageDetailsDto(
            gd.Hostname, gd.MgmtUrl, gd.ControllerCount, gd.DiskBayTotal, gd.DiskBayUsed,
            gd.RawCapacityTb, gd.UsableCapacityTb, gd.CacheGb, gd.SupportedProtocols,
            gd.ExpansionShelfCount, gd.FirmwareVersion, gd.FirmwareUpdatedAt,
            gd.HasDedup, gd.HasCompression, gd.HasSnapshot, gd.HasReplication) : null,
        a.PowerDetail is { } pd ? new PowerDetailsDto(
            pd.CapacityKva, pd.CapacityKw, pd.InputPhase, pd.InputVoltage, pd.OutputVoltage,
            pd.OutletCount, pd.OutletType, pd.BatteryCount, pd.BatteryModel,
            pd.BatteryInstallDate, pd.BatteryReplaceDue, pd.RuntimeMinutesFullLoad,
            pd.CurrentLoadPercent, pd.LoadMeasuredAt, pd.HasBypass, pd.HasSnmpCard,
            pd.FirmwareVersion, pd.CoolingCapacityBtu, pd.RefrigerantType, pd.LastServiceDate) : null,
        a.PeripheralDetail is { } rd ? new PeripheralDetailsDto(
            rd.ConnectionType, rd.FirmwareVersion, rd.PrintTechnology, rd.IsColor, rd.MaxPaperSize,
            rd.HasDuplex, rd.HasAdf, rd.PageCounterMono, rd.PageCounterColor, rd.CounterReadDate,
            rd.TonerModel, rd.ScreenSizeInch, rd.Resolution, rd.PanelType, rd.RefreshRateHz,
            rd.HasSpeaker, rd.MountType) : null,
        a.MobileIotDetail is { } id_ ? new MobileIotDetailsDto(
            id_.Imei, id_.PhoneNumber, id_.SimProvider, id_.OsName, id_.OsVersion,
            id_.IsMdmEnrolled, id_.MdmPlatform, id_.Hostname, id_.MacAddress, id_.FirmwareVersion,
            id_.DeviceProtocol, id_.ControllerModel, id_.IoPointCount, id_.Resolution,
            id_.HasPtz, id_.HasIr, id_.StorageType, id_.AssignedToName, id_.AssignedDate) : null,
        a.SoftwareDetail is { } swd ? new SoftwareDetailsDto(
            swd.Publisher, swd.Version, swd.Edition, swd.LicenseType, null,
            swd.IsPerDevice, swd.SupportLevel, swd.AutoRenew, swd.LicensePortalUrl,
            swd.LicenseKeyEncrypted is not null) : null);
}
