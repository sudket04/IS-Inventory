using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class StorageVolume
{
    public int VolumeId { get; set; }

    public int? AssetId { get; set; }

    public int? ClusterId { get; set; }

    public int? ProviderAssetId { get; set; }

    public string VolumeName { get; set; } = null!;

    public string VolumeType { get; set; } = null!;

    public string? StorageProtocol { get; set; }

    public string? RaidLevel { get; set; }

    public string? DiskType { get; set; }

    public decimal CapacityGb { get; set; }

    public decimal? UsedGb { get; set; }

    public decimal? FreeGb { get; set; }

    public decimal? UsedPercent { get; set; }

    public DateOnly? LastMeasuredAt { get; set; }

    public string? MountPath { get; set; }

    public bool IsShared { get; set; }

    public bool? IsThinProvisioned { get; set; }

    public bool? EncryptionEnabled { get; set; }

    public int? ImmutabilityDays { get; set; }

    public int? RetentionDays { get; set; }

    public decimal? DedupRatio { get; set; }

    public string? Notes { get; set; }

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual Asset? Asset { get; set; }

    public virtual Cluster? Cluster { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Asset? ProviderAsset { get; set; }

    public virtual ICollection<StorageVolumeConsumer> StorageVolumeConsumers { get; set; } = new List<StorageVolumeConsumer>();

    public virtual User? UpdatedByNavigation { get; set; }
}
