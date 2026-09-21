namespace KKND.Api.Controllers.Clusters;

public sealed record StorageVolumeListItem(
    int VolumeId, int? AssetId, int? ClusterId, int? ProviderAssetId, string? ProviderAssetTag,
    string VolumeName, string VolumeType, string? StorageProtocol, string? RaidLevel, string? DiskType,
    decimal CapacityGb, decimal? UsedGb, decimal? FreeGb, decimal? UsedPercent, DateOnly? LastMeasuredAt,
    string? MountPath, bool IsShared, bool? IsThinProvisioned, bool? EncryptionEnabled,
    int? ImmutabilityDays, int? RetentionDays, decimal? DedupRatio, string? Notes, bool IsActive);

public sealed record StorageVolumeRequest(
    string VolumeName, string VolumeType, string? StorageProtocol, string? RaidLevel, string? DiskType,
    decimal CapacityGb, decimal? UsedGb, DateOnly? LastMeasuredAt, string? MountPath, int? ProviderAssetId,
    bool? IsThinProvisioned, bool? EncryptionEnabled, int? ImmutabilityDays, int? RetentionDays,
    decimal? DedupRatio, string? Notes, bool IsActive);
