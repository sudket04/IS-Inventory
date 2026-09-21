using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class Cluster
{
    public int ClusterId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string ClusterType { get; set; } = null!;

    public string? VendorProduct { get; set; }

    public short? ExpectedNodeCount { get; set; }

    public string? QuorumType { get; set; }

    public string? ManagementIp { get; set; }

    public string? ManagementUrl { get; set; }

    public int? SiteLocationId { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual ICollection<ClusterMember> ClusterMembers { get; set; } = new List<ClusterMember>();

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Location? SiteLocation { get; set; }

    public virtual ICollection<StorageVolume> StorageVolumes { get; set; } = new List<StorageVolume>();

    public virtual User? UpdatedByNavigation { get; set; }
}
