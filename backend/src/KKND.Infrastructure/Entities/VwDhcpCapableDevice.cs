using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwDhcpCapableDevice
{
    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public string AssetName { get; set; } = null!;

    public string DeviceKind { get; set; } = null!;

    public string DeviceTypeName { get; set; } = null!;

    public string? DeviceClassName { get; set; }

    public string? DhcpSourceType { get; set; }

    public string? DeviceHostname { get; set; }

    public string? DeviceIp { get; set; }

    public string? LocationName { get; set; }

    public string StatusCode { get; set; } = null!;

    public string DisplayLabel { get; set; } = null!;
}
