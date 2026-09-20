using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class Vlan
{
    public int VlanId { get; set; }

    public short? VlanNumber { get; set; }

    public bool IsUntagged { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public int ZoneId { get; set; }

    public string NetworkLevel { get; set; } = null!;

    public string NetworkAddress { get; set; } = null!;

    public byte PrefixLength { get; set; }

    public long? NetworkNumeric { get; set; }

    public string? GatewayIp { get; set; }

    public string? GatewayDeviceRole { get; set; }

    public int? GatewayAssetId { get; set; }

    public string? GatewayInterface { get; set; }

    public string IpAssignmentMode { get; set; } = null!;

    public string? DhcpSourceType { get; set; }

    public int? DhcpServerAssetId { get; set; }

    public string? DhcpServerNameRaw { get; set; }

    public string? DhcpRelayIp { get; set; }

    public int? DhcpLeaseHours { get; set; }

    public string? DnsPrimary { get; set; }

    public string? DnsSecondary { get; set; }

    public string? DomainName { get; set; }

    public byte SiteId { get; set; }

    public bool IsActive { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Asset? DhcpServerAsset { get; set; }

    public virtual Asset? GatewayAsset { get; set; }

    public virtual ICollection<IpAddress> IpAddresses { get; set; } = new List<IpAddress>();

    public virtual VlanSite Site { get; set; } = null!;

    public virtual User? UpdatedByNavigation { get; set; }

    public virtual ICollection<VlanDevice> VlanDevices { get; set; } = new List<VlanDevice>();

    public virtual ICollection<VlanIpRange> VlanIpRanges { get; set; } = new List<VlanIpRange>();

    public virtual NetworkZone Zone { get; set; } = null!;
}
