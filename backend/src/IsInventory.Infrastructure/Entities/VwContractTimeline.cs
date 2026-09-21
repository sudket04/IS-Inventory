using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwContractTimeline
{
    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public int ContractId { get; set; }

    public string ContractNo { get; set; } = null!;

    public string? VendorContractNo { get; set; }

    public string ContractType { get; set; } = null!;

    public string? VendorName { get; set; }

    public int? PreviousContractId { get; set; }

    public string? PreviousContractNo { get; set; }

    public DateOnly CoverageStart { get; set; }

    public DateOnly CoverageEnd { get; set; }

    public decimal? PeriodCost { get; set; }

    public string Currency { get; set; } = null!;

    public int? SeatCount { get; set; }

    public string? CoverageHours { get; set; }

    public string? ServiceType { get; set; }

    public short? SlaResponseHours { get; set; }

    public bool AutoRenew { get; set; }

    public string Status { get; set; } = null!;

    public string? ContractOwner { get; set; }

    public long? SequenceNo { get; set; }

    public decimal? CostChangePercent { get; set; }

    public int? GapDaysFromPrevious { get; set; }
}
