namespace KKND.Api.Controllers.Assets;

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

public sealed record AssetCreateRequest(
    int CategoryId, string Name, int? ManufacturerId, string? Model, string? SerialNumber,
    int StatusId, int? LocationId, int? DepartmentId, int? OwnerUserId, int? VendorId,
    string? PoNumber, DateOnly? PurchaseDate, decimal? PurchasePrice, string? Currency,
    DateOnly? ReceivedDate, DateOnly? InstallDate, DateOnly? ServiceStartDate,
    string? FixedAssetNo, string? ServiceTag, string? SystemUuid, string? CostCenter, string? Notes,
    ServerDetailsDto? ServerDetails, NetworkDetailsDto? NetworkDetails);

public sealed record AssetUpdateRequest(
    string Name, int? ManufacturerId, string? Model, string? SerialNumber,
    int StatusId, int? LocationId, int? DepartmentId, int? OwnerUserId, int? VendorId,
    string? PoNumber, DateOnly? PurchaseDate, decimal? PurchasePrice, string? Currency,
    DateOnly? ReceivedDate, DateOnly? InstallDate, DateOnly? ServiceStartDate,
    string? FixedAssetNo, string? ServiceTag, string? SystemUuid, string? CostCenter, string? Notes,
    ServerDetailsDto? ServerDetails, NetworkDetailsDto? NetworkDetails);

public sealed record AssetDetail(
    int AssetId, string AssetTag, string Name, int CategoryId, string CategoryCode, string CategoryName,
    int? ManufacturerId, string? Model, string? SerialNumber,
    int StatusId, int? LocationId, int? DepartmentId, int? OwnerUserId, int? VendorId,
    string? PoNumber, DateOnly? PurchaseDate, decimal? PurchasePrice, string? Currency,
    DateOnly? ReceivedDate, DateOnly? InstallDate, DateOnly? ServiceStartDate,
    string? FixedAssetNo, string? ServiceTag, string? SystemUuid, string? CostCenter, string? Notes,
    DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt,
    ServerDetailsDto? ServerDetails, NetworkDetailsDto? NetworkDetails);
