/* =============================================================================
   IS-Inventory v2 — 10: Seed data

   Safe to re-run: every statement is guarded, so this doubles as the
   "make sure the built-in roles and permissions are present" step after an
   upgrade adds a new module.
   ============================================================================= */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
GO

/* ---------------------------------------------------------------------------
   Permissions — one row per (module, action).

   module_key matches the keys in TABLES[] in app.js, so a screen and its
   permissions line up by name and neither side needs a translation table.
   --------------------------------------------------------------------------- */
DECLARE @modules TABLE (module_key VARCHAR(40), label NVARCHAR(80), sort_order INT);
INSERT INTO @modules (module_key, label, sort_order) VALUES
    ('dashboard',            N'Dashboard',            10),
    ('hardware',             N'Server hardware',      20),
    ('clusters',             N'Clusters',             30),
    ('servers',              N'Server list',          40),
    ('network_devices',      N'Network hardware',     50),
    ('vlans',                N'VLANs',                60),
    ('ipam',                 N'IP addresses',         70),
    ('software_catalogue',   N'Software catalogue',   80),
    ('software_licenses',    N'License control',      90),
    ('software_allocations', N'License allocation',  100),
    ('server_permissions',   N'Server permissions',  110),
    ('ad_users',             N'AD users',            120),
    ('locations',            N'Locations & racks',   130),
    ('lifecycle',            N'Warranty & history',  140),
    ('users',                N'Users & roles',       150);

DECLARE @actions TABLE (action VARCHAR(10), verb NVARCHAR(20), ord INT);
INSERT INTO @actions (action, verb, ord) VALUES
    ('view',   N'View',   1),
    ('create', N'Create', 2),
    ('edit',   N'Edit',   3),
    ('delete', N'Delete', 4),
    ('export', N'Export', 5);

INSERT INTO dbo.permissions (permission_id, module_key, action, label, sort_order)
SELECT m.module_key + '.' + a.action,
       m.module_key,
       a.action,
       a.verb + N' — ' + m.label,
       m.sort_order + a.ord
  FROM @modules m
  CROSS JOIN @actions a
 WHERE NOT EXISTS (
       SELECT 1 FROM dbo.permissions p WHERE p.permission_id = m.module_key + '.' + a.action);
GO

/* ---------------------------------------------------------------------------
   Built-in roles

   Four, matching how the department actually splits up — not the flat
   Admin/User/Viewer of v1, which gave a site technician the same reach over
   every server in the company as the infrastructure lead.
   --------------------------------------------------------------------------- */
INSERT INTO dbo.roles (role_id, role_name, description, is_system)
SELECT v.role_id, v.role_name, v.description, 1
  FROM (VALUES
    ('ROL-001', N'Administrator',
     N'Full access including user and role management.'),
    ('ROL-002', N'IS Engineer',
     N'Creates and edits infrastructure across every site. Cannot manage users.'),
    ('ROL-003', N'Site Support',
     N'Edits hardware and network gear, limited to the sites assigned in user_site_scope. Read-only on licences.'),
    ('ROL-004', N'Viewer',
     N'Read and export everything, change nothing. For managers and auditors.')
  ) v(role_id, role_name, description)
 WHERE NOT EXISTS (SELECT 1 FROM dbo.roles r WHERE r.role_id = v.role_id);
GO

/* --- ROL-001 Administrator: everything ------------------------------------- */
INSERT INTO dbo.role_permissions (role_id, permission_id)
SELECT 'ROL-001', p.permission_id
  FROM dbo.permissions p
 WHERE NOT EXISTS (SELECT 1 FROM dbo.role_permissions rp
                    WHERE rp.role_id = 'ROL-001' AND rp.permission_id = p.permission_id);
GO

/* --- ROL-002 IS Engineer: everything except user/role management ------------ */
INSERT INTO dbo.role_permissions (role_id, permission_id)
SELECT 'ROL-002', p.permission_id
  FROM dbo.permissions p
 WHERE (p.module_key <> 'users' OR p.action = 'view')
   AND NOT EXISTS (SELECT 1 FROM dbo.role_permissions rp
                    WHERE rp.role_id = 'ROL-002' AND rp.permission_id = p.permission_id);
GO

/* --- ROL-003 Site Support: edits the gear it can physically reach ----------- */
INSERT INTO dbo.role_permissions (role_id, permission_id)
SELECT 'ROL-003', p.permission_id
  FROM dbo.permissions p
 WHERE (
        /* full create/edit on physical gear and its whereabouts */
        (p.module_key IN ('hardware','network_devices','locations','ipam')
         AND p.action IN ('view','create','edit','export'))
        /* read-only everywhere else it needs context */
     OR (p.module_key IN ('dashboard','servers','clusters','vlans',
                          'software_catalogue','software_licenses','software_allocations',
                          'server_permissions','ad_users','lifecycle')
         AND p.action IN ('view','export'))
   )
   AND NOT EXISTS (SELECT 1 FROM dbo.role_permissions rp
                    WHERE rp.role_id = 'ROL-003' AND rp.permission_id = p.permission_id);
GO

/* --- ROL-004 Viewer: read and export, nothing else -------------------------- */
INSERT INTO dbo.role_permissions (role_id, permission_id)
SELECT 'ROL-004', p.permission_id
  FROM dbo.permissions p
 WHERE p.action IN ('view','export')
   AND p.module_key <> 'users'
   AND NOT EXISTS (SELECT 1 FROM dbo.role_permissions rp
                    WHERE rp.role_id = 'ROL-004' AND rp.permission_id = p.permission_id);
GO

/* ---------------------------------------------------------------------------
   The first administrator.

   v1 seeded password_hash with the literal string 'admin123' and left a
   comment asking someone to replace it later. This is a real bcrypt hash
   (cost 12) of "ChangeMe$2026", with must_change_password = 1 so the account
   cannot be used until the password is actually changed.

   Re-hash before a production run if this file has ever been shared —
   the plaintext above is in version control by definition.
   --------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE username = 'admin')
INSERT INTO dbo.app_users (user_id, username, full_name, password_hash, role_id, status, must_change_password)
VALUES ('USR-001', 'admin', N'Administrator',
        '$2b$12$bIQOrWdeHNDqoTBz5prn.uGQFSiwI95Jn9wFGTVrBAr0VOLguS8ZW',
        'ROL-001', 'Active', 1);
GO

/* ---------------------------------------------------------------------------
   Id counters — start each sequence past whatever the seed inserted
   --------------------------------------------------------------------------- */
MERGE dbo.id_counters AS t
USING (VALUES ('USR',1),('ROL',4),('HW',0),('CLU',0),('NOD',0),('SRV',0),('DSK',0),
              ('HWU',0),('MAR',0),('LOC',0),('VLA',0),('NET',0),('SWC',0),('LIC',0),
              ('ALC',0),('PRM',0),('AD',0),('MBR',0)
      ) AS s(counter_key, next_seq)
   ON t.counter_key = s.counter_key
 WHEN NOT MATCHED THEN INSERT (counter_key, next_seq) VALUES (s.counter_key, s.next_seq);
GO

/* ---------------------------------------------------------------------------
   Location master — Site > Factory > Floor, from Location_Master.xlsx.
   Ids are assigned deterministically so a re-run produces the same tree.
   --------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.locations)
BEGIN
    DECLARE @master TABLE (site NVARCHAR(120), factory NVARCHAR(120), floor NVARCHAR(120));
    INSERT INTO @master (site, factory, floor) VALUES
        (N'1st Site', N'Main Office',   N'Floor 1'), (N'1st Site', N'Main Office',   N'Floor 2'),
        (N'1st Site', N'HDC',           N'Floor 1'), (N'1st Site', N'HDC',           N'Floor 2'),
        (N'1st Site', N'HDC',           N'Floor 3'), (N'1st Site', N'HDC',           N'Floor 4'),
        (N'1st Site', N'Factory 1',     N'Floor 1'), (N'1st Site', N'Factory 1',     N'Floor 2'),
        (N'1st Site', N'Factory 2',     N'Floor 1'), (N'1st Site', N'Factory 2',     N'Floor 2'),
        (N'1st Site', N'Canteen 1',     N'Floor 1'), (N'1st Site', N'Canteen 2',     N'Floor 1'),
        (N'1st Site', N'Guard House 1', N'Floor 1'), (N'1st Site', N'Guard House 2', N'Floor 1'),
        (N'1st Site', N'Shop Factory',  N'Floor 1'),
        (N'1st Site', N'Multi Purpose', N'Floor 1'), (N'1st Site', N'Multi Purpose', N'Floor 2'),
        (N'1st Site', N'Anechoic 1',    N'Floor 1'), (N'1st Site', N'Anechoic 2',    N'Floor 1'),
        (N'1st Site', N'Anechoic 3',    N'Floor 1'),
        (N'2nd Site', N'Canteen 1',     N'Floor 1'), (N'2nd Site', N'Canteen 1',     N'Floor 2'),
        (N'2nd Site', N'Canteen 2',     N'Floor 1'), (N'2nd Site', N'Canteen 2',     N'Floor 2'),
        (N'2nd Site', N'Shop Factory',  N'Floor 1'), (N'2nd Site', N'Shop Forklift', N'Floor 1'),
        (N'2nd Site', N'Shop Recycle',  N'Floor 1');

    /* Sites */
    ;WITH s AS (SELECT DISTINCT site FROM @master)
    INSERT INTO dbo.locations (location_id, level, name, parent_id)
    SELECT 'LOC-' + RIGHT('000' + CAST(ROW_NUMBER() OVER (ORDER BY site) AS VARCHAR(10)), 3),
           'Site', site, NULL
      FROM s;

    /* Factories */
    ;WITH f AS (SELECT DISTINCT m.site, m.factory FROM @master m)
    INSERT INTO dbo.locations (location_id, level, name, parent_id)
    SELECT 'LOC-' + RIGHT('000' + CAST(100 + ROW_NUMBER() OVER (ORDER BY f.site, f.factory) AS VARCHAR(10)), 3),
           'Factory', f.factory, p.location_id
      FROM f
      JOIN dbo.locations p ON p.level = 'Site' AND p.name = f.site;

    /* Floors */
    ;WITH fl AS (SELECT DISTINCT m.site, m.factory, m.floor FROM @master m)
    INSERT INTO dbo.locations (location_id, level, name, parent_id)
    SELECT 'LOC-' + RIGHT('000' + CAST(300 + ROW_NUMBER() OVER (ORDER BY fl.site, fl.factory, fl.floor) AS VARCHAR(10)), 3),
           'Floor', fl.floor, fac.location_id
      FROM fl
      JOIN dbo.locations sit ON sit.level = 'Site'    AND sit.name = fl.site
      JOIN dbo.locations fac ON fac.level = 'Factory' AND fac.name = fl.factory AND fac.parent_id = sit.location_id;

    UPDATE dbo.id_counters SET next_seq = 400 WHERE counter_key = 'LOC';
END
GO

/* ---------------------------------------------------------------------------
   Lookup values the forms offer
   --------------------------------------------------------------------------- */
INSERT INTO dbo.catalog_values (catalog_key, value, sort_order)
SELECT v.catalog_key, v.value, v.sort_order
  FROM (VALUES
    ('ram_gb','8',1),('ram_gb','16',2),('ram_gb','32',3),('ram_gb','64',4),
    ('ram_gb','128',5),('ram_gb','256',6),('ram_gb','512',7),
    ('cpu_cores','2',1),('cpu_cores','4',2),('cpu_cores','8',3),
    ('cpu_cores','16',4),('cpu_cores','24',5),('cpu_cores','32',6),('cpu_cores','64',7),
    ('os_version_windows',N'Windows Server 2016',1),
    ('os_version_windows',N'Windows Server 2019',2),
    ('os_version_windows',N'Windows Server 2022',3),
    ('os_version_windows',N'Windows Server 2025',4),
    ('os_version_linux',N'Ubuntu Server 22.04 LTS',1),
    ('os_version_linux',N'Ubuntu Server 24.04 LTS',2),
    ('os_version_linux',N'RHEL 8',3),('os_version_linux',N'RHEL 9',4),
    ('software_category',N'Operating System',1),
    ('software_category',N'Database',2),
    ('software_category',N'Virtualisation',3),
    ('software_category',N'Security',4),
    ('software_category',N'Backup',5),
    ('software_category',N'Productivity',6),
    ('license_type',N'Perpetual',1),('license_type',N'Subscription',2),
    ('license_type',N'OEM',3),('license_type',N'Volume',4),
    ('license_metric',N'Per Core',1),('license_metric',N'Per Socket',2),
    ('license_metric',N'Per User',3),('license_metric',N'Per Device',4),
    ('license_metric',N'Per VM',5),('license_metric',N'Unlimited',6)
  ) v(catalog_key, value, sort_order)
 WHERE NOT EXISTS (SELECT 1 FROM dbo.catalog_values c
                    WHERE c.catalog_key = v.catalog_key AND c.value = v.value);
GO

INSERT INTO dbo.server_roles (role_name)
SELECT v.role_name FROM (VALUES
    (N'Application Server'),(N'Database Server'),(N'Web Server'),(N'File Server'),
    (N'Domain Controller'),(N'Backup Server'),(N'Mail Server'),(N'Monitoring Server')
  ) v(role_name)
 WHERE NOT EXISTS (SELECT 1 FROM dbo.server_roles r WHERE r.role_name = v.role_name);
GO

PRINT 'Seed complete.';
GO
