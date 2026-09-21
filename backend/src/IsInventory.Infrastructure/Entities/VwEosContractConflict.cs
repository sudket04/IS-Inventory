using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwEosContractConflict
{
    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string AssetName { get; set; } = null!;

    public string? ManufacturerName { get; set; }

    public string ModelName { get; set; } = null!;

    public DateOnly? EosDate { get; set; }

    public DateOnly CoverageEnd { get; set; }

    public string ContractNo { get; set; } = null!;

    public int? DaysPaidBeyondEos { get; set; }

    public decimal? ContractCost { get; set; }
}
