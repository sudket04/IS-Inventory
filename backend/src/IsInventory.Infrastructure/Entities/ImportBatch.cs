using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class ImportBatch
{
    public int BatchId { get; set; }

    public Guid BatchUid { get; set; }

    public int CategoryId { get; set; }

    public string FileName { get; set; } = null!;

    public int TotalRows { get; set; }

    public int SuccessRows { get; set; }

    public int FailedRows { get; set; }

    public string Status { get; set; } = null!;

    public string? ErrorReportPath { get; set; }

    public DateTimeOffset StartedAt { get; set; }

    public DateTimeOffset? CompletedAt { get; set; }

    public int? ImportedBy { get; set; }

    public virtual AssetCategory Category { get; set; } = null!;

    public virtual User? ImportedByNavigation { get; set; }
}
