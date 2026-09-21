using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwIpRangeUsage
{
    public int RangeId { get; set; }

    public int VlanId { get; set; }

    public short? VlanNumber { get; set; }

    public string VlanName { get; set; } = null!;

    public string RangeType { get; set; } = null!;

    public string StartIp { get; set; } = null!;

    public string EndIp { get; set; } = null!;

    public long? RangeSize { get; set; }

    public int UsedCount { get; set; }

    public long? AvailableCount { get; set; }

    public decimal? UsedPercent { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; }
}
