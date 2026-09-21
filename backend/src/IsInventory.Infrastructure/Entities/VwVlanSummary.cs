using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwVlanSummary
{
    public int VlanId { get; set; }

    public short? VlanNumber { get; set; }

    public bool IsUntagged { get; set; }

    public string NetworkLevel { get; set; } = null!;

    public string VlanName { get; set; } = null!;

    public string? Description { get; set; }

    public string ZoneCode { get; set; } = null!;

    public string ZoneName { get; set; } = null!;

    public byte TrustLevel { get; set; }

    public string ZoneColor { get; set; } = null!;

    public bool IsInternetFacing { get; set; }

    public string NetworkAddress { get; set; } = null!;

    public byte PrefixLength { get; set; }

    public string? Cidr { get; set; }

    public string? SubnetMask { get; set; }

    public string? BroadcastAddress { get; set; }

    public string? FirstUsableIp { get; set; }

    public string? LastUsableIp { get; set; }

    public long? TotalAddresses { get; set; }

    public long? UsableAddresses { get; set; }

    public string? GatewayIp { get; set; }

    public string? GatewayDeviceRole { get; set; }

    public string? GatewayInterface { get; set; }

    public string? GatewayAssetTag { get; set; }

    public string? GatewayAssetName { get; set; }

    public string IpAssignmentMode { get; set; } = null!;

    public string? DhcpSourceType { get; set; }

    public string? DhcpServerAssetTag { get; set; }

    public string? DhcpServerAssetName { get; set; }

    public string? DhcpServerNameRaw { get; set; }

    public string? DhcpServerDisplayName { get; set; }

    public string? DhcpRelayIp { get; set; }

    public int? DhcpLeaseHours { get; set; }

    public string? DnsPrimary { get; set; }

    public string? DnsSecondary { get; set; }

    public string? DomainName { get; set; }

    public long StaticPoolSize { get; set; }

    public long DhcpPoolSize { get; set; }

    public long ReservedPoolSize { get; set; }

    public long ExcludedPoolSize { get; set; }

    public int KnownIpsInSubnet { get; set; }

    public int StaticIpsUsed { get; set; }

    public long? StaticIpsAvailable { get; set; }

    public int IpsOutsideAnyPool { get; set; }

    public long? UnplannedAddresses { get; set; }

    public decimal? PoolCoveragePercent { get; set; }

    public decimal? StaticUtilizationPercent { get; set; }

    public byte SiteId { get; set; }

    public string SiteName { get; set; } = null!;

    public bool IsActive { get; set; }

    public string? Notes { get; set; }
}
