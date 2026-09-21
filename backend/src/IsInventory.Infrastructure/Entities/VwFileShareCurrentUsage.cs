using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwFileShareCurrentUsage
{
    public int ShareId { get; set; }

    public DateTimeOffset? MeasuredAt { get; set; }

    public long? QuotaBytes { get; set; }

    public long? UsedBytes { get; set; }

    public decimal? UsagePercent { get; set; }

    public string? QuotaType { get; set; }

    public long? FileCount { get; set; }

    public long? FolderCount { get; set; }

    public string UsageStatus { get; set; } = null!;

    public long? PreviousUsedBytes { get; set; }

    public long? GrowthBytes { get; set; }

    public int? GrowthPeriodDays { get; set; }
}
