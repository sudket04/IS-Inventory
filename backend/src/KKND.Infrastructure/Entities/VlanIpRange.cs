using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VlanIpRange
{
    public int RangeId { get; set; }

    public int VlanId { get; set; }

    public string RangeType { get; set; } = null!;

    public string StartIp { get; set; } = null!;

    public string EndIp { get; set; } = null!;

    public long? StartNumeric { get; set; }

    public long? EndNumeric { get; set; }

    public string? DhcpSourceType { get; set; }

    public int? DhcpServerAssetId { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Asset? DhcpServerAsset { get; set; }

    public virtual ICollection<IpAddress> IpAddresses { get; set; } = new List<IpAddress>();

    public virtual Vlan Vlan { get; set; } = null!;
}
