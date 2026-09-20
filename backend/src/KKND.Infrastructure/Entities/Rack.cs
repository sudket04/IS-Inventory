using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class Rack
{
    public int RackId { get; set; }

    public int LocationId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public byte TotalU { get; set; }

    public short? WidthMm { get; set; }

    public short? DepthMm { get; set; }

    public decimal? MaxWeightKg { get; set; }

    public decimal? MaxPowerKw { get; set; }

    public string NumberingDirection { get; set; } = null!;

    public bool? HasFrontDoor { get; set; }

    public bool? HasRearDoor { get; set; }

    public string? Notes { get; set; }

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Location Location { get; set; } = null!;

    public virtual ICollection<RackMount> RackMounts { get; set; } = new List<RackMount>();

    public virtual User? UpdatedByNavigation { get; set; }
}
