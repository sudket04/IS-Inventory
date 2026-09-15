/* =============================================================================
   IS-Inventory v2 — 09: Views

   Two jobs:

   1. Put the numbers back that normalising took away. Addresses now live in
      ip_allocations and AD group counts are rows rather than a stored
      integer, so the screens that used to read one column get a view that
      joins it back — computed from the rows, so it cannot go stale the way
      v1's ad_users.group_count could.

   2. Answer the questions the UI asks, once, here, instead of in the API in
      slightly different ways each time: what is under this site, how full is
      this subnet, are we over-licensed, what expires soon.
   ============================================================================= */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ---------------------------------------------------------------------------
   v_location_tree — every location with the Site it ultimately belongs to
   and its full readable path.

   This is what makes per-site permissions cheap: user_site_scope stores Site
   ids, and a row's visibility is "is my site_id in that list".
   --------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.v_location_tree
AS
WITH tree AS (
    SELECT location_id, level, name, parent_id,
           site_id   = location_id,
           site_name = name,
           full_path = CAST(name AS NVARCHAR(1000)),
           depth     = 1
      FROM dbo.locations
     WHERE parent_id IS NULL AND is_deleted = 0

    UNION ALL

    SELECT c.location_id, c.level, c.name, c.parent_id,
           p.site_id,
           p.site_name,
           CAST(p.full_path + N' › ' + c.name AS NVARCHAR(1000)),
           p.depth + 1
      FROM dbo.locations c
      JOIN tree p ON p.location_id = c.parent_id
     WHERE c.is_deleted = 0
)
SELECT location_id, level, name, parent_id, site_id, site_name, full_path, depth
  FROM tree;
GO

/* ---------------------------------------------------------------------------
   v_user_permissions — the flattened RBAC grant list.

   The API resolves a request to one row here: "may USR-007 do vlans.edit?"
   is EXISTS against this view rather than a three-table join written out
   again at every call site.
   --------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.v_user_permissions
AS
SELECT u.user_id,
       u.username,
       r.role_id,
       r.role_name,
       p.permission_id,
       p.module_key,
       p.action
  FROM dbo.app_users u
  JOIN dbo.roles r            ON r.role_id = u.role_id
  JOIN dbo.role_permissions rp ON rp.role_id = r.role_id
  JOIN dbo.permissions p       ON p.permission_id = rp.permission_id
 WHERE u.is_deleted = 0
   AND u.status = 'Active'
   AND r.is_active = 1;
GO

/* v_user_visible_sites — the other half of authorization. A user with no
   user_site_scope rows sees every site; one with rows sees only those. */
CREATE OR ALTER VIEW dbo.v_user_visible_sites
AS
SELECT u.user_id, s.location_id AS site_id, s.name AS site_name
  FROM dbo.app_users u
  CROSS JOIN dbo.locations s
 WHERE u.is_deleted = 0
   AND s.level = 'Site' AND s.is_deleted = 0
   AND NOT EXISTS (SELECT 1 FROM dbo.user_site_scope x WHERE x.user_id = u.user_id)

UNION

SELECT sc.user_id, sc.location_id, s.name
  FROM dbo.user_site_scope sc
  JOIN dbo.locations s ON s.location_id = sc.location_id AND s.is_deleted = 0;
GO

/* ---------------------------------------------------------------------------
   v_vlan_utilization — how full is each subnet?

   The question v1 could not answer at all, because addresses were text
   scattered across four tables.
   --------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.v_vlan_utilization
AS
SELECT v.vlan_id_pk,
       v.vlan_id,
       v.vlan_name,
       v.purpose,
       cidr            = v.network_address + '/' + CAST(v.prefix_len AS VARCHAR(2)),
       v.network_address,
       v.subnet_mask,
       gateway         = dbo.fn_IntToIp(v.gateway_num),
       v.usable_count,
       assigned_count  = ISNULL(a.cnt, 0),
       free_count      = v.usable_count - ISNULL(a.cnt, 0),
       used_percent    = CAST(100.0 * ISNULL(a.cnt, 0) / NULLIF(v.usable_count, 0) AS DECIMAL(5,1)),
       dhcp_enabled    = v.dhcp_enabled,
       dhcp_start      = dbo.fn_IntToIp(v.dhcp_start_num),
       dhcp_end        = dbo.fn_IntToIp(v.dhcp_end_num),
       dhcp_pool_size  = CASE WHEN v.dhcp_start_num IS NULL THEN 0
                              ELSE v.dhcp_end_num - v.dhcp_start_num + 1 END,
       static_start    = dbo.fn_IntToIp(v.static_start_num),
       static_end      = dbo.fn_IntToIp(v.static_end_num),
       static_size     = CASE WHEN v.static_start_num IS NULL OR v.static_end_num IS NULL THEN 0
                              ELSE v.static_end_num - v.static_start_num + 1 END
  FROM dbo.vlans v
  OUTER APPLY (
      SELECT cnt = COUNT(*)
        FROM dbo.ip_allocations ia
       WHERE ia.vlan_id_pk = v.vlan_id_pk
         AND ia.ip_num BETWEEN v.first_usable_num AND v.last_usable_num
  ) a
 WHERE v.is_deleted = 0;
GO

/* ---------------------------------------------------------------------------
   v_asset_360 — one row per server with everything the side panel shows.

   This is the Asset 360 panel's query. Without it the UI makes five round
   trips (server, location, IPs, licences, share permissions) and stitches
   them together in JavaScript, which is exactly the silo problem the
   redesign set out to remove.
   --------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.v_asset_360
AS
SELECT s.server_id,
       s.server_name,
       s.system_name,
       s.system_group,
       s.hosting_type,
       s.os_type,
       s.os_version,
       s.status,
       s.environment,
       s.criticality,
       s.owner,

       cluster_name   = c.cluster_name,
       node_host_name = n.host_name,

       /* Specs: a virtual server carries its own allocation, a physical one
          inherits the chassis's. Everything below that comes from `h` is the
          physical box the server sits on — its own chassis when Physical, the
          cluster node's chassis when Virtual — which is what "where is this
          server?" means to someone standing in the data centre. */
       cpu_cores      = COALESCE(s.cpu_cores, h.cpu_cores),
       ram_gb         = COALESCE(s.ram_gb,    h.memory_gb),
       disk_total_gb  = d.total_gb,

       serial_number  = h.serial_number,
       manufacturer   = h.manufacturer,
       model          = h.model,
       location_path  = lt.full_path,
       site_name      = lt.site_name,
       rack_u_start   = h.rack_u_start,
       warranty_expiry = h.warranty_expiry,
       warranty_days_left = DATEDIFF(DAY, CAST(SYSUTCDATETIME() AS DATE), h.warranty_expiry),
       ma_expiry_date = h.ma_expiry_date,

       primary_ip     = ip.primary_ip,
       management_ip  = ip.management_ip,
       ip_count       = ISNULL(ip.ip_count, 0),
       vlan_name      = ip.vlan_name,
       vlan_id        = ip.vlan_id,

       license_count  = ISNULL(lic.cnt, 0),
       share_count    = ISNULL(shr.cnt, 0)
  FROM dbo.servers s
  LEFT JOIN dbo.clusters       c  ON c.cluster_id  = s.cluster_id  AND c.is_deleted = 0
  LEFT JOIN dbo.cluster_nodes  n  ON n.node_id     = s.node_id
  /* A Physical server owns its chassis directly; a Virtual one reaches it
     through the cluster node it runs on. Joining on s.hardware_id alone left
     every VM with no location and no warranty. */
  LEFT JOIN dbo.hardware       h  ON h.hardware_id = COALESCE(s.hardware_id, n.hardware_id)
                                 AND h.is_deleted = 0
  LEFT JOIN dbo.v_location_tree lt ON lt.location_id = h.location_id

  OUTER APPLY (
      SELECT total_gb = SUM(dk.capacity_gb) FROM dbo.server_disks dk WHERE dk.server_id = s.server_id
  ) d

  OUTER APPLY (
      SELECT ip_count      = COUNT(*),
             primary_ip    = MAX(CASE WHEN ia.purpose = 'service'    THEN ia.ip_address END),
             management_ip = MAX(CASE WHEN ia.purpose = 'management' THEN ia.ip_address END),
             vlan_name     = MAX(v.vlan_name),
             vlan_id       = MAX(v.vlan_id)
        FROM dbo.ip_allocations ia
        LEFT JOIN dbo.vlans v ON v.vlan_id_pk = ia.vlan_id_pk
       WHERE ia.server_id = s.server_id
  ) ip

  OUTER APPLY (
      SELECT cnt = COUNT(*) FROM dbo.software_allocations sa
       WHERE sa.server_id = s.server_id AND sa.is_deleted = 0
  ) lic

  OUTER APPLY (
      SELECT cnt = COUNT(*) FROM dbo.server_permissions sp
       WHERE sp.server_id = s.server_id AND sp.is_deleted = 0
  ) shr

 WHERE s.is_deleted = 0;
GO

/* ---------------------------------------------------------------------------
   v_license_compliance — bought versus handed out
   --------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.v_license_compliance
AS
SELECT l.license_id,
       sc.vendor,
       software_name  = sc.name,
       sc.edition,
       sc.version,
       l.license_type,
       l.license_metric,
       l.purchased_qty,
       allocated_qty  = ISNULL(a.qty, 0),
       available_qty  = l.purchased_qty - ISNULL(a.qty, 0),
       used_percent   = CAST(100.0 * ISNULL(a.qty, 0) / NULLIF(l.purchased_qty, 0) AS DECIMAL(5,1)),
       compliance     = CASE WHEN ISNULL(a.qty, 0) >  l.purchased_qty THEN 'Over-allocated'
                             WHEN ISNULL(a.qty, 0) =  l.purchased_qty THEN 'Fully used'
                             WHEN ISNULL(a.qty, 0) = 0                THEN 'Unused'
                             ELSE 'OK' END,
       l.expiry_date,
       days_to_expiry = DATEDIFF(DAY, CAST(SYSUTCDATETIME() AS DATE), l.expiry_date),
       expiry_state   = CASE WHEN l.expiry_date IS NULL THEN 'Perpetual'
                             WHEN l.expiry_date <  CAST(SYSUTCDATETIME() AS DATE) THEN 'Expired'
                             WHEN l.expiry_date <= DATEADD(DAY, 90, CAST(SYSUTCDATETIME() AS DATE)) THEN 'Expiring soon'
                             ELSE 'Valid' END,
       l.cost_thb,
       l.auto_renewal,
       l.owner
  FROM dbo.software_licenses l
  JOIN dbo.software_catalogue sc ON sc.software_id = l.software_id
  OUTER APPLY (
      SELECT qty = SUM(sa.quantity)
        FROM dbo.software_allocations sa
       WHERE sa.license_id = l.license_id AND sa.is_deleted = 0
  ) a
 WHERE l.is_deleted = 0;
GO

/* ---------------------------------------------------------------------------
   v_warranty_watch — every asset's warranty in one list, hardware and
   network gear together, which is how the manager actually wants it.
   --------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.v_warranty_watch
AS
SELECT asset_kind  = 'Hardware',
       asset_id    = h.hardware_id,
       asset_name  = COALESCE(h.storage_name, h.manufacturer + ' ' + h.model, h.serial_number),
       h.serial_number,
       site_name   = lt.site_name,
       location_path = lt.full_path,
       h.status,
       h.commission_date,
       h.warranty_expiry,
       days_left   = DATEDIFF(DAY, CAST(SYSUTCDATETIME() AS DATE), h.warranty_expiry),
       state       = CASE WHEN h.warranty_expiry IS NULL THEN 'Unknown'
                          WHEN h.warranty_expiry <  CAST(SYSUTCDATETIME() AS DATE) THEN 'Expired'
                          WHEN h.warranty_expiry <= DATEADD(DAY, 90, CAST(SYSUTCDATETIME() AS DATE)) THEN 'Expiring soon'
                          ELSE 'Valid' END
  FROM dbo.hardware h
  LEFT JOIN dbo.v_location_tree lt ON lt.location_id = h.location_id
 WHERE h.is_deleted = 0

UNION ALL

SELECT 'Network',
       n.device_id,
       n.device_name,
       n.serial_number,
       lt.site_name,
       lt.full_path,
       n.status,
       n.commission_date,
       n.warranty_expiry,
       DATEDIFF(DAY, CAST(SYSUTCDATETIME() AS DATE), n.warranty_expiry),
       CASE WHEN n.warranty_expiry IS NULL THEN 'Unknown'
            WHEN n.warranty_expiry <  CAST(SYSUTCDATETIME() AS DATE) THEN 'Expired'
            WHEN n.warranty_expiry <= DATEADD(DAY, 90, CAST(SYSUTCDATETIME() AS DATE)) THEN 'Expiring soon'
            ELSE 'Valid' END
  FROM dbo.network_devices n
  LEFT JOIN dbo.v_location_tree lt ON lt.location_id = n.location_id
 WHERE n.is_deleted = 0;
GO

/* ---------------------------------------------------------------------------
   v_ad_user_groups — group_count derived from the memberships instead of
   stored beside them, so the two can no longer disagree.
   --------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.v_ad_user_groups
AS
SELECT u.ad_user_id,
       u.user_logon,
       u.display_name,
       u.status,
       u.department,
       u.job_title,
       u.email,
       group_count = ISNULL(g.cnt, 0),
       group_list  = g.names
  FROM dbo.ad_users u
  OUTER APPLY (
      SELECT cnt   = COUNT(*),
             names = STRING_AGG(m.group_name, N', ') WITHIN GROUP (ORDER BY m.group_name)
        FROM dbo.ad_memberships m
       WHERE m.ad_user_id = u.ad_user_id
  ) g
 WHERE u.is_deleted = 0;
GO

/* ---------------------------------------------------------------------------
   v_ip_estate — the flat address book, with whatever owns each address
   resolved to a readable name.
   --------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.v_ip_estate
AS
SELECT a.alloc_id,
       a.ip_address,
       a.ip_num,
       a.assign_type,
       a.purpose,
       a.hostname,
       vlan_tag   = v.vlan_id,
       vlan_name  = v.vlan_name,
       subnet     = v.network_address + '/' + CAST(v.prefix_len AS VARCHAR(2)),
       owner_kind = CASE WHEN a.server_id   IS NOT NULL THEN 'Server'
                         WHEN a.device_id   IS NOT NULL THEN 'Network device'
                         WHEN a.node_id     IS NOT NULL THEN 'Cluster node'
                         WHEN a.hardware_id IS NOT NULL THEN 'Hardware'
                         ELSE 'Unassigned' END,
       owner_id   = COALESCE(a.server_id, a.device_id, a.node_id, a.hardware_id),
       owner_name = COALESCE(s.server_name, nd.device_name, cn.host_name, h.serial_number),
       a.remarks
  FROM dbo.ip_allocations a
  LEFT JOIN dbo.vlans           v  ON v.vlan_id_pk  = a.vlan_id_pk
  LEFT JOIN dbo.servers         s  ON s.server_id   = a.server_id
  LEFT JOIN dbo.network_devices nd ON nd.device_id  = a.device_id
  LEFT JOIN dbo.cluster_nodes   cn ON cn.node_id    = a.node_id
  LEFT JOIN dbo.hardware        h  ON h.hardware_id = a.hardware_id;
GO
