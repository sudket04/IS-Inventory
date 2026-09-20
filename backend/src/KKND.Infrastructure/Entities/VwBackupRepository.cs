using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwBackupRepository
{
    public int VolumeId { get; set; }

    public string VolumeName { get; set; } = null!;

    public string VolumeType { get; set; } = null!;

    public string? BackupServerTag { get; set; }

    public string? BackupServerName { get; set; }

    public string? ClusterName { get; set; }

    public string? StorageProviderTag { get; set; }

    public string? StorageProviderName { get; set; }

    public string? StorageProtocol { get; set; }

    public string? DiskType { get; set; }

    public decimal CapacityGb { get; set; }

    public decimal? UsedGb { get; set; }

    public decimal? FreeGb { get; set; }

    public decimal? UsedPercent { get; set; }

    public int? ImmutabilityDays { get; set; }

    public int? RetentionDays { get; set; }

    public decimal? DedupRatio { get; set; }

    public bool? EncryptionEnabled { get; set; }

    public string CapacityStatus { get; set; } = null!;

    public bool? LacksImmutability { get; set; }

    public DateOnly? LastMeasuredAt { get; set; }
}
