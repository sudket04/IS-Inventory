using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwVlanIpAllocation
{
    public int VlanId { get; set; }

    public short? VlanNumber { get; set; }

    public string NetworkLevel { get; set; } = null!;

    public string VlanName { get; set; } = null!;

    public string ZoneCode { get; set; } = null!;

    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string AssetName { get; set; } = null!;

    public string CategoryCode { get; set; } = null!;

    public string IpPurpose { get; set; } = null!;

    public string? IpAddress { get; set; }

    public long? IpNumeric { get; set; }

    public string RangeType { get; set; } = null!;

    public string? RangeDescription { get; set; }

    public bool? IsGateway { get; set; }
}
