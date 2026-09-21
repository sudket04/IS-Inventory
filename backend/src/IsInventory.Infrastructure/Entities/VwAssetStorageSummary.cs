using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwAssetStorageSummary
{
    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string AssetName { get; set; } = null!;

    public int? VolumeCount { get; set; }

    public decimal? TotalCapacityGb { get; set; }

    public decimal? TotalUsedGb { get; set; }

    public decimal? TotalFreeGb { get; set; }

    public decimal? UsedPercent { get; set; }

    public DateOnly? LastMeasuredAt { get; set; }
}
