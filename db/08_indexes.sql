/* =============================================================================
   IS-Inventory v2 — 08: Indexes

   v1 had none of these: the only indexes in the whole database were the ones
   SQL Server creates for PRIMARY KEY and UNIQUE. Foreign keys are NOT indexed
   automatically, so every "which servers are on this cluster?" and every
   cascade check was a table scan. That is survivable at 50 rows and not at
   the volume 30-100 people will produce.

   Uniqueness lives with its table in 02-06 (those filtered unique indexes are
   constraints, not tuning). Everything here is purely for speed and can be
   dropped and rebuilt without changing what the database means.

   Nearly all of them are filtered on is_deleted = 0: the application reads
   live rows almost exclusively, so a filtered index is both smaller and a
   stronger hint to the optimiser.
   ============================================================================= */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* --- Foreign keys ---------------------------------------------------------- */
CREATE NONCLUSTERED INDEX IX_appusers_role        ON dbo.app_users(role_id)       WHERE is_deleted = 0;
CREATE NONCLUSTERED INDEX IX_locations_parent     ON dbo.locations(parent_id)     WHERE is_deleted = 0;
CREATE NONCLUSTERED INDEX IX_roleperm_permission  ON dbo.role_permissions(permission_id);
CREATE NONCLUSTERED INDEX IX_usersite_location    ON dbo.user_site_scope(location_id);

CREATE NONCLUSTERED INDEX IX_hardware_location    ON dbo.hardware(location_id)    WHERE is_deleted = 0;
CREATE NONCLUSTERED INDEX IX_hwrenew_hardware     ON dbo.hardware_ma_renewals(hardware_id);
CREATE NONCLUSTERED INDEX IX_hwusage_hardware     ON dbo.hardware_usage(hardware_id);
CREATE NONCLUSTERED INDEX IX_nodes_cluster        ON dbo.cluster_nodes(cluster_id);

CREATE NONCLUSTERED INDEX IX_servers_cluster      ON dbo.servers(cluster_id)      WHERE is_deleted = 0;
CREATE NONCLUSTERED INDEX IX_servers_node         ON dbo.servers(node_id)         WHERE is_deleted = 0;
CREATE NONCLUSTERED INDEX IX_servers_hardware     ON dbo.servers(hardware_id)     WHERE is_deleted = 0;
CREATE NONCLUSTERED INDEX IX_disks_server         ON dbo.server_disks(server_id);

CREATE NONCLUSTERED INDEX IX_netdev_location      ON dbo.network_devices(location_id) WHERE is_deleted = 0;

CREATE NONCLUSTERED INDEX IX_swlic_software       ON dbo.software_licenses(software_id)   WHERE is_deleted = 0;
CREATE NONCLUSTERED INDEX IX_swalloc_license      ON dbo.software_allocations(license_id) WHERE is_deleted = 0;
CREATE NONCLUSTERED INDEX IX_swalloc_server       ON dbo.software_allocations(server_id)  WHERE server_id IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_swalloc_aduser       ON dbo.software_allocations(ad_user_id) WHERE ad_user_id IS NOT NULL;

CREATE NONCLUSTERED INDEX IX_serverperm_server    ON dbo.server_permissions(server_id) WHERE is_deleted = 0;
CREATE NONCLUSTERED INDEX IX_admember_user        ON dbo.ad_memberships(ad_user_id);
GO

/* --- IP lookups ------------------------------------------------------------
   ip_num already has a unique index from UQ_ipalloc_address, which covers
   both the point lookup and the "everything in this subnet" range scan. What
   is missing is the reverse direction — "which addresses belong to this
   VLAN / this server?" — and a covering index so the estate-wide IP list
   never touches the base table.                                             */
CREATE NONCLUSTERED INDEX IX_ipalloc_vlan   ON dbo.ip_allocations(vlan_id_pk, ip_num)
    INCLUDE (assign_type, purpose, hostname);
CREATE NONCLUSTERED INDEX IX_ipalloc_server ON dbo.ip_allocations(server_id) WHERE server_id IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_ipalloc_device ON dbo.ip_allocations(device_id) WHERE device_id IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_ipalloc_node   ON dbo.ip_allocations(node_id)   WHERE node_id   IS NOT NULL;
GO

/* --- The list screens ------------------------------------------------------
   Each of these matches how a table page is opened by default: filtered by
   status, ordered by name, showing a handful of columns.                     */
CREATE NONCLUSTERED INDEX IX_hardware_status_name ON dbo.hardware(status, serial_number)
    INCLUDE (asset_type, manufacturer, model, location_id, warranty_expiry) WHERE is_deleted = 0;

CREATE NONCLUSTERED INDEX IX_servers_status_name  ON dbo.servers(status, server_name)
    INCLUDE (hosting_type, system_name, os_type, environment, cluster_id) WHERE is_deleted = 0;

CREATE NONCLUSTERED INDEX IX_netdev_status_name   ON dbo.network_devices(status, device_name)
    INCLUDE (category, subcategory, brand, location_id, warranty_expiry) WHERE is_deleted = 0;
GO

/* --- The dashboard tiles ---------------------------------------------------
   "Warranty expiring in the next 90 days" and "licences expiring soon" are
   the two numbers on the manager's dashboard, and both are range scans on a
   date. Indexed here so the tile does not scan the table on every page load. */
/* SQL Server refuses a filtered index whose WHERE mentions a computed
   column, so these two filter on the inputs warranty_expiry is derived from
   instead — which is exactly when it is non-NULL. */
CREATE NONCLUSTERED INDEX IX_hardware_warranty ON dbo.hardware(warranty_expiry)
    INCLUDE (serial_number, manufacturer, model, status)
    WHERE is_deleted = 0 AND commission_date IS NOT NULL AND warranty_years IS NOT NULL;

CREATE NONCLUSTERED INDEX IX_hardware_ma_expiry ON dbo.hardware(ma_expiry_date)
    INCLUDE (serial_number, ma_provider, ma_cost_thb)
    WHERE is_deleted = 0 AND ma_expiry_date IS NOT NULL;

CREATE NONCLUSTERED INDEX IX_netdev_warranty ON dbo.network_devices(warranty_expiry)
    INCLUDE (device_name, brand, model, status)
    WHERE is_deleted = 0 AND commission_date IS NOT NULL AND warranty_years IS NOT NULL;

CREATE NONCLUSTERED INDEX IX_swlic_expiry ON dbo.software_licenses(expiry_date)
    INCLUDE (software_id, purchased_qty, cost_thb, auto_renewal)
    WHERE is_deleted = 0 AND expiry_date IS NOT NULL;
GO

/* --- Audit feed ------------------------------------------------------------
   Read newest-first, and filtered by record when opening one item's history. */
CREATE NONCLUSTERED INDEX IX_auditlog_recent ON dbo.audit_log(changed_at DESC)
    INCLUDE (table_key, record_id, display, action, user_id);
CREATE NONCLUSTERED INDEX IX_auditlog_record ON dbo.audit_log(table_key, record_id, changed_at DESC);
GO

/* --- Recycle bin -----------------------------------------------------------
   The mirror image of every other index here: the only place that wants the
   deleted rows.                                                              */
CREATE NONCLUSTERED INDEX IX_hardware_deleted ON dbo.hardware(deleted_at DESC) WHERE is_deleted = 1;
CREATE NONCLUSTERED INDEX IX_servers_deleted  ON dbo.servers(deleted_at DESC)  WHERE is_deleted = 1;
CREATE NONCLUSTERED INDEX IX_netdev_deleted   ON dbo.network_devices(deleted_at DESC) WHERE is_deleted = 1;
CREATE NONCLUSTERED INDEX IX_vlans_deleted    ON dbo.vlans(deleted_at DESC)    WHERE is_deleted = 1;
GO
