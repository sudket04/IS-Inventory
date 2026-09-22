using System;
using System.Collections.Generic;
using IsInventory.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using FileShare = IsInventory.Infrastructure.Entities.FileShare;

namespace IsInventory.Infrastructure;

public partial class IsInventoryDbContext : DbContext
{
    public IsInventoryDbContext(DbContextOptions<IsInventoryDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AccessLevel> AccessLevels { get; set; }

    public virtual DbSet<AdGroup> AdGroups { get; set; }

    public virtual DbSet<AdGroupMember> AdGroupMembers { get; set; }

    public virtual DbSet<AdObjectSyncState> AdObjectSyncStates { get; set; }

    public virtual DbSet<AdUser> AdUsers { get; set; }

    public virtual DbSet<Asset> Assets { get; set; }

    public virtual DbSet<AssetCategory> AssetCategories { get; set; }

    public virtual DbSet<AssetRelationship> AssetRelationships { get; set; }

    public virtual DbSet<AssetStatus> AssetStatuses { get; set; }

    public virtual DbSet<AssetTagSequence> AssetTagSequences { get; set; }

    public virtual DbSet<AssetType> AssetTypes { get; set; }

    public virtual DbSet<Attachment> Attachments { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<AuditLogsArchive> AuditLogsArchives { get; set; }

    public virtual DbSet<ClassificationRoleVisibility> ClassificationRoleVisibilities { get; set; }

    public virtual DbSet<Cluster> Clusters { get; set; }

    public virtual DbSet<ClusterMember> ClusterMembers { get; set; }

    public virtual DbSet<CollectorAgent> CollectorAgents { get; set; }

    public virtual DbSet<ComputerDetail> ComputerDetails { get; set; }

    public virtual DbSet<Contract> Contracts { get; set; }

    public virtual DbSet<ContractAsset> ContractAssets { get; set; }

    public virtual DbSet<CpuCoreOption> CpuCoreOptions { get; set; }

    public virtual DbSet<Department> Departments { get; set; }

    public virtual DbSet<DeviceModel> DeviceModels { get; set; }

    public virtual DbSet<FileShare> FileShares { get; set; }

    public virtual DbSet<FileSharePermission> FileSharePermissions { get; set; }

    public virtual DbSet<FileShareUsageSnapshot> FileShareUsageSnapshots { get; set; }

    public virtual DbSet<FolderClassificationLevel> FolderClassificationLevels { get; set; }

    public virtual DbSet<ImportBatch> ImportBatches { get; set; }

    public virtual DbSet<InternetPolicy> InternetPolicies { get; set; }

    public virtual DbSet<InternetPolicyCategory> InternetPolicyCategories { get; set; }

    public virtual DbSet<InternetPolicyGroup> InternetPolicyGroups { get; set; }

    public virtual DbSet<IpAddress> IpAddresses { get; set; }

    public virtual DbSet<Location> Locations { get; set; }

    public virtual DbSet<Manufacturer> Manufacturers { get; set; }

    public virtual DbSet<Menu> Menus { get; set; }

    public virtual DbSet<MobileIotDetail> MobileIotDetails { get; set; }

    public virtual DbSet<NetworkDetail> NetworkDetails { get; set; }

    public virtual DbSet<NetworkZone> NetworkZones { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<NotificationHistory> NotificationHistories { get; set; }

    public virtual DbSet<OsType> OsTypes { get; set; }

    public virtual DbSet<OsVersion> OsVersions { get; set; }

    public virtual DbSet<PeripheralDetail> PeripheralDetails { get; set; }

    public virtual DbSet<PowerDetail> PowerDetails { get; set; }

    public virtual DbSet<Rack> Racks { get; set; }

    public virtual DbSet<RackMount> RackMounts { get; set; }

    public virtual DbSet<RamSizeOption> RamSizeOptions { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<RelationshipType> RelationshipTypes { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<RoleMenuPermission> RoleMenuPermissions { get; set; }

    public virtual DbSet<ServerApplication> ServerApplications { get; set; }

    public virtual DbSet<ServerCpu> ServerCpus { get; set; }

    public virtual DbSet<ServerDetail> ServerDetails { get; set; }

    public virtual DbSet<ServerLocalDisk> ServerLocalDisks { get; set; }

    public virtual DbSet<ServerMemoryModule> ServerMemoryModules { get; set; }

    public virtual DbSet<ServerRole> ServerRoles { get; set; }

    public virtual DbSet<ServerRoleAssignment> ServerRoleAssignments { get; set; }

    public virtual DbSet<ServerStatus> ServerStatuses { get; set; }

    public virtual DbSet<SoftwareDetail> SoftwareDetails { get; set; }

    public virtual DbSet<SoftwareInstallation> SoftwareInstallations { get; set; }

    public virtual DbSet<StorageDetail> StorageDetails { get; set; }

    public virtual DbSet<StorageSizeOptionsGb> StorageSizeOptionsGbs { get; set; }

    public virtual DbSet<StorageSizeOptionsTb> StorageSizeOptionsTbs { get; set; }

    public virtual DbSet<StorageVolume> StorageVolumes { get; set; }

    public virtual DbSet<StorageVolumeConsumer> StorageVolumeConsumers { get; set; }

    public virtual DbSet<SyncJob> SyncJobs { get; set; }

    public virtual DbSet<SyncJobRun> SyncJobRuns { get; set; }

    public virtual DbSet<SyncOuScope> SyncOuScopes { get; set; }

    public virtual DbSet<SystemSetting> SystemSettings { get; set; }

    public virtual DbSet<Tally> Tallies { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserMenuPermission> UserMenuPermissions { get; set; }

    public virtual DbSet<UserSite> UserSites { get; set; }

    public virtual DbSet<UserTeam> UserTeams { get; set; }

    public virtual DbSet<Vendor> Vendors { get; set; }

    public virtual DbSet<Vlan> Vlans { get; set; }

    public virtual DbSet<VlanDevice> VlanDevices { get; set; }

    public virtual DbSet<VlanIpRange> VlanIpRanges { get; set; }

    public virtual DbSet<VlanSite> VlanSites { get; set; }

    public virtual DbSet<VwAdGroupExpanded> VwAdGroupExpandeds { get; set; }

    public virtual DbSet<VwAllIpAddress> VwAllIpAddresses { get; set; }

    public virtual DbSet<VwAssetCoverage> VwAssetCoverages { get; set; }

    public virtual DbSet<VwAssetList> VwAssetLists { get; set; }

    public virtual DbSet<VwAssetPrimaryIp> VwAssetPrimaryIps { get; set; }

    public virtual DbSet<VwAssetRelationshipsExpanded> VwAssetRelationshipsExpandeds { get; set; }

    public virtual DbSet<VwAssetStorageSummary> VwAssetStorageSummaries { get; set; }

    public virtual DbSet<VwAssetTco> VwAssetTcos { get; set; }

    public virtual DbSet<VwAssetTypeTree> VwAssetTypeTrees { get; set; }

    public virtual DbSet<VwBackupRepository> VwBackupRepositories { get; set; }

    public virtual DbSet<VwCascadeManufacturer> VwCascadeManufacturers { get; set; }

    public virtual DbSet<VwCascadeModel> VwCascadeModels { get; set; }

    public virtual DbSet<VwClassificationSummary> VwClassificationSummaries { get; set; }

    public virtual DbSet<VwClusterOverview> VwClusterOverviews { get; set; }

    public virtual DbSet<VwContractTimeline> VwContractTimelines { get; set; }

    public virtual DbSet<VwDepartmentFolderSummary> VwDepartmentFolderSummaries { get; set; }

    public virtual DbSet<VwDhcpCapableDevice> VwDhcpCapableDevices { get; set; }

    public virtual DbSet<VwEosContractConflict> VwEosContractConflicts { get; set; }

    public virtual DbSet<VwExpiringAsset> VwExpiringAssets { get; set; }

    public virtual DbSet<VwFileShareChangeHistory> VwFileShareChangeHistories { get; set; }

    public virtual DbSet<VwFileShareCurrentUsage> VwFileShareCurrentUsages { get; set; }

    public virtual DbSet<VwFileShareList> VwFileShareLists { get; set; }

    public virtual DbSet<VwGatewayCapableDevice> VwGatewayCapableDevices { get; set; }

    public virtual DbSet<VwIpRangeUsage> VwIpRangeUsages { get; set; }

    public virtual DbSet<VwIpValidationIssue> VwIpValidationIssues { get; set; }

    public virtual DbSet<VwLocationTree> VwLocationTrees { get; set; }

    public virtual DbSet<VwPermissionChangeHistory> VwPermissionChangeHistories { get; set; }

    public virtual DbSet<VwPermissionIssue> VwPermissionIssues { get; set; }

    public virtual DbSet<VwPermissionRecentVersion> VwPermissionRecentVersions { get; set; }

    public virtual DbSet<VwRackElevation> VwRackElevations { get; set; }

    public virtual DbSet<VwRackUtilization> VwRackUtilizations { get; set; }

    public virtual DbSet<VwSelectablePhysicalServer> VwSelectablePhysicalServers { get; set; }

    public virtual DbSet<VwServerApplication> VwServerApplications { get; set; }

    public virtual DbSet<VwServerHardwareSummary> VwServerHardwareSummaries { get; set; }

    public virtual DbSet<VwServerRolesSummary> VwServerRolesSummaries { get; set; }

    public virtual DbSet<VwShareEffectiveUser> VwShareEffectiveUsers { get; set; }

    public virtual DbSet<VwSharePermissionTimeline> VwSharePermissionTimelines { get; set; }

    public virtual DbSet<VwSoftwareSeatUsage> VwSoftwareSeatUsages { get; set; }

    public virtual DbSet<VwSyncHealth> VwSyncHealths { get; set; }

    public virtual DbSet<VwUntrackedPermissionChange> VwUntrackedPermissionChanges { get; set; }

    public virtual DbSet<VwUserAccessPath> VwUserAccessPaths { get; set; }

    public virtual DbSet<VwUserEffectiveAccess> VwUserEffectiveAccesses { get; set; }

    public virtual DbSet<VwUserInternetPolicy> VwUserInternetPolicies { get; set; }

    public virtual DbSet<VwVlanIpAllocation> VwVlanIpAllocations { get; set; }

    public virtual DbSet<VwVlanSummary> VwVlanSummaries { get; set; }

    public virtual DbSet<VwVlanValidationIssue> VwVlanValidationIssues { get; set; }

    public virtual DbSet<WebCategory> WebCategories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AccessLevel>(entity =>
        {
            entity
                .ToTable("access_levels")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("access_levels_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.Code, "UX_access_levels_code").IsUnique();

            entity.Property(e => e.AccessLevelId).HasColumnName("access_level_id");
            entity.Property(e => e.CanWrite).HasColumnName("can_write");
            entity.Property(e => e.Code)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.ColorToken)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("color_token");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.NameEn)
                .HasMaxLength(50)
                .HasColumnName("name_en");
            entity.Property(e => e.NameTh)
                .HasMaxLength(50)
                .HasColumnName("name_th");
            entity.Property(e => e.PrivilegeRank).HasColumnName("privilege_rank");
        });

        modelBuilder.Entity<AdGroup>(entity =>
        {
            entity
                .ToTable("ad_groups")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("ad_groups_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.DisplayName, "IX_ad_groups_name");

            entity.HasIndex(e => e.ObjectGuid, "UX_ad_groups_guid").IsUnique();

            entity.HasIndex(e => e.SamAccountName, "UX_ad_groups_sam")
                .IsUnique()
                .HasFilter("([is_present_in_ad]=(1))");

            entity.Property(e => e.AdGroupId).HasColumnName("ad_group_id");
            entity.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("description");
            entity.Property(e => e.DirectMemberCount).HasColumnName("direct_member_count");
            entity.Property(e => e.DisappearedAt)
                .HasPrecision(3)
                .HasColumnName("disappeared_at");
            entity.Property(e => e.DisplayName)
                .HasMaxLength(256)
                .HasColumnName("display_name");
            entity.Property(e => e.DistinguishedName)
                .HasMaxLength(1000)
                .HasColumnName("distinguished_name");
            entity.Property(e => e.FirstSeenAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("first_seen_at");
            entity.Property(e => e.GroupCategory)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("group_category");
            entity.Property(e => e.GroupScope)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("group_scope");
            entity.Property(e => e.IsPresentInAd)
                .HasDefaultValue(true)
                .HasColumnName("is_present_in_ad");
            entity.Property(e => e.ManagedByDn)
                .HasMaxLength(1000)
                .HasColumnName("managed_by_dn");
            entity.Property(e => e.ObjectGuid).HasColumnName("object_guid");
            entity.Property(e => e.ObjectSid)
                .HasMaxLength(184)
                .IsUnicode(false)
                .HasColumnName("object_sid");
            entity.Property(e => e.OuPath)
                .HasMaxLength(1000)
                .HasColumnName("ou_path");
            entity.Property(e => e.SamAccountName)
                .HasMaxLength(256)
                .HasColumnName("sam_account_name");
        });

        modelBuilder.Entity<AdGroupMember>(entity =>
        {
            entity.HasKey(e => e.MembershipId);

            entity
                .ToTable("ad_group_members", tb => tb.HasTrigger("trg_ad_group_members_no_cycle"))
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("ad_group_members_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.MemberGroupId, "IX_agm_by_group").HasFilter("([member_group_id] IS NOT NULL)");

            entity.HasIndex(e => e.MemberUserId, "IX_agm_by_user").HasFilter("([member_user_id] IS NOT NULL)");

            entity.HasIndex(e => new { e.AdGroupId, e.MemberGroupId }, "UX_agm_group")
                .IsUnique()
                .HasFilter("([member_group_id] IS NOT NULL)");

            entity.HasIndex(e => new { e.AdGroupId, e.MemberUserId }, "UX_agm_user")
                .IsUnique()
                .HasFilter("([member_user_id] IS NOT NULL)");

            entity.Property(e => e.MembershipId).HasColumnName("membership_id");
            entity.Property(e => e.AdGroupId).HasColumnName("ad_group_id");
            entity.Property(e => e.IsPrimaryGroup).HasColumnName("is_primary_group");
            entity.Property(e => e.MemberGroupId).HasColumnName("member_group_id");
            entity.Property(e => e.MemberUserId).HasColumnName("member_user_id");

            entity.HasOne(d => d.AdGroup).WithMany(p => p.AdGroupMemberAdGroups)
                .HasForeignKey(d => d.AdGroupId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_agm_group");

            entity.HasOne(d => d.MemberGroup).WithMany(p => p.AdGroupMemberMemberGroups)
                .HasForeignKey(d => d.MemberGroupId)
                .HasConstraintName("FK_agm_member_group");

            entity.HasOne(d => d.MemberUser).WithMany(p => p.AdGroupMembers)
                .HasForeignKey(d => d.MemberUserId)
                .HasConstraintName("FK_agm_member_user");
        });

        modelBuilder.Entity<AdObjectSyncState>(entity =>
        {
            entity.HasKey(e => e.ObjectGuid);

            entity.ToTable("ad_object_sync_state");

            entity.Property(e => e.ObjectGuid)
                .ValueGeneratedNever()
                .HasColumnName("object_guid");
            entity.Property(e => e.LastRunId).HasColumnName("last_run_id");
            entity.Property(e => e.LastSeenAt)
                .HasPrecision(3)
                .HasColumnName("last_seen_at");
            entity.Property(e => e.ObjectType)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("object_type");
        });

        modelBuilder.Entity<AdUser>(entity =>
        {
            entity
                .ToTable("ad_users")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("ad_users_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.DepartmentId, "IX_ad_users_dept").HasFilter("([is_present_in_ad]=(1))");

            entity.HasIndex(e => e.LinkedUserId, "IX_ad_users_linked").HasFilter("([linked_user_id] IS NOT NULL)");

            entity.HasIndex(e => e.DisplayName, "IX_ad_users_name");

            entity.HasIndex(e => new { e.IsEnabled, e.IsPresentInAd }, "IX_ad_users_status");

            entity.HasIndex(e => e.ObjectGuid, "UX_ad_users_guid").IsUnique();

            entity.HasIndex(e => e.SamAccountName, "UX_ad_users_sam")
                .IsUnique()
                .HasFilter("([is_present_in_ad]=(1))");

            entity.Property(e => e.AdUserId).HasColumnName("ad_user_id");
            entity.Property(e => e.AccountExpiresAt)
                .HasPrecision(3)
                .HasColumnName("account_expires_at");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.DepartmentNameRaw)
                .HasMaxLength(150)
                .HasColumnName("department_name_raw");
            entity.Property(e => e.DisappearedAt)
                .HasPrecision(3)
                .HasColumnName("disappeared_at");
            entity.Property(e => e.DisplayName)
                .HasMaxLength(256)
                .HasColumnName("display_name");
            entity.Property(e => e.DistinguishedName)
                .HasMaxLength(1000)
                .HasColumnName("distinguished_name");
            entity.Property(e => e.Email)
                .HasMaxLength(320)
                .HasColumnName("email");
            entity.Property(e => e.EmployeeId)
                .HasMaxLength(50)
                .HasColumnName("employee_id");
            entity.Property(e => e.FirstSeenAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("first_seen_at");
            entity.Property(e => e.IsEnabled)
                .HasDefaultValue(true)
                .HasColumnName("is_enabled");
            entity.Property(e => e.IsPresentInAd)
                .HasDefaultValue(true)
                .HasColumnName("is_present_in_ad");
            entity.Property(e => e.JobTitle)
                .HasMaxLength(150)
                .HasColumnName("job_title");
            entity.Property(e => e.LastLogonAt)
                .HasPrecision(3)
                .HasColumnName("last_logon_at");
            entity.Property(e => e.LinkedUserId).HasColumnName("linked_user_id");
            entity.Property(e => e.ObjectGuid).HasColumnName("object_guid");
            entity.Property(e => e.ObjectSid)
                .HasMaxLength(184)
                .IsUnicode(false)
                .HasColumnName("object_sid");
            entity.Property(e => e.OuPath)
                .HasMaxLength(1000)
                .HasColumnName("ou_path");
            entity.Property(e => e.PasswordLastSetAt)
                .HasPrecision(3)
                .HasColumnName("password_last_set_at");
            entity.Property(e => e.PrimaryGroupSid)
                .HasMaxLength(184)
                .IsUnicode(false)
                .HasColumnName("primary_group_sid");
            entity.Property(e => e.SamAccountName)
                .HasMaxLength(256)
                .HasColumnName("sam_account_name");
            entity.Property(e => e.UserPrincipalName)
                .HasMaxLength(320)
                .HasColumnName("user_principal_name");

            entity.HasOne(d => d.Department).WithMany(p => p.AdUsers)
                .HasForeignKey(d => d.DepartmentId)
                .HasConstraintName("FK_adu_department");

            entity.HasOne(d => d.LinkedUser).WithMany(p => p.AdUsers)
                .HasForeignKey(d => d.LinkedUserId)
                .HasConstraintName("FK_adu_user");
        });

        modelBuilder.Entity<Asset>(entity =>
        {
            entity
                .ToTable("assets", tb => tb.HasTrigger("trg_assets_validate_type"))
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("assets_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.DepartmentId, "IX_assets_department").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.LastVerifiedAt, "IX_assets_last_verified").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => new { e.IsDeleted, e.CategoryId, e.StatusId }, "IX_assets_list_covering");

            entity.HasIndex(e => e.LocationId, "IX_assets_location").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.ManufacturerId, "IX_assets_manufacturer");

            entity.HasIndex(e => e.ModelId, "IX_assets_model").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.Name, "IX_assets_name").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.OwnerUserId, "IX_assets_owner").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.ServiceStartDate, "IX_assets_service_start").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.StatusId, "IX_assets_status").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.AssetTypeId, "IX_assets_type").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.VendorId, "IX_assets_vendor").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.AssetTag, "UX_assets_asset_tag").IsUnique();

            entity.HasIndex(e => e.FixedAssetNo, "UX_assets_fixed_asset_no")
                .IsUnique()
                .HasFilter("([fixed_asset_no] IS NOT NULL AND [is_deleted]=(0))");

            entity.HasIndex(e => e.SerialNumber, "UX_assets_serial")
                .IsUnique()
                .HasFilter("([serial_number] IS NOT NULL AND [is_deleted]=(0))");

            entity.HasIndex(e => e.ServiceTag, "UX_assets_service_tag")
                .IsUnique()
                .HasFilter("([service_tag] IS NOT NULL AND [is_deleted]=(0))");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.AssetTypeId).HasColumnName("asset_type_id");
            entity.Property(e => e.BudgetYear).HasColumnName("budget_year");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CostCenter)
                .HasMaxLength(50)
                .HasColumnName("cost_center");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Currency)
                .HasMaxLength(3)
                .IsUnicode(false)
                .HasDefaultValue("THB")
                .IsFixedLength()
                .HasColumnName("currency");
            entity.Property(e => e.CustomAttributes).HasColumnName("custom_attributes");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(3)
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.DisposalDate).HasColumnName("disposal_date");
            entity.Property(e => e.DisposalMethod)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("disposal_method");
            entity.Property(e => e.DisposalReference)
                .HasMaxLength(100)
                .HasColumnName("disposal_reference");
            entity.Property(e => e.FixedAssetNo)
                .HasMaxLength(50)
                .HasColumnName("fixed_asset_no");
            entity.Property(e => e.InstallDate).HasColumnName("install_date");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.LastVerifiedAt).HasColumnName("last_verified_at");
            entity.Property(e => e.LocationId).HasColumnName("location_id");
            entity.Property(e => e.ManufacturerId).HasColumnName("manufacturer_id");
            entity.Property(e => e.Model)
                .HasMaxLength(150)
                .HasColumnName("model");
            entity.Property(e => e.ModelId).HasColumnName("model_id");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.OwnerUserId).HasColumnName("owner_user_id");
            entity.Property(e => e.PoNumber)
                .HasMaxLength(50)
                .HasColumnName("po_number");
            entity.Property(e => e.PurchaseDate).HasColumnName("purchase_date");
            entity.Property(e => e.PurchasePrice)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("purchase_price");
            entity.Property(e => e.ReceivedDate).HasColumnName("received_date");
            entity.Property(e => e.RetireDate).HasColumnName("retire_date");
            entity.Property(e => e.SerialNumber)
                .HasMaxLength(100)
                .HasColumnName("serial_number");
            entity.Property(e => e.ServiceStartDate).HasColumnName("service_start_date");
            entity.Property(e => e.ServiceTag)
                .HasMaxLength(50)
                .HasColumnName("service_tag");
            entity.Property(e => e.StatusId).HasColumnName("status_id");
            entity.Property(e => e.SystemUuid)
                .HasMaxLength(100)
                .HasColumnName("system_uuid");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.VendorId).HasColumnName("vendor_id");

            entity.HasOne(d => d.AssetType).WithMany(p => p.Assets)
                .HasForeignKey(d => d.AssetTypeId)
                .HasConstraintName("FK_assets_type");

            entity.HasOne(d => d.Category).WithMany(p => p.Assets)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_assets_category");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.AssetCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_assets_created_by");

            entity.HasOne(d => d.DeletedByNavigation).WithMany(p => p.AssetDeletedByNavigations)
                .HasForeignKey(d => d.DeletedBy)
                .HasConstraintName("FK_assets_deleted_by");

            entity.HasOne(d => d.Department).WithMany(p => p.Assets)
                .HasForeignKey(d => d.DepartmentId)
                .HasConstraintName("FK_assets_department");

            entity.HasOne(d => d.Location).WithMany(p => p.Assets)
                .HasForeignKey(d => d.LocationId)
                .HasConstraintName("FK_assets_location");

            entity.HasOne(d => d.Manufacturer).WithMany(p => p.Assets)
                .HasForeignKey(d => d.ManufacturerId)
                .HasConstraintName("FK_assets_manufacturer");

            entity.HasOne(d => d.ModelNavigation).WithMany(p => p.Assets)
                .HasForeignKey(d => d.ModelId)
                .HasConstraintName("FK_assets_model");

            entity.HasOne(d => d.OwnerUser).WithMany(p => p.AssetOwnerUsers)
                .HasForeignKey(d => d.OwnerUserId)
                .HasConstraintName("FK_assets_owner");

            entity.HasOne(d => d.Status).WithMany(p => p.Assets)
                .HasForeignKey(d => d.StatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_assets_status");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.AssetUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_assets_updated_by");

            entity.HasOne(d => d.Vendor).WithMany(p => p.Assets)
                .HasForeignKey(d => d.VendorId)
                .HasConstraintName("FK_assets_vendor");
        });

        modelBuilder.Entity<AssetCategory>(entity =>
        {
            entity.HasKey(e => e.CategoryId);

            entity.ToTable("asset_categories");

            entity.HasIndex(e => e.Code, "UX_asset_categories_code").IsUnique();

            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.Code)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.DetailTable)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("detail_table");
            entity.Property(e => e.IconName)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("icon_name");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<AssetRelationship>(entity =>
        {
            entity.HasKey(e => e.RelationshipId);

            entity
                .ToTable("asset_relationships")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("asset_relationships_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.SourceAssetId, "IX_relations_source");

            entity.HasIndex(e => e.TargetAssetId, "IX_relations_target");

            entity.HasIndex(e => new { e.SourceAssetId, e.TargetAssetId, e.RelationshipTypeId }, "UX_asset_relationships").IsUnique();

            entity.Property(e => e.RelationshipId).HasColumnName("relationship_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Notes)
                .HasMaxLength(400)
                .HasColumnName("notes");
            entity.Property(e => e.RelationshipTypeId).HasColumnName("relationship_type_id");
            entity.Property(e => e.SourceAssetId).HasColumnName("source_asset_id");
            entity.Property(e => e.TargetAssetId).HasColumnName("target_asset_id");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.AssetRelationships)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_relations_created_by");

            entity.HasOne(d => d.RelationshipType).WithMany(p => p.AssetRelationships)
                .HasForeignKey(d => d.RelationshipTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_relations_type");

            entity.HasOne(d => d.SourceAsset).WithMany(p => p.AssetRelationshipSourceAssets)
                .HasForeignKey(d => d.SourceAssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_relations_source");

            entity.HasOne(d => d.TargetAsset).WithMany(p => p.AssetRelationshipTargetAssets)
                .HasForeignKey(d => d.TargetAssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_relations_target");
        });

        modelBuilder.Entity<AssetStatus>(entity =>
        {
            entity.HasKey(e => e.StatusId);

            entity.ToTable("asset_statuses");

            entity.HasIndex(e => e.Code, "UX_asset_statuses_code").IsUnique();

            entity.Property(e => e.StatusId).HasColumnName("status_id");
            entity.Property(e => e.Code)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.ColorToken)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("color_token");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsOperational)
                .HasDefaultValue(true)
                .HasColumnName("is_operational");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<AssetTagSequence>(entity =>
        {
            entity.HasKey(e => new { e.CategoryId, e.Year });

            entity.ToTable("asset_tag_sequences");

            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.Year).HasColumnName("year");
            entity.Property(e => e.LastNumber).HasColumnName("last_number");

            entity.HasOne(d => d.Category).WithMany(p => p.AssetTagSequences)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_tagseq_category");
        });

        modelBuilder.Entity<AssetType>(entity =>
        {
            entity
                .ToTable("asset_types")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("asset_types_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => new { e.CategoryId, e.TypeLevel }, "IX_at_category").HasFilter("([is_active]=(1))");

            entity.HasIndex(e => e.ParentTypeId, "IX_at_parent").HasFilter("([is_active]=(1))");

            entity.HasIndex(e => e.Code, "UX_asset_types_code").IsUnique();

            entity.Property(e => e.AssetTypeId).HasColumnName("asset_type_id");
            entity.Property(e => e.CanBeGateway).HasColumnName("can_be_gateway");
            entity.Property(e => e.CanHostVm).HasColumnName("can_host_vm");
            entity.Property(e => e.CanProvideDhcp).HasColumnName("can_provide_dhcp");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.Code)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.DefaultUHeight).HasColumnName("default_u_height");
            entity.Property(e => e.Description)
                .HasMaxLength(300)
                .HasColumnName("description");
            entity.Property(e => e.DhcpSourceCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("dhcp_source_code");
            entity.Property(e => e.GatewayRoleCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("gateway_role_code");
            entity.Property(e => e.IconName)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("icon_name");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsLayer3).HasColumnName("is_layer3");
            entity.Property(e => e.IsRackable).HasColumnName("is_rackable");
            entity.Property(e => e.IsVirtual).HasColumnName("is_virtual");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.ParentTypeId).HasColumnName("parent_type_id");
            entity.Property(e => e.RequiresIp).HasColumnName("requires_ip");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            entity.Property(e => e.TypeLevel).HasColumnName("type_level");

            entity.HasOne(d => d.Category).WithMany(p => p.AssetTypes)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_asset_types_category");

            entity.HasOne(d => d.ParentType).WithMany(p => p.InverseParentType)
                .HasForeignKey(d => d.ParentTypeId)
                .HasConstraintName("FK_asset_types_parent");
        });

        modelBuilder.Entity<Attachment>(entity =>
        {
            entity
                .ToTable("attachments")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("attachments_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.AssetId, "IX_attachments_asset").HasFilter("([is_deleted]=(0) AND [asset_id] IS NOT NULL)");

            entity.HasIndex(e => e.ContractId, "IX_attachments_contract").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.StoredFileName, "UX_attachments_stored_name").IsUnique();

            entity.Property(e => e.AttachmentId).HasColumnName("attachment_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.Description)
                .HasMaxLength(300)
                .HasColumnName("description");
            entity.Property(e => e.FileHash)
                .HasMaxLength(64)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("file_hash");
            entity.Property(e => e.FileSizeBytes).HasColumnName("file_size_bytes");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.MimeType)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("mime_type");
            entity.Property(e => e.OriginalFileName)
                .HasMaxLength(255)
                .HasColumnName("original_file_name");
            entity.Property(e => e.StoragePath)
                .HasMaxLength(400)
                .HasColumnName("storage_path");
            entity.Property(e => e.StoredFileName)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("stored_file_name");
            entity.Property(e => e.UploadedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("uploaded_at");
            entity.Property(e => e.UploadedBy).HasColumnName("uploaded_by");

            entity.HasOne(d => d.Asset).WithMany(p => p.Attachments)
                .HasForeignKey(d => d.AssetId)
                .HasConstraintName("FK_attachments_asset");

            entity.HasOne(d => d.Contract).WithMany(p => p.Attachments)
                .HasForeignKey(d => d.ContractId)
                .HasConstraintName("FK_attachments_contract");

            entity.HasOne(d => d.UploadedByNavigation).WithMany(p => p.Attachments)
                .HasForeignKey(d => d.UploadedBy)
                .HasConstraintName("FK_attachments_user");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.AuditId);

            entity.ToTable("audit_logs", tb => tb.HasTrigger("trg_audit_logs_no_modify"));

            entity.HasIndex(e => new { e.Action, e.OccurredAt }, "IX_audit_action").IsDescending(false, true);

            entity.HasIndex(e => e.BatchUid, "IX_audit_batch").HasFilter("([batch_uid] IS NOT NULL)");

            entity.HasIndex(e => new { e.EntityType, e.EntityId, e.OccurredAt }, "IX_audit_entity").IsDescending(false, false, true);

            entity.HasIndex(e => e.OccurredAt, "IX_audit_occurred").IsDescending();

            entity.HasIndex(e => new { e.UserId, e.OccurredAt }, "IX_audit_user").IsDescending(false, true);

            entity.Property(e => e.AuditId).HasColumnName("audit_id");
            entity.Property(e => e.Action)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("action");
            entity.Property(e => e.AfterJson).HasColumnName("after_json");
            entity.Property(e => e.BatchUid).HasColumnName("batch_uid");
            entity.Property(e => e.BeforeJson).HasColumnName("before_json");
            entity.Property(e => e.ChangedFields)
                .HasMaxLength(1000)
                .HasColumnName("changed_fields");
            entity.Property(e => e.EntityId).HasColumnName("entity_id");
            entity.Property(e => e.EntityLabel)
                .HasMaxLength(200)
                .HasColumnName("entity_label");
            entity.Property(e => e.EntityType)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("entity_type");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("ip_address");
            entity.Property(e => e.OccurredAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("occurred_at");
            entity.Property(e => e.UserAgent)
                .HasMaxLength(400)
                .HasColumnName("user_agent");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.UsernameSnapshot)
                .HasMaxLength(100)
                .HasColumnName("username_snapshot");

            entity.HasOne(d => d.User).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_audit_user");
        });

        modelBuilder.Entity<AuditLogsArchive>(entity =>
        {
            entity.HasKey(e => e.AuditId);

            entity.ToTable("audit_logs_archive");

            entity.Property(e => e.AuditId)
                .ValueGeneratedNever()
                .HasColumnName("audit_id");
            entity.Property(e => e.Action)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("action");
            entity.Property(e => e.AfterJson).HasColumnName("after_json");
            entity.Property(e => e.ArchivedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("archived_at");
            entity.Property(e => e.BatchUid).HasColumnName("batch_uid");
            entity.Property(e => e.BeforeJson).HasColumnName("before_json");
            entity.Property(e => e.ChangedFields)
                .HasMaxLength(1000)
                .HasColumnName("changed_fields");
            entity.Property(e => e.EntityId).HasColumnName("entity_id");
            entity.Property(e => e.EntityLabel)
                .HasMaxLength(200)
                .HasColumnName("entity_label");
            entity.Property(e => e.EntityType)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("entity_type");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("ip_address");
            entity.Property(e => e.OccurredAt)
                .HasPrecision(3)
                .HasColumnName("occurred_at");
            entity.Property(e => e.UserAgent)
                .HasMaxLength(400)
                .HasColumnName("user_agent");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.UsernameSnapshot)
                .HasMaxLength(100)
                .HasColumnName("username_snapshot");
        });

        modelBuilder.Entity<ClassificationRoleVisibility>(entity =>
        {
            entity.HasKey(e => new { e.ClassificationId, e.RoleId });

            entity
                .ToTable("classification_role_visibility")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("classification_role_visibility_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.Property(e => e.ClassificationId).HasColumnName("classification_id");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.CanEdit).HasColumnName("can_edit");
            entity.Property(e => e.CanExport).HasColumnName("can_export");
            entity.Property(e => e.CanView)
                .HasDefaultValue(true)
                .HasColumnName("can_view");

            entity.HasOne(d => d.Classification).WithMany(p => p.ClassificationRoleVisibilities)
                .HasForeignKey(d => d.ClassificationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_crv_classification");

            entity.HasOne(d => d.Role).WithMany(p => p.ClassificationRoleVisibilities)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_crv_role");
        });

        modelBuilder.Entity<Cluster>(entity =>
        {
            entity
                .ToTable("clusters")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("clusters_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.SiteLocationId, "IX_clusters_site");

            entity.HasIndex(e => e.Code, "UX_clusters_code").IsUnique();

            entity.Property(e => e.ClusterId).HasColumnName("cluster_id");
            entity.Property(e => e.ClusterType)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("cluster_type");
            entity.Property(e => e.Code)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description)
                .HasMaxLength(400)
                .HasColumnName("description");
            entity.Property(e => e.ExpectedNodeCount).HasColumnName("expected_node_count");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.ManagementIp)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("management_ip");
            entity.Property(e => e.ManagementUrl)
                .HasMaxLength(400)
                .HasColumnName("management_url");
            entity.Property(e => e.Name)
                .HasMaxLength(120)
                .HasColumnName("name");
            entity.Property(e => e.QuorumType)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("quorum_type");
            entity.Property(e => e.SiteLocationId).HasColumnName("site_location_id");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.VendorProduct)
                .HasMaxLength(120)
                .HasColumnName("vendor_product");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ClusterCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_clusters_created_by");

            entity.HasOne(d => d.SiteLocation).WithMany(p => p.Clusters)
                .HasForeignKey(d => d.SiteLocationId)
                .HasConstraintName("FK_clusters_site");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ClusterUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_clusters_updated_by");
        });

        modelBuilder.Entity<ClusterMember>(entity =>
        {
            entity.HasKey(e => e.MemberId);

            entity
                .ToTable("cluster_members")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("cluster_members_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.AssetId, "IX_clmem_asset").HasFilter("([left_date] IS NULL)");

            entity.HasIndex(e => new { e.ClusterId, e.AssetId, e.MemberRole }, "UX_cluster_members_active")
                .IsUnique()
                .HasFilter("([left_date] IS NULL)");

            entity.HasIndex(e => e.HostName, "UX_clmem_host_name")
                .IsUnique()
                .HasFilter("([left_date] IS NULL AND [host_name] IS NOT NULL)");

            entity.HasIndex(e => e.IpHost, "UX_clmem_ip_host")
                .IsUnique()
                .HasFilter("([left_date] IS NULL AND [ip_host] IS NOT NULL)");

            entity.HasIndex(e => e.IpMgmt, "UX_clmem_ip_mgmt")
                .IsUnique()
                .HasFilter("([left_date] IS NULL AND [ip_mgmt] IS NOT NULL)");

            entity.Property(e => e.MemberId).HasColumnName("member_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.ClusterId).HasColumnName("cluster_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.HostName)
                .HasMaxLength(100)
                .HasColumnName("host_name");
            entity.Property(e => e.IpHost)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("ip_host");
            entity.Property(e => e.IpMgmt)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("ip_mgmt");
            entity.Property(e => e.IsActive)
                .HasComputedColumnSql("(case when [left_date] IS NULL then CONVERT([bit],(1)) else CONVERT([bit],(0)) end)", true)
                .HasColumnName("is_active");
            entity.Property(e => e.JoinedDate).HasColumnName("joined_date");
            entity.Property(e => e.LeftDate).HasColumnName("left_date");
            entity.Property(e => e.MemberRole)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("member_role");
            entity.Property(e => e.NodePriority).HasColumnName("node_priority");
            entity.Property(e => e.Notes)
                .HasMaxLength(300)
                .HasColumnName("notes");

            entity.HasOne(d => d.Asset).WithMany(p => p.ClusterMembers)
                .HasForeignKey(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_clmem_asset");

            entity.HasOne(d => d.Cluster).WithMany(p => p.ClusterMembers)
                .HasForeignKey(d => d.ClusterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_clmem_cluster");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ClusterMembers)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_clmem_created_by");
        });

        modelBuilder.Entity<CpuCoreOption>(entity =>
        {
            entity.HasKey(e => e.CpuCoreOptionId);

            entity.ToTable("cpu_core_options");

            entity.HasIndex(e => e.CoreCount, "UX_cpu_core_options").IsUnique();

            entity.Property(e => e.CpuCoreOptionId).HasColumnName("cpu_core_option_id");
            entity.Property(e => e.CoreCount).HasColumnName("core_count");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<RamSizeOption>(entity =>
        {
            entity.HasKey(e => e.RamSizeOptionId);

            entity.ToTable("ram_size_options");

            entity.HasIndex(e => e.SizeGb, "UX_ram_size_options").IsUnique();

            entity.Property(e => e.RamSizeOptionId).HasColumnName("ram_size_option_id");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.SizeGb).HasColumnName("size_gb");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<StorageSizeOptionsGb>(entity =>
        {
            entity.HasKey(e => e.StorageSizeGbId);

            entity.ToTable("storage_size_options_gb");

            entity.HasIndex(e => e.SizeGb, "UX_storage_size_options_gb").IsUnique();

            entity.Property(e => e.StorageSizeGbId).HasColumnName("storage_size_gb_id");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.SizeGb).HasColumnName("size_gb");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<StorageSizeOptionsTb>(entity =>
        {
            entity.HasKey(e => e.StorageSizeTbId);

            entity.ToTable("storage_size_options_tb");

            entity.HasIndex(e => e.SizeTb, "UX_storage_size_options_tb").IsUnique();

            entity.Property(e => e.StorageSizeTbId).HasColumnName("storage_size_tb_id");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.SizeTb).HasColumnName("size_tb");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<CollectorAgent>(entity =>
        {
            entity.HasKey(e => e.AgentId);

            entity.ToTable("collector_agents");

            entity.HasIndex(e => e.AgentCode, "UX_collector_agents_code").IsUnique();

            entity.HasIndex(e => e.ApiKeyHash, "UX_collector_agents_hash").IsUnique();

            entity.Property(e => e.AgentId).HasColumnName("agent_id");
            entity.Property(e => e.AgentCode)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("agent_code");
            entity.Property(e => e.AgentName)
                .HasMaxLength(150)
                .HasColumnName("agent_name");
            entity.Property(e => e.AgentVersion)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("agent_version");
            entity.Property(e => e.AllowedSourceIps)
                .HasMaxLength(500)
                .HasColumnName("allowed_source_ips");
            entity.Property(e => e.ApiKeyExpiresAt)
                .HasPrecision(3)
                .HasColumnName("api_key_expires_at");
            entity.Property(e => e.ApiKeyHash)
                .HasMaxLength(64)
                .IsUnicode(false)
                .HasColumnName("api_key_hash");
            entity.Property(e => e.ApiKeyPrefix)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasColumnName("api_key_prefix");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnName("description");
            entity.Property(e => e.Hostname)
                .HasMaxLength(150)
                .HasColumnName("hostname");
            entity.Property(e => e.IsEnabled)
                .HasDefaultValue(true)
                .HasColumnName("is_enabled");
            entity.Property(e => e.LastHeartbeatAt)
                .HasPrecision(3)
                .HasColumnName("last_heartbeat_at");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.CollectorAgents)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_cagt_created_by");
        });

        modelBuilder.Entity<ComputerDetail>(entity =>
        {
            entity.HasKey(e => e.AssetId);

            entity
                .ToTable("computer_details")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("computer_details_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.Hostname, "IX_computer_hostname").HasFilter("([hostname] IS NOT NULL)");

            entity.Property(e => e.AssetId)
                .ValueGeneratedNever()
                .HasColumnName("asset_id");
            entity.Property(e => e.AssignedDate).HasColumnName("assigned_date");
            entity.Property(e => e.AssignedToName)
                .HasMaxLength(150)
                .HasColumnName("assigned_to_name");
            entity.Property(e => e.CpuModel)
                .HasMaxLength(150)
                .HasColumnName("cpu_model");
            entity.Property(e => e.DomainJoined).HasColumnName("domain_joined");
            entity.Property(e => e.Hostname)
                .HasMaxLength(100)
                .HasColumnName("hostname");
            entity.Property(e => e.MacAddress)
                .HasMaxLength(17)
                .IsUnicode(false)
                .HasColumnName("mac_address");
            entity.Property(e => e.OsName)
                .HasMaxLength(100)
                .HasColumnName("os_name");
            entity.Property(e => e.OsVersion)
                .HasMaxLength(50)
                .HasColumnName("os_version");
            entity.Property(e => e.RamGb).HasColumnName("ram_gb");
            entity.Property(e => e.StorageConfig)
                .HasMaxLength(200)
                .HasColumnName("storage_config");

            entity.HasOne(d => d.Asset).WithOne(p => p.ComputerDetail)
                .HasForeignKey<ComputerDetail>(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_computer_details_asset");
        });

        modelBuilder.Entity<Contract>(entity =>
        {
            entity
                .ToTable("contracts", tb => tb.HasTrigger("trg_contracts_supersede"))
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("contracts_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.EndDate, "IX_contracts_end_date");

            entity.HasIndex(e => e.OwnerUserId, "IX_contracts_owner");

            entity.HasIndex(e => e.PreviousContractId, "IX_contracts_previous");

            entity.HasIndex(e => new { e.Status, e.EndDate }, "IX_contracts_status");

            entity.HasIndex(e => e.VendorId, "IX_contracts_vendor");

            entity.HasIndex(e => e.ContractNo, "UX_contracts_no").IsUnique();

            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.AutoRenew).HasColumnName("auto_renew");
            entity.Property(e => e.ContactEmail)
                .HasMaxLength(255)
                .HasColumnName("contact_email");
            entity.Property(e => e.ContactPerson)
                .HasMaxLength(150)
                .HasColumnName("contact_person");
            entity.Property(e => e.ContactPhone)
                .HasMaxLength(50)
                .HasColumnName("contact_phone");
            entity.Property(e => e.ContractNo)
                .HasMaxLength(80)
                .HasColumnName("contract_no");
            entity.Property(e => e.ContractType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("contract_type");
            entity.Property(e => e.ContractValue)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("contract_value");
            entity.Property(e => e.CoverageHours)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("coverage_hours");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Currency)
                .HasMaxLength(3)
                .IsUnicode(false)
                .HasDefaultValue("THB")
                .IsFixedLength()
                .HasColumnName("currency");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.ExchangeRate)
                .HasColumnType("decimal(12, 6)")
                .HasColumnName("exchange_rate");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.OwnerUserId).HasColumnName("owner_user_id");
            entity.Property(e => e.PoNumber)
                .HasMaxLength(50)
                .HasColumnName("po_number");
            entity.Property(e => e.PreviousContractId).HasColumnName("previous_contract_id");
            entity.Property(e => e.RenewalNoticeDays).HasColumnName("renewal_notice_days");
            entity.Property(e => e.ServiceType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("service_type");
            entity.Property(e => e.SlaResolutionHours).HasColumnName("sla_resolution_hours");
            entity.Property(e => e.SlaResponseHours).HasColumnName("sla_response_hours");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Status)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasDefaultValue("ACTIVE")
                .HasColumnName("status");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.VendorContractNo)
                .HasMaxLength(80)
                .HasColumnName("vendor_contract_no");
            entity.Property(e => e.VendorId).HasColumnName("vendor_id");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ContractCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_contracts_created_by");

            entity.HasOne(d => d.OwnerUser).WithMany(p => p.ContractOwnerUsers)
                .HasForeignKey(d => d.OwnerUserId)
                .HasConstraintName("FK_contracts_owner");

            entity.HasOne(d => d.PreviousContract).WithMany(p => p.InversePreviousContract)
                .HasForeignKey(d => d.PreviousContractId)
                .HasConstraintName("FK_contracts_previous");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ContractUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_contracts_updated_by");

            entity.HasOne(d => d.Vendor).WithMany(p => p.Contracts)
                .HasForeignKey(d => d.VendorId)
                .HasConstraintName("FK_contracts_vendor");
        });

        modelBuilder.Entity<ContractAsset>(entity =>
        {
            entity
                .ToTable("contract_assets")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("contract_assets_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => new { e.AssetId, e.CoverageEnd }, "IX_ca_asset").IsDescending(false, true);

            entity.HasIndex(e => e.CoverageEnd, "IX_ca_coverage_end");

            entity.HasIndex(e => new { e.ContractId, e.AssetId }, "UX_contract_assets").IsUnique();

            entity.Property(e => e.ContractAssetId).HasColumnName("contract_asset_id");
            entity.Property(e => e.AllocatedCost)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("allocated_cost");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.CoverageEnd).HasColumnName("coverage_end");
            entity.Property(e => e.CoverageStart).HasColumnName("coverage_start");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Notes)
                .HasMaxLength(300)
                .HasColumnName("notes");
            entity.Property(e => e.SeatCount).HasColumnName("seat_count");
            entity.Property(e => e.ServiceLevelNote)
                .HasMaxLength(300)
                .HasColumnName("service_level_note");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.Asset).WithMany(p => p.ContractAssets)
                .HasForeignKey(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ca_asset");

            entity.HasOne(d => d.Contract).WithMany(p => p.ContractAssets)
                .HasForeignKey(d => d.ContractId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ca_contract");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ContractAssetCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_ca_created_by");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ContractAssetUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_ca_updated_by");
        });

        modelBuilder.Entity<Department>(entity =>
        {
            entity
                .ToTable("departments")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("departments_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.Code, "UX_departments_code").IsUnique();

            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.Code)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
        });

        modelBuilder.Entity<DeviceModel>(entity =>
        {
            entity.HasKey(e => e.ModelId);

            entity
                .ToTable("device_models")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("device_models_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.EosDate, "IX_dm_eos").HasFilter("([eos_date] IS NOT NULL)");

            entity.HasIndex(e => e.ManufacturerId, "IX_dm_manufacturer").HasFilter("([is_active]=(1))");

            entity.HasIndex(e => e.AssetTypeId, "IX_dm_type").HasFilter("([is_active]=(1))");

            entity.HasIndex(e => e.CreatedAt, "IX_dm_unverified")
                .IsDescending()
                .HasFilter("([is_verified]=(0) AND [is_active]=(1))");

            entity.HasIndex(e => new { e.ManufacturerId, e.ModelName }, "UX_device_models").IsUnique();

            entity.Property(e => e.ModelId).HasColumnName("model_id");
            entity.Property(e => e.AssetTypeId).HasColumnName("asset_type_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DatasheetUrl)
                .HasMaxLength(400)
                .HasColumnName("datasheet_url");
            entity.Property(e => e.DefaultSpecs).HasColumnName("default_specs");
            entity.Property(e => e.Description)
                .HasMaxLength(400)
                .HasColumnName("description");
            entity.Property(e => e.EolDate).HasColumnName("eol_date");
            entity.Property(e => e.EosDate).HasColumnName("eos_date");
            entity.Property(e => e.FormFactor)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("form_factor");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsVerified).HasColumnName("is_verified");
            entity.Property(e => e.ManufacturerId).HasColumnName("manufacturer_id");
            entity.Property(e => e.ModelName)
                .HasMaxLength(150)
                .HasColumnName("model_name");
            entity.Property(e => e.ModelNumber)
                .HasMaxLength(100)
                .HasColumnName("model_number");
            entity.Property(e => e.PowerDrawWatt).HasColumnName("power_draw_watt");
            entity.Property(e => e.UHeight).HasColumnName("u_height");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.VerifiedAt)
                .HasPrecision(3)
                .HasColumnName("verified_at");
            entity.Property(e => e.VerifiedBy).HasColumnName("verified_by");
            entity.Property(e => e.WeightKg)
                .HasColumnType("decimal(7, 2)")
                .HasColumnName("weight_kg");

            entity.HasOne(d => d.AssetType).WithMany(p => p.DeviceModels)
                .HasForeignKey(d => d.AssetTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_dm_type");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.DeviceModelCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_dm_created_by");

            entity.HasOne(d => d.Manufacturer).WithMany(p => p.DeviceModels)
                .HasForeignKey(d => d.ManufacturerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_dm_manufacturer");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.DeviceModelUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_dm_updated_by");

            entity.HasOne(d => d.VerifiedByNavigation).WithMany(p => p.DeviceModelVerifiedByNavigations)
                .HasForeignKey(d => d.VerifiedBy)
                .HasConstraintName("FK_dm_verified_by");
        });

        modelBuilder.Entity<FileShare>(entity =>
        {
            entity.HasKey(e => e.ShareId);

            entity
                .ToTable("file_shares", tb => tb.HasTrigger("trg_file_shares_validate"))
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("file_shares_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.AssetId, "IX_file_shares_asset").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.ClassificationId, "IX_file_shares_class").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.OwnerDepartmentId, "IX_file_shares_dept").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.LastReviewedAt, "IX_file_shares_review").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => new { e.AssetId, e.FolderPath }, "UX_file_shares_path")
                .IsUnique()
                .HasFilter("([is_deleted]=(0))");

            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.BusinessPurpose)
                .HasMaxLength(500)
                .HasColumnName("business_purpose");
            entity.Property(e => e.ClassificationId).HasColumnName("classification_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.FolderPath)
                .HasMaxLength(500)
                .HasColumnName("folder_path");
            entity.Property(e => e.FsrmQuotaTemplate)
                .HasMaxLength(128)
                .HasColumnName("fsrm_quota_template");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.IsQuotaManaged)
                .HasDefaultValue(true)
                .HasColumnName("is_quota_managed");
            entity.Property(e => e.LastReviewedAt).HasColumnName("last_reviewed_at");
            entity.Property(e => e.LastReviewedBy).HasColumnName("last_reviewed_by");
            entity.Property(e => e.Notes)
                .HasMaxLength(1000)
                .HasColumnName("notes");
            entity.Property(e => e.OwnerDepartmentId).HasColumnName("owner_department_id");
            entity.Property(e => e.OwnerUserId).HasColumnName("owner_user_id");
            entity.Property(e => e.ReviewNote)
                .HasMaxLength(500)
                .HasColumnName("review_note");
            entity.Property(e => e.ShareName)
                .HasMaxLength(128)
                .HasColumnName("share_name");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.Asset).WithMany(p => p.FileShares)
                .HasForeignKey(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_fs_asset");

            entity.HasOne(d => d.Classification).WithMany(p => p.FileShares)
                .HasForeignKey(d => d.ClassificationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_fs_classification");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.FileShareCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_fs_created_by");

            entity.HasOne(d => d.LastReviewedByNavigation).WithMany(p => p.FileShareLastReviewedByNavigations)
                .HasForeignKey(d => d.LastReviewedBy)
                .HasConstraintName("FK_fs_reviewed_by");

            entity.HasOne(d => d.OwnerDepartment).WithMany(p => p.FileShares)
                .HasForeignKey(d => d.OwnerDepartmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_fs_department");

            entity.HasOne(d => d.OwnerUser).WithMany(p => p.FileShareOwnerUsers)
                .HasForeignKey(d => d.OwnerUserId)
                .HasConstraintName("FK_fs_owner");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.FileShareUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_fs_updated_by");
        });

        modelBuilder.Entity<FileSharePermission>(entity =>
        {
            entity.HasKey(e => e.PermissionId);

            entity
                .ToTable("file_share_permissions")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("file_share_permissions_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.AdGroupId, "IX_fsp_group").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.ShareId, "IX_fsp_share").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => new { e.ShareId, e.AdGroupId }, "UX_fsp_group")
                .IsUnique()
                .HasFilter("([is_deleted]=(0) AND [ad_group_id] IS NOT NULL)");

            entity.Property(e => e.PermissionId).HasColumnName("permission_id");
            entity.Property(e => e.AccessLevelId).HasColumnName("access_level_id");
            entity.Property(e => e.AdGroupId).HasColumnName("ad_group_id");
            entity.Property(e => e.AdGroupNameRaw)
                .HasMaxLength(256)
                .HasColumnName("ad_group_name_raw");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.GrantedReason)
                .HasMaxLength(500)
                .HasColumnName("granted_reason");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.RequestReference)
                .HasMaxLength(100)
                .HasColumnName("request_reference");
            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.AccessLevel).WithMany(p => p.FileSharePermissions)
                .HasForeignKey(d => d.AccessLevelId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_fsp_level");

            entity.HasOne(d => d.AdGroup).WithMany(p => p.FileSharePermissions)
                .HasForeignKey(d => d.AdGroupId)
                .HasConstraintName("FK_fsp_group");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.FileSharePermissionCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_fsp_created_by");

            entity.HasOne(d => d.Share).WithMany(p => p.FileSharePermissions)
                .HasForeignKey(d => d.ShareId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_fsp_share");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.FileSharePermissionUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_fsp_updated_by");
        });

        modelBuilder.Entity<FileShareUsageSnapshot>(entity =>
        {
            entity.HasKey(e => e.SnapshotId);

            entity.ToTable("file_share_usage_snapshots");

            entity.HasIndex(e => e.MeasuredAt, "IX_fsus_measured").IsDescending();

            entity.HasIndex(e => new { e.ShareId, e.MeasuredAt }, "UX_fsus_share_time")
                .IsUnique()
                .IsDescending(false, true);

            entity.Property(e => e.SnapshotId).HasColumnName("snapshot_id");
            entity.Property(e => e.FileCount).HasColumnName("file_count");
            entity.Property(e => e.FolderCount).HasColumnName("folder_count");
            entity.Property(e => e.MeasuredAt)
                .HasPrecision(3)
                .HasColumnName("measured_at");
            entity.Property(e => e.PeakUsageBytes).HasColumnName("peak_usage_bytes");
            entity.Property(e => e.QuotaBytes).HasColumnName("quota_bytes");
            entity.Property(e => e.QuotaType)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("quota_type");
            entity.Property(e => e.RunId).HasColumnName("run_id");
            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.UsagePercent)
                .HasComputedColumnSql("(case when [quota_bytes]>(0) then CONVERT([decimal](6,2),([used_bytes]*(100.0))/[quota_bytes])  end)", true)
                .HasColumnType("decimal(6, 2)")
                .HasColumnName("usage_percent");
            entity.Property(e => e.UsedBytes).HasColumnName("used_bytes");

            entity.HasOne(d => d.Share).WithMany(p => p.FileShareUsageSnapshots)
                .HasForeignKey(d => d.ShareId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_fsus_share");
        });

        modelBuilder.Entity<FolderClassificationLevel>(entity =>
        {
            entity.HasKey(e => e.ClassificationId);

            entity
                .ToTable("folder_classification_levels")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("folder_classification_levels_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.Code, "UX_fcl_code").IsUnique();

            entity.HasIndex(e => e.SensitivityRank, "UX_fcl_rank").IsUnique();

            entity.Property(e => e.ClassificationId).HasColumnName("classification_id");
            entity.Property(e => e.Code)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.ColorToken)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("color_token");
            entity.Property(e => e.Description)
                .HasMaxLength(300)
                .HasColumnName("description");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.NameEn)
                .HasMaxLength(60)
                .HasColumnName("name_en");
            entity.Property(e => e.NameTh)
                .HasMaxLength(60)
                .HasColumnName("name_th");
            entity.Property(e => e.RequiresViewAudit).HasColumnName("requires_view_audit");
            entity.Property(e => e.SensitivityRank).HasColumnName("sensitivity_rank");
        });

        modelBuilder.Entity<ImportBatch>(entity =>
        {
            entity.HasKey(e => e.BatchId);

            entity.ToTable("import_batches");

            entity.HasIndex(e => e.BatchUid, "UX_import_batches_uid").IsUnique();

            entity.Property(e => e.BatchId).HasColumnName("batch_id");
            entity.Property(e => e.BatchUid)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("batch_uid");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CompletedAt)
                .HasPrecision(3)
                .HasColumnName("completed_at");
            entity.Property(e => e.ErrorReportPath)
                .HasMaxLength(400)
                .HasColumnName("error_report_path");
            entity.Property(e => e.FailedRows).HasColumnName("failed_rows");
            entity.Property(e => e.FileName)
                .HasMaxLength(255)
                .HasColumnName("file_name");
            entity.Property(e => e.ImportedBy).HasColumnName("imported_by");
            entity.Property(e => e.StartedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("started_at");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("status");
            entity.Property(e => e.SuccessRows).HasColumnName("success_rows");
            entity.Property(e => e.TotalRows).HasColumnName("total_rows");

            entity.HasOne(d => d.Category).WithMany(p => p.ImportBatches)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_import_category");

            entity.HasOne(d => d.ImportedByNavigation).WithMany(p => p.ImportBatches)
                .HasForeignKey(d => d.ImportedBy)
                .HasConstraintName("FK_import_user");
        });

        modelBuilder.Entity<InternetPolicy>(entity =>
        {
            entity.HasKey(e => e.PolicyId);

            entity
                .ToTable("internet_policies", tb => tb.HasTrigger("trg_internet_policies_validate"))
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("internet_policies_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.PolicyCode, "UX_internet_policies_code")
                .IsUnique()
                .HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => e.IsDefault, "UX_internet_policies_default")
                .IsUnique()
                .HasFilter("([is_default]=(1) AND [is_deleted]=(0))");

            entity.Property(e => e.PolicyId).HasColumnName("policy_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("description");
            entity.Property(e => e.ExternalPolicyRef)
                .HasMaxLength(150)
                .HasColumnName("external_policy_ref");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsDefault).HasColumnName("is_default");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.Notes)
                .HasMaxLength(1000)
                .HasColumnName("notes");
            entity.Property(e => e.PolicyCode)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("policy_code");
            entity.Property(e => e.PolicyName)
                .HasMaxLength(150)
                .HasColumnName("policy_name");
            entity.Property(e => e.ProxyAssetId).HasColumnName("proxy_asset_id");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.InternetPolicyCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_intpol_created_by");

            entity.HasOne(d => d.ProxyAsset).WithMany(p => p.InternetPolicies)
                .HasForeignKey(d => d.ProxyAssetId)
                .HasConstraintName("FK_intpol_proxy");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.InternetPolicyUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_intpol_updated_by");
        });

        modelBuilder.Entity<InternetPolicyCategory>(entity =>
        {
            entity.HasKey(e => e.PolicyCategoryId);

            entity
                .ToTable("internet_policy_categories")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("internet_policy_categories_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => new { e.PolicyId, e.CategoryId }, "UX_ipc").IsUnique();

            entity.Property(e => e.PolicyCategoryId).HasColumnName("policy_category_id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.Notes)
                .HasMaxLength(300)
                .HasColumnName("notes");
            entity.Property(e => e.PolicyAction)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("policy_action");
            entity.Property(e => e.PolicyId).HasColumnName("policy_id");

            entity.HasOne(d => d.Category).WithMany(p => p.InternetPolicyCategories)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ipc_category");

            entity.HasOne(d => d.Policy).WithMany(p => p.InternetPolicyCategories)
                .HasForeignKey(d => d.PolicyId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ipc_policy");
        });

        modelBuilder.Entity<InternetPolicyGroup>(entity =>
        {
            entity.HasKey(e => e.PolicyGroupId);

            entity
                .ToTable("internet_policy_groups")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("internet_policy_groups_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.AdGroupId, "IX_ipg_group").HasFilter("([is_deleted]=(0))");

            entity.HasIndex(e => new { e.PolicyId, e.AdGroupId }, "UX_ipg")
                .IsUnique()
                .HasFilter("([is_deleted]=(0) AND [ad_group_id] IS NOT NULL)");

            entity.Property(e => e.PolicyGroupId).HasColumnName("policy_group_id");
            entity.Property(e => e.AdGroupId).HasColumnName("ad_group_id");
            entity.Property(e => e.AdGroupNameRaw)
                .HasMaxLength(256)
                .HasColumnName("ad_group_name_raw");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.Notes)
                .HasMaxLength(300)
                .HasColumnName("notes");
            entity.Property(e => e.PolicyId).HasColumnName("policy_id");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.AdGroup).WithMany(p => p.InternetPolicyGroups)
                .HasForeignKey(d => d.AdGroupId)
                .HasConstraintName("FK_ipg_group");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.InternetPolicyGroupCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_ipg_created_by");

            entity.HasOne(d => d.Policy).WithMany(p => p.InternetPolicyGroups)
                .HasForeignKey(d => d.PolicyId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ipg_policy");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.InternetPolicyGroupUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_ipg_updated_by");
        });

        modelBuilder.Entity<IpAddress>(entity =>
        {
            entity.HasKey(e => e.IpId);

            entity
                .ToTable("ip_addresses")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("ip_addresses_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.AssetId, "IX_ip_asset").HasFilter("([released_date] IS NULL)");

            entity.HasIndex(e => e.IpNumeric, "IX_ip_numeric").HasFilter("([released_date] IS NULL)");

            entity.HasIndex(e => e.RangeId, "IX_ip_range").HasFilter("([released_date] IS NULL)");

            entity.HasIndex(e => e.VlanId, "IX_ip_vlan").HasFilter("([released_date] IS NULL)");

            entity.HasIndex(e => e.IpAddress1, "UX_ip_active")
                .IsUnique()
                .HasFilter("([released_date] IS NULL)");

            entity.HasIndex(e => e.AssetId, "UX_ip_primary_per_asset")
                .IsUnique()
                .HasFilter("([is_primary]=(1) AND [released_date] IS NULL AND [asset_id] IS NOT NULL)");

            entity.Property(e => e.IpId).HasColumnName("ip_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssignedDate).HasColumnName("assigned_date");
            entity.Property(e => e.AssignmentType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("STATIC")
                .HasColumnName("assignment_type");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description)
                .HasMaxLength(300)
                .HasColumnName("description");
            entity.Property(e => e.DnsName)
                .HasMaxLength(255)
                .HasColumnName("dns_name");
            entity.Property(e => e.Hostname)
                .HasMaxLength(100)
                .HasColumnName("hostname");
            entity.Property(e => e.InterfaceName)
                .HasMaxLength(50)
                .HasColumnName("interface_name");
            entity.Property(e => e.IpAddress1)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("ip_address");
            entity.Property(e => e.IpNumeric)
                .HasComputedColumnSql("([dbo].[fn_ipv4_to_bigint]([ip_address]))", true)
                .HasColumnName("ip_numeric");
            entity.Property(e => e.IpPurpose)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("SERVICE")
                .HasColumnName("ip_purpose");
            entity.Property(e => e.IsPrimary).HasColumnName("is_primary");
            entity.Property(e => e.MacAddress)
                .HasMaxLength(17)
                .IsUnicode(false)
                .HasColumnName("mac_address");
            entity.Property(e => e.RangeId).HasColumnName("range_id");
            entity.Property(e => e.ReleasedDate).HasColumnName("released_date");
            entity.Property(e => e.Status)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasDefaultValue("IN_USE")
                .HasColumnName("status");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.VlanId).HasColumnName("vlan_id");

            entity.HasOne(d => d.Asset).WithOne(p => p.IpAddress)
                .HasForeignKey<IpAddress>(d => d.AssetId)
                .HasConstraintName("FK_ip_asset");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.IpAddressCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_ip_created_by");

            entity.HasOne(d => d.Range).WithMany(p => p.IpAddresses)
                .HasForeignKey(d => d.RangeId)
                .HasConstraintName("FK_ip_range");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.IpAddressUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_ip_updated_by");

            entity.HasOne(d => d.Vlan).WithMany(p => p.IpAddresses)
                .HasForeignKey(d => d.VlanId)
                .HasConstraintName("FK_ip_vlan");
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity
                .ToTable("locations")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("locations_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.ParentLocationId, "IX_locations_parent");

            entity.HasIndex(e => e.Code, "UX_locations_code").IsUnique();

            entity.Property(e => e.LocationId).HasColumnName("location_id");
            entity.Property(e => e.Address)
                .HasMaxLength(400)
                .HasColumnName("address");
            entity.Property(e => e.Code)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.LocationType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("location_type");
            entity.Property(e => e.Name)
                .HasMaxLength(150)
                .HasColumnName("name");
            entity.Property(e => e.ParentLocationId).HasColumnName("parent_location_id");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");

            entity.HasOne(d => d.ParentLocation).WithMany(p => p.InverseParentLocation)
                .HasForeignKey(d => d.ParentLocationId)
                .HasConstraintName("FK_locations_parent");
        });

        modelBuilder.Entity<Manufacturer>(entity =>
        {
            entity
                .ToTable("manufacturers")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("manufacturers_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.Name, "UX_manufacturers_name").IsUnique();

            entity.Property(e => e.ManufacturerId).HasColumnName("manufacturer_id");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(150)
                .HasColumnName("name");
            entity.Property(e => e.SupportUrl)
                .HasMaxLength(400)
                .HasColumnName("support_url");
        });

        modelBuilder.Entity<Menu>(entity =>
        {
            entity.ToTable("menus");

            entity.HasIndex(e => e.MenuKey, "UX_menus_key").IsUnique();

            entity.Property(e => e.MenuId).HasColumnName("menu_id");
            entity.Property(e => e.MenuKey)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("menu_key");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<MobileIotDetail>(entity =>
        {
            entity.HasKey(e => e.AssetId);

            entity
                .ToTable("mobile_iot_details")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("mobile_iot_details_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.Imei, "IX_iot_imei").HasFilter("([imei] IS NOT NULL)");

            entity.Property(e => e.AssetId)
                .ValueGeneratedNever()
                .HasColumnName("asset_id");
            entity.Property(e => e.AssignedDate).HasColumnName("assigned_date");
            entity.Property(e => e.AssignedToName)
                .HasMaxLength(150)
                .HasColumnName("assigned_to_name");
            entity.Property(e => e.ControllerModel)
                .HasMaxLength(100)
                .HasColumnName("controller_model");
            entity.Property(e => e.DeviceProtocol)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("device_protocol");
            entity.Property(e => e.FirmwareVersion)
                .HasMaxLength(100)
                .HasColumnName("firmware_version");
            entity.Property(e => e.HasIr).HasColumnName("has_ir");
            entity.Property(e => e.HasPtz).HasColumnName("has_ptz");
            entity.Property(e => e.Hostname)
                .HasMaxLength(100)
                .HasColumnName("hostname");
            entity.Property(e => e.Imei)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("imei");
            entity.Property(e => e.IoPointCount).HasColumnName("io_point_count");
            entity.Property(e => e.IsMdmEnrolled).HasColumnName("is_mdm_enrolled");
            entity.Property(e => e.MacAddress)
                .HasMaxLength(17)
                .IsUnicode(false)
                .HasColumnName("mac_address");
            entity.Property(e => e.MdmPlatform)
                .HasMaxLength(80)
                .HasColumnName("mdm_platform");
            entity.Property(e => e.OsName)
                .HasMaxLength(100)
                .HasColumnName("os_name");
            entity.Property(e => e.OsVersion)
                .HasMaxLength(50)
                .HasColumnName("os_version");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(30)
                .HasColumnName("phone_number");
            entity.Property(e => e.Resolution)
                .HasMaxLength(30)
                .HasColumnName("resolution");
            entity.Property(e => e.SimProvider)
                .HasMaxLength(80)
                .HasColumnName("sim_provider");
            entity.Property(e => e.StorageType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("storage_type");

            entity.HasOne(d => d.Asset).WithOne(p => p.MobileIotDetail)
                .HasForeignKey<MobileIotDetail>(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_mobile_iot_details_asset");
        });

        modelBuilder.Entity<NetworkDetail>(entity =>
        {
            entity.HasKey(e => e.AssetId);

            entity
                .ToTable("network_details")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("network_details_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.Hostname, "IX_network_hostname").HasFilter("([hostname] IS NOT NULL)");

            entity.Property(e => e.AssetId)
                .ValueGeneratedNever()
                .HasColumnName("asset_id");
            entity.Property(e => e.FirmwareUpdatedAt).HasColumnName("firmware_updated_at");
            entity.Property(e => e.FirmwareVersion)
                .HasMaxLength(100)
                .HasColumnName("firmware_version");
            entity.Property(e => e.Hostname)
                .HasMaxLength(100)
                .HasColumnName("hostname");
            entity.Property(e => e.MacAddress)
                .HasMaxLength(17)
                .IsUnicode(false)
                .HasColumnName("mac_address");
            entity.Property(e => e.PoeSupport).HasColumnName("poe_support");
            entity.Property(e => e.PortCount).HasColumnName("port_count");
            entity.Property(e => e.PortSpeed)
                .HasMaxLength(50)
                .HasColumnName("port_speed");
            entity.Property(e => e.StackInfo)
                .HasMaxLength(200)
                .HasColumnName("stack_info");
            entity.Property(e => e.UplinkAssetId).HasColumnName("uplink_asset_id");

            entity.HasOne(d => d.Asset).WithOne(p => p.NetworkDetailAsset)
                .HasForeignKey<NetworkDetail>(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_network_details_asset");

            entity.HasOne(d => d.UplinkAsset).WithMany(p => p.NetworkDetailUplinkAssets)
                .HasForeignKey(d => d.UplinkAssetId)
                .HasConstraintName("FK_network_details_uplink");
        });

        modelBuilder.Entity<NetworkZone>(entity =>
        {
            entity.HasKey(e => e.ZoneId);

            entity.ToTable("network_zones");

            entity.HasIndex(e => e.Code, "UX_network_zones_code").IsUnique();

            entity.Property(e => e.ZoneId).HasColumnName("zone_id");
            entity.Property(e => e.Code)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.ColorToken)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("color_token");
            entity.Property(e => e.Description)
                .HasMaxLength(400)
                .HasColumnName("description");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsInternetFacing).HasColumnName("is_internet_facing");
            entity.Property(e => e.Name)
                .HasMaxLength(80)
                .HasColumnName("name");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            entity.Property(e => e.TrustLevel).HasColumnName("trust_level");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notifications");

            entity.HasIndex(e => new { e.UserId, e.CreatedAt }, "IX_notifications_unread")
                .IsDescending(false, true)
                .HasFilter("([is_read]=(0))");

            entity.Property(e => e.NotificationId).HasColumnName("notification_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.IsRead).HasColumnName("is_read");
            entity.Property(e => e.Message)
                .HasMaxLength(1000)
                .HasColumnName("message");
            entity.Property(e => e.NotificationType)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("notification_type");
            entity.Property(e => e.ReadAt)
                .HasPrecision(3)
                .HasColumnName("read_at");
            entity.Property(e => e.RelatedEntityId).HasColumnName("related_entity_id");
            entity.Property(e => e.RelatedEntityType)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("related_entity_type");
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .HasColumnName("title");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_notifications_user");
        });

        modelBuilder.Entity<NotificationHistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId);

            entity.ToTable("notification_history");

            entity.HasIndex(e => new { e.AssetId, e.ThresholdDays, e.CoverageEndSnapshot, e.Channel }, "UX_notification_dedup")
                .IsUnique()
                .HasFilter("([status]='SENT')");

            entity.Property(e => e.HistoryId).HasColumnName("history_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.Channel)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("channel");
            entity.Property(e => e.CoverageEndSnapshot).HasColumnName("coverage_end_snapshot");
            entity.Property(e => e.ErrorMessage)
                .HasMaxLength(1000)
                .HasColumnName("error_message");
            entity.Property(e => e.Recipient)
                .HasMaxLength(255)
                .HasColumnName("recipient");
            entity.Property(e => e.SentAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("sent_at");
            entity.Property(e => e.Status)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("status");
            entity.Property(e => e.ThresholdDays).HasColumnName("threshold_days");

            entity.HasOne(d => d.Asset).WithMany(p => p.NotificationHistories)
                .HasForeignKey(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_nothist_asset");
        });

        modelBuilder.Entity<OsType>(entity =>
        {
            entity.ToTable("os_types");

            entity.HasIndex(e => e.Code, "UX_os_types_code").IsUnique();

            entity.Property(e => e.OsTypeId).HasColumnName("os_type_id");
            entity.Property(e => e.Code)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(60)
                .HasColumnName("name");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<OsVersion>(entity =>
        {
            entity.ToTable("os_versions");

            entity.HasIndex(e => e.OsTypeId, "IX_osv_type").HasFilter("([is_active]=(1))");

            entity.HasIndex(e => new { e.OsTypeId, e.Name }, "UX_os_versions").IsUnique();

            entity.Property(e => e.OsVersionId).HasColumnName("os_version_id");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(80)
                .HasColumnName("name");
            entity.Property(e => e.OsTypeId).HasColumnName("os_type_id");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");

            entity.HasOne(d => d.OsType).WithMany(p => p.OsVersions)
                .HasForeignKey(d => d.OsTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_osv_type");
        });

        modelBuilder.Entity<PeripheralDetail>(entity =>
        {
            entity.HasKey(e => e.AssetId);

            entity
                .ToTable("peripheral_details")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("peripheral_details_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.Property(e => e.AssetId)
                .ValueGeneratedNever()
                .HasColumnName("asset_id");
            entity.Property(e => e.ConnectionType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("connection_type");
            entity.Property(e => e.CounterReadDate).HasColumnName("counter_read_date");
            entity.Property(e => e.FirmwareVersion)
                .HasMaxLength(100)
                .HasColumnName("firmware_version");
            entity.Property(e => e.HasAdf).HasColumnName("has_adf");
            entity.Property(e => e.HasDuplex).HasColumnName("has_duplex");
            entity.Property(e => e.HasSpeaker).HasColumnName("has_speaker");
            entity.Property(e => e.IsColor).HasColumnName("is_color");
            entity.Property(e => e.MaxPaperSize)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("max_paper_size");
            entity.Property(e => e.MountType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("mount_type");
            entity.Property(e => e.PageCounterColor).HasColumnName("page_counter_color");
            entity.Property(e => e.PageCounterMono).HasColumnName("page_counter_mono");
            entity.Property(e => e.PanelType)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("panel_type");
            entity.Property(e => e.PrintTechnology)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("print_technology");
            entity.Property(e => e.RefreshRateHz).HasColumnName("refresh_rate_hz");
            entity.Property(e => e.Resolution)
                .HasMaxLength(30)
                .HasColumnName("resolution");
            entity.Property(e => e.ScreenSizeInch)
                .HasColumnType("decimal(5, 1)")
                .HasColumnName("screen_size_inch");
            entity.Property(e => e.TonerModel)
                .HasMaxLength(100)
                .HasColumnName("toner_model");

            entity.HasOne(d => d.Asset).WithOne(p => p.PeripheralDetail)
                .HasForeignKey<PeripheralDetail>(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_peripheral_details_asset");
        });

        modelBuilder.Entity<PowerDetail>(entity =>
        {
            entity.HasKey(e => e.AssetId);

            entity
                .ToTable("power_details")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("power_details_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.BatteryReplaceDue, "IX_power_battery_due").HasFilter("([battery_replace_due] IS NOT NULL)");

            entity.Property(e => e.AssetId)
                .ValueGeneratedNever()
                .HasColumnName("asset_id");
            entity.Property(e => e.BatteryCount).HasColumnName("battery_count");
            entity.Property(e => e.BatteryInstallDate).HasColumnName("battery_install_date");
            entity.Property(e => e.BatteryModel)
                .HasMaxLength(100)
                .HasColumnName("battery_model");
            entity.Property(e => e.BatteryReplaceDue).HasColumnName("battery_replace_due");
            entity.Property(e => e.CapacityKva)
                .HasColumnType("decimal(8, 2)")
                .HasColumnName("capacity_kva");
            entity.Property(e => e.CapacityKw)
                .HasColumnType("decimal(8, 2)")
                .HasColumnName("capacity_kw");
            entity.Property(e => e.CoolingCapacityBtu).HasColumnName("cooling_capacity_btu");
            entity.Property(e => e.CurrentLoadPercent)
                .HasColumnType("decimal(5, 1)")
                .HasColumnName("current_load_percent");
            entity.Property(e => e.FirmwareVersion)
                .HasMaxLength(100)
                .HasColumnName("firmware_version");
            entity.Property(e => e.HasBypass).HasColumnName("has_bypass");
            entity.Property(e => e.HasSnmpCard).HasColumnName("has_snmp_card");
            entity.Property(e => e.InputPhase).HasColumnName("input_phase");
            entity.Property(e => e.InputVoltage)
                .HasMaxLength(50)
                .HasColumnName("input_voltage");
            entity.Property(e => e.LastServiceDate).HasColumnName("last_service_date");
            entity.Property(e => e.LoadMeasuredAt).HasColumnName("load_measured_at");
            entity.Property(e => e.OutletCount).HasColumnName("outlet_count");
            entity.Property(e => e.OutletType)
                .HasMaxLength(100)
                .HasColumnName("outlet_type");
            entity.Property(e => e.OutputVoltage)
                .HasMaxLength(50)
                .HasColumnName("output_voltage");
            entity.Property(e => e.RefrigerantType)
                .HasMaxLength(50)
                .HasColumnName("refrigerant_type");
            entity.Property(e => e.RuntimeMinutesFullLoad).HasColumnName("runtime_minutes_full_load");

            entity.HasOne(d => d.Asset).WithOne(p => p.PowerDetail)
                .HasForeignKey<PowerDetail>(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_power_details_asset");
        });

        modelBuilder.Entity<Rack>(entity =>
        {
            entity
                .ToTable("racks")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("racks_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.LocationId, "IX_racks_location").HasFilter("([is_active]=(1))");

            entity.HasIndex(e => e.Code, "UX_racks_code").IsUnique();

            entity.Property(e => e.RackId).HasColumnName("rack_id");
            entity.Property(e => e.Code)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DepthMm).HasColumnName("depth_mm");
            entity.Property(e => e.HasFrontDoor).HasColumnName("has_front_door");
            entity.Property(e => e.HasRearDoor).HasColumnName("has_rear_door");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.LocationId).HasColumnName("location_id");
            entity.Property(e => e.MaxPowerKw)
                .HasColumnType("decimal(6, 2)")
                .HasColumnName("max_power_kw");
            entity.Property(e => e.MaxWeightKg)
                .HasColumnType("decimal(8, 2)")
                .HasColumnName("max_weight_kg");
            entity.Property(e => e.Name)
                .HasMaxLength(120)
                .HasColumnName("name");
            entity.Property(e => e.Notes)
                .HasMaxLength(400)
                .HasColumnName("notes");
            entity.Property(e => e.NumberingDirection)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("BOTTOM_UP")
                .HasColumnName("numbering_direction");
            entity.Property(e => e.TotalU)
                .HasDefaultValue((byte)42)
                .HasColumnName("total_u");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.WidthMm).HasColumnName("width_mm");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.RackCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_racks_created_by");

            entity.HasOne(d => d.Location).WithMany(p => p.Racks)
                .HasForeignKey(d => d.LocationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_racks_location");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.RackUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_racks_updated_by");
        });

        modelBuilder.Entity<RackMount>(entity =>
        {
            entity
                .ToTable("rack_mounts", tb => tb.HasTrigger("trg_rack_mounts_validate"))
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("rack_mounts_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => new { e.RackId, e.StartU }, "IX_rm_rack").HasFilter("([removed_date] IS NULL)");

            entity.HasIndex(e => e.AssetId, "UX_rm_asset_active")
                .IsUnique()
                .HasFilter("([removed_date] IS NULL)");

            entity.Property(e => e.RackMountId).HasColumnName("rack_mount_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.MountFace)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("FRONT")
                .HasColumnName("mount_face");
            entity.Property(e => e.MountedDate).HasColumnName("mounted_date");
            entity.Property(e => e.Notes)
                .HasMaxLength(300)
                .HasColumnName("notes");
            entity.Property(e => e.Orientation)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("NORMAL")
                .HasColumnName("orientation");
            entity.Property(e => e.RackId).HasColumnName("rack_id");
            entity.Property(e => e.RemovedDate).HasColumnName("removed_date");
            entity.Property(e => e.StartU).HasColumnName("start_u");
            entity.Property(e => e.UHeight).HasColumnName("u_height");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.Asset).WithOne(p => p.RackMount)
                .HasForeignKey<RackMount>(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_rm_asset");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.RackMountCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_rm_created_by");

            entity.HasOne(d => d.Rack).WithMany(p => p.RackMounts)
                .HasForeignKey(d => d.RackId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_rm_rack");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.RackMountUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_rm_updated_by");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.TokenId);

            entity.ToTable("refresh_tokens");

            entity.HasIndex(e => e.ExpiresAt, "IX_refresh_tokens_expires").HasFilter("([revoked_at] IS NULL)");

            entity.HasIndex(e => e.UserId, "IX_refresh_tokens_user");

            entity.HasIndex(e => e.TokenHash, "UX_refresh_tokens_hash").IsUnique();

            entity.Property(e => e.TokenId).HasColumnName("token_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedIp)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("created_ip");
            entity.Property(e => e.ExpiresAt)
                .HasPrecision(3)
                .HasColumnName("expires_at");
            entity.Property(e => e.RevokedAt)
                .HasPrecision(3)
                .HasColumnName("revoked_at");
            entity.Property(e => e.TokenHash)
                .HasMaxLength(64)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("token_hash");
            entity.Property(e => e.UserAgent)
                .HasMaxLength(400)
                .HasColumnName("user_agent");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_refresh_tokens_user");
        });

        modelBuilder.Entity<RelationshipType>(entity =>
        {
            entity.ToTable("relationship_types");

            entity.HasIndex(e => e.Code, "UX_relationship_types_code").IsUnique();

            entity.Property(e => e.RelationshipTypeId).HasColumnName("relationship_type_id");
            entity.Property(e => e.Code)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.ForwardName)
                .HasMaxLength(50)
                .HasColumnName("forward_name");
            entity.Property(e => e.InverseName)
                .HasMaxLength(50)
                .HasColumnName("inverse_name");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles");

            entity.HasIndex(e => e.Code, "UX_roles_code").IsUnique();

            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.Code)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.Description)
                .HasMaxLength(200)
                .HasColumnName("description");
            entity.Property(e => e.IsSystem).HasColumnName("is_system");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<RoleMenuPermission>(entity =>
        {
            entity.HasKey(e => new { e.RoleId, e.MenuId });

            entity.ToTable("role_menu_permissions");

            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.MenuId).HasColumnName("menu_id");
            entity.Property(e => e.CanCreate).HasColumnName("can_create");
            entity.Property(e => e.CanDelete).HasColumnName("can_delete");
            entity.Property(e => e.CanEdit).HasColumnName("can_edit");
            entity.Property(e => e.CanView).HasColumnName("can_view");

            entity.HasOne(d => d.Menu).WithMany(p => p.RoleMenuPermissions)
                .HasForeignKey(d => d.MenuId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_rmp_menu");

            entity.HasOne(d => d.Role).WithMany(p => p.RoleMenuPermissions)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_rmp_role");
        });

        modelBuilder.Entity<ServerApplication>(entity =>
        {
            entity.HasKey(e => e.ApplicationId);

            entity.ToTable("server_applications");

            entity.HasIndex(e => e.AssetId, "IX_svcapp_asset");

            entity.HasIndex(e => e.DepartmentId, "IX_svcapp_dept").HasFilter("([department_id] IS NOT NULL)");

            entity.HasIndex(e => e.ServerTypeId, "IX_svcapp_role").HasFilter("([server_type_id] IS NOT NULL)");

            entity.HasIndex(e => e.SiteId, "IX_svcapp_site");

            entity.HasIndex(e => new { e.AssetId, e.ApplicationName }, "UX_svcapp").IsUnique();

            entity.Property(e => e.ApplicationId).HasColumnName("application_id");
            entity.Property(e => e.ApplicationName)
                .HasMaxLength(150)
                .HasColumnName("application_name");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.InchargeName)
                .HasMaxLength(150)
                .HasColumnName("incharge_name");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.LinkUrl)
                .HasMaxLength(500)
                .HasColumnName("link_url");
            entity.Property(e => e.Notes)
                .HasMaxLength(500)
                .HasColumnName("notes");
            entity.Property(e => e.PortNumber)
                .HasMaxLength(50)
                .HasColumnName("port_number");
            entity.Property(e => e.ServerTypeId).HasColumnName("server_type_id");
            entity.Property(e => e.SiteId).HasColumnName("site_id");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.Asset).WithMany(p => p.ServerApplications)
                .HasForeignKey(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_svcapp_asset");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ServerApplicationCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_svcapp_created_by");

            entity.HasOne(d => d.Department).WithMany(p => p.ServerApplications)
                .HasForeignKey(d => d.DepartmentId)
                .HasConstraintName("FK_svcapp_department");

            entity.HasOne(d => d.ServerType).WithMany(p => p.ServerApplications)
                .HasForeignKey(d => d.ServerTypeId)
                .HasConstraintName("FK_svcapp_role");

            entity.HasOne(d => d.Site).WithMany(p => p.ServerApplications)
                .HasForeignKey(d => d.SiteId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_svcapp_site");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ServerApplicationUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_svcapp_updated_by");
        });

        modelBuilder.Entity<ServerCpu>(entity =>
        {
            entity.ToTable("server_cpus");

            entity.HasIndex(e => e.AssetId, "IX_scpu_asset");

            entity.Property(e => e.ServerCpuId).HasColumnName("server_cpu_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.CoreCount).HasColumnName("core_count");
            entity.Property(e => e.CpuModel)
                .HasMaxLength(150)
                .HasColumnName("cpu_model");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");

            entity.HasOne(d => d.Asset).WithMany(p => p.ServerCpus)
                .HasForeignKey(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_scpu_asset");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ServerCpus)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_scpu_created_by");
        });

        modelBuilder.Entity<ServerDetail>(entity =>
        {
            entity.HasKey(e => e.AssetId);

            entity
                .ToTable("server_details")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("server_details_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.ClusterId, "IX_sd_cluster").HasFilter("([cluster_id] IS NOT NULL)");

            entity.HasIndex(e => e.Hostname, "IX_server_hostname").HasFilter("([hostname] IS NOT NULL)");

            entity.Property(e => e.AssetId)
                .ValueGeneratedNever()
                .HasColumnName("asset_id");
            entity.Property(e => e.ClusterId).HasColumnName("cluster_id");
            entity.Property(e => e.Criticality)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("criticality");
            entity.Property(e => e.Environment)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("environment");
            entity.Property(e => e.Fqdn)
                .HasMaxLength(255)
                .HasColumnName("fqdn");
            entity.Property(e => e.Hostname)
                .HasMaxLength(100)
                .HasColumnName("hostname");
            entity.Property(e => e.LastPatchDate).HasColumnName("last_patch_date");
            entity.Property(e => e.MacAddress)
                .HasMaxLength(17)
                .IsUnicode(false)
                .HasColumnName("mac_address");
            entity.Property(e => e.OsInstallDate).HasColumnName("os_install_date");
            entity.Property(e => e.OsTypeId).HasColumnName("os_type_id");
            entity.Property(e => e.OsVersionId).HasColumnName("os_version_id");
            entity.Property(e => e.ServerStatusId).HasColumnName("server_status_id");
            entity.Property(e => e.ServerZoneId).HasColumnName("server_zone_id");
            entity.Property(e => e.SystemGroup)
                .HasMaxLength(100)
                .HasColumnName("system_group");

            entity.HasOne(d => d.Asset).WithOne(p => p.ServerDetail)
                .HasForeignKey<ServerDetail>(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_server_details_asset");

            entity.HasOne(d => d.Cluster).WithMany(p => p.ServerDetails)
                .HasForeignKey(d => d.ClusterId)
                .HasConstraintName("FK_sd_cluster");

            entity.HasOne(d => d.OsType).WithMany(p => p.ServerDetails)
                .HasForeignKey(d => d.OsTypeId)
                .HasConstraintName("FK_sd_os_type");

            entity.HasOne(d => d.OsVersion).WithMany(p => p.ServerDetails)
                .HasForeignKey(d => d.OsVersionId)
                .HasConstraintName("FK_sd_os_version");

            entity.HasOne(d => d.ServerStatus).WithMany(p => p.ServerDetails)
                .HasForeignKey(d => d.ServerStatusId)
                .HasConstraintName("FK_sd_status");

            entity.HasOne(d => d.ServerZone).WithMany(p => p.ServerDetails)
                .HasForeignKey(d => d.ServerZoneId)
                .HasConstraintName("FK_sd_zone");
        });

        modelBuilder.Entity<ServerLocalDisk>(entity =>
        {
            entity.HasKey(e => e.LocalDiskId);

            entity.ToTable("server_local_disks");

            entity.HasIndex(e => e.AssetId, "IX_sdisk_asset");

            entity.Property(e => e.LocalDiskId).HasColumnName("local_disk_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.CapacityGb)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("capacity_gb");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DiskLabel)
                .HasMaxLength(80)
                .HasColumnName("disk_label");
            entity.Property(e => e.DiskType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("disk_type");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");

            entity.HasOne(d => d.Asset).WithMany(p => p.ServerLocalDisks)
                .HasForeignKey(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_sdisk_asset");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ServerLocalDisks)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_sdisk_created_by");
        });

        modelBuilder.Entity<ServerMemoryModule>(entity =>
        {
            entity.HasKey(e => e.MemoryModuleId);

            entity.ToTable("server_memory_modules");

            entity.HasIndex(e => e.AssetId, "IX_smem_asset");

            entity.Property(e => e.MemoryModuleId).HasColumnName("memory_module_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.CapacityGb)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("capacity_gb");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.MemoryType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("memory_type");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");

            entity.HasOne(d => d.Asset).WithMany(p => p.ServerMemoryModules)
                .HasForeignKey(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_smem_asset");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ServerMemoryModules)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_smem_created_by");
        });

        modelBuilder.Entity<ServerRole>(entity =>
        {
            entity.ToTable("server_roles");

            entity.HasIndex(e => e.Code, "UX_server_roles_code").IsUnique();

            entity.Property(e => e.ServerRoleId).HasColumnName("server_role_id");
            entity.Property(e => e.Code)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.Description)
                .HasMaxLength(300)
                .HasColumnName("description");
            entity.Property(e => e.IconName)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("icon_name");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsCriticalService).HasColumnName("is_critical_service");
            entity.Property(e => e.IsDhcpProvider).HasColumnName("is_dhcp_provider");
            entity.Property(e => e.Name)
                .HasMaxLength(80)
                .HasColumnName("name");
            entity.Property(e => e.RoleGroup)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("role_group");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<ServerRoleAssignment>(entity =>
        {
            entity.HasKey(e => e.AssignmentId);

            entity
                .ToTable("server_role_assignments", tb => tb.HasTrigger("trg_server_roles_protect_dhcp"))
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("server_role_assignments_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.ServerRoleId, "IX_srvra_role");

            entity.HasIndex(e => e.AssetId, "UX_server_primary_role")
                .IsUnique()
                .HasFilter("([is_primary]=(1))");

            entity.HasIndex(e => new { e.AssetId, e.ServerRoleId }, "UX_server_role_assignments").IsUnique();

            entity.Property(e => e.AssignmentId).HasColumnName("assignment_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.IsPrimary).HasColumnName("is_primary");
            entity.Property(e => e.Notes)
                .HasMaxLength(300)
                .HasColumnName("notes");
            entity.Property(e => e.ServerRoleId).HasColumnName("server_role_id");
            entity.Property(e => e.ServiceName)
                .HasMaxLength(150)
                .HasColumnName("service_name");
            entity.Property(e => e.ServicePort)
                .HasMaxLength(50)
                .HasColumnName("service_port");

            entity.HasOne(d => d.Asset).WithOne(p => p.ServerRoleAssignment)
                .HasForeignKey<ServerRoleAssignment>(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_srvra_asset");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ServerRoleAssignments)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_srvra_created_by");

            entity.HasOne(d => d.ServerRole).WithMany(p => p.ServerRoleAssignments)
                .HasForeignKey(d => d.ServerRoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_srvra_role");
        });

        modelBuilder.Entity<ServerStatus>(entity =>
        {
            entity.ToTable("server_statuses");

            entity.HasIndex(e => e.Code, "UX_server_statuses_code").IsUnique();

            entity.Property(e => e.ServerStatusId).HasColumnName("server_status_id");
            entity.Property(e => e.Code)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.ColorToken)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("color_token");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(60)
                .HasColumnName("name");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<SoftwareDetail>(entity =>
        {
            entity.HasKey(e => e.AssetId);

            entity
                .ToTable("software_details")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("software_details_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.Property(e => e.AssetId)
                .ValueGeneratedNever()
                .HasColumnName("asset_id");
            entity.Property(e => e.AutoRenew).HasColumnName("auto_renew");
            entity.Property(e => e.Edition)
                .HasMaxLength(100)
                .HasColumnName("edition");
            entity.Property(e => e.IsPerDevice)
                .HasDefaultValue(true)
                .HasColumnName("is_per_device");
            entity.Property(e => e.LicenseKeyEncrypted)
                .HasMaxLength(1024)
                .HasColumnName("license_key_encrypted");
            entity.Property(e => e.LicensePortalUrl)
                .HasMaxLength(400)
                .HasColumnName("license_portal_url");
            entity.Property(e => e.LicenseType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("license_type");
            entity.Property(e => e.Publisher)
                .HasMaxLength(150)
                .HasColumnName("publisher");
            entity.Property(e => e.SupportLevel)
                .HasMaxLength(100)
                .HasColumnName("support_level");
            entity.Property(e => e.Version)
                .HasMaxLength(50)
                .HasColumnName("version");

            entity.HasOne(d => d.Asset).WithOne(p => p.SoftwareDetail)
                .HasForeignKey<SoftwareDetail>(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_software_details_asset");
        });

        modelBuilder.Entity<SoftwareInstallation>(entity =>
        {
            entity.HasKey(e => e.InstallationId);

            entity
                .ToTable("software_installations")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("software_installations_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.SoftwareAssetId, "IX_swinst_software").HasFilter("([removed_date] IS NULL)");

            entity.HasIndex(e => e.TargetAssetId, "IX_swinst_target").HasFilter("([removed_date] IS NULL)");

            entity.HasIndex(e => new { e.SoftwareAssetId, e.TargetAssetId }, "UX_swinst_active")
                .IsUnique()
                .HasFilter("([removed_date] IS NULL)");

            entity.Property(e => e.InstallationId).HasColumnName("installation_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.InstalledDate).HasColumnName("installed_date");
            entity.Property(e => e.InstalledVersion)
                .HasMaxLength(50)
                .HasColumnName("installed_version");
            entity.Property(e => e.IsActive)
                .HasComputedColumnSql("(case when [removed_date] IS NULL then CONVERT([bit],(1)) else CONVERT([bit],(0)) end)", true)
                .HasColumnName("is_active");
            entity.Property(e => e.Notes)
                .HasMaxLength(400)
                .HasColumnName("notes");
            entity.Property(e => e.RemovedBy).HasColumnName("removed_by");
            entity.Property(e => e.RemovedDate).HasColumnName("removed_date");
            entity.Property(e => e.SoftwareAssetId).HasColumnName("software_asset_id");
            entity.Property(e => e.TargetAssetId).HasColumnName("target_asset_id");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.SoftwareInstallationCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_swinst_created_by");

            entity.HasOne(d => d.RemovedByNavigation).WithMany(p => p.SoftwareInstallationRemovedByNavigations)
                .HasForeignKey(d => d.RemovedBy)
                .HasConstraintName("FK_swinst_removed_by");

            entity.HasOne(d => d.SoftwareAsset).WithMany(p => p.SoftwareInstallationSoftwareAssets)
                .HasForeignKey(d => d.SoftwareAssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_swinst_software");

            entity.HasOne(d => d.TargetAsset).WithMany(p => p.SoftwareInstallationTargetAssets)
                .HasForeignKey(d => d.TargetAssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_swinst_target");
        });

        modelBuilder.Entity<StorageDetail>(entity =>
        {
            entity.HasKey(e => e.AssetId);

            entity
                .ToTable("storage_details")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("storage_details_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.Hostname, "IX_storage_hostname").HasFilter("([hostname] IS NOT NULL)");

            entity.Property(e => e.AssetId)
                .ValueGeneratedNever()
                .HasColumnName("asset_id");
            entity.Property(e => e.CacheGb).HasColumnName("cache_gb");
            entity.Property(e => e.ControllerCount).HasColumnName("controller_count");
            entity.Property(e => e.DiskBayTotal).HasColumnName("disk_bay_total");
            entity.Property(e => e.DiskBayUsed).HasColumnName("disk_bay_used");
            entity.Property(e => e.ExpansionShelfCount).HasColumnName("expansion_shelf_count");
            entity.Property(e => e.FirmwareUpdatedAt).HasColumnName("firmware_updated_at");
            entity.Property(e => e.FirmwareVersion)
                .HasMaxLength(100)
                .HasColumnName("firmware_version");
            entity.Property(e => e.HasCompression).HasColumnName("has_compression");
            entity.Property(e => e.HasDedup).HasColumnName("has_dedup");
            entity.Property(e => e.HasReplication).HasColumnName("has_replication");
            entity.Property(e => e.HasSnapshot).HasColumnName("has_snapshot");
            entity.Property(e => e.Hostname)
                .HasMaxLength(100)
                .HasColumnName("hostname");
            entity.Property(e => e.MgmtUrl)
                .HasMaxLength(400)
                .HasColumnName("mgmt_url");
            entity.Property(e => e.RawCapacityTb)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("raw_capacity_tb");
            entity.Property(e => e.SupportedProtocols)
                .HasMaxLength(200)
                .HasColumnName("supported_protocols");
            entity.Property(e => e.UsableCapacityTb)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("usable_capacity_tb");

            entity.HasOne(d => d.Asset).WithOne(p => p.StorageDetail)
                .HasForeignKey<StorageDetail>(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_storage_details_asset");
        });

        modelBuilder.Entity<StorageVolume>(entity =>
        {
            entity.HasKey(e => e.VolumeId);

            entity
                .ToTable("storage_volumes")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("storage_volumes_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.AssetId, "IX_vol_asset").HasFilter("([is_active]=(1))");

            entity.HasIndex(e => e.ClusterId, "IX_vol_cluster").HasFilter("([is_active]=(1))");

            entity.HasIndex(e => e.ProviderAssetId, "IX_vol_provider").HasFilter("([is_active]=(1))");

            entity.HasIndex(e => e.VolumeType, "IX_vol_type").HasFilter("([is_active]=(1))");

            entity.Property(e => e.VolumeId).HasColumnName("volume_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.CapacityGb)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("capacity_gb");
            entity.Property(e => e.ClusterId).HasColumnName("cluster_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DedupRatio)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("dedup_ratio");
            entity.Property(e => e.DiskType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("disk_type");
            entity.Property(e => e.EncryptionEnabled).HasColumnName("encryption_enabled");
            entity.Property(e => e.FreeGb)
                .HasComputedColumnSql("([capacity_gb]-[used_gb])", true)
                .HasColumnType("decimal(19, 2)")
                .HasColumnName("free_gb");
            entity.Property(e => e.ImmutabilityDays).HasColumnName("immutability_days");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsShared).HasColumnName("is_shared");
            entity.Property(e => e.IsThinProvisioned).HasColumnName("is_thin_provisioned");
            entity.Property(e => e.LastMeasuredAt).HasColumnName("last_measured_at");
            entity.Property(e => e.MountPath)
                .HasMaxLength(300)
                .HasColumnName("mount_path");
            entity.Property(e => e.Notes)
                .HasMaxLength(400)
                .HasColumnName("notes");
            entity.Property(e => e.ProviderAssetId).HasColumnName("provider_asset_id");
            entity.Property(e => e.RaidLevel)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("raid_level");
            entity.Property(e => e.RetentionDays).HasColumnName("retention_days");
            entity.Property(e => e.StorageProtocol)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("storage_protocol");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.UsedGb)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("used_gb");
            entity.Property(e => e.UsedPercent)
                .HasComputedColumnSql("(CONVERT([decimal](5,1),((100.0)*[used_gb])/nullif([capacity_gb],(0))))", false)
                .HasColumnType("decimal(5, 1)")
                .HasColumnName("used_percent");
            entity.Property(e => e.VolumeName)
                .HasMaxLength(150)
                .HasColumnName("volume_name");
            entity.Property(e => e.VolumeType)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("volume_type");

            entity.HasOne(d => d.Asset).WithMany(p => p.StorageVolumeAssets)
                .HasForeignKey(d => d.AssetId)
                .HasConstraintName("FK_vol_asset");

            entity.HasOne(d => d.Cluster).WithMany(p => p.StorageVolumes)
                .HasForeignKey(d => d.ClusterId)
                .HasConstraintName("FK_vol_cluster");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.StorageVolumeCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_vol_created_by");

            entity.HasOne(d => d.ProviderAsset).WithMany(p => p.StorageVolumeProviderAssets)
                .HasForeignKey(d => d.ProviderAssetId)
                .HasConstraintName("FK_vol_provider");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.StorageVolumeUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_vol_updated_by");
        });

        modelBuilder.Entity<StorageVolumeConsumer>(entity =>
        {
            entity.HasKey(e => e.ConsumerId);

            entity.ToTable("storage_volume_consumers");

            entity.HasIndex(e => e.AssetId, "IX_svc_asset");

            entity.HasIndex(e => e.ClusterId, "IX_svc_cluster");

            entity.HasIndex(e => e.VolumeId, "IX_svc_volume");

            entity.HasIndex(e => new { e.VolumeId, e.AssetId }, "UX_svc_volume_asset")
                .IsUnique()
                .HasFilter("([asset_id] IS NOT NULL)");

            entity.HasIndex(e => new { e.VolumeId, e.ClusterId }, "UX_svc_volume_cluster")
                .IsUnique()
                .HasFilter("([cluster_id] IS NOT NULL)");

            entity.Property(e => e.ConsumerId).HasColumnName("consumer_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.ClusterId).HasColumnName("cluster_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Notes)
                .HasMaxLength(300)
                .HasColumnName("notes");
            entity.Property(e => e.VolumeId).HasColumnName("volume_id");

            entity.HasOne(d => d.Asset).WithMany(p => p.StorageVolumeConsumers)
                .HasForeignKey(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_svc_asset");

            entity.HasOne(d => d.Cluster).WithMany(p => p.StorageVolumeConsumers)
                .HasForeignKey(d => d.ClusterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_svc_cluster");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.StorageVolumeConsumers)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_svc_created_by");

            entity.HasOne(d => d.Volume).WithMany(p => p.StorageVolumeConsumers)
                .HasForeignKey(d => d.VolumeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_svc_volume");
        });

        modelBuilder.Entity<SyncJob>(entity =>
        {
            entity.HasKey(e => e.JobId);

            entity
                .ToTable("sync_jobs")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("sync_jobs_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.JobCode, "UX_sync_jobs_code").IsUnique();

            entity.Property(e => e.JobId).HasColumnName("job_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CronExpression)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("cron_expression");
            entity.Property(e => e.IsEnabled)
                .HasDefaultValue(true)
                .HasColumnName("is_enabled");
            entity.Property(e => e.JobCode)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("job_code");
            entity.Property(e => e.JobName)
                .HasMaxLength(150)
                .HasColumnName("job_name");
            entity.Property(e => e.JobType)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("job_type");
            entity.Property(e => e.Notes)
                .HasMaxLength(500)
                .HasColumnName("notes");
            entity.Property(e => e.StaleAfterHours)
                .HasDefaultValue(48)
                .HasColumnName("stale_after_hours");
            entity.Property(e => e.TimeoutSeconds)
                .HasDefaultValue(1800)
                .HasColumnName("timeout_seconds");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.SyncJobs)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_sj_updated_by");
        });

        modelBuilder.Entity<SyncJobRun>(entity =>
        {
            entity.HasKey(e => e.RunId);

            entity.ToTable("sync_job_runs");

            entity.HasIndex(e => new { e.JobId, e.StartedAt }, "IX_sjr_job_time").IsDescending(false, true);

            entity.HasIndex(e => new { e.RunStatus, e.StartedAt }, "IX_sjr_status").IsDescending(false, true);

            entity.Property(e => e.RunId).HasColumnName("run_id");
            entity.Property(e => e.AgentId).HasColumnName("agent_id");
            entity.Property(e => e.DurationSeconds)
                .HasComputedColumnSql("(case when [finished_at] IS NOT NULL then datediff(second,[started_at],[finished_at])  end)", true)
                .HasColumnName("duration_seconds");
            entity.Property(e => e.ErrorDetailJson).HasColumnName("error_detail_json");
            entity.Property(e => e.ErrorMessage)
                .HasMaxLength(2000)
                .HasColumnName("error_message");
            entity.Property(e => e.FinishedAt)
                .HasPrecision(3)
                .HasColumnName("finished_at");
            entity.Property(e => e.JobId).HasColumnName("job_id");
            entity.Property(e => e.RecordsCreated).HasColumnName("records_created");
            entity.Property(e => e.RecordsFailed).HasColumnName("records_failed");
            entity.Property(e => e.RecordsRead).HasColumnName("records_read");
            entity.Property(e => e.RecordsUnchanged).HasColumnName("records_unchanged");
            entity.Property(e => e.RecordsUpdated).HasColumnName("records_updated");
            entity.Property(e => e.RecordsVanished).HasColumnName("records_vanished");
            entity.Property(e => e.RunStatus)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasDefaultValue("RUNNING")
                .HasColumnName("run_status");
            entity.Property(e => e.StartedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("started_at");
            entity.Property(e => e.TriggeredBy)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasDefaultValue("SCHEDULE")
                .HasColumnName("triggered_by");
            entity.Property(e => e.TriggeredByUser).HasColumnName("triggered_by_user");

            entity.HasOne(d => d.Agent).WithMany(p => p.SyncJobRuns)
                .HasForeignKey(d => d.AgentId)
                .HasConstraintName("FK_sjr_agent");

            entity.HasOne(d => d.Job).WithMany(p => p.SyncJobRuns)
                .HasForeignKey(d => d.JobId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_sjr_job");

            entity.HasOne(d => d.TriggeredByUserNavigation).WithMany(p => p.SyncJobRuns)
                .HasForeignKey(d => d.TriggeredByUser)
                .HasConstraintName("FK_sjr_user");
        });

        modelBuilder.Entity<SyncOuScope>(entity =>
        {
            entity.HasKey(e => e.ScopeId);

            entity
                .ToTable("sync_ou_scopes")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("sync_ou_scopes_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.DnHash, "UX_sync_ou_scopes").IsUnique();

            entity.Property(e => e.ScopeId).HasColumnName("scope_id");
            entity.Property(e => e.DistinguishedName)
                .HasMaxLength(1000)
                .HasColumnName("distinguished_name");
            entity.Property(e => e.DnHash)
                .HasMaxLength(32)
                .HasComputedColumnSql("(CONVERT([binary](32),hashbytes('SHA2_256',[distinguished_name])))", true)
                .IsFixedLength()
                .HasColumnName("dn_hash");
            entity.Property(e => e.IncludeSubtree)
                .HasDefaultValue(true)
                .HasColumnName("include_subtree");
            entity.Property(e => e.IsEnabled)
                .HasDefaultValue(true)
                .HasColumnName("is_enabled");
            entity.Property(e => e.LdapFilter)
                .HasMaxLength(500)
                .HasColumnName("ldap_filter");
            entity.Property(e => e.Notes)
                .HasMaxLength(500)
                .HasColumnName("notes");
            entity.Property(e => e.ObjectTypes)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("BOTH")
                .HasColumnName("object_types");
            entity.Property(e => e.ScopeLabel)
                .HasMaxLength(150)
                .HasColumnName("scope_label");
        });

        modelBuilder.Entity<SystemSetting>(entity =>
        {
            entity.HasKey(e => e.SettingKey);

            entity.ToTable("system_settings");

            entity.Property(e => e.SettingKey)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("setting_key");
            entity.Property(e => e.Description)
                .HasMaxLength(400)
                .HasColumnName("description");
            entity.Property(e => e.IsSecret).HasColumnName("is_secret");
            entity.Property(e => e.SettingValue).HasColumnName("setting_value");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.ValueType)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("STRING")
                .HasColumnName("value_type");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.SystemSettings)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_settings_user");
        });

        modelBuilder.Entity<Tally>(entity =>
        {
            entity.HasKey(e => e.N);

            entity.ToTable("tally");

            entity.Property(e => e.N)
                .ValueGeneratedNever()
                .HasColumnName("n");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity
                .ToTable("users")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("users_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.IsActive, "IX_users_active");

            entity.HasIndex(e => e.DepartmentId, "IX_users_department");

            entity.HasIndex(e => e.RoleId, "IX_users_role");

            entity.HasIndex(e => e.SiteId, "IX_users_site");

            entity.HasIndex(e => e.TeamId, "IX_users_team");

            entity.HasIndex(e => e.Email, "UX_users_email").IsUnique();

            entity.HasIndex(e => e.Username, "UX_users_username").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.ExternalId)
                .HasMaxLength(255)
                .HasColumnName("external_id");
            entity.Property(e => e.FailedLoginAttempts).HasColumnName("failed_login_attempts");
            entity.Property(e => e.FullName)
                .HasMaxLength(150)
                .HasColumnName("full_name");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.LastLoginAt)
                .HasPrecision(3)
                .HasColumnName("last_login_at");
            entity.Property(e => e.LockedUntil)
                .HasPrecision(3)
                .HasColumnName("locked_until");
            entity.Property(e => e.MustChangePassword)
                .HasDefaultValue(true)
                .HasColumnName("must_change_password");
            entity.Property(e => e.PasswordChangedAt)
                .HasPrecision(3)
                .HasColumnName("password_changed_at");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .HasColumnName("password_hash");
            entity.Property(e => e.Phone)
                .HasMaxLength(30)
                .HasColumnName("phone");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.SiteId).HasColumnName("site_id");
            entity.Property(e => e.TeamId).HasColumnName("team_id");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .HasColumnName("username");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.InverseCreatedByNavigation)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_users_created_by");

            entity.HasOne(d => d.Department).WithMany(p => p.Users)
                .HasForeignKey(d => d.DepartmentId)
                .HasConstraintName("FK_users_department");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_users_role");

            entity.HasOne(d => d.Site).WithMany(p => p.Users)
                .HasForeignKey(d => d.SiteId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_users_site");

            entity.HasOne(d => d.Team).WithMany(p => p.Users)
                .HasForeignKey(d => d.TeamId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_users_team");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.InverseUpdatedByNavigation)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_users_updated_by");
        });

        modelBuilder.Entity<UserMenuPermission>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.MenuId });

            entity.ToTable("user_menu_permissions");

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.MenuId).HasColumnName("menu_id");
            entity.Property(e => e.CanCreate).HasColumnName("can_create");
            entity.Property(e => e.CanDelete).HasColumnName("can_delete");
            entity.Property(e => e.CanEdit).HasColumnName("can_edit");
            entity.Property(e => e.CanView).HasColumnName("can_view");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.Menu).WithMany(p => p.UserMenuPermissions)
                .HasForeignKey(d => d.MenuId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ump_menu");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.UserMenuPermissionUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_ump_updated_by");

            entity.HasOne(d => d.User).WithMany(p => p.UserMenuPermissionUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ump_user");
        });

        modelBuilder.Entity<UserSite>(entity =>
        {
            entity.HasKey(e => e.SiteId);

            entity.ToTable("user_sites");

            entity.HasIndex(e => e.Code, "UX_user_sites_code").IsUnique();

            entity.Property(e => e.SiteId).HasColumnName("site_id");
            entity.Property(e => e.Code)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<UserTeam>(entity =>
        {
            entity.HasKey(e => e.TeamId);

            entity.ToTable("user_teams");

            entity.HasIndex(e => e.Code, "UX_user_teams_code").IsUnique();

            entity.Property(e => e.TeamId).HasColumnName("team_id");
            entity.Property(e => e.Code)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<Vendor>(entity =>
        {
            entity
                .ToTable("vendors")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("vendors_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.Code, "UX_vendors_code").IsUnique();

            entity.Property(e => e.VendorId).HasColumnName("vendor_id");
            entity.Property(e => e.Address)
                .HasMaxLength(400)
                .HasColumnName("address");
            entity.Property(e => e.Code)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.ContactPerson)
                .HasMaxLength(150)
                .HasColumnName("contact_person");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");
            entity.Property(e => e.Phone)
                .HasMaxLength(50)
                .HasColumnName("phone");
            entity.Property(e => e.TaxId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("tax_id");
        });

        modelBuilder.Entity<Vlan>(entity =>
        {
            entity
                .ToTable("vlans", tb => tb.HasTrigger("trg_vlans_validate_device_refs"))
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("vlans_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.DhcpServerAssetId, "IX_vlans_dhcp_server");

            entity.HasIndex(e => e.GatewayAssetId, "IX_vlans_gateway");

            entity.HasIndex(e => e.VlanNumber, "IX_vlans_number").HasFilter("([vlan_number] IS NOT NULL)");

            entity.HasIndex(e => new { e.NetworkNumeric, e.PrefixLength }, "IX_vlans_numeric");

            entity.HasIndex(e => e.SiteId, "IX_vlans_site");

            entity.HasIndex(e => e.ZoneId, "IX_vlans_zone");

            entity.HasIndex(e => new { e.NetworkAddress, e.PrefixLength }, "UX_vlans_network").IsUnique();

            entity.HasIndex(e => new { e.VlanNumber, e.GatewayAssetId }, "UX_vlans_primary_per_device")
                .IsUnique()
                .HasFilter("([network_level]='PRIMARY' AND [is_untagged]=(0) AND [gateway_asset_id] IS NOT NULL)");

            entity.Property(e => e.VlanId).HasColumnName("vlan_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description)
                .HasMaxLength(400)
                .HasColumnName("description");
            entity.Property(e => e.DhcpLeaseHours).HasColumnName("dhcp_lease_hours");
            entity.Property(e => e.DhcpRelayIp)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("dhcp_relay_ip");
            entity.Property(e => e.DhcpServerAssetId).HasColumnName("dhcp_server_asset_id");
            entity.Property(e => e.DhcpServerNameRaw)
                .HasMaxLength(150)
                .HasColumnName("dhcp_server_name_raw");
            entity.Property(e => e.DhcpSourceType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("dhcp_source_type");
            entity.Property(e => e.DnsPrimary)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("dns_primary");
            entity.Property(e => e.DnsSecondary)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("dns_secondary");
            entity.Property(e => e.DomainName)
                .HasMaxLength(100)
                .HasColumnName("domain_name");
            entity.Property(e => e.GatewayAssetId).HasColumnName("gateway_asset_id");
            entity.Property(e => e.GatewayDeviceRole)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("gateway_device_role");
            entity.Property(e => e.GatewayInterface)
                .HasMaxLength(50)
                .HasColumnName("gateway_interface");
            entity.Property(e => e.GatewayIp)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("gateway_ip");
            entity.Property(e => e.IpAssignmentMode)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasColumnName("ip_assignment_mode");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsUntagged).HasColumnName("is_untagged");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.NetworkAddress)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("network_address");
            entity.Property(e => e.NetworkLevel)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("PRIMARY")
                .HasColumnName("network_level");
            entity.Property(e => e.NetworkNumeric)
                .HasComputedColumnSql("([dbo].[fn_ipv4_to_bigint]([network_address]))", true)
                .HasColumnName("network_numeric");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.PrefixLength).HasColumnName("prefix_length");
            entity.Property(e => e.SiteId).HasColumnName("site_id");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.VlanNumber).HasColumnName("vlan_number");
            entity.Property(e => e.ZoneId).HasColumnName("zone_id");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.VlanCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_vlans_created_by");

            entity.HasOne(d => d.DhcpServerAsset).WithMany(p => p.VlanDhcpServerAssets)
                .HasForeignKey(d => d.DhcpServerAssetId)
                .HasConstraintName("FK_vlans_dhcp_server");

            entity.HasOne(d => d.GatewayAsset).WithMany(p => p.VlanGatewayAssets)
                .HasForeignKey(d => d.GatewayAssetId)
                .HasConstraintName("FK_vlans_gateway");

            entity.HasOne(d => d.Site).WithMany(p => p.Vlans)
                .HasForeignKey(d => d.SiteId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_vlans_site");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.VlanUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_vlans_updated_by");

            entity.HasOne(d => d.Zone).WithMany(p => p.Vlans)
                .HasForeignKey(d => d.ZoneId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_vlans_zone");
        });

        modelBuilder.Entity<VlanDevice>(entity =>
        {
            entity
                .ToTable("vlan_devices")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("vlan_devices_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.AssetId, "IX_vlandev_asset");

            entity.HasIndex(e => e.VlanId, "IX_vlandev_vlan");

            entity.HasIndex(e => new { e.VlanId, e.AssetId, e.DeviceRole }, "UX_vlan_devices").IsUnique();

            entity.Property(e => e.VlanDeviceId).HasColumnName("vlan_device_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeviceRole)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("device_role");
            entity.Property(e => e.InterfaceName)
                .HasMaxLength(50)
                .HasColumnName("interface_name");
            entity.Property(e => e.IsTagged).HasColumnName("is_tagged");
            entity.Property(e => e.Notes)
                .HasMaxLength(300)
                .HasColumnName("notes");
            entity.Property(e => e.VlanId).HasColumnName("vlan_id");

            entity.HasOne(d => d.Asset).WithMany(p => p.VlanDevices)
                .HasForeignKey(d => d.AssetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_vlandev_asset");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.VlanDevices)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_vlandev_created_by");

            entity.HasOne(d => d.Vlan).WithMany(p => p.VlanDevices)
                .HasForeignKey(d => d.VlanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_vlandev_vlan");
        });

        modelBuilder.Entity<VlanIpRange>(entity =>
        {
            entity.HasKey(e => e.RangeId);

            entity
                .ToTable("vlan_ip_ranges", tb => tb.HasTrigger("trg_vlan_ranges_validate_dhcp"))
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("vlan_ip_ranges_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => new { e.StartNumeric, e.EndNumeric }, "IX_ranges_span");

            entity.HasIndex(e => new { e.VlanId, e.RangeType }, "IX_ranges_vlan").HasFilter("([is_active]=(1))");

            entity.Property(e => e.RangeId).HasColumnName("range_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysdatetimeoffset())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description)
                .HasMaxLength(200)
                .HasColumnName("description");
            entity.Property(e => e.DhcpServerAssetId).HasColumnName("dhcp_server_asset_id");
            entity.Property(e => e.DhcpSourceType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("dhcp_source_type");
            entity.Property(e => e.EndIp)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("end_ip");
            entity.Property(e => e.EndNumeric)
                .HasComputedColumnSql("([dbo].[fn_ipv4_to_bigint]([end_ip]))", true)
                .HasColumnName("end_numeric");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.RangeType)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasColumnName("range_type");
            entity.Property(e => e.StartIp)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("start_ip");
            entity.Property(e => e.StartNumeric)
                .HasComputedColumnSql("([dbo].[fn_ipv4_to_bigint]([start_ip]))", true)
                .HasColumnName("start_numeric");
            entity.Property(e => e.VlanId).HasColumnName("vlan_id");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.VlanIpRanges)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_ranges_created_by");

            entity.HasOne(d => d.DhcpServerAsset).WithMany(p => p.VlanIpRanges)
                .HasForeignKey(d => d.DhcpServerAssetId)
                .HasConstraintName("FK_ranges_dhcp_server");

            entity.HasOne(d => d.Vlan).WithMany(p => p.VlanIpRanges)
                .HasForeignKey(d => d.VlanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ranges_vlan");
        });

        modelBuilder.Entity<VlanSite>(entity =>
        {
            entity.HasKey(e => e.SiteId);

            entity.ToTable("vlan_sites");

            entity.HasIndex(e => e.Code, "UX_vlan_sites_code").IsUnique();

            entity.Property(e => e.SiteId).HasColumnName("site_id");
            entity.Property(e => e.Code)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(80)
                .HasColumnName("name");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<VwAdGroupExpanded>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_ad_group_expanded");

            entity.Property(e => e.Depth).HasColumnName("depth");
            entity.Property(e => e.IdPath)
                .HasMaxLength(4000)
                .IsUnicode(false)
                .HasColumnName("id_path");
            entity.Property(e => e.NamePath)
                .HasMaxLength(4000)
                .HasColumnName("name_path");
            entity.Property(e => e.NestedGroupId).HasColumnName("nested_group_id");
            entity.Property(e => e.RootGroupId).HasColumnName("root_group_id");
        });

        modelBuilder.Entity<VwAllIpAddress>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_all_ip_addresses");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetName)
                .HasMaxLength(200)
                .HasColumnName("asset_name");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.CategoryCode)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("category_code");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("ip_address");
            entity.Property(e => e.IpNumeric).HasColumnName("ip_numeric");
            entity.Property(e => e.IpPurpose)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("ip_purpose");
        });

        modelBuilder.Entity<VwAssetCoverage>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_asset_coverage");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetName)
                .HasMaxLength(200)
                .HasColumnName("asset_name");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.ContractNo)
                .HasMaxLength(80)
                .HasColumnName("contract_no");
            entity.Property(e => e.ContractStatus)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("contract_status");
            entity.Property(e => e.ContractType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("contract_type");
            entity.Property(e => e.CoverageEnd).HasColumnName("coverage_end");
            entity.Property(e => e.CoverageHours)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("coverage_hours");
            entity.Property(e => e.CoverageStart).HasColumnName("coverage_start");
            entity.Property(e => e.CoverageStatus)
                .HasMaxLength(11)
                .IsUnicode(false)
                .HasColumnName("coverage_status");
            entity.Property(e => e.DaysRemaining).HasColumnName("days_remaining");
            entity.Property(e => e.SeatCount).HasColumnName("seat_count");
            entity.Property(e => e.ServiceType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("service_type");
            entity.Property(e => e.VendorName)
                .HasMaxLength(200)
                .HasColumnName("vendor_name");
        });

        modelBuilder.Entity<VwAssetList>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_asset_list");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.CategoryCode)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("category_code");
            entity.Property(e => e.CategoryName)
                .HasMaxLength(50)
                .HasColumnName("category_name");
            entity.Property(e => e.ContractNo)
                .HasMaxLength(80)
                .HasColumnName("contract_no");
            entity.Property(e => e.CoverageEnd).HasColumnName("coverage_end");
            entity.Property(e => e.CoverageStatus)
                .HasMaxLength(11)
                .IsUnicode(false)
                .HasColumnName("coverage_status");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasColumnName("created_at");
            entity.Property(e => e.Currency)
                .HasMaxLength(3)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("currency");
            entity.Property(e => e.DaysRemaining).HasColumnName("days_remaining");
            entity.Property(e => e.DepartmentName)
                .HasMaxLength(100)
                .HasColumnName("department_name");
            entity.Property(e => e.FixedAssetNo)
                .HasMaxLength(50)
                .HasColumnName("fixed_asset_no");
            entity.Property(e => e.Hostname)
                .HasMaxLength(100)
                .HasColumnName("hostname");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("ip_address");
            entity.Property(e => e.LastVerifiedAt).HasColumnName("last_verified_at");
            entity.Property(e => e.LocationName)
                .HasMaxLength(150)
                .HasColumnName("location_name");
            entity.Property(e => e.LocationPath)
                .HasMaxLength(1000)
                .HasColumnName("location_path");
            entity.Property(e => e.ManufacturerName)
                .HasMaxLength(150)
                .HasColumnName("manufacturer_name");
            entity.Property(e => e.ModelName)
                .HasMaxLength(150)
                .HasColumnName("model_name");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");
            entity.Property(e => e.OwnerName)
                .HasMaxLength(150)
                .HasColumnName("owner_name");
            entity.Property(e => e.PurchaseDate).HasColumnName("purchase_date");
            entity.Property(e => e.PurchasePrice)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("purchase_price");
            entity.Property(e => e.RackCode)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("rack_code");
            entity.Property(e => e.SerialNumber)
                .HasMaxLength(100)
                .HasColumnName("serial_number");
            entity.Property(e => e.ServerPrimaryRole)
                .HasMaxLength(80)
                .HasColumnName("server_primary_role");
            entity.Property(e => e.ServiceStartDate).HasColumnName("service_start_date");
            entity.Property(e => e.ServiceTag)
                .HasMaxLength(50)
                .HasColumnName("service_tag");
            entity.Property(e => e.StartU).HasColumnName("start_u");
            entity.Property(e => e.StatusCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("status_code");
            entity.Property(e => e.StatusColor)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("status_color");
            entity.Property(e => e.StatusName)
                .HasMaxLength(50)
                .HasColumnName("status_name");
            entity.Property(e => e.TypeGroupName)
                .HasMaxLength(100)
                .HasColumnName("type_group_name");
            entity.Property(e => e.TypeName)
                .HasMaxLength(100)
                .HasColumnName("type_name");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.VendorName)
                .HasMaxLength(200)
                .HasColumnName("vendor_name");
            entity.Property(e => e.VlanNumber).HasColumnName("vlan_number");
            entity.Property(e => e.ZoneName)
                .HasMaxLength(80)
                .HasColumnName("zone_name");
        });

        modelBuilder.Entity<VwAssetPrimaryIp>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_asset_primary_ip");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.Hostname)
                .HasMaxLength(100)
                .HasColumnName("hostname");
            entity.Property(e => e.PrimaryIp)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("primary_ip");
            entity.Property(e => e.VlanId).HasColumnName("vlan_id");
            entity.Property(e => e.VlanName)
                .HasMaxLength(100)
                .HasColumnName("vlan_name");
            entity.Property(e => e.VlanNumber).HasColumnName("vlan_number");
            entity.Property(e => e.ZoneCode)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("zone_code");
            entity.Property(e => e.ZoneName)
                .HasMaxLength(80)
                .HasColumnName("zone_name");
        });

        modelBuilder.Entity<VwAssetRelationshipsExpanded>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_asset_relationships_expanded");

            entity.Property(e => e.Direction)
                .HasMaxLength(8)
                .IsUnicode(false)
                .HasColumnName("direction");
            entity.Property(e => e.FromAssetId).HasColumnName("from_asset_id");
            entity.Property(e => e.Notes)
                .HasMaxLength(400)
                .HasColumnName("notes");
            entity.Property(e => e.RelatedAssetName)
                .HasMaxLength(200)
                .HasColumnName("related_asset_name");
            entity.Property(e => e.RelatedAssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("related_asset_tag");
            entity.Property(e => e.RelatedStatusCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("related_status_code");
            entity.Property(e => e.RelationshipId).HasColumnName("relationship_id");
            entity.Property(e => e.RelationshipName)
                .HasMaxLength(50)
                .HasColumnName("relationship_name");
            entity.Property(e => e.ToAssetId).HasColumnName("to_asset_id");
        });

        modelBuilder.Entity<VwAssetStorageSummary>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_asset_storage_summary");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetName)
                .HasMaxLength(200)
                .HasColumnName("asset_name");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.LastMeasuredAt).HasColumnName("last_measured_at");
            entity.Property(e => e.TotalCapacityGb)
                .HasColumnType("decimal(38, 2)")
                .HasColumnName("total_capacity_gb");
            entity.Property(e => e.TotalFreeGb)
                .HasColumnType("decimal(38, 2)")
                .HasColumnName("total_free_gb");
            entity.Property(e => e.TotalUsedGb)
                .HasColumnType("decimal(38, 2)")
                .HasColumnName("total_used_gb");
            entity.Property(e => e.UsedPercent)
                .HasColumnType("decimal(5, 1)")
                .HasColumnName("used_percent");
            entity.Property(e => e.VolumeCount).HasColumnName("volume_count");
        });

        modelBuilder.Entity<VwAssetTco>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_asset_tco");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetName)
                .HasMaxLength(200)
                .HasColumnName("asset_name");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.ContractCount).HasColumnName("contract_count");
            entity.Property(e => e.Currency)
                .HasMaxLength(3)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("currency");
            entity.Property(e => e.FixedAssetNo)
                .HasMaxLength(50)
                .HasColumnName("fixed_asset_no");
            entity.Property(e => e.MonthsInService).HasColumnName("months_in_service");
            entity.Property(e => e.PurchasePrice)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("purchase_price");
            entity.Property(e => e.ServiceStartDate).HasColumnName("service_start_date");
            entity.Property(e => e.SupportCostVsPurchasePercent)
                .HasColumnType("decimal(6, 1)")
                .HasColumnName("support_cost_vs_purchase_percent");
            entity.Property(e => e.TotalContractCost)
                .HasColumnType("decimal(38, 2)")
                .HasColumnName("total_contract_cost");
            entity.Property(e => e.TotalCostOfOwnership)
                .HasColumnType("decimal(38, 2)")
                .HasColumnName("total_cost_of_ownership");
        });

        modelBuilder.Entity<VwAssetTypeTree>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_asset_type_tree");

            entity.Property(e => e.AssetTypeId).HasColumnName("asset_type_id");
            entity.Property(e => e.CanBeGateway).HasColumnName("can_be_gateway");
            entity.Property(e => e.CanHostVm).HasColumnName("can_host_vm");
            entity.Property(e => e.CanProvideDhcp).HasColumnName("can_provide_dhcp");
            entity.Property(e => e.CategoryCode)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("category_code");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CategoryName)
                .HasMaxLength(50)
                .HasColumnName("category_name");
            entity.Property(e => e.Code)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.DefaultUHeight).HasColumnName("default_u_height");
            entity.Property(e => e.DhcpSourceCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("dhcp_source_code");
            entity.Property(e => e.FullPath)
                .HasMaxLength(256)
                .HasColumnName("full_path");
            entity.Property(e => e.GatewayRoleCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("gateway_role_code");
            entity.Property(e => e.IconName)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("icon_name");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.IsLayer3).HasColumnName("is_layer3");
            entity.Property(e => e.IsRackable).HasColumnName("is_rackable");
            entity.Property(e => e.IsVirtual).HasColumnName("is_virtual");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.ParentCode)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("parent_code");
            entity.Property(e => e.ParentName)
                .HasMaxLength(100)
                .HasColumnName("parent_name");
            entity.Property(e => e.ParentTypeId).HasColumnName("parent_type_id");
            entity.Property(e => e.RequiresIp).HasColumnName("requires_ip");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            entity.Property(e => e.TypeLevel).HasColumnName("type_level");
        });

        modelBuilder.Entity<VwBackupRepository>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_backup_repositories");

            entity.Property(e => e.BackupServerName)
                .HasMaxLength(200)
                .HasColumnName("backup_server_name");
            entity.Property(e => e.BackupServerTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("backup_server_tag");
            entity.Property(e => e.CapacityGb)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("capacity_gb");
            entity.Property(e => e.CapacityStatus)
                .HasMaxLength(8)
                .IsUnicode(false)
                .HasColumnName("capacity_status");
            entity.Property(e => e.ClusterName)
                .HasMaxLength(120)
                .HasColumnName("cluster_name");
            entity.Property(e => e.DedupRatio)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("dedup_ratio");
            entity.Property(e => e.DiskType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("disk_type");
            entity.Property(e => e.EncryptionEnabled).HasColumnName("encryption_enabled");
            entity.Property(e => e.FreeGb)
                .HasColumnType("decimal(19, 2)")
                .HasColumnName("free_gb");
            entity.Property(e => e.ImmutabilityDays).HasColumnName("immutability_days");
            entity.Property(e => e.LacksImmutability).HasColumnName("lacks_immutability");
            entity.Property(e => e.LastMeasuredAt).HasColumnName("last_measured_at");
            entity.Property(e => e.RetentionDays).HasColumnName("retention_days");
            entity.Property(e => e.StorageProtocol)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("storage_protocol");
            entity.Property(e => e.StorageProviderName)
                .HasMaxLength(200)
                .HasColumnName("storage_provider_name");
            entity.Property(e => e.StorageProviderTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("storage_provider_tag");
            entity.Property(e => e.UsedGb)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("used_gb");
            entity.Property(e => e.UsedPercent)
                .HasColumnType("decimal(5, 1)")
                .HasColumnName("used_percent");
            entity.Property(e => e.VolumeId).HasColumnName("volume_id");
            entity.Property(e => e.VolumeName)
                .HasMaxLength(150)
                .HasColumnName("volume_name");
            entity.Property(e => e.VolumeType)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("volume_type");
        });

        modelBuilder.Entity<VwCascadeManufacturer>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_cascade_manufacturers");

            entity.Property(e => e.AssetTypeId).HasColumnName("asset_type_id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.ManufacturerId).HasColumnName("manufacturer_id");
            entity.Property(e => e.ManufacturerName)
                .HasMaxLength(150)
                .HasColumnName("manufacturer_name");
            entity.Property(e => e.ModelCount).HasColumnName("model_count");
        });

        modelBuilder.Entity<VwCascadeModel>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_cascade_models");

            entity.Property(e => e.AssetTypeId).HasColumnName("asset_type_id");
            entity.Property(e => e.DefaultSpecs).HasColumnName("default_specs");
            entity.Property(e => e.DisplayLabel)
                .HasMaxLength(301)
                .HasColumnName("display_label");
            entity.Property(e => e.EolDate).HasColumnName("eol_date");
            entity.Property(e => e.EosDate).HasColumnName("eos_date");
            entity.Property(e => e.FormFactor)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("form_factor");
            entity.Property(e => e.IsPastEos).HasColumnName("is_past_eos");
            entity.Property(e => e.IsVerified).HasColumnName("is_verified");
            entity.Property(e => e.ManufacturerId).HasColumnName("manufacturer_id");
            entity.Property(e => e.ManufacturerName)
                .HasMaxLength(150)
                .HasColumnName("manufacturer_name");
            entity.Property(e => e.ModelId).HasColumnName("model_id");
            entity.Property(e => e.ModelName)
                .HasMaxLength(150)
                .HasColumnName("model_name");
            entity.Property(e => e.ModelNumber)
                .HasMaxLength(100)
                .HasColumnName("model_number");
            entity.Property(e => e.PowerDrawWatt).HasColumnName("power_draw_watt");
            entity.Property(e => e.TypeName)
                .HasMaxLength(100)
                .HasColumnName("type_name");
            entity.Property(e => e.UHeight).HasColumnName("u_height");
            entity.Property(e => e.WeightKg)
                .HasColumnType("decimal(7, 2)")
                .HasColumnName("weight_kg");
        });

        modelBuilder.Entity<VwClassificationSummary>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_classification_summary");

            entity.Property(e => e.ClassificationCode)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("classification_code");
            entity.Property(e => e.ClassificationId).HasColumnName("classification_id");
            entity.Property(e => e.ClassificationName)
                .HasMaxLength(60)
                .HasColumnName("classification_name");
            entity.Property(e => e.ColorToken)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("color_token");
            entity.Property(e => e.DepartmentCount).HasColumnName("department_count");
            entity.Property(e => e.FolderCount).HasColumnName("folder_count");
            entity.Property(e => e.SensitivityRank).HasColumnName("sensitivity_rank");
            entity.Property(e => e.TotalUsedBytes).HasColumnName("total_used_bytes");
        });

        modelBuilder.Entity<VwClusterOverview>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_cluster_overview");

            entity.Property(e => e.ActiveMembers).HasColumnName("active_members");
            entity.Property(e => e.ClusterCode)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("cluster_code");
            entity.Property(e => e.ClusterId).HasColumnName("cluster_id");
            entity.Property(e => e.ClusterName)
                .HasMaxLength(120)
                .HasColumnName("cluster_name");
            entity.Property(e => e.ClusterType)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("cluster_type");
            entity.Property(e => e.ExpectedNodeCount).HasColumnName("expected_node_count");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.IsDegraded).HasColumnName("is_degraded");
            entity.Property(e => e.ManagementIp)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("management_ip");
            entity.Property(e => e.MemberList)
                .HasMaxLength(4000)
                .HasColumnName("member_list");
            entity.Property(e => e.SharedCapacityGb)
                .HasColumnType("decimal(38, 2)")
                .HasColumnName("shared_capacity_gb");
            entity.Property(e => e.SharedUsedGb)
                .HasColumnType("decimal(38, 2)")
                .HasColumnName("shared_used_gb");
            entity.Property(e => e.SharedUsedPercent)
                .HasColumnType("decimal(5, 1)")
                .HasColumnName("shared_used_percent");
            entity.Property(e => e.SharedVolumeCount).HasColumnName("shared_volume_count");
            entity.Property(e => e.SiteName)
                .HasMaxLength(150)
                .HasColumnName("site_name");
            entity.Property(e => e.VendorProduct)
                .HasMaxLength(120)
                .HasColumnName("vendor_product");
        });

        modelBuilder.Entity<VwContractTimeline>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_contract_timeline");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.AutoRenew).HasColumnName("auto_renew");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.ContractNo)
                .HasMaxLength(80)
                .HasColumnName("contract_no");
            entity.Property(e => e.ContractOwner)
                .HasMaxLength(150)
                .HasColumnName("contract_owner");
            entity.Property(e => e.ContractType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("contract_type");
            entity.Property(e => e.CostChangePercent)
                .HasColumnType("decimal(6, 1)")
                .HasColumnName("cost_change_percent");
            entity.Property(e => e.CoverageEnd).HasColumnName("coverage_end");
            entity.Property(e => e.CoverageHours)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("coverage_hours");
            entity.Property(e => e.CoverageStart).HasColumnName("coverage_start");
            entity.Property(e => e.Currency)
                .HasMaxLength(3)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("currency");
            entity.Property(e => e.GapDaysFromPrevious).HasColumnName("gap_days_from_previous");
            entity.Property(e => e.PeriodCost)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("period_cost");
            entity.Property(e => e.PreviousContractId).HasColumnName("previous_contract_id");
            entity.Property(e => e.PreviousContractNo)
                .HasMaxLength(80)
                .HasColumnName("previous_contract_no");
            entity.Property(e => e.SeatCount).HasColumnName("seat_count");
            entity.Property(e => e.SequenceNo).HasColumnName("sequence_no");
            entity.Property(e => e.ServiceType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("service_type");
            entity.Property(e => e.SlaResponseHours).HasColumnName("sla_response_hours");
            entity.Property(e => e.Status)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("status");
            entity.Property(e => e.VendorContractNo)
                .HasMaxLength(80)
                .HasColumnName("vendor_contract_no");
            entity.Property(e => e.VendorName)
                .HasMaxLength(200)
                .HasColumnName("vendor_name");
        });

        modelBuilder.Entity<VwDepartmentFolderSummary>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_department_folder_summary");

            entity.Property(e => e.ConfidentialOrAbove).HasColumnName("confidential_or_above");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.DepartmentName)
                .HasMaxLength(100)
                .HasColumnName("department_name");
            entity.Property(e => e.FolderCount).HasColumnName("folder_count");
            entity.Property(e => e.NearFullCount).HasColumnName("near_full_count");
            entity.Property(e => e.OldestReviewDate).HasColumnName("oldest_review_date");
            entity.Property(e => e.ServerCount).HasColumnName("server_count");
            entity.Property(e => e.TotalQuotaBytes).HasColumnName("total_quota_bytes");
            entity.Property(e => e.TotalUsedBytes).HasColumnName("total_used_bytes");
        });

        modelBuilder.Entity<VwDhcpCapableDevice>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_dhcp_capable_devices");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetName)
                .HasMaxLength(200)
                .HasColumnName("asset_name");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.DeviceClassName)
                .HasMaxLength(100)
                .HasColumnName("device_class_name");
            entity.Property(e => e.DeviceHostname)
                .HasMaxLength(100)
                .HasColumnName("device_hostname");
            entity.Property(e => e.DeviceIp)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("device_ip");
            entity.Property(e => e.DeviceKind)
                .HasMaxLength(7)
                .IsUnicode(false)
                .HasColumnName("device_kind");
            entity.Property(e => e.DeviceTypeName)
                .HasMaxLength(100)
                .HasColumnName("device_type_name");
            entity.Property(e => e.DhcpSourceType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("dhcp_source_type");
            entity.Property(e => e.DisplayLabel)
                .HasMaxLength(326)
                .HasColumnName("display_label");
            entity.Property(e => e.LocationName)
                .HasMaxLength(150)
                .HasColumnName("location_name");
            entity.Property(e => e.StatusCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("status_code");
        });

        modelBuilder.Entity<VwEosContractConflict>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_eos_contract_conflicts");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetName)
                .HasMaxLength(200)
                .HasColumnName("asset_name");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.ContractCost)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("contract_cost");
            entity.Property(e => e.ContractNo)
                .HasMaxLength(80)
                .HasColumnName("contract_no");
            entity.Property(e => e.CoverageEnd).HasColumnName("coverage_end");
            entity.Property(e => e.DaysPaidBeyondEos).HasColumnName("days_paid_beyond_eos");
            entity.Property(e => e.EosDate).HasColumnName("eos_date");
            entity.Property(e => e.ManufacturerName)
                .HasMaxLength(150)
                .HasColumnName("manufacturer_name");
            entity.Property(e => e.ModelName)
                .HasMaxLength(150)
                .HasColumnName("model_name");
        });

        modelBuilder.Entity<VwExpiringAsset>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_expiring_assets");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.CategoryCode)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("category_code");
            entity.Property(e => e.CategoryName)
                .HasMaxLength(50)
                .HasColumnName("category_name");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.ContractNo)
                .HasMaxLength(80)
                .HasColumnName("contract_no");
            entity.Property(e => e.ContractOwnerEmail)
                .HasMaxLength(255)
                .HasColumnName("contract_owner_email");
            entity.Property(e => e.ContractOwnerName)
                .HasMaxLength(150)
                .HasColumnName("contract_owner_name");
            entity.Property(e => e.ContractType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("contract_type");
            entity.Property(e => e.CoverageEndDate).HasColumnName("coverage_end_date");
            entity.Property(e => e.CurrentContractId).HasColumnName("current_contract_id");
            entity.Property(e => e.DaysRemaining).HasColumnName("days_remaining");
            entity.Property(e => e.LocationName)
                .HasMaxLength(150)
                .HasColumnName("location_name");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");
            entity.Property(e => e.OwnerEmail)
                .HasMaxLength(255)
                .HasColumnName("owner_email");
            entity.Property(e => e.OwnerName)
                .HasMaxLength(150)
                .HasColumnName("owner_name");
            entity.Property(e => e.OwnerUserId).HasColumnName("owner_user_id");
            entity.Property(e => e.SeatCount).HasColumnName("seat_count");
            entity.Property(e => e.Severity)
                .HasMaxLength(8)
                .IsUnicode(false)
                .HasColumnName("severity");
            entity.Property(e => e.VendorName)
                .HasMaxLength(200)
                .HasColumnName("vendor_name");
        });

        modelBuilder.Entity<VwFileShareChangeHistory>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_file_share_change_history");

            entity.Property(e => e.BusinessPurpose)
                .HasMaxLength(500)
                .HasColumnName("business_purpose");
            entity.Property(e => e.ChangeActionTh)
                .HasMaxLength(18)
                .HasColumnName("change_action_th");
            entity.Property(e => e.ChangedAtUtc)
                .HasPrecision(3)
                .HasColumnName("changed_at_utc");
            entity.Property(e => e.ChangedByName)
                .HasMaxLength(150)
                .HasColumnName("changed_by_name");
            entity.Property(e => e.ChangedByUserId).HasColumnName("changed_by_user_id");
            entity.Property(e => e.ChangedByUsername)
                .HasMaxLength(50)
                .HasColumnName("changed_by_username");
            entity.Property(e => e.ClassificationName)
                .HasMaxLength(60)
                .HasColumnName("classification_name");
            entity.Property(e => e.FolderPath)
                .HasMaxLength(500)
                .HasColumnName("folder_path");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.OwnerDepartment)
                .HasMaxLength(100)
                .HasColumnName("owner_department");
            entity.Property(e => e.PreviousClassificationName)
                .HasMaxLength(60)
                .HasColumnName("previous_classification_name");
            entity.Property(e => e.PreviousOwnerDepartment)
                .HasMaxLength(100)
                .HasColumnName("previous_owner_department");
            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.ShareName)
                .HasMaxLength(128)
                .HasColumnName("share_name");
            entity.Property(e => e.SupersededAtUtc)
                .HasPrecision(3)
                .HasColumnName("superseded_at_utc");
            entity.Property(e => e.VersionNo).HasColumnName("version_no");
            entity.Property(e => e.VersionSeq).HasColumnName("version_seq");
        });

        modelBuilder.Entity<VwFileShareCurrentUsage>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_file_share_current_usage");

            entity.Property(e => e.FileCount).HasColumnName("file_count");
            entity.Property(e => e.FolderCount).HasColumnName("folder_count");
            entity.Property(e => e.GrowthBytes).HasColumnName("growth_bytes");
            entity.Property(e => e.GrowthPeriodDays).HasColumnName("growth_period_days");
            entity.Property(e => e.MeasuredAt)
                .HasPrecision(3)
                .HasColumnName("measured_at");
            entity.Property(e => e.PreviousUsedBytes).HasColumnName("previous_used_bytes");
            entity.Property(e => e.QuotaBytes).HasColumnName("quota_bytes");
            entity.Property(e => e.QuotaType)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("quota_type");
            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.UsagePercent)
                .HasColumnType("decimal(6, 2)")
                .HasColumnName("usage_percent");
            entity.Property(e => e.UsageStatus)
                .HasMaxLength(19)
                .HasColumnName("usage_status");
            entity.Property(e => e.UsedBytes).HasColumnName("used_bytes");
        });

        modelBuilder.Entity<VwFileShareList>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_file_share_list");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.BusinessPurpose)
                .HasMaxLength(500)
                .HasColumnName("business_purpose");
            entity.Property(e => e.ClassificationCode)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("classification_code");
            entity.Property(e => e.ClassificationColor)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("classification_color");
            entity.Property(e => e.ClassificationId).HasColumnName("classification_id");
            entity.Property(e => e.ClassificationName)
                .HasMaxLength(60)
                .HasColumnName("classification_name");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasColumnName("created_at");
            entity.Property(e => e.DaysSinceReview).HasColumnName("days_since_review");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.FolderPath)
                .HasMaxLength(500)
                .HasColumnName("folder_path");
            entity.Property(e => e.LastReviewedAt).HasColumnName("last_reviewed_at");
            entity.Property(e => e.OrphanGroupCount).HasColumnName("orphan_group_count");
            entity.Property(e => e.OwnerDepartment)
                .HasMaxLength(100)
                .HasColumnName("owner_department");
            entity.Property(e => e.OwnerUserName)
                .HasMaxLength(150)
                .HasColumnName("owner_user_name");
            entity.Property(e => e.QuotaBytes).HasColumnName("quota_bytes");
            entity.Property(e => e.RequiresViewAudit).HasColumnName("requires_view_audit");
            entity.Property(e => e.RoGroupCount).HasColumnName("ro_group_count");
            entity.Property(e => e.RwGroupCount).HasColumnName("rw_group_count");
            entity.Property(e => e.SensitivityRank).HasColumnName("sensitivity_rank");
            entity.Property(e => e.ServerName)
                .HasMaxLength(200)
                .HasColumnName("server_name");
            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.ShareName)
                .HasMaxLength(128)
                .HasColumnName("share_name");
            entity.Property(e => e.TotalGroupCount).HasColumnName("total_group_count");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.UsageMeasuredAt)
                .HasPrecision(3)
                .HasColumnName("usage_measured_at");
            entity.Property(e => e.UsagePercent)
                .HasColumnType("decimal(6, 2)")
                .HasColumnName("usage_percent");
            entity.Property(e => e.UsageStatus)
                .HasMaxLength(19)
                .HasColumnName("usage_status");
            entity.Property(e => e.UsedBytes).HasColumnName("used_bytes");
        });

        modelBuilder.Entity<VwGatewayCapableDevice>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_gateway_capable_devices");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetName)
                .HasMaxLength(200)
                .HasColumnName("asset_name");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.DeviceClassName)
                .HasMaxLength(100)
                .HasColumnName("device_class_name");
            entity.Property(e => e.DeviceHostname)
                .HasMaxLength(100)
                .HasColumnName("device_hostname");
            entity.Property(e => e.DeviceIp)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("device_ip");
            entity.Property(e => e.DeviceTypeName)
                .HasMaxLength(100)
                .HasColumnName("device_type_name");
            entity.Property(e => e.DisplayLabel)
                .HasMaxLength(271)
                .HasColumnName("display_label");
            entity.Property(e => e.GatewayDeviceRole)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("gateway_device_role");
            entity.Property(e => e.IsLayer3).HasColumnName("is_layer3");
            entity.Property(e => e.LocationName)
                .HasMaxLength(150)
                .HasColumnName("location_name");
            entity.Property(e => e.StatusCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("status_code");
        });

        modelBuilder.Entity<VwIpRangeUsage>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_ip_range_usage");

            entity.Property(e => e.AvailableCount).HasColumnName("available_count");
            entity.Property(e => e.Description)
                .HasMaxLength(200)
                .HasColumnName("description");
            entity.Property(e => e.EndIp)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("end_ip");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.RangeId).HasColumnName("range_id");
            entity.Property(e => e.RangeSize).HasColumnName("range_size");
            entity.Property(e => e.RangeType)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasColumnName("range_type");
            entity.Property(e => e.StartIp)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("start_ip");
            entity.Property(e => e.UsedCount).HasColumnName("used_count");
            entity.Property(e => e.UsedPercent)
                .HasColumnType("decimal(5, 1)")
                .HasColumnName("used_percent");
            entity.Property(e => e.VlanId).HasColumnName("vlan_id");
            entity.Property(e => e.VlanName)
                .HasMaxLength(100)
                .HasColumnName("vlan_name");
            entity.Property(e => e.VlanNumber).HasColumnName("vlan_number");
        });

        modelBuilder.Entity<VwIpValidationIssue>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_ip_validation_issues");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("ip_address");
            entity.Property(e => e.IpId).HasColumnName("ip_id");
            entity.Property(e => e.IssueCode)
                .HasMaxLength(16)
                .IsUnicode(false)
                .HasColumnName("issue_code");
            entity.Property(e => e.IssueDetail)
                .HasMaxLength(167)
                .HasColumnName("issue_detail");
            entity.Property(e => e.Severity)
                .HasMaxLength(7)
                .IsUnicode(false)
                .HasColumnName("severity");
        });

        modelBuilder.Entity<VwLocationTree>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_location_tree");

            entity.Property(e => e.Code)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.Depth).HasColumnName("depth");
            entity.Property(e => e.FullPath)
                .HasMaxLength(1000)
                .HasColumnName("full_path");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.LocationId).HasColumnName("location_id");
            entity.Property(e => e.LocationType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("location_type");
            entity.Property(e => e.Name)
                .HasMaxLength(150)
                .HasColumnName("name");
            entity.Property(e => e.ParentLocationId).HasColumnName("parent_location_id");
        });

        modelBuilder.Entity<VwPermissionChangeHistory>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_permission_change_history");

            entity.Property(e => e.AccessLevelCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("access_level_code");
            entity.Property(e => e.AccessLevelName)
                .HasMaxLength(50)
                .HasColumnName("access_level_name");
            entity.Property(e => e.AdGroupName)
                .HasMaxLength(256)
                .HasColumnName("ad_group_name");
            entity.Property(e => e.ChangeAction)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasColumnName("change_action");
            entity.Property(e => e.ChangeActionTh)
                .HasMaxLength(18)
                .HasColumnName("change_action_th");
            entity.Property(e => e.ChangedAtUtc)
                .HasPrecision(3)
                .HasColumnName("changed_at_utc");
            entity.Property(e => e.ChangedByName)
                .HasMaxLength(150)
                .HasColumnName("changed_by_name");
            entity.Property(e => e.ChangedByUserId).HasColumnName("changed_by_user_id");
            entity.Property(e => e.ChangedByUsername)
                .HasMaxLength(50)
                .HasColumnName("changed_by_username");
            entity.Property(e => e.ClassificationName)
                .HasMaxLength(60)
                .HasColumnName("classification_name");
            entity.Property(e => e.FolderPath)
                .HasMaxLength(500)
                .HasColumnName("folder_path");
            entity.Property(e => e.GrantedReason)
                .HasMaxLength(500)
                .HasColumnName("granted_reason");
            entity.Property(e => e.IsCurrent).HasColumnName("is_current");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.PermissionId).HasColumnName("permission_id");
            entity.Property(e => e.PreviousAccessLevelName)
                .HasMaxLength(50)
                .HasColumnName("previous_access_level_name");
            entity.Property(e => e.SensitivityRank).HasColumnName("sensitivity_rank");
            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.ShareName)
                .HasMaxLength(128)
                .HasColumnName("share_name");
            entity.Property(e => e.SupersededAtUtc)
                .HasPrecision(3)
                .HasColumnName("superseded_at_utc");
            entity.Property(e => e.VersionNo).HasColumnName("version_no");
            entity.Property(e => e.VersionSeq).HasColumnName("version_seq");
        });

        modelBuilder.Entity<VwPermissionIssue>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_permission_issues");

            entity.Property(e => e.FolderPath)
                .HasMaxLength(500)
                .HasColumnName("folder_path");
            entity.Property(e => e.IssueCode)
                .HasMaxLength(24)
                .IsUnicode(false)
                .HasColumnName("issue_code");
            entity.Property(e => e.IssueDetail)
                .HasMaxLength(93)
                .HasColumnName("issue_detail");
            entity.Property(e => e.SensitivityRank).HasColumnName("sensitivity_rank");
            entity.Property(e => e.Severity)
                .HasMaxLength(6)
                .IsUnicode(false)
                .HasColumnName("severity");
            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.ShareName)
                .HasMaxLength(128)
                .HasColumnName("share_name");
            entity.Property(e => e.Subject)
                .HasMaxLength(256)
                .HasColumnName("subject");
        });

        modelBuilder.Entity<VwPermissionRecentVersion>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_permission_recent_versions");

            entity.Property(e => e.AccessLevelCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("access_level_code");
            entity.Property(e => e.AccessLevelName)
                .HasMaxLength(50)
                .HasColumnName("access_level_name");
            entity.Property(e => e.AdGroupName)
                .HasMaxLength(256)
                .HasColumnName("ad_group_name");
            entity.Property(e => e.ChangeAction)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasColumnName("change_action");
            entity.Property(e => e.ChangeActionTh)
                .HasMaxLength(18)
                .HasColumnName("change_action_th");
            entity.Property(e => e.ChangedAtUtc)
                .HasPrecision(3)
                .HasColumnName("changed_at_utc");
            entity.Property(e => e.ChangedByName)
                .HasMaxLength(150)
                .HasColumnName("changed_by_name");
            entity.Property(e => e.ChangedByUserId).HasColumnName("changed_by_user_id");
            entity.Property(e => e.ChangedByUsername)
                .HasMaxLength(50)
                .HasColumnName("changed_by_username");
            entity.Property(e => e.ClassificationName)
                .HasMaxLength(60)
                .HasColumnName("classification_name");
            entity.Property(e => e.FolderPath)
                .HasMaxLength(500)
                .HasColumnName("folder_path");
            entity.Property(e => e.GrantedReason)
                .HasMaxLength(500)
                .HasColumnName("granted_reason");
            entity.Property(e => e.IsCurrent).HasColumnName("is_current");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.PermissionId).HasColumnName("permission_id");
            entity.Property(e => e.PreviousAccessLevelName)
                .HasMaxLength(50)
                .HasColumnName("previous_access_level_name");
            entity.Property(e => e.SensitivityRank).HasColumnName("sensitivity_rank");
            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.ShareName)
                .HasMaxLength(128)
                .HasColumnName("share_name");
            entity.Property(e => e.SupersededAtUtc)
                .HasPrecision(3)
                .HasColumnName("superseded_at_utc");
            entity.Property(e => e.VersionNo).HasColumnName("version_no");
            entity.Property(e => e.VersionSeq).HasColumnName("version_seq");
        });

        modelBuilder.Entity<VwRackElevation>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_rack_elevation");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetName)
                .HasMaxLength(200)
                .HasColumnName("asset_name");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.CategoryCode)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("category_code");
            entity.Property(e => e.EndU).HasColumnName("end_u");
            entity.Property(e => e.ManufacturerName)
                .HasMaxLength(150)
                .HasColumnName("manufacturer_name");
            entity.Property(e => e.ModelName)
                .HasMaxLength(150)
                .HasColumnName("model_name");
            entity.Property(e => e.MountFace)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("mount_face");
            entity.Property(e => e.MountedDate).HasColumnName("mounted_date");
            entity.Property(e => e.Orientation)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("orientation");
            entity.Property(e => e.PowerDrawWatt).HasColumnName("power_draw_watt");
            entity.Property(e => e.RackCode)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("rack_code");
            entity.Property(e => e.RackId).HasColumnName("rack_id");
            entity.Property(e => e.RackMountId).HasColumnName("rack_mount_id");
            entity.Property(e => e.StartU).HasColumnName("start_u");
            entity.Property(e => e.StatusCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("status_code");
            entity.Property(e => e.StatusColor)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("status_color");
            entity.Property(e => e.TypeName)
                .HasMaxLength(100)
                .HasColumnName("type_name");
            entity.Property(e => e.UHeight).HasColumnName("u_height");
            entity.Property(e => e.WeightKg)
                .HasColumnType("decimal(7, 2)")
                .HasColumnName("weight_kg");
        });

        modelBuilder.Entity<VwRackUtilization>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_rack_utilization");

            entity.Property(e => e.DeviceCount).HasColumnName("device_count");
            entity.Property(e => e.FreeU).HasColumnName("free_u");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.IsOverPower).HasColumnName("is_over_power");
            entity.Property(e => e.IsOverWeight).HasColumnName("is_over_weight");
            entity.Property(e => e.LocationPath)
                .HasMaxLength(1000)
                .HasColumnName("location_path");
            entity.Property(e => e.MaxPowerKw)
                .HasColumnType("decimal(6, 2)")
                .HasColumnName("max_power_kw");
            entity.Property(e => e.MaxWeightKg)
                .HasColumnType("decimal(8, 2)")
                .HasColumnName("max_weight_kg");
            entity.Property(e => e.PowerUsedPercent)
                .HasColumnType("decimal(5, 1)")
                .HasColumnName("power_used_percent");
            entity.Property(e => e.RackCode)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("rack_code");
            entity.Property(e => e.RackId).HasColumnName("rack_id");
            entity.Property(e => e.RackName)
                .HasMaxLength(120)
                .HasColumnName("rack_name");
            entity.Property(e => e.TotalPowerKw)
                .HasColumnType("decimal(8, 2)")
                .HasColumnName("total_power_kw");
            entity.Property(e => e.TotalU).HasColumnName("total_u");
            entity.Property(e => e.TotalWeightKg)
                .HasColumnType("decimal(38, 2)")
                .HasColumnName("total_weight_kg");
            entity.Property(e => e.UUsedPercent)
                .HasColumnType("decimal(5, 1)")
                .HasColumnName("u_used_percent");
            entity.Property(e => e.UsedU).HasColumnName("used_u");
            entity.Property(e => e.WeightUsedPercent)
                .HasColumnType("decimal(5, 1)")
                .HasColumnName("weight_used_percent");
        });

        modelBuilder.Entity<VwSelectablePhysicalServer>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_selectable_physical_servers");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetName)
                .HasMaxLength(200)
                .HasColumnName("asset_name");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.DisplayLabel)
                .HasMaxLength(226)
                .HasColumnName("display_label");
            entity.Property(e => e.Hostname)
                .HasMaxLength(100)
                .HasColumnName("hostname");
            entity.Property(e => e.LocationName)
                .HasMaxLength(150)
                .HasColumnName("location_name");
            entity.Property(e => e.ManufacturerId).HasColumnName("manufacturer_id");
            entity.Property(e => e.ManufacturerName)
                .HasMaxLength(150)
                .HasColumnName("manufacturer_name");
            entity.Property(e => e.ModelId).HasColumnName("model_id");
            entity.Property(e => e.ModelName)
                .HasMaxLength(150)
                .HasColumnName("model_name");
            entity.Property(e => e.SerialNumber)
                .HasMaxLength(100)
                .HasColumnName("serial_number");
            entity.Property(e => e.StatusCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("status_code");
            entity.Property(e => e.TypeName)
                .HasMaxLength(100)
                .HasColumnName("type_name");
        });

        modelBuilder.Entity<VwServerApplication>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_server_applications");

            entity.Property(e => e.ApplicationId).HasColumnName("application_id");
            entity.Property(e => e.ApplicationName)
                .HasMaxLength(150)
                .HasColumnName("application_name");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.DepartmentName)
                .HasMaxLength(100)
                .HasColumnName("department_name");
            entity.Property(e => e.InchargeName)
                .HasMaxLength(150)
                .HasColumnName("incharge_name");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.LinkUrl)
                .HasMaxLength(500)
                .HasColumnName("link_url");
            entity.Property(e => e.Notes)
                .HasMaxLength(500)
                .HasColumnName("notes");
            entity.Property(e => e.PortNumber)
                .HasMaxLength(50)
                .HasColumnName("port_number");
            entity.Property(e => e.ServerName)
                .HasMaxLength(200)
                .HasColumnName("server_name");
            entity.Property(e => e.ServerTypeName)
                .HasMaxLength(80)
                .HasColumnName("server_type_name");
            entity.Property(e => e.SiteName)
                .HasMaxLength(80)
                .HasColumnName("site_name");
        });

        modelBuilder.Entity<VwServerHardwareSummary>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_server_hardware_summary");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.CpuSocketCount).HasColumnName("cpu_socket_count");
            entity.Property(e => e.CpuTotalCores).HasColumnName("cpu_total_cores");
            entity.Property(e => e.TotalRamGb)
                .HasColumnType("decimal(38, 2)")
                .HasColumnName("total_ram_gb");
            entity.Property(e => e.TotalStorageGb)
                .HasColumnType("decimal(38, 2)")
                .HasColumnName("total_storage_gb");
        });

        modelBuilder.Entity<VwServerRolesSummary>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_server_roles_summary");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.HasCriticalService).HasColumnName("has_critical_service");
            entity.Property(e => e.Hostname)
                .HasMaxLength(100)
                .HasColumnName("hostname");
            entity.Property(e => e.IsVirtual).HasColumnName("is_virtual");
            entity.Property(e => e.PrimaryRole)
                .HasMaxLength(80)
                .HasColumnName("primary_role");
            entity.Property(e => e.PrimaryRoleGroup)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("primary_role_group");
            entity.Property(e => e.RoleCount).HasColumnName("role_count");
            entity.Property(e => e.RoleList)
                .HasMaxLength(4000)
                .HasColumnName("role_list");
            entity.Property(e => e.ServerName)
                .HasMaxLength(200)
                .HasColumnName("server_name");
            entity.Property(e => e.ServerTypeName)
                .HasMaxLength(100)
                .HasColumnName("server_type_name");
        });

        modelBuilder.Entity<VwShareEffectiveUser>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_share_effective_users");

            entity.Property(e => e.ClassificationName)
                .HasMaxLength(60)
                .HasColumnName("classification_name");
            entity.Property(e => e.DisabledUsers).HasColumnName("disabled_users");
            entity.Property(e => e.FolderPath)
                .HasMaxLength(500)
                .HasColumnName("folder_path");
            entity.Property(e => e.OwnerDepartment)
                .HasMaxLength(100)
                .HasColumnName("owner_department");
            entity.Property(e => e.ReadOnlyUsers).HasColumnName("read_only_users");
            entity.Property(e => e.ReadWriteUsers).HasColumnName("read_write_users");
            entity.Property(e => e.SensitivityRank).HasColumnName("sensitivity_rank");
            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.ShareName)
                .HasMaxLength(128)
                .HasColumnName("share_name");
            entity.Property(e => e.TotalUsers).HasColumnName("total_users");
        });

        modelBuilder.Entity<VwSharePermissionTimeline>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_share_permission_timeline");

            entity.Property(e => e.AccessLevelName)
                .HasMaxLength(50)
                .HasColumnName("access_level_name");
            entity.Property(e => e.AdGroupName)
                .HasMaxLength(256)
                .HasColumnName("ad_group_name");
            entity.Property(e => e.ChangeAction)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasColumnName("change_action");
            entity.Property(e => e.ChangeActionTh)
                .HasMaxLength(18)
                .HasColumnName("change_action_th");
            entity.Property(e => e.ChangeSeq).HasColumnName("change_seq");
            entity.Property(e => e.ChangedAtUtc)
                .HasPrecision(3)
                .HasColumnName("changed_at_utc");
            entity.Property(e => e.ChangedByName)
                .HasMaxLength(150)
                .HasColumnName("changed_by_name");
            entity.Property(e => e.ChangedByUserId).HasColumnName("changed_by_user_id");
            entity.Property(e => e.ChangedByUsername)
                .HasMaxLength(50)
                .HasColumnName("changed_by_username");
            entity.Property(e => e.ClassificationName)
                .HasMaxLength(60)
                .HasColumnName("classification_name");
            entity.Property(e => e.FolderPath)
                .HasMaxLength(500)
                .HasColumnName("folder_path");
            entity.Property(e => e.PermissionId).HasColumnName("permission_id");
            entity.Property(e => e.PreviousAccessLevelName)
                .HasMaxLength(50)
                .HasColumnName("previous_access_level_name");
            entity.Property(e => e.SensitivityRank).HasColumnName("sensitivity_rank");
            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.ShareName)
                .HasMaxLength(128)
                .HasColumnName("share_name");
        });

        modelBuilder.Entity<VwSoftwareSeatUsage>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_software_seat_usage");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.CurrentContractNo)
                .HasMaxLength(80)
                .HasColumnName("current_contract_no");
            entity.Property(e => e.DaysUntilExpiry).HasColumnName("days_until_expiry");
            entity.Property(e => e.IsOverDeployed).HasColumnName("is_over_deployed");
            entity.Property(e => e.LicenseEndDate).HasColumnName("license_end_date");
            entity.Property(e => e.LicenseType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("license_type");
            entity.Property(e => e.OverDeployedCount).HasColumnName("over_deployed_count");
            entity.Property(e => e.Publisher)
                .HasMaxLength(150)
                .HasColumnName("publisher");
            entity.Property(e => e.SeatsAvailable).HasColumnName("seats_available");
            entity.Property(e => e.SeatsPurchased).HasColumnName("seats_purchased");
            entity.Property(e => e.SeatsUsed).HasColumnName("seats_used");
            entity.Property(e => e.SoftwareName)
                .HasMaxLength(200)
                .HasColumnName("software_name");
            entity.Property(e => e.VendorName)
                .HasMaxLength(200)
                .HasColumnName("vendor_name");
            entity.Property(e => e.Version)
                .HasMaxLength(50)
                .HasColumnName("version");
        });

        modelBuilder.Entity<VwSyncHealth>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_sync_health");

            entity.Property(e => e.ConsecutiveFailures).HasColumnName("consecutive_failures");
            entity.Property(e => e.CronExpression)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("cron_expression");
            entity.Property(e => e.DurationSeconds).HasColumnName("duration_seconds");
            entity.Property(e => e.FreshnessStatus)
                .HasMaxLength(15)
                .HasColumnName("freshness_status");
            entity.Property(e => e.HoursSinceSuccess).HasColumnName("hours_since_success");
            entity.Property(e => e.IsEnabled).HasColumnName("is_enabled");
            entity.Property(e => e.JobCode)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("job_code");
            entity.Property(e => e.JobId).HasColumnName("job_id");
            entity.Property(e => e.JobName)
                .HasMaxLength(150)
                .HasColumnName("job_name");
            entity.Property(e => e.JobType)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("job_type");
            entity.Property(e => e.LastAttemptAt)
                .HasPrecision(3)
                .HasColumnName("last_attempt_at");
            entity.Property(e => e.LastErrorMessage)
                .HasMaxLength(2000)
                .HasColumnName("last_error_message");
            entity.Property(e => e.LastRunStatus)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("last_run_status");
            entity.Property(e => e.LastSuccessAt)
                .HasPrecision(3)
                .HasColumnName("last_success_at");
            entity.Property(e => e.RecordsCreated).HasColumnName("records_created");
            entity.Property(e => e.RecordsUnchanged).HasColumnName("records_unchanged");
            entity.Property(e => e.RecordsUpdated).HasColumnName("records_updated");
            entity.Property(e => e.RecordsVanished).HasColumnName("records_vanished");
            entity.Property(e => e.StaleAfterHours).HasColumnName("stale_after_hours");
        });

        modelBuilder.Entity<VwUntrackedPermissionChange>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_untracked_permission_changes");

            entity.Property(e => e.AdGroupName)
                .HasMaxLength(256)
                .HasColumnName("ad_group_name");
            entity.Property(e => e.ChangeAction)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasColumnName("change_action");
            entity.Property(e => e.ChangeActionTh)
                .HasMaxLength(18)
                .HasColumnName("change_action_th");
            entity.Property(e => e.ChangedAtUtc)
                .HasPrecision(3)
                .HasColumnName("changed_at_utc");
            entity.Property(e => e.ChangedByName)
                .HasMaxLength(150)
                .HasColumnName("changed_by_name");
            entity.Property(e => e.ChangedByUserId).HasColumnName("changed_by_user_id");
            entity.Property(e => e.ClassificationName)
                .HasMaxLength(60)
                .HasColumnName("classification_name");
            entity.Property(e => e.FolderPath)
                .HasMaxLength(500)
                .HasColumnName("folder_path");
            entity.Property(e => e.IssueDetail)
                .HasMaxLength(110)
                .HasColumnName("issue_detail");
            entity.Property(e => e.PermissionId).HasColumnName("permission_id");
            entity.Property(e => e.SensitivityRank).HasColumnName("sensitivity_rank");
            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.ShareName)
                .HasMaxLength(128)
                .HasColumnName("share_name");
        });

        modelBuilder.Entity<VwUserAccessPath>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_user_access_paths");

            entity.Property(e => e.AccessLevelCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("access_level_code");
            entity.Property(e => e.AccessLevelName)
                .HasMaxLength(50)
                .HasColumnName("access_level_name");
            entity.Property(e => e.AccessPath)
                .HasMaxLength(4000)
                .HasColumnName("access_path");
            entity.Property(e => e.AccessRoute)
                .HasMaxLength(22)
                .HasColumnName("access_route");
            entity.Property(e => e.AdUserId).HasColumnName("ad_user_id");
            entity.Property(e => e.ClassificationCode)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("classification_code");
            entity.Property(e => e.ClassificationName)
                .HasMaxLength(60)
                .HasColumnName("classification_name");
            entity.Property(e => e.FolderPath)
                .HasMaxLength(500)
                .HasColumnName("folder_path");
            entity.Property(e => e.GrantingGroupName)
                .HasMaxLength(256)
                .HasColumnName("granting_group_name");
            entity.Property(e => e.IsEnabled).HasColumnName("is_enabled");
            entity.Property(e => e.MemberOfGroupName)
                .HasMaxLength(256)
                .HasColumnName("member_of_group_name");
            entity.Property(e => e.NestingDepth).HasColumnName("nesting_depth");
            entity.Property(e => e.PrivilegeRank).HasColumnName("privilege_rank");
            entity.Property(e => e.SamAccountName)
                .HasMaxLength(256)
                .HasColumnName("sam_account_name");
            entity.Property(e => e.SensitivityRank).HasColumnName("sensitivity_rank");
            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.ShareName)
                .HasMaxLength(128)
                .HasColumnName("share_name");
            entity.Property(e => e.UserDisplayName)
                .HasMaxLength(256)
                .HasColumnName("user_display_name");
        });

        modelBuilder.Entity<VwUserEffectiveAccess>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_user_effective_access");

            entity.Property(e => e.AdUserId).HasColumnName("ad_user_id");
            entity.Property(e => e.ClassificationCode)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("classification_code");
            entity.Property(e => e.ClassificationName)
                .HasMaxLength(60)
                .HasColumnName("classification_name");
            entity.Property(e => e.EffectivePrivilegeRank).HasColumnName("effective_privilege_rank");
            entity.Property(e => e.FolderPath)
                .HasMaxLength(500)
                .HasColumnName("folder_path");
            entity.Property(e => e.IsEnabled).HasColumnName("is_enabled");
            entity.Property(e => e.PathCount).HasColumnName("path_count");
            entity.Property(e => e.SamAccountName)
                .HasMaxLength(256)
                .HasColumnName("sam_account_name");
            entity.Property(e => e.SensitivityRank).HasColumnName("sensitivity_rank");
            entity.Property(e => e.ShareId).HasColumnName("share_id");
            entity.Property(e => e.ShareName)
                .HasMaxLength(128)
                .HasColumnName("share_name");
            entity.Property(e => e.ShortestDepth).HasColumnName("shortest_depth");
            entity.Property(e => e.UserDisplayName)
                .HasMaxLength(256)
                .HasColumnName("user_display_name");
        });

        modelBuilder.Entity<VwUserInternetPolicy>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_user_internet_policy");

            entity.Property(e => e.AccessPath)
                .HasMaxLength(4000)
                .HasColumnName("access_path");
            entity.Property(e => e.AdUserId).HasColumnName("ad_user_id");
            entity.Property(e => e.EnforcedByDevice)
                .HasMaxLength(200)
                .HasColumnName("enforced_by_device");
            entity.Property(e => e.GrantingGroupName)
                .HasMaxLength(256)
                .HasColumnName("granting_group_name");
            entity.Property(e => e.IsEnabled).HasColumnName("is_enabled");
            entity.Property(e => e.NestingDepth).HasColumnName("nesting_depth");
            entity.Property(e => e.PolicyCode)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("policy_code");
            entity.Property(e => e.PolicyId).HasColumnName("policy_id");
            entity.Property(e => e.PolicyName)
                .HasMaxLength(150)
                .HasColumnName("policy_name");
            entity.Property(e => e.SamAccountName)
                .HasMaxLength(256)
                .HasColumnName("sam_account_name");
            entity.Property(e => e.UserDisplayName)
                .HasMaxLength(256)
                .HasColumnName("user_display_name");
        });

        modelBuilder.Entity<VwVlanIpAllocation>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_vlan_ip_allocation");

            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.AssetName)
                .HasMaxLength(200)
                .HasColumnName("asset_name");
            entity.Property(e => e.AssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("asset_tag");
            entity.Property(e => e.CategoryCode)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("category_code");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("ip_address");
            entity.Property(e => e.IpNumeric).HasColumnName("ip_numeric");
            entity.Property(e => e.IpPurpose)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("ip_purpose");
            entity.Property(e => e.IsGateway).HasColumnName("is_gateway");
            entity.Property(e => e.NetworkLevel)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("network_level");
            entity.Property(e => e.RangeDescription)
                .HasMaxLength(200)
                .HasColumnName("range_description");
            entity.Property(e => e.RangeType)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasColumnName("range_type");
            entity.Property(e => e.VlanId).HasColumnName("vlan_id");
            entity.Property(e => e.VlanName)
                .HasMaxLength(100)
                .HasColumnName("vlan_name");
            entity.Property(e => e.VlanNumber).HasColumnName("vlan_number");
            entity.Property(e => e.ZoneCode)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("zone_code");
        });

        modelBuilder.Entity<VwVlanSummary>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_vlan_summary");

            entity.Property(e => e.BroadcastAddress)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("broadcast_address");
            entity.Property(e => e.Cidr)
                .HasMaxLength(18)
                .IsUnicode(false)
                .HasColumnName("cidr");
            entity.Property(e => e.Description)
                .HasMaxLength(400)
                .HasColumnName("description");
            entity.Property(e => e.DhcpLeaseHours).HasColumnName("dhcp_lease_hours");
            entity.Property(e => e.DhcpPoolSize).HasColumnName("dhcp_pool_size");
            entity.Property(e => e.DhcpRelayIp)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("dhcp_relay_ip");
            entity.Property(e => e.DhcpServerAssetName)
                .HasMaxLength(200)
                .HasColumnName("dhcp_server_asset_name");
            entity.Property(e => e.DhcpServerAssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("dhcp_server_asset_tag");
            entity.Property(e => e.DhcpServerDisplayName)
                .HasMaxLength(200)
                .HasColumnName("dhcp_server_display_name");
            entity.Property(e => e.DhcpServerNameRaw)
                .HasMaxLength(150)
                .HasColumnName("dhcp_server_name_raw");
            entity.Property(e => e.DhcpSourceType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("dhcp_source_type");
            entity.Property(e => e.DnsPrimary)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("dns_primary");
            entity.Property(e => e.DnsSecondary)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("dns_secondary");
            entity.Property(e => e.DomainName)
                .HasMaxLength(100)
                .HasColumnName("domain_name");
            entity.Property(e => e.ExcludedPoolSize).HasColumnName("excluded_pool_size");
            entity.Property(e => e.FirstUsableIp)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("first_usable_ip");
            entity.Property(e => e.GatewayAssetName)
                .HasMaxLength(200)
                .HasColumnName("gateway_asset_name");
            entity.Property(e => e.GatewayAssetTag)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("gateway_asset_tag");
            entity.Property(e => e.GatewayDeviceRole)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("gateway_device_role");
            entity.Property(e => e.GatewayInterface)
                .HasMaxLength(50)
                .HasColumnName("gateway_interface");
            entity.Property(e => e.GatewayIp)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("gateway_ip");
            entity.Property(e => e.IpAssignmentMode)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasColumnName("ip_assignment_mode");
            entity.Property(e => e.IpsOutsideAnyPool).HasColumnName("ips_outside_any_pool");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.IsInternetFacing).HasColumnName("is_internet_facing");
            entity.Property(e => e.IsUntagged).HasColumnName("is_untagged");
            entity.Property(e => e.KnownIpsInSubnet).HasColumnName("known_ips_in_subnet");
            entity.Property(e => e.LastUsableIp)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("last_usable_ip");
            entity.Property(e => e.NetworkAddress)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("network_address");
            entity.Property(e => e.NetworkLevel)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("network_level");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.PoolCoveragePercent)
                .HasColumnType("decimal(5, 1)")
                .HasColumnName("pool_coverage_percent");
            entity.Property(e => e.PrefixLength).HasColumnName("prefix_length");
            entity.Property(e => e.ReservedPoolSize).HasColumnName("reserved_pool_size");
            entity.Property(e => e.SiteId).HasColumnName("site_id");
            entity.Property(e => e.SiteName)
                .HasMaxLength(80)
                .HasColumnName("site_name");
            entity.Property(e => e.StaticIpsAvailable).HasColumnName("static_ips_available");
            entity.Property(e => e.StaticIpsUsed).HasColumnName("static_ips_used");
            entity.Property(e => e.StaticPoolSize).HasColumnName("static_pool_size");
            entity.Property(e => e.StaticUtilizationPercent)
                .HasColumnType("decimal(5, 1)")
                .HasColumnName("static_utilization_percent");
            entity.Property(e => e.SubnetMask)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("subnet_mask");
            entity.Property(e => e.TotalAddresses).HasColumnName("total_addresses");
            entity.Property(e => e.TrustLevel).HasColumnName("trust_level");
            entity.Property(e => e.UnplannedAddresses).HasColumnName("unplanned_addresses");
            entity.Property(e => e.UsableAddresses).HasColumnName("usable_addresses");
            entity.Property(e => e.VlanId).HasColumnName("vlan_id");
            entity.Property(e => e.VlanName)
                .HasMaxLength(100)
                .HasColumnName("vlan_name");
            entity.Property(e => e.VlanNumber).HasColumnName("vlan_number");
            entity.Property(e => e.ZoneCode)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("zone_code");
            entity.Property(e => e.ZoneColor)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("zone_color");
            entity.Property(e => e.ZoneName)
                .HasMaxLength(80)
                .HasColumnName("zone_name");
        });

        modelBuilder.Entity<VwVlanValidationIssue>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_vlan_validation_issues");

            entity.Property(e => e.IssueCode)
                .HasMaxLength(25)
                .IsUnicode(false)
                .HasColumnName("issue_code");
            entity.Property(e => e.IssueDetail)
                .HasMaxLength(176)
                .HasColumnName("issue_detail");
            entity.Property(e => e.Severity)
                .HasMaxLength(7)
                .IsUnicode(false)
                .HasColumnName("severity");
            entity.Property(e => e.VlanId).HasColumnName("vlan_id");
            entity.Property(e => e.VlanName)
                .HasMaxLength(100)
                .HasColumnName("vlan_name");
            entity.Property(e => e.VlanNumber).HasColumnName("vlan_number");
        });

        modelBuilder.Entity<WebCategory>(entity =>
        {
            entity.HasKey(e => e.CategoryId);

            entity
                .ToTable("web_categories")
                .ToTable(tb => tb.IsTemporal(ttb =>
                    {
                        ttb.UseHistoryTable("web_categories_history", "dbo");
                        ttb
                            .HasPeriodStart("valid_from")
                            .HasColumnName("valid_from");
                        ttb
                            .HasPeriodEnd("valid_to")
                            .HasColumnName("valid_to");
                    }));

            entity.HasIndex(e => e.Code, "UX_web_categories_code").IsUnique();

            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.Code)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.NameEn)
                .HasMaxLength(80)
                .HasColumnName("name_en");
            entity.Property(e => e.NameTh)
                .HasMaxLength(80)
                .HasColumnName("name_th");
            entity.Property(e => e.RiskLevel)
                .HasDefaultValue((byte)1)
                .HasColumnName("risk_level");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
