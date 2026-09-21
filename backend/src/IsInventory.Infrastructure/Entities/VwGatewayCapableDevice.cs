using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class VwGatewayCapableDevice
{
    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string AssetName { get; set; } = null!;

    public string DeviceTypeName { get; set; } = null!;

    public string? DeviceClassName { get; set; }

    public string? GatewayDeviceRole { get; set; }

    public bool IsLayer3 { get; set; }

    public string? DeviceHostname { get; set; }

    public string? DeviceIp { get; set; }

    public string? LocationName { get; set; }

    public string StatusCode { get; set; } = null!;

    public string DisplayLabel { get; set; } = null!;
}
