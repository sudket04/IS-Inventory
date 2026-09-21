namespace IsInventory.Api.Controllers.Assets;

public sealed record AssetListItem(
    int AssetId, string AssetTag, string Name,
    string CategoryCode, string CategoryName,
    string StatusCode, string StatusName, string StatusColorToken,
    string? ManufacturerName, string? Model, string? SerialNumber, string? Hostname,
    string? LocationName, string? DepartmentName, string? OwnerFullName,
    DateTimeOffset? UpdatedAt);

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

public sealed record ServerDetailsDto(
    string? Hostname, string? MacAddress, string? CpuModel, byte? CpuSocketCount, int? RamGb,
    string? OsName, string? OsVersion, DateOnly? OsInstallDate, DateOnly? LastPatchDate,
    int? ParentHostAssetId);

public sealed record NetworkDetailsDto(
    string? Hostname, string? MacAddress, string? PortSpeed, bool? PoeSupport,
    string? FirmwareVersion, DateOnly? FirmwareUpdatedAt, string? StackInfo, int? UplinkAssetId);

public sealed record ComputerDetailsDto(
    string? Hostname, string? MacAddress, string? CpuModel, int? RamGb, string? StorageConfig,
    string? OsName, string? OsVersion, DateOnly? AssignedDate, string? AssignedToName, bool? DomainJoined);

public sealed record StorageDetailsDto(
    string? Hostname, string? MgmtUrl, byte? ControllerCount, short? DiskBayTotal, short? DiskBayUsed,
    decimal? RawCapacityTb, decimal? UsableCapacityTb, int? CacheGb, string? SupportedProtocols,
    byte? ExpansionShelfCount, string? FirmwareVersion, DateOnly? FirmwareUpdatedAt,
    bool? HasDedup, bool? HasCompression, bool? HasSnapshot, bool? HasReplication);

public sealed record PowerDetailsDto(
    decimal? CapacityKva, decimal? CapacityKw, byte? InputPhase, string? InputVoltage, string? OutputVoltage,
    short? OutletCount, string? OutletType, short? BatteryCount, string? BatteryModel,
    DateOnly? BatteryInstallDate, DateOnly? BatteryReplaceDue, short? RuntimeMinutesFullLoad,
    decimal? CurrentLoadPercent, DateOnly? LoadMeasuredAt, bool? HasBypass, bool? HasSnmpCard,
    string? FirmwareVersion, int? CoolingCapacityBtu, string? RefrigerantType, DateOnly? LastServiceDate);

public sealed record PeripheralDetailsDto(
    string? ConnectionType, string? FirmwareVersion, string? PrintTechnology, bool? IsColor, string? MaxPaperSize,
    bool? HasDuplex, bool? HasAdf, int? PageCounterMono, int? PageCounterColor, DateOnly? CounterReadDate,
    string? TonerModel, decimal? ScreenSizeInch, string? Resolution, string? PanelType, short? RefreshRateHz,
    bool? HasSpeaker, string? MountType);

public sealed record MobileIotDetailsDto(
    string? Imei, string? PhoneNumber, string? SimProvider, string? OsName, string? OsVersion,
    bool? IsMdmEnrolled, string? MdmPlatform, string? Hostname, string? MacAddress, string? FirmwareVersion,
    string? DeviceProtocol, string? ControllerModel, short? IoPointCount, string? Resolution,
    bool? HasPtz, bool? HasIr, string? StorageType, string? AssignedToName, DateOnly? AssignedDate);

/// <summary>
/// LicenseKey is write-only: sent in on Create/Update (null/omitted = leave unchanged on
/// Update, or "no key" on Create) and encrypted server-side (FR-SW-06). It is never
/// returned — HasLicenseKey is the read-side signal instead. Seats moved to
/// contract_assets.seat_count in v1.4 (see vw_software_seat_usage), so there is no seat
/// field here any more.
/// </summary>
public sealed record SoftwareDetailsDto(
    string? Publisher, string? Version, string? Edition, string LicenseType, string? LicenseKey,
    bool? IsPerDevice, string? SupportLevel, bool? AutoRenew, string? LicensePortalUrl,
    bool HasLicenseKey = false);

public sealed record AssetCreateRequest(
    int CategoryId, string Name, int? ManufacturerId, string? Model, string? SerialNumber,
    int StatusId, int? LocationId, int? DepartmentId, int? OwnerUserId, int? VendorId,
    string? PoNumber, DateOnly? PurchaseDate, decimal? PurchasePrice, string? Currency,
    DateOnly? ReceivedDate, DateOnly? InstallDate, DateOnly? ServiceStartDate,
    string? FixedAssetNo, string? ServiceTag, string? SystemUuid, string? CostCenter, string? Notes,
    ServerDetailsDto? ServerDetails, NetworkDetailsDto? NetworkDetails,
    ComputerDetailsDto? ComputerDetails, StorageDetailsDto? StorageDetails, PowerDetailsDto? PowerDetails,
    PeripheralDetailsDto? PeripheralDetails, MobileIotDetailsDto? MobileIotDetails,
    SoftwareDetailsDto? SoftwareDetails = null);

public sealed record AssetUpdateRequest(
    string Name, int? ManufacturerId, string? Model, string? SerialNumber,
    int StatusId, int? LocationId, int? DepartmentId, int? OwnerUserId, int? VendorId,
    string? PoNumber, DateOnly? PurchaseDate, decimal? PurchasePrice, string? Currency,
    DateOnly? ReceivedDate, DateOnly? InstallDate, DateOnly? ServiceStartDate,
    string? FixedAssetNo, string? ServiceTag, string? SystemUuid, string? CostCenter, string? Notes,
    ServerDetailsDto? ServerDetails, NetworkDetailsDto? NetworkDetails,
    ComputerDetailsDto? ComputerDetails, StorageDetailsDto? StorageDetails, PowerDetailsDto? PowerDetails,
    PeripheralDetailsDto? PeripheralDetails, MobileIotDetailsDto? MobileIotDetails,
    SoftwareDetailsDto? SoftwareDetails = null);

public sealed record AssetDetail(
    int AssetId, string AssetTag, string Name, int CategoryId, string CategoryCode, string CategoryName,
    int? ManufacturerId, string? Model, string? SerialNumber,
    int StatusId, int? LocationId, int? DepartmentId, int? OwnerUserId, int? VendorId,
    string? PoNumber, DateOnly? PurchaseDate, decimal? PurchasePrice, string? Currency,
    DateOnly? ReceivedDate, DateOnly? InstallDate, DateOnly? ServiceStartDate,
    string? FixedAssetNo, string? ServiceTag, string? SystemUuid, string? CostCenter, string? Notes,
    DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt,
    ServerDetailsDto? ServerDetails, NetworkDetailsDto? NetworkDetails,
    ComputerDetailsDto? ComputerDetails, StorageDetailsDto? StorageDetails, PowerDetailsDto? PowerDetails,
    PeripheralDetailsDto? PeripheralDetails, MobileIotDetailsDto? MobileIotDetails,
    SoftwareDetailsDto? SoftwareDetails);
