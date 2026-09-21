namespace IsInventory.Api.Controllers.ServerApplications;

public sealed record ServerApplicationListItem(
    int ApplicationId, int AssetId, int? ServerTypeId, string? ServerTypeName,
    string ApplicationName, string? PortNumber, string? LinkUrl, string? InchargeName,
    int? DepartmentId, string? DepartmentName, byte SiteId, string SiteName,
    bool IsActive, string? Notes);

public sealed record ServerApplicationRequest(
    int? ServerTypeId, string ApplicationName, string? PortNumber, string? LinkUrl,
    string? InchargeName, int? DepartmentId, byte SiteId, bool IsActive, string? Notes);
