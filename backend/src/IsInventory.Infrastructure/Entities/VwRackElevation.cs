using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwRackElevation
{
    public int RackMountId { get; set; }

    public int RackId { get; set; }

    public string RackCode { get; set; } = null!;

    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string AssetName { get; set; } = null!;

    public string? ManufacturerName { get; set; }

    public string? ModelName { get; set; }

    public string? TypeName { get; set; }

    public string CategoryCode { get; set; } = null!;

    public byte StartU { get; set; }

    public byte UHeight { get; set; }

    public int? EndU { get; set; }

    public string MountFace { get; set; } = null!;

    public string Orientation { get; set; } = null!;

    public string StatusCode { get; set; } = null!;

    public string StatusColor { get; set; } = null!;

    public int? PowerDrawWatt { get; set; }

    public decimal? WeightKg { get; set; }

    public DateOnly? MountedDate { get; set; }
}
