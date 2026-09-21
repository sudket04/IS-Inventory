using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwSelectablePhysicalServer
{
    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string AssetName { get; set; } = null!;

    public int? ManufacturerId { get; set; }

    public string? ManufacturerName { get; set; }

    public int? ModelId { get; set; }

    public string? ModelName { get; set; }

    public string? SerialNumber { get; set; }

    public string? Hostname { get; set; }

    public string TypeName { get; set; } = null!;

    public string? LocationName { get; set; }

    public string StatusCode { get; set; } = null!;

    public string? DisplayLabel { get; set; }
}
