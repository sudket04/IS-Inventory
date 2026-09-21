using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class RackMount
{
    public int RackMountId { get; set; }

    public int RackId { get; set; }

    public int AssetId { get; set; }

    public byte StartU { get; set; }

    public byte UHeight { get; set; }

    public string MountFace { get; set; } = null!;

    public string Orientation { get; set; } = null!;

    public DateOnly? MountedDate { get; set; }

    public DateOnly? RemovedDate { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Rack Rack { get; set; } = null!;

    public virtual User? UpdatedByNavigation { get; set; }
}
