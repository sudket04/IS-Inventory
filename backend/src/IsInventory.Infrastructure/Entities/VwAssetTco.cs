using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwAssetTco
{
    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string AssetName { get; set; } = null!;

    public string? FixedAssetNo { get; set; }

    public decimal? PurchasePrice { get; set; }

    public string Currency { get; set; } = null!;

    public DateOnly? ServiceStartDate { get; set; }

    public int? MonthsInService { get; set; }

    public int ContractCount { get; set; }

    public decimal TotalContractCost { get; set; }

    public decimal? TotalCostOfOwnership { get; set; }

    public decimal? SupportCostVsPurchasePercent { get; set; }
}
