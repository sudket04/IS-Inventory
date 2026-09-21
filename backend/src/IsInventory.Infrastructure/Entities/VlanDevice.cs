using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VlanDevice
{
    public int VlanDeviceId { get; set; }

    public int VlanId { get; set; }

    public int AssetId { get; set; }

    public string DeviceRole { get; set; } = null!;

    public string? InterfaceName { get; set; }

    public bool? IsTagged { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Vlan Vlan { get; set; } = null!;
}
