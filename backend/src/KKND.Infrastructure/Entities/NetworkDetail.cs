using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class NetworkDetail
{
    public int AssetId { get; set; }

    public string? Hostname { get; set; }

    public string? MacAddress { get; set; }

    public short? PortCount { get; set; }

    public string? PortSpeed { get; set; }

    public bool? PoeSupport { get; set; }

    public string? FirmwareVersion { get; set; }

    public DateOnly? FirmwareUpdatedAt { get; set; }

    public string? StackInfo { get; set; }

    public int? UplinkAssetId { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual Asset? UplinkAsset { get; set; }
}
