using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwRackUtilization
{
    public int RackId { get; set; }

    public string RackCode { get; set; } = null!;

    public string RackName { get; set; } = null!;

    public string? LocationPath { get; set; }

    public byte TotalU { get; set; }

    public int UsedU { get; set; }

    public int? FreeU { get; set; }

    public decimal? UUsedPercent { get; set; }

    public int DeviceCount { get; set; }

    public decimal? TotalWeightKg { get; set; }

    public decimal? MaxWeightKg { get; set; }

    public decimal? WeightUsedPercent { get; set; }

    public decimal? TotalPowerKw { get; set; }

    public decimal? MaxPowerKw { get; set; }

    public decimal? PowerUsedPercent { get; set; }

    public bool? IsOverWeight { get; set; }

    public bool? IsOverPower { get; set; }

    public bool IsActive { get; set; }
}
