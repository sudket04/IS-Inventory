using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class StorageDetail
{
    public int AssetId { get; set; }

    public string? Hostname { get; set; }

    public string? MgmtUrl { get; set; }

    public byte? ControllerCount { get; set; }

    public short? DiskBayTotal { get; set; }

    public short? DiskBayUsed { get; set; }

    public decimal? RawCapacityTb { get; set; }

    public decimal? UsableCapacityTb { get; set; }

    public int? CacheGb { get; set; }

    public string? SupportedProtocols { get; set; }

    public byte? ExpansionShelfCount { get; set; }

    public string? FirmwareVersion { get; set; }

    public DateOnly? FirmwareUpdatedAt { get; set; }

    public bool? HasDedup { get; set; }

    public bool? HasCompression { get; set; }

    public bool? HasSnapshot { get; set; }

    public bool? HasReplication { get; set; }

    public virtual Asset Asset { get; set; } = null!;
}
