using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwClusterOverview
{
    public int ClusterId { get; set; }

    public string ClusterCode { get; set; } = null!;

    public string ClusterName { get; set; } = null!;

    public string ClusterType { get; set; } = null!;

    public string? VendorProduct { get; set; }

    public string? ManagementIp { get; set; }

    public short? ExpectedNodeCount { get; set; }

    public int ActiveMembers { get; set; }

    public bool? IsDegraded { get; set; }

    public string? MemberList { get; set; }

    public int SharedVolumeCount { get; set; }

    public decimal? SharedCapacityGb { get; set; }

    public decimal? SharedUsedGb { get; set; }

    public decimal? SharedUsedPercent { get; set; }

    public string? SiteName { get; set; }

    public bool IsActive { get; set; }
}
