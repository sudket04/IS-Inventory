using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class ServerMemoryModule
{
    public int MemoryModuleId { get; set; }

    public int AssetId { get; set; }

    public decimal CapacityGb { get; set; }

    public string? MemoryType { get; set; }

    public int SortOrder { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual User? CreatedByNavigation { get; set; }
}
