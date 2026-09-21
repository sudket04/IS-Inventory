using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class User
{
    public int UserId { get; set; }

    public string Username { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public int RoleId { get; set; }

    public int? DepartmentId { get; set; }

    public string? Phone { get; set; }

    public bool IsActive { get; set; }

    public bool MustChangePassword { get; set; }

    public byte FailedLoginAttempts { get; set; }

    public DateTimeOffset? LockedUntil { get; set; }

    public DateTimeOffset? LastLoginAt { get; set; }

    public DateTimeOffset? PasswordChangedAt { get; set; }

    public string? ExternalId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual ICollection<AdUser> AdUsers { get; set; } = new List<AdUser>();

    public virtual ICollection<Asset> AssetCreatedByNavigations { get; set; } = new List<Asset>();

    public virtual ICollection<Asset> AssetDeletedByNavigations { get; set; } = new List<Asset>();

    public virtual ICollection<Asset> AssetOwnerUsers { get; set; } = new List<Asset>();

    public virtual ICollection<AssetRelationship> AssetRelationships { get; set; } = new List<AssetRelationship>();

    public virtual ICollection<Asset> AssetUpdatedByNavigations { get; set; } = new List<Asset>();

    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();

    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public virtual ICollection<Cluster> ClusterCreatedByNavigations { get; set; } = new List<Cluster>();

    public virtual ICollection<ClusterMember> ClusterMembers { get; set; } = new List<ClusterMember>();

    public virtual ICollection<Cluster> ClusterUpdatedByNavigations { get; set; } = new List<Cluster>();

    public virtual ICollection<CollectorAgent> CollectorAgents { get; set; } = new List<CollectorAgent>();

    public virtual ICollection<ContractAsset> ContractAssetCreatedByNavigations { get; set; } = new List<ContractAsset>();

    public virtual ICollection<ContractAsset> ContractAssetUpdatedByNavigations { get; set; } = new List<ContractAsset>();

    public virtual ICollection<Contract> ContractCreatedByNavigations { get; set; } = new List<Contract>();

    public virtual ICollection<Contract> ContractOwnerUsers { get; set; } = new List<Contract>();

    public virtual ICollection<Contract> ContractUpdatedByNavigations { get; set; } = new List<Contract>();

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Department? Department { get; set; }

    public virtual ICollection<DeviceModel> DeviceModelCreatedByNavigations { get; set; } = new List<DeviceModel>();

    public virtual ICollection<DeviceModel> DeviceModelUpdatedByNavigations { get; set; } = new List<DeviceModel>();

    public virtual ICollection<DeviceModel> DeviceModelVerifiedByNavigations { get; set; } = new List<DeviceModel>();

    public virtual ICollection<FileShare> FileShareCreatedByNavigations { get; set; } = new List<FileShare>();

    public virtual ICollection<FileShare> FileShareLastReviewedByNavigations { get; set; } = new List<FileShare>();

    public virtual ICollection<FileShare> FileShareOwnerUsers { get; set; } = new List<FileShare>();

    public virtual ICollection<FileSharePermission> FileSharePermissionCreatedByNavigations { get; set; } = new List<FileSharePermission>();

    public virtual ICollection<FileSharePermission> FileSharePermissionUpdatedByNavigations { get; set; } = new List<FileSharePermission>();

    public virtual ICollection<FileShare> FileShareUpdatedByNavigations { get; set; } = new List<FileShare>();

    public virtual ICollection<ImportBatch> ImportBatches { get; set; } = new List<ImportBatch>();

    public virtual ICollection<InternetPolicy> InternetPolicyCreatedByNavigations { get; set; } = new List<InternetPolicy>();

    public virtual ICollection<InternetPolicyGroup> InternetPolicyGroupCreatedByNavigations { get; set; } = new List<InternetPolicyGroup>();

    public virtual ICollection<InternetPolicyGroup> InternetPolicyGroupUpdatedByNavigations { get; set; } = new List<InternetPolicyGroup>();

    public virtual ICollection<InternetPolicy> InternetPolicyUpdatedByNavigations { get; set; } = new List<InternetPolicy>();

    public virtual ICollection<User> InverseCreatedByNavigation { get; set; } = new List<User>();

    public virtual ICollection<User> InverseUpdatedByNavigation { get; set; } = new List<User>();

    public virtual ICollection<IpAddress> IpAddressCreatedByNavigations { get; set; } = new List<IpAddress>();

    public virtual ICollection<IpAddress> IpAddressUpdatedByNavigations { get; set; } = new List<IpAddress>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<Rack> RackCreatedByNavigations { get; set; } = new List<Rack>();

    public virtual ICollection<RackMount> RackMountCreatedByNavigations { get; set; } = new List<RackMount>();

    public virtual ICollection<RackMount> RackMountUpdatedByNavigations { get; set; } = new List<RackMount>();

    public virtual ICollection<Rack> RackUpdatedByNavigations { get; set; } = new List<Rack>();

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual Role Role { get; set; } = null!;

    public virtual ICollection<ServerApplication> ServerApplicationCreatedByNavigations { get; set; } = new List<ServerApplication>();

    public virtual ICollection<ServerApplication> ServerApplicationUpdatedByNavigations { get; set; } = new List<ServerApplication>();

    public virtual ICollection<ServerCpu> ServerCpus { get; set; } = new List<ServerCpu>();

    public virtual ICollection<ServerLocalDisk> ServerLocalDisks { get; set; } = new List<ServerLocalDisk>();

    public virtual ICollection<ServerMemoryModule> ServerMemoryModules { get; set; } = new List<ServerMemoryModule>();

    public virtual ICollection<ServerRoleAssignment> ServerRoleAssignments { get; set; } = new List<ServerRoleAssignment>();

    public virtual ICollection<SoftwareInstallation> SoftwareInstallationCreatedByNavigations { get; set; } = new List<SoftwareInstallation>();

    public virtual ICollection<SoftwareInstallation> SoftwareInstallationRemovedByNavigations { get; set; } = new List<SoftwareInstallation>();

    public virtual ICollection<StorageVolumeConsumer> StorageVolumeConsumers { get; set; } = new List<StorageVolumeConsumer>();

    public virtual ICollection<StorageVolume> StorageVolumeCreatedByNavigations { get; set; } = new List<StorageVolume>();

    public virtual ICollection<StorageVolume> StorageVolumeUpdatedByNavigations { get; set; } = new List<StorageVolume>();

    public virtual ICollection<SyncJobRun> SyncJobRuns { get; set; } = new List<SyncJobRun>();

    public virtual ICollection<SyncJob> SyncJobs { get; set; } = new List<SyncJob>();

    public virtual ICollection<SystemSetting> SystemSettings { get; set; } = new List<SystemSetting>();

    public virtual User? UpdatedByNavigation { get; set; }

    public virtual ICollection<UserMenuPermission> UserMenuPermissionUpdatedByNavigations { get; set; } = new List<UserMenuPermission>();

    public virtual ICollection<UserMenuPermission> UserMenuPermissionUsers { get; set; } = new List<UserMenuPermission>();

    public virtual ICollection<Vlan> VlanCreatedByNavigations { get; set; } = new List<Vlan>();

    public virtual ICollection<VlanDevice> VlanDevices { get; set; } = new List<VlanDevice>();

    public virtual ICollection<VlanIpRange> VlanIpRanges { get; set; } = new List<VlanIpRange>();

    public virtual ICollection<Vlan> VlanUpdatedByNavigations { get; set; } = new List<Vlan>();
}
