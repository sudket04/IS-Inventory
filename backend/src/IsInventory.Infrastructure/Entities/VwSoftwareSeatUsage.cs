using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwSoftwareSeatUsage
{
    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string SoftwareName { get; set; } = null!;

    public string? Publisher { get; set; }

    public string? Version { get; set; }

    public string LicenseType { get; set; } = null!;

    public int SeatsPurchased { get; set; }

    public int SeatsUsed { get; set; }

    public int? SeatsAvailable { get; set; }

    public bool? IsOverDeployed { get; set; }

    public int? OverDeployedCount { get; set; }

    public DateOnly? LicenseEndDate { get; set; }

    public int? DaysUntilExpiry { get; set; }

    public string? CurrentContractNo { get; set; }

    public string? VendorName { get; set; }
}
