using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwAllIpAddress
{
    public int? AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string AssetName { get; set; } = null!;

    public string CategoryCode { get; set; } = null!;

    public string IpPurpose { get; set; } = null!;

    public string IpAddress { get; set; } = null!;

    public long? IpNumeric { get; set; }
}
