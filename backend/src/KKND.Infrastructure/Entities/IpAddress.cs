using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class IpAddress
{
    public long IpId { get; set; }

    public string IpAddress1 { get; set; } = null!;

    public long? IpNumeric { get; set; }

    public int? VlanId { get; set; }

    public int? RangeId { get; set; }

    public int? AssetId { get; set; }

    public string? InterfaceName { get; set; }

    public string IpPurpose { get; set; } = null!;

    public string AssignmentType { get; set; } = null!;

    public string Status { get; set; } = null!;

    public bool IsPrimary { get; set; }

    public string? MacAddress { get; set; }

    public string? Hostname { get; set; }

    public string? DnsName { get; set; }

    public string? Description { get; set; }

    public DateOnly? AssignedDate { get; set; }

    public DateOnly? ReleasedDate { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual Asset? Asset { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual VlanIpRange? Range { get; set; }

    public virtual User? UpdatedByNavigation { get; set; }

    public virtual Vlan? Vlan { get; set; }
}
