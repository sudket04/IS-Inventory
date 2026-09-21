using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class Asset
{
    public int AssetId { get; set; }

    public string AssetTag { get; set; } = null!;

    public int CategoryId { get; set; }

    public string Name { get; set; } = null!;

    public int? ManufacturerId { get; set; }

    public string? Model { get; set; }

    public string? SerialNumber { get; set; }

    public int StatusId { get; set; }

    public int? LocationId { get; set; }

    public int? DepartmentId { get; set; }

    public int? OwnerUserId { get; set; }

    public int? VendorId { get; set; }

    public string? PoNumber { get; set; }

    public DateOnly? PurchaseDate { get; set; }

    public decimal? PurchasePrice { get; set; }

    public string Currency { get; set; } = null!;

    public string? Notes { get; set; }

    public string? CustomAttributes { get; set; }

    public DateOnly? LastVerifiedAt { get; set; }

    public bool IsDeleted { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public int? AssetTypeId { get; set; }

    public int? ModelId { get; set; }

    public string? FixedAssetNo { get; set; }

    public string? ServiceTag { get; set; }

    public string? SystemUuid { get; set; }

    public DateOnly? ReceivedDate { get; set; }

    public DateOnly? InstallDate { get; set; }

    public DateOnly? ServiceStartDate { get; set; }

    public DateOnly? RetireDate { get; set; }

    public DateOnly? DisposalDate { get; set; }

    public string? DisposalMethod { get; set; }

    public string? DisposalReference { get; set; }

    public string? CostCenter { get; set; }

    public short? BudgetYear { get; set; }

    public virtual ICollection<AssetRelationship> AssetRelationshipSourceAssets { get; set; } = new List<AssetRelationship>();

    public virtual ICollection<AssetRelationship> AssetRelationshipTargetAssets { get; set; } = new List<AssetRelationship>();

    public virtual AssetType? AssetType { get; set; }

    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();

    public virtual AssetCategory Category { get; set; } = null!;

    public virtual ICollection<ClusterMember> ClusterMembers { get; set; } = new List<ClusterMember>();

    public virtual ComputerDetail? ComputerDetail { get; set; }

    public virtual ICollection<ContractAsset> ContractAssets { get; set; } = new List<ContractAsset>();

    public virtual User? CreatedByNavigation { get; set; }

    public virtual User? DeletedByNavigation { get; set; }

    public virtual Department? Department { get; set; }

    public virtual ICollection<FileShare> FileShares { get; set; } = new List<FileShare>();

    public virtual ICollection<InternetPolicy> InternetPolicies { get; set; } = new List<InternetPolicy>();

    public virtual IpAddress? IpAddress { get; set; }

    public virtual Location? Location { get; set; }

    public virtual Manufacturer? Manufacturer { get; set; }

    public virtual MobileIotDetail? MobileIotDetail { get; set; }

    public virtual DeviceModel? ModelNavigation { get; set; }

    public virtual NetworkDetail? NetworkDetailAsset { get; set; }

    public virtual ICollection<NetworkDetail> NetworkDetailUplinkAssets { get; set; } = new List<NetworkDetail>();

    public virtual ICollection<NotificationHistory> NotificationHistories { get; set; } = new List<NotificationHistory>();

    public virtual User? OwnerUser { get; set; }

    public virtual PeripheralDetail? PeripheralDetail { get; set; }

    public virtual PowerDetail? PowerDetail { get; set; }

    public virtual RackMount? RackMount { get; set; }

    public virtual ICollection<ServerApplication> ServerApplications { get; set; } = new List<ServerApplication>();

    public virtual ICollection<ServerCpu> ServerCpus { get; set; } = new List<ServerCpu>();

    public virtual ServerDetail? ServerDetail { get; set; }

    public virtual ICollection<ServerLocalDisk> ServerLocalDisks { get; set; } = new List<ServerLocalDisk>();

    public virtual ICollection<ServerMemoryModule> ServerMemoryModules { get; set; } = new List<ServerMemoryModule>();

    public virtual ServerRoleAssignment? ServerRoleAssignment { get; set; }

    public virtual SoftwareDetail? SoftwareDetail { get; set; }

    public virtual ICollection<SoftwareInstallation> SoftwareInstallationSoftwareAssets { get; set; } = new List<SoftwareInstallation>();

    public virtual ICollection<SoftwareInstallation> SoftwareInstallationTargetAssets { get; set; } = new List<SoftwareInstallation>();

    public virtual AssetStatus Status { get; set; } = null!;

    public virtual StorageDetail? StorageDetail { get; set; }

    public virtual ICollection<StorageVolume> StorageVolumeAssets { get; set; } = new List<StorageVolume>();

    public virtual ICollection<StorageVolumeConsumer> StorageVolumeConsumers { get; set; } = new List<StorageVolumeConsumer>();

    public virtual ICollection<StorageVolume> StorageVolumeProviderAssets { get; set; } = new List<StorageVolume>();

    public virtual User? UpdatedByNavigation { get; set; }

    public virtual Vendor? Vendor { get; set; }

    public virtual ICollection<VlanDevice> VlanDevices { get; set; } = new List<VlanDevice>();

    public virtual ICollection<Vlan> VlanDhcpServerAssets { get; set; } = new List<Vlan>();

    public virtual ICollection<Vlan> VlanGatewayAssets { get; set; } = new List<Vlan>();

    public virtual ICollection<VlanIpRange> VlanIpRanges { get; set; } = new List<VlanIpRange>();
}
