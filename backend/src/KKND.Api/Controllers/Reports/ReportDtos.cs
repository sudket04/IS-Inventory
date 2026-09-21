namespace KKND.Api.Controllers.Reports;

public sealed record ExpiringCoverageItem(
    int AssetId, string AssetTag, string Name, string CategoryCode, string CategoryName,
    string? ContractNo, string? VendorName, DateOnly? CoverageEndDate, int? DaysRemaining,
    string Severity, string? OwnerName, string? LocationName);

public sealed record LicenseComplianceItem(
    int AssetId, string AssetTag, string SoftwareName, string? Publisher, string LicenseType,
    int SeatsPurchased, int SeatsUsed, int? SeatsAvailable, bool IsOverDeployed, int? OverDeployedCount,
    DateOnly? LicenseEndDate, string? CurrentContractNo, string? VendorName);

public sealed record AssetsByStatusRow(string CategoryCode, string CategoryName, string StatusCode, string StatusName, string ColorToken, int Count);

public sealed record AssetsByStatusReport(IReadOnlyList<AssetsByStatusRow> Rows, int GrandTotal);

public sealed record AssetValueItem(
    int AssetId, string AssetTag, string Name, string CategoryCode, string CategoryName,
    string? DepartmentName, string? LocationName, decimal? PurchasePrice, string Currency,
    decimal TotalContractCost, decimal? TotalCostOfOwnership);

public sealed record AssetValueReport(IReadOnlyList<AssetValueItem> Items, decimal TotalPurchaseValue, decimal TotalTco, int AssetCount);
