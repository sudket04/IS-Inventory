using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class VwAssetTypeTree
{
    public int AssetTypeId { get; set; }

    public int CategoryId { get; set; }

    public string CategoryCode { get; set; } = null!;

    public string CategoryName { get; set; } = null!;

    public int? ParentTypeId { get; set; }

    public byte TypeLevel { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? ParentCode { get; set; }

    public string? ParentName { get; set; }

    public string FullPath { get; set; } = null!;

    public bool IsVirtual { get; set; }

    public bool IsRackable { get; set; }

    public byte? DefaultUHeight { get; set; }

    public bool RequiresIp { get; set; }

    public bool CanHostVm { get; set; }

    public bool IsLayer3 { get; set; }

    public bool CanBeGateway { get; set; }

    public bool CanProvideDhcp { get; set; }

    public string? GatewayRoleCode { get; set; }

    public string? DhcpSourceCode { get; set; }

    public string? IconName { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }
}
