namespace KKND.Api.Controllers.Clusters;

public sealed record ClusterListItem(
    int ClusterId, string ClusterCode, string ClusterName, string ClusterType, string? VendorProduct,
    string? ManagementIp, short? ExpectedNodeCount, int ActiveMembers, bool? IsDegraded, string? MemberList,
    int SharedVolumeCount, decimal? SharedCapacityGb, decimal? SharedUsedGb, decimal? SharedUsedPercent,
    string? SiteName, bool IsActive);

public sealed record ClusterDetail(
    int ClusterId, string Code, string Name, string ClusterType, string? VendorProduct,
    short? ExpectedNodeCount, string? QuorumType, string? ManagementIp, string? ManagementUrl,
    int? SiteLocationId, string? SiteLocationName, string? Description, bool IsActive,
    DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);

public sealed record ClusterRequest(
    string Code, string Name, string ClusterType, string? VendorProduct, short? ExpectedNodeCount,
    string? QuorumType, string? ManagementIp, string? ManagementUrl, int? SiteLocationId,
    string? Description, bool IsActive);

public sealed record ClusterMemberItem(
    int MemberId, int ClusterId, int AssetId, string AssetTag, string AssetName,
    string MemberRole, short? NodePriority, DateOnly? JoinedDate, DateOnly? LeftDate,
    bool? IsActive, string? Notes);

public sealed record ClusterMemberRequest(
    int AssetId, string MemberRole, short? NodePriority, DateOnly? JoinedDate, string? Notes);

public sealed record ClusterMemberUpdateRequest(string MemberRole, short? NodePriority, string? Notes);
