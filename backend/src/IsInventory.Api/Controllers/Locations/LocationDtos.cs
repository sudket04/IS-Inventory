namespace IsInventory.Api.Controllers.Locations;

public sealed record LocationTreeNode(
    int LocationId,
    int? ParentLocationId,
    string Code,
    string Name,
    string LocationType,
    string? Address,
    int SortOrder,
    bool IsActive,
    IReadOnlyList<LocationTreeNode> Children);

public sealed record LocationDetail(
    int LocationId,
    int? ParentLocationId,
    string? ParentName,
    string Code,
    string Name,
    string LocationType,
    string? Address,
    int SortOrder,
    bool IsActive,
    DateTimeOffset CreatedAt);

public sealed record LocationRequest(
    int? ParentLocationId,
    string Code,
    string Name,
    string LocationType,
    string? Address,
    int SortOrder,
    bool IsActive);
