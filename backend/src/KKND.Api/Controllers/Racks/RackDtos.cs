namespace KKND.Api.Controllers.Racks;

public sealed record RackListItem(
    int RackId, string RackCode, string RackName, string? LocationPath, byte TotalU,
    int UsedU, int? FreeU, decimal? UUsedPercent, int DeviceCount,
    decimal? TotalWeightKg, decimal? MaxWeightKg, decimal? WeightUsedPercent,
    decimal? TotalPowerKw, decimal? MaxPowerKw, decimal? PowerUsedPercent,
    bool? IsOverWeight, bool? IsOverPower, bool IsActive);

public sealed record RackDetail(
    int RackId, int LocationId, string? LocationName, string Code, string Name, byte TotalU,
    short? WidthMm, short? DepthMm, decimal? MaxWeightKg, decimal? MaxPowerKw,
    string NumberingDirection, bool? HasFrontDoor, bool? HasRearDoor, string? Notes,
    bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);

public sealed record RackRequest(
    int LocationId, string Code, string Name, byte TotalU, short? WidthMm, short? DepthMm,
    decimal? MaxWeightKg, decimal? MaxPowerKw, string NumberingDirection,
    bool? HasFrontDoor, bool? HasRearDoor, string? Notes, bool IsActive);

public sealed record RackMountItem(
    int RackMountId, int RackId, int AssetId, string AssetTag, string AssetName,
    string? ManufacturerName, string? ModelName, string? TypeName, string CategoryCode,
    byte StartU, byte UHeight, int? EndU, string MountFace, string Orientation,
    string StatusCode, string StatusColor, int? PowerDrawWatt, decimal? WeightKg, DateOnly? MountedDate);

public sealed record RackMountRequest(
    int AssetId, byte StartU, byte UHeight, string MountFace, string Orientation,
    DateOnly? MountedDate, string? Notes);

public sealed record RackMountUpdateRequest(
    byte StartU, byte UHeight, string MountFace, string Orientation, string? Notes);
