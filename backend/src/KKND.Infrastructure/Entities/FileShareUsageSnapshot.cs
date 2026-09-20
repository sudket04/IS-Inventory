using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class FileShareUsageSnapshot
{
    public long SnapshotId { get; set; }

    public int ShareId { get; set; }

    public DateTimeOffset MeasuredAt { get; set; }

    public long? QuotaBytes { get; set; }

    public long UsedBytes { get; set; }

    public long? PeakUsageBytes { get; set; }

    public string? QuotaType { get; set; }

    public long? FileCount { get; set; }

    public long? FolderCount { get; set; }

    public long? RunId { get; set; }

    public decimal? UsagePercent { get; set; }

    public virtual FileShare Share { get; set; } = null!;
}
