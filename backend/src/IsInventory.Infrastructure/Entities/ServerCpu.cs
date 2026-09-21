using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class ServerCpu
{
    public int ServerCpuId { get; set; }

    public int AssetId { get; set; }

    public string CpuModel { get; set; } = null!;

    public short CoreCount { get; set; }

    public int SortOrder { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual User? CreatedByNavigation { get; set; }
}
