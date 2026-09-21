using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwAssetCoverage
{
    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string AssetName { get; set; } = null!;

    public int? ContractId { get; set; }

    public string? ContractNo { get; set; }

    public string? ContractType { get; set; }

    public string? VendorName { get; set; }

    public DateOnly? CoverageStart { get; set; }

    public DateOnly? CoverageEnd { get; set; }

    public string? CoverageHours { get; set; }

    public string? ServiceType { get; set; }

    public int? SeatCount { get; set; }

    public string? ContractStatus { get; set; }

    public int? DaysRemaining { get; set; }

    public string CoverageStatus { get; set; } = null!;
}
