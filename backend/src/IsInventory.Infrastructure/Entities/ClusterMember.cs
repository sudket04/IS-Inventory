using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class ClusterMember
{
    public int MemberId { get; set; }

    public int ClusterId { get; set; }

    public int AssetId { get; set; }

    public string MemberRole { get; set; } = null!;

    public short? NodePriority { get; set; }

    public DateOnly? JoinedDate { get; set; }

    public DateOnly? LeftDate { get; set; }

    public bool? IsActive { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public string? HostName { get; set; }

    public string? IpHost { get; set; }

    public string? IpMgmt { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual Cluster Cluster { get; set; } = null!;

    public virtual User? CreatedByNavigation { get; set; }
}
