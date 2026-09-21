using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwAssetList
{
    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string? FixedAssetNo { get; set; }

    public string Name { get; set; } = null!;

    public string? SerialNumber { get; set; }

    public string? ServiceTag { get; set; }

    public string CategoryCode { get; set; } = null!;

    public string CategoryName { get; set; } = null!;

    public string? TypeName { get; set; }

    public string? TypeGroupName { get; set; }

    public string StatusCode { get; set; } = null!;

    public string StatusName { get; set; } = null!;

    public string StatusColor { get; set; } = null!;

    public string? ManufacturerName { get; set; }

    public string? ModelName { get; set; }

    public string? LocationPath { get; set; }

    public string? LocationName { get; set; }

    public string? RackCode { get; set; }

    public byte? StartU { get; set; }

    public string? DepartmentName { get; set; }

    public string? OwnerName { get; set; }

    public string? VendorName { get; set; }

    public DateOnly? PurchaseDate { get; set; }

    public DateOnly? ServiceStartDate { get; set; }

    public decimal? PurchasePrice { get; set; }

    public string Currency { get; set; } = null!;

    public DateOnly? CoverageEnd { get; set; }

    public int? DaysRemaining { get; set; }

    public string? CoverageStatus { get; set; }

    public string? ContractNo { get; set; }

    public string? IpAddress { get; set; }

    public string? Hostname { get; set; }

    public short? VlanNumber { get; set; }

    public string? ZoneName { get; set; }

    public string? ServerPrimaryRole { get; set; }

    public DateOnly? LastVerifiedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
}
