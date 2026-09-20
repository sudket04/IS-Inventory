using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class Manufacturer
{
    public int ManufacturerId { get; set; }

    public string Name { get; set; } = null!;

    public string? SupportUrl { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual ICollection<DeviceModel> DeviceModels { get; set; } = new List<DeviceModel>();
}
