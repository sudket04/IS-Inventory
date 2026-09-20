using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwCascadeModel
{
    public int ModelId { get; set; }

    public int ManufacturerId { get; set; }

    public string ManufacturerName { get; set; } = null!;

    public int AssetTypeId { get; set; }

    public string TypeName { get; set; } = null!;

    public string ModelName { get; set; } = null!;

    public string? ModelNumber { get; set; }

    public byte? UHeight { get; set; }

    public string? FormFactor { get; set; }

    public int? PowerDrawWatt { get; set; }

    public decimal? WeightKg { get; set; }

    public string? DefaultSpecs { get; set; }

    public DateOnly? EolDate { get; set; }

    public DateOnly? EosDate { get; set; }

    public bool IsVerified { get; set; }

    public string DisplayLabel { get; set; } = null!;

    public bool? IsPastEos { get; set; }
}
