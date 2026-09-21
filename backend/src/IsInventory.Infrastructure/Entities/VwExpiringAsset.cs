using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwExpiringAsset
{
    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string CategoryCode { get; set; } = null!;

    public string CategoryName { get; set; } = null!;

    public int? ContractId { get; set; }

    public string? ContractNo { get; set; }

    public string? ContractType { get; set; }

    public DateOnly? CoverageEndDate { get; set; }

    public int? DaysRemaining { get; set; }

    public string Severity { get; set; } = null!;

    public int? OwnerUserId { get; set; }

    public string? OwnerName { get; set; }

    public string? OwnerEmail { get; set; }

    public int? CurrentContractId { get; set; }

    public string? ContractOwnerName { get; set; }

    public string? ContractOwnerEmail { get; set; }

    public string? LocationName { get; set; }

    public string? VendorName { get; set; }

    public int? SeatCount { get; set; }
}
