namespace IsInventory.Api.Controllers.Servers;

// ---------- Shared: CPU / Memory / Local Disk (multi-entry, used by both
// Server Inventory (Hardware→Physical) and Server List (Virtual, entered directly) ----------

public sealed record CpuItem(int Id, string CpuModel, short CoreCount);
public sealed record CpuRequest(string CpuModel, short CoreCount);

public sealed record MemoryItem(int Id, decimal CapacityGb, string? MemoryType);
public sealed record MemoryRequest(decimal CapacityGb, string? MemoryType);

public sealed record DiskItem(int Id, string? DiskLabel, decimal CapacityGb, string? DiskType);
public sealed record DiskRequest(string? DiskLabel, decimal CapacityGb, string? DiskType);

public sealed record HardwareSummary(int CpuSocketCount, int CpuTotalCores, decimal TotalRamGb, decimal TotalStorageGb);

// ---------- Server Inventory (Hardware) — Server (Physical only) + Storage ----------

public sealed record ServerInventoryListItem(
    int AssetId, string AssetTag, string Name, string CategoryCode, string CategoryName,
    string? AssetTypeName, string? ManufacturerName, string? Model, string? SerialNumber,
    string StatusCode, string StatusName, string StatusColorToken,
    string? LocationName, DateOnly? PurchaseDate, string? FixedAssetNo, DateOnly? WarrantyUntil,
    string? CostCenter, bool InUseByServerList);

public sealed record ServerInventoryDetail(
    int AssetId, string AssetTag, string Name, int CategoryId, string CategoryCode, string CategoryName,
    int? AssetTypeId, string? AssetTypeName,
    int? ManufacturerId, string? Model, string? SerialNumber,
    int StatusId, int? LocationId, int? DepartmentId, int? OwnerUserId, int? VendorId,
    string? PoNumber, DateOnly? PurchaseDate, decimal? PurchasePrice, string? Currency,
    DateOnly? ReceivedDate, DateOnly? InstallDate, DateOnly? ServiceStartDate,
    string? FixedAssetNo, string? ServiceTag, string? SystemUuid, string? CostCenter, string? Notes,
    DateOnly? WarrantyUntil, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt,
    // Server-only (null when CategoryCode == "STG")
    string? Hostname, string? MacAddress, DateOnly? OsInstallDate, DateOnly? LastPatchDate, string? Criticality,
    HardwareSummary? HardwareSummary, IReadOnlyList<CpuItem>? Cpus, IReadOnlyList<MemoryItem>? MemoryModules, IReadOnlyList<DiskItem>? LocalDisks,
    // Storage-only (null when CategoryCode == "SRV")
    string? StorageHostname, string? StorageMgmtUrl, byte? ControllerCount, short? DiskBayTotal, short? DiskBayUsed,
    decimal? RawCapacityTb, decimal? UsableCapacityTb, int? CacheGb, string? SupportedProtocols,
    bool? HasDedup, bool? HasCompression, bool? HasSnapshot, bool? HasReplication,
    IReadOnlyList<UsedWithItem>? UsedWith,
    bool InUseByServerList);

// "Used With" — which Cluster(s)/Server(s) a Storage Hardware asset serves, edited as a flat
// multi-select on the Storage record itself (PUT api/server-inventory/{id}/used-with).
// Modeled as consumers of one auto-managed storage_volumes row owned by the Storage asset
// itself (provider_asset_id = asset_id = this asset) — bookkeeping only, distinct from the
// real, capacity-tracked volumes a user creates by hand via the Storage Volumes panel.
public sealed record UsedWithItem(string Type, int Id, string Label);
public sealed record UsedWithTargetRequest(string Type, int Id);
public sealed record UsedWithRequest(IReadOnlyList<UsedWithTargetRequest> Targets);

public sealed record ServerInventoryRequest(
    int CategoryId, int AssetTypeId, string Name, int? ManufacturerId, string? Model, string? SerialNumber,
    int StatusId, int? LocationId, int? DepartmentId, int? OwnerUserId, int? VendorId,
    string? PoNumber, DateOnly? PurchaseDate, decimal? PurchasePrice, string? Currency,
    DateOnly? ReceivedDate, DateOnly? InstallDate, DateOnly? ServiceStartDate,
    string? FixedAssetNo, string? ServiceTag, string? SystemUuid, string? CostCenter, string? Notes,
    // Server-only
    string? Hostname, string? MacAddress, DateOnly? OsInstallDate, DateOnly? LastPatchDate, string? Criticality,
    IReadOnlyList<CpuRequest>? Cpus, IReadOnlyList<MemoryRequest>? MemoryModules, IReadOnlyList<DiskRequest>? LocalDisks,
    // Storage-only
    string? StorageMgmtUrl, byte? ControllerCount, short? DiskBayTotal, short? DiskBayUsed,
    decimal? RawCapacityTb, decimal? UsableCapacityTb, int? CacheGb, string? SupportedProtocols,
    bool? HasDedup, bool? HasCompression, bool? HasSnapshot, bool? HasReplication);

// ---------- Server List (Virtual / Physical workload view) ----------

public sealed record ServerListItem(
    int AssetId, string AssetTag, string Name, bool IsVirtual,
    string? ClusterName, string? HardwareLabel,
    string? Environment, string? Criticality,
    string? ServerStatusCode, string? ServerStatusName, string? ServerStatusColorToken,
    string? OsTypeName, string? OsVersionName, string? OwnerFullName, DateTimeOffset? UpdatedAt);

public sealed record ServerListDetail(
    int AssetId, string AssetTag, string Name, bool IsVirtual, int AssetTypeId, string AssetTypeName,
    int StatusId, int? LocationId, int? DepartmentId, int? OwnerUserId, string? Notes,
    string? Hostname, string? MacAddress, DateOnly? OsInstallDate, DateOnly? LastPatchDate,
    int? ClusterId, string? ClusterName, string? SystemGroup, string? Fqdn,
    int? ServerZoneId, string? ServerZoneName, string? Environment, string? Criticality,
    int? ServerStatusId, string? ServerStatusName, int? OsTypeId, string? OsTypeName, int? OsVersionId, string? OsVersionName,
    string? PrimaryIpAddress, string? ManagementIpAddress,
    HardwareSummary? HardwareSummary, IReadOnlyList<CpuItem> Cpus, IReadOnlyList<MemoryItem> MemoryModules, IReadOnlyList<DiskItem> LocalDisks,
    DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);

/// <summary>
/// hardwareAssetId set + isVirtual=false → attach workload fields onto that existing Server
/// Inventory asset (no new Asset row). isVirtual=true → create a brand-new Asset
/// (asset_type defaults to SRV_VM_STD) with Cpus/MemoryModules/LocalDisks entered directly.
/// </summary>
public sealed record ServerListCreateRequest(
    bool IsVirtual, int? HardwareAssetId, string? Name,
    int? StatusId, int? LocationId, int? DepartmentId, int? OwnerUserId, string? Notes,
    string? Hostname, string? MacAddress, DateOnly? OsInstallDate, DateOnly? LastPatchDate,
    int? ClusterId, string? SystemGroup, string? Fqdn, int? ServerZoneId,
    string Environment, string? Criticality, int ServerStatusId, int? OsTypeId, int? OsVersionId,
    string? PrimaryIpAddress, string? ManagementIpAddress,
    IReadOnlyList<CpuRequest>? Cpus, IReadOnlyList<MemoryRequest>? MemoryModules, IReadOnlyList<DiskRequest>? LocalDisks);

public sealed record ServerListUpdateRequest(
    string? Name, int? StatusId, int? LocationId, int? DepartmentId, int? OwnerUserId, string? Notes,
    string? Hostname, string? MacAddress, DateOnly? OsInstallDate, DateOnly? LastPatchDate,
    int? ClusterId, string? SystemGroup, string? Fqdn, int? ServerZoneId,
    string Environment, string? Criticality, int ServerStatusId, int? OsTypeId, int? OsVersionId,
    string? PrimaryIpAddress, string? ManagementIpAddress,
    IReadOnlyList<CpuRequest>? Cpus, IReadOnlyList<MemoryRequest>? MemoryModules, IReadOnlyList<DiskRequest>? LocalDisks);

public sealed record AvailableHardwareItem(int AssetId, string AssetTag, string Name, string? ManufacturerName, string? Model, string? SerialNumber);
