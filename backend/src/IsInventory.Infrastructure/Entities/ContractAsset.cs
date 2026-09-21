using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class ContractAsset
{
    public int ContractAssetId { get; set; }

    public int ContractId { get; set; }

    public int AssetId { get; set; }

    public DateOnly CoverageStart { get; set; }

    public DateOnly CoverageEnd { get; set; }

    public decimal? AllocatedCost { get; set; }

    public int? SeatCount { get; set; }

    public string? ServiceLevelNote { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual Contract Contract { get; set; } = null!;

    public virtual User? CreatedByNavigation { get; set; }

    public virtual User? UpdatedByNavigation { get; set; }
}
