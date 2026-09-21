using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class AssetType
{
    public int AssetTypeId { get; set; }

    public int CategoryId { get; set; }

    public int? ParentTypeId { get; set; }

    public byte TypeLevel { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

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

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual AssetCategory Category { get; set; } = null!;

    public virtual ICollection<DeviceModel> DeviceModels { get; set; } = new List<DeviceModel>();

    public virtual ICollection<AssetType> InverseParentType { get; set; } = new List<AssetType>();

    public virtual AssetType? ParentType { get; set; }
}
