namespace KKND.Api.Controllers.Vlans;

public sealed record VlanListItem(
    int VlanId, short? VlanNumber, bool IsUntagged, string NetworkLevel, string VlanName,
    string ZoneCode, string ZoneName, string ZoneColor, bool IsInternetFacing,
    string? Cidr, long? UsableAddresses, decimal? PoolCoveragePercent, decimal? StaticUtilizationPercent,
    string? GatewayIp, string? GatewayAssetTag, string IpAssignmentMode, string? DhcpSourceType,
    byte SiteId, string SiteName, bool IsActive);

public sealed record VlanDetail(
    int VlanId, short? VlanNumber, bool IsUntagged, string Name, string? Description,
    int ZoneId, string ZoneName, string NetworkLevel,
    string NetworkAddress, byte PrefixLength, string? Cidr, string? SubnetMask,
    string? BroadcastAddress, string? FirstUsableIp, string? LastUsableIp,
    long? TotalAddresses, long? UsableAddresses,
    string? GatewayIp, string? GatewayDeviceRole, int? GatewayAssetId, string? GatewayAssetTag,
    string? GatewayInterface,
    string IpAssignmentMode, string? DhcpSourceType, int? DhcpServerAssetId, string? DhcpServerAssetTag,
    string? DhcpServerNameRaw, string? DhcpRelayIp, int? DhcpLeaseHours,
    string? DnsPrimary, string? DnsSecondary, string? DomainName,
    byte SiteId, string SiteName, bool IsActive, string? Notes,
    DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);

public sealed record VlanRequest(
    short? VlanNumber, bool IsUntagged, string Name, string? Description,
    int ZoneId, string NetworkLevel,
    string NetworkAddress, byte PrefixLength,
    string? GatewayIp, string? GatewayDeviceRole, int? GatewayAssetId, string? GatewayInterface,
    string IpAssignmentMode, string? DhcpSourceType, int? DhcpServerAssetId,
    string? DhcpServerNameRaw, string? DhcpRelayIp, int? DhcpLeaseHours,
    string? DnsPrimary, string? DnsSecondary, string? DomainName,
    byte SiteId, bool IsActive, string? Notes);

public sealed record VlanIpRangeItem(
    int RangeId, int VlanId, string RangeType, string StartIp, string EndIp,
    string? DhcpSourceType, string? DhcpServerAssetTag, string? DhcpServerNameDisplay,
    string? Description, bool IsActive);

public sealed record VlanIpRangeRequest(
    string RangeType, string StartIp, string EndIp,
    string? DhcpSourceType, int? DhcpServerAssetId, string? Description, bool IsActive);

public sealed record VlanDeviceItem(
    int VlanDeviceId, int VlanId, int AssetId, string AssetTag, string AssetName,
    string DeviceRole, string? InterfaceName, bool? IsTagged, string? Notes);

public sealed record VlanDeviceRequest(
    int AssetId, string DeviceRole, string? InterfaceName, bool? IsTagged, string? Notes);

public sealed record VlanIssueItem(
    int VlanId, short? VlanNumber, string VlanName, string IssueCode, string Severity, string? IssueDetail);
