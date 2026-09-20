using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class NotificationHistory
{
    public long HistoryId { get; set; }

    public int AssetId { get; set; }

    public short ThresholdDays { get; set; }

    public DateOnly CoverageEndSnapshot { get; set; }

    public string Channel { get; set; } = null!;

    public string? Recipient { get; set; }

    public string Status { get; set; } = null!;

    public string? ErrorMessage { get; set; }

    public DateTimeOffset SentAt { get; set; }

    public virtual Asset Asset { get; set; } = null!;
}
