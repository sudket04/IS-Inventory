namespace KKND.Api.Controllers.Dashboard;

public sealed record ActionRequiredCards(
    int ExpiredCoverageCount,
    int ExpiringWithin30DaysCount,
    int LicenseOverDeployedCount,
    int UnderRepairCount);

public sealed record OverviewCards(
    int TotalAssets,
    int InUseCount,
    int InStockCount,
    decimal? TotalValue,
    int NewThisMonth);

public sealed record CategoryBreakdownItem(string Code, string Name, string? IconName, int Count);

public sealed record StatusBreakdownItem(string Code, string Name, string ColorToken, int Count);

public sealed record ExpiringSoonItem(
    int AssetId, string AssetTag, string Name, string CategoryCode, string CategoryName,
    DateOnly CoverageEndDate, int DaysRemaining);

public sealed record RecentActivityItem(
    DateTimeOffset OccurredAt, string? UsernameSnapshot, string Action,
    string? EntityType, string? EntityLabel);

public sealed record DashboardSummary(
    ActionRequiredCards ActionRequired,
    OverviewCards Overview,
    IReadOnlyList<CategoryBreakdownItem> ByCategory,
    IReadOnlyList<StatusBreakdownItem> ByStatus,
    IReadOnlyList<ExpiringSoonItem> ExpiringSoon,
    IReadOnlyList<RecentActivityItem> RecentActivity);
