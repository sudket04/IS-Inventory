namespace IsInventory.Api.Controllers.Network;

// ---------- Network Hardware — switches, firewalls, APs, and other network devices
// (Asset category "NET"). Mirrors the Server Inventory (Hardware) module's shape:
// its own controller/route rather than the generic Assets flow, since the reference
// design calls for a first-class "Network" menu parallel to "Server". ----------

public sealed record NetworkDeviceListItem(
    int AssetId, string AssetTag, string Name, string? AssetTypeName,
    string? ManufacturerName, string? Model, string? SerialNumber,
    string StatusCode, string StatusName, string StatusColorToken,
    string? MacAddress, string? ManagementIpAddress, string? StackInfo,
    string? LocationName, DateOnly? EolDate);

public sealed record NetworkDeviceDetail(
    int AssetId, string AssetTag, string Name, int CategoryId, string CategoryName,
    int? AssetTypeId, string? AssetTypeName, string? AssetTypeFullPath,
    int? ManufacturerId, string? ManufacturerName, string? Model, string? SerialNumber,
    int StatusId, string StatusCode, string StatusName,
    int? LocationId, string? LocationName, int? DepartmentId, int? OwnerUserId, int? VendorId,
    string? PoNumber, DateOnly? PurchaseDate, decimal? PurchasePrice, string? Currency,
    DateOnly? ReceivedDate, DateOnly? InstallDate, DateOnly? ServiceStartDate,
    string? FixedAssetNo, string? CostCenter, string? Notes,
    DateOnly? WarrantyUntil, DateOnly? EolDate, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt,
    // Network-only
    string? Hostname, string? MacAddress, short? PortCount, string? PortSpeed, bool? PoeSupport,
    string? FirmwareVersion, DateOnly? FirmwareUpdatedAt, string? StackInfo,
    int? UplinkAssetId, string? UplinkAssetLabel, string? ManagementIpAddress);

public sealed record NetworkDeviceRequest(
    int AssetTypeId, string Name, int? ManufacturerId, string? Model, string? SerialNumber,
    int StatusId, int? LocationId, int? DepartmentId, int? OwnerUserId, int? VendorId,
    string? PoNumber, DateOnly? PurchaseDate, decimal? PurchasePrice, string? Currency,
    DateOnly? ReceivedDate, DateOnly? InstallDate, DateOnly? ServiceStartDate,
    string? FixedAssetNo, string? CostCenter, string? Notes, DateOnly? EolDate,
    // Network-only
    string? Hostname, string? MacAddress, short? PortCount, string? PortSpeed, bool? PoeSupport,
    string? FirmwareVersion, DateOnly? FirmwareUpdatedAt, string? StackInfo,
    int? UplinkAssetId, string? ManagementIpAddress);
