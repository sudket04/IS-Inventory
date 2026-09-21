using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwAssetPrimaryIp
{
    public int? AssetId { get; set; }

    public string PrimaryIp { get; set; } = null!;

    public string? Hostname { get; set; }

    public int? VlanId { get; set; }

    public short? VlanNumber { get; set; }

    public string? VlanName { get; set; }

    public string? ZoneCode { get; set; }

    public string? ZoneName { get; set; }
}
