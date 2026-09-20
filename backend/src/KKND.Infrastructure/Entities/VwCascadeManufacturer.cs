using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwCascadeManufacturer
{
    public int AssetTypeId { get; set; }

    public int CategoryId { get; set; }

    public int ManufacturerId { get; set; }

    public string ManufacturerName { get; set; } = null!;

    public int? ModelCount { get; set; }
}
