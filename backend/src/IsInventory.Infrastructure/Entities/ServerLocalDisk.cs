using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class ServerLocalDisk
{
    public int LocalDiskId { get; set; }

    public int AssetId { get; set; }

    public string? DiskLabel { get; set; }

    public decimal CapacityGb { get; set; }

    public string? DiskType { get; set; }

    public int SortOrder { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual User? CreatedByNavigation { get; set; }
}
