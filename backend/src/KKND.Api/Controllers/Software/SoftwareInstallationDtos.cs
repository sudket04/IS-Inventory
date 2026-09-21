namespace KKND.Api.Controllers.Software;

public sealed record SoftwareInstallationItem(
    int InstallationId, int TargetAssetId, string TargetAssetTag, string TargetAssetName,
    DateOnly? InstalledDate, string? InstalledVersion, DateOnly? RemovedDate, bool? IsActive, string? Notes);

public sealed record SoftwareInstallationRequest(
    int TargetAssetId, DateOnly? InstalledDate, string? InstalledVersion, string? Notes);

public sealed record SeatUsageItem(
    int AssetId, string AssetTag, string SoftwareName, string? Publisher, string? Version, string LicenseType,
    int SeatsPurchased, int SeatsUsed, int? SeatsAvailable, bool? IsOverDeployed, int? OverDeployedCount,
    DateOnly? LicenseEndDate, int? DaysUntilExpiry, string? CurrentContractNo, string? VendorName);
