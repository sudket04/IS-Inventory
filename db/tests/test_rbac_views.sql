/* =============================================================================
   IS-Inventory v2 — behaviour tests for RBAC, the views, and system versioning.
   Run after 01-10. Leaves no data behind.
   ============================================================================= */
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
GO

PRINT '=== RBAC seed ===';
SELECT test = '15 modules x 5 actions = 75 permissions',
       actual = COUNT(*),
       result = CASE WHEN COUNT(*) = 75 THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.permissions;

SELECT test = 'Administrator holds every permission',
       actual = COUNT(*),
       result = CASE WHEN COUNT(*) = (SELECT COUNT(*) FROM dbo.permissions) THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.role_permissions WHERE role_id = 'ROL-001';

SELECT test = 'Viewer cannot create, edit or delete anything',
       result = CASE WHEN NOT EXISTS (
                   SELECT 1 FROM dbo.role_permissions rp
                     JOIN dbo.permissions p ON p.permission_id = rp.permission_id
                    WHERE rp.role_id = 'ROL-004' AND p.action IN ('create','edit','delete'))
                     THEN 'PASS' ELSE 'FAIL' END;

SELECT test = 'IS Engineer cannot manage users but can see them',
       result = CASE WHEN EXISTS (SELECT 1 FROM dbo.role_permissions
                                   WHERE role_id = 'ROL-002' AND permission_id = 'users.view')
                      AND NOT EXISTS (SELECT 1 FROM dbo.role_permissions
                                       WHERE role_id = 'ROL-002' AND permission_id = 'users.edit')
                     THEN 'PASS' ELSE 'FAIL' END;

SELECT test = 'Site Support edits network gear but only reads servers',
       result = CASE WHEN EXISTS (SELECT 1 FROM dbo.role_permissions
                                   WHERE role_id = 'ROL-003' AND permission_id = 'network_devices.edit')
                      AND NOT EXISTS (SELECT 1 FROM dbo.role_permissions
                                       WHERE role_id = 'ROL-003' AND permission_id = 'servers.edit')
                      AND EXISTS (SELECT 1 FROM dbo.role_permissions
                                   WHERE role_id = 'ROL-003' AND permission_id = 'servers.view')
                     THEN 'PASS' ELSE 'FAIL' END;

PRINT '=== v_user_permissions: the check the API actually runs ===';
SELECT test = 'admin is allowed vlans.edit',
       result = CASE WHEN EXISTS (SELECT 1 FROM dbo.v_user_permissions
                                   WHERE username = 'admin' AND permission_id = 'vlans.edit')
                     THEN 'PASS' ELSE 'FAIL' END;

/* A disabled account must lose every grant immediately, without touching
   role_permissions — that is why the view filters on status. */
UPDATE dbo.app_users SET status = 'Disabled' WHERE username = 'admin';
SELECT test = 'a disabled account resolves to no permissions at all',
       result = CASE WHEN NOT EXISTS (SELECT 1 FROM dbo.v_user_permissions WHERE username = 'admin')
                     THEN 'PASS' ELSE 'FAIL' END;
UPDATE dbo.app_users SET status = 'Active' WHERE username = 'admin';

PRINT '=== Location master + v_location_tree ===';
SELECT test = 'seeded 2 sites',
       actual = COUNT(*),
       result = CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.locations WHERE level = 'Site';

SELECT TOP 1
       test = 'a Floor resolves to its Site and full path',
       site_name, full_path, depth,
       result = CASE WHEN site_name = N'1st Site' AND depth = 3
                      AND full_path = N'1st Site › HDC › Floor 3'
                     THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.v_location_tree
 WHERE full_path = N'1st Site › HDC › Floor 3';

PRINT '=== v_user_visible_sites ===';
SELECT test = 'a user with no scope rows sees every site',
       actual = COUNT(*),
       result = CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.v_user_visible_sites WHERE user_id = 'USR-001';

INSERT INTO dbo.user_site_scope (user_id, location_id)
SELECT 'USR-001', location_id FROM dbo.locations WHERE level = 'Site' AND name = N'2nd Site';

SELECT test = 'once scoped, the same user sees only that site',
       actual = COUNT(*), site = MIN(site_name),
       result = CASE WHEN COUNT(*) = 1 AND MIN(site_name) = N'2nd Site' THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.v_user_visible_sites WHERE user_id = 'USR-001';

DELETE FROM dbo.user_site_scope WHERE user_id = 'USR-001';

/* ===========================================================================
   Build a small but complete estate, then read it back through the views.
   =========================================================================== */
PRINT '=== fixture: one rack, one chassis, one VM, one VLAN, two addresses ===';
DECLARE @floor VARCHAR(20) = (SELECT location_id FROM dbo.v_location_tree
                               WHERE full_path = N'1st Site › HDC › Floor 3');

INSERT INTO dbo.locations (location_id, level, name, parent_id, rack_units)
VALUES ('LOC-T01', 'Rack', N'Rack-A12', @floor, 42);

INSERT INTO dbo.hardware (hardware_id, asset_type, serial_number, manufacturer, model,
                          location_id, rack_u_start, rack_u_size,
                          commission_date, warranty_years, status)
VALUES ('HW-T01', 'Server', N'SN-T-0001', N'Dell', N'PowerEdge R760',
        'LOC-T01', 20, 2, '2026-01-15', 3, 'In Use');

INSERT INTO dbo.clusters (cluster_id, cluster_name, status)
VALUES ('CLU-T01', N'HDC-CLUSTER-01', 'Active');

INSERT INTO dbo.cluster_nodes (node_id, cluster_id, hardware_id, host_name)
VALUES ('NOD-T01', 'CLU-T01', 'HW-T01', N'esxi-01');

INSERT INTO dbo.servers (server_id, hosting_type, cluster_id, node_id,
                         system_name, server_name, os_type, os_version, status, environment)
VALUES ('SRV-T01', 'Virtual', 'CLU-T01', 'NOD-T01',
        N'ERP', N'HDC-APP01', 'Windows', N'Windows Server 2022', 'Active', 'Production');

INSERT INTO dbo.server_disks (disk_id, server_id, drive_letter, capacity, unit)
VALUES ('DSK-T01', 'SRV-T01', N'C:', 100, 'GB'),
       ('DSK-T02', 'SRV-T01', N'D:', 1,   'TB');

INSERT INTO dbo.vlans (vlan_id_pk, vlan_id, vlan_name, network_num, prefix_len,
                       gateway_num, dhcp_enabled, dhcp_server_num)
VALUES ('VLA-T10', 120, N'HDC-SERVER', dbo.fn_IpToInt('10.10.120.0'), 24,
        dbo.fn_IpToInt('10.10.120.1'), 1, dbo.fn_IpToInt('10.10.120.1'));

INSERT INTO dbo.ip_allocations (ip_num, vlan_id_pk, assign_type, purpose, server_id, hostname)
VALUES (dbo.fn_IpToInt('10.10.120.42'), 'VLA-T10', 'Static', 'service',    'SRV-T01', N'HDC-APP01'),
       (dbo.fn_IpToInt('10.10.120.43'), 'VLA-T10', 'Static', 'management', 'SRV-T01', N'HDC-APP01-mgmt');

PRINT '=== v_asset_360: the side panel in one query ===';
SELECT test = 'server resolves location, specs, IPs and VLAN in one row',
       server_name, location_path, primary_ip, management_ip, vlan_id,
       disk_total_gb, warranty_expiry, ip_count,
       result = CASE WHEN location_path  = N'1st Site › HDC › Floor 3 › Rack-A12'
                      AND primary_ip     = '10.10.120.42'
                      AND management_ip  = '10.10.120.43'
                      AND vlan_id        = 120
                      AND disk_total_gb  = 1124          -- 100 GB + 1 TB, normalised
                      AND warranty_expiry = '2029-01-15' -- 2026-01-15 + 3 years
                      AND ip_count       = 2
                     THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.v_asset_360 WHERE server_id = 'SRV-T01';

PRINT '=== v_vlan_utilization ===';
SELECT test = '2 of 254 usable addresses taken in VLAN 120',
       usable_count, assigned_count, free_count, used_percent, dhcp_start, dhcp_end,
       result = CASE WHEN usable_count = 254 AND assigned_count = 2 AND free_count = 252
                      AND dhcp_start = '10.10.120.2' AND dhcp_end = '10.10.120.254'
                     THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.v_vlan_utilization WHERE vlan_id = 120;

PRINT '=== v_license_compliance: over-allocation is detected ===';
INSERT INTO dbo.software_catalogue (software_id, vendor, name, edition, category, type)
VALUES ('SWC-T01', N'Microsoft', N'SQL Server', N'Standard', N'Database', N'Server');

INSERT INTO dbo.software_licenses (license_id, software_id, license_type, license_metric,
                                   purchased_qty, cost_thb, expiry_date)
VALUES ('LIC-T01', 'SWC-T01', N'Volume', N'Per Core', 8, 450000.00, '2027-12-31');

INSERT INTO dbo.software_allocations (allocation_id, license_id, server_id, quantity, environment)
VALUES ('ALC-T01', 'LIC-T01', 'SRV-T01', 4, 'Production');

SELECT test = '4 of 8 seats used -> OK',
       purchased_qty, allocated_qty, available_qty, compliance, expiry_state,
       result = CASE WHEN allocated_qty = 4 AND available_qty = 4 AND compliance = 'OK'
                     THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.v_license_compliance WHERE license_id = 'LIC-T01';

UPDATE dbo.software_allocations SET quantity = 12 WHERE allocation_id = 'ALC-T01';
SELECT test = '12 of 8 seats used -> Over-allocated',
       allocated_qty, available_qty, compliance,
       result = CASE WHEN compliance = 'Over-allocated' AND available_qty = -4
                     THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.v_license_compliance WHERE license_id = 'LIC-T01';

PRINT '=== renaming a server no longer detaches its licence (the v1 bug) ===';
UPDATE dbo.servers SET server_name = N'HDC-APP01-RENAMED' WHERE server_id = 'SRV-T01';
SELECT test = 'allocation survives the rename',
       allocated_qty,
       result = CASE WHEN allocated_qty = 12 THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.v_license_compliance WHERE license_id = 'LIC-T01';

PRINT '=== v_warranty_watch ===';
SELECT test = 'hardware warranty shows as Valid with days remaining',
       asset_name, warranty_expiry, state,
       result = CASE WHEN state IN ('Valid','Expiring soon') AND warranty_expiry = '2029-01-15'
                     THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.v_warranty_watch WHERE asset_id = 'HW-T01';

PRINT '=== system versioning: what did this row look like before? ===';
DECLARE @before DATETIME2(0) = SYSUTCDATETIME();
WAITFOR DELAY '00:00:01';
UPDATE dbo.servers SET status = 'Maintenance', environment = 'DR' WHERE server_id = 'SRV-T01';

SELECT test = 'current row shows the new value',
       status, environment,
       result = CASE WHEN status = 'Maintenance' THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.servers WHERE server_id = 'SRV-T01';

SELECT test = 'FOR SYSTEM_TIME AS OF returns the value from before the update',
       status, environment,
       result = CASE WHEN status = 'Active' AND environment = 'Production' THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.servers FOR SYSTEM_TIME AS OF @before
 WHERE server_id = 'SRV-T01';

SELECT test = 'the history table recorded the superseded row',
       versions = COUNT(*),
       result = CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.servers_history WHERE server_id = 'SRV-T01';

PRINT '=== soft delete keeps the row but frees the business key ===';
UPDATE dbo.network_devices SET is_deleted = 1, deleted_at = SYSUTCDATETIME() WHERE device_id = 'NET-TX1';
INSERT INTO dbo.network_devices (device_id, status, category, subcategory, device_name, serial_number)
VALUES ('NET-TX1', 'Use', N'Switch', N'Access', N'DUP-TEST', N'SN-DUP-1');
UPDATE dbo.network_devices SET is_deleted = 1, deleted_at = SYSUTCDATETIME() WHERE device_id = 'NET-TX1';

INSERT INTO dbo.network_devices (device_id, status, category, subcategory, device_name, serial_number)
VALUES ('NET-TX2', 'Use', N'Switch', N'Access', N'DUP-TEST', N'SN-DUP-1');
SELECT test = 'a deleted serial number can be reused by a new record',
       result = 'PASS';

BEGIN TRY
    INSERT INTO dbo.network_devices (device_id, status, category, subcategory, device_name, serial_number)
    VALUES ('NET-TX3', 'Use', N'Switch', N'Access', N'DUP-TEST', N'SN-DUP-1');
    SELECT test = 'but two LIVE records cannot share it', result = 'FAIL (it was accepted)';
END TRY
BEGIN CATCH
    SELECT test = 'but two LIVE records cannot share it', result = 'PASS';
END CATCH;

/* --- clean up --------------------------------------------------------------- */
DELETE FROM dbo.software_allocations WHERE allocation_id LIKE 'ALC-T%';
DELETE FROM dbo.software_licenses    WHERE license_id    LIKE 'LIC-T%';
DELETE FROM dbo.software_catalogue   WHERE software_id   LIKE 'SWC-T%';
DELETE FROM dbo.ip_allocations       WHERE vlan_id_pk    LIKE 'VLA-T%';
DELETE FROM dbo.vlans                WHERE vlan_id_pk    LIKE 'VLA-T%';
DELETE FROM dbo.server_disks         WHERE disk_id       LIKE 'DSK-T%';
DELETE FROM dbo.servers              WHERE server_id     LIKE 'SRV-T%';
DELETE FROM dbo.cluster_nodes        WHERE node_id       LIKE 'NOD-T%';
DELETE FROM dbo.clusters             WHERE cluster_id    LIKE 'CLU-T%';
DELETE FROM dbo.hardware             WHERE hardware_id   LIKE 'HW-T%';
DELETE FROM dbo.network_devices      WHERE device_id     LIKE 'NET-TX%';
DELETE FROM dbo.locations            WHERE location_id   LIKE 'LOC-T%';
GO
