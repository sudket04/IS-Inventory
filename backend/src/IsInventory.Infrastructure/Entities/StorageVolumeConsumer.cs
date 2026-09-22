using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class StorageVolumeConsumer
{
    public int ConsumerId { get; set; }

    public int VolumeId { get; set; }

    public int? AssetId { get; set; }

    public int? ClusterId { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public virtual Asset? Asset { get; set; }

    public virtual Cluster? Cluster { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual StorageVolume Volume { get; set; } = null!;
}
