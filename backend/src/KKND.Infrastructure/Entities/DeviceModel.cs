using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class DeviceModel
{
    public int ModelId { get; set; }

    public int ManufacturerId { get; set; }

    public int AssetTypeId { get; set; }

    public string ModelName { get; set; } = null!;

    public string? ModelNumber { get; set; }

    public string? Description { get; set; }

    public byte? UHeight { get; set; }

    public string? FormFactor { get; set; }

    public int? PowerDrawWatt { get; set; }

    public decimal? WeightKg { get; set; }

    public string? DefaultSpecs { get; set; }

    public DateOnly? EolDate { get; set; }

    public DateOnly? EosDate { get; set; }

    public string? DatasheetUrl { get; set; }

    public bool IsVerified { get; set; }

    public int? VerifiedBy { get; set; }

    public DateTimeOffset? VerifiedAt { get; set; }

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual AssetType AssetType { get; set; } = null!;

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Manufacturer Manufacturer { get; set; } = null!;

    public virtual User? UpdatedByNavigation { get; set; }

    public virtual User? VerifiedByNavigation { get; set; }
}
