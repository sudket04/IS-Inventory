using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwServerHardwareSummary
{
    public int AssetId { get; set; }

    public int CpuSocketCount { get; set; }

    public int CpuTotalCores { get; set; }

    public decimal TotalRamGb { get; set; }

    public decimal TotalStorageGb { get; set; }
}
