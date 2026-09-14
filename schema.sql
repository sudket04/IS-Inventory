/* ============================================================================
   IT Infrastructure Inventory — SQL Server 2025 schema
   Target: SQL Server 2025 on Windows Server 2025
   Run once against a fresh database. Idempotent-ish: guarded with IF NOT EXISTS
   so it can be re-run safely during setup.

   Design notes
   ------------
   - Access control: three roles — Admin (full control + user management),
     User (add / edit / delete inventory data), Viewer (read-only). Enforce
     these roles in the API layer (app.py) as well; the front-end gating in
     index.html is convenience, not security.
   - Location Master is a 3-tier hierarchy: Site > Factory > Floor
     (matches Location Master.xlsx). Network devices reference a Floor.
   - Repeating values (cluster hosts/nodes, server storage sizes, storage
     "used with") are modelled as child tables or native JSON columns.
   - app_kv is the key/value store the current front-end talks to via
     /api/data/<key>. Keep it if you want the HTML to work with no further
     backend changes; drop it once the API reads/writes the relational tables.
   ============================================================================ */

-- CREATE DATABASE ServerInventory;   -- create separately, then:
-- USE ServerInventory;
GO

/* ---------------------------------------------------------------------------
   Application accounts + access control
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.app_users', 'U') IS NULL
CREATE TABLE dbo.app_users (
    user_id       VARCHAR(20)   NOT NULL PRIMARY KEY,          -- e.g. USR-001
    full_name     NVARCHAR(120) NOT NULL,
    username      NVARCHAR(60)  NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,                      -- store a hash, not plaintext
    role          VARCHAR(10)   NOT NULL
                  CONSTRAINT CK_app_users_role CHECK (role IN ('Admin','User','Viewer')),
    status        VARCHAR(10)   NOT NULL DEFAULT 'Active'
                  CONSTRAINT CK_app_users_status CHECK (status IN ('Active','Disabled')),
    created_at    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_app_users_username UNIQUE (username)
);
GO

/* Seed the default administrator (username: admin / password: admin123).
   Replace password_hash with a real hash from your backend on first run and
   force a password change. */
IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE username = 'admin')
INSERT INTO dbo.app_users (user_id, full_name, username, password_hash, role, status)
VALUES ('USR-001', N'Administrator', 'admin', 'admin123', 'Admin', 'Active');
GO

/* ---------------------------------------------------------------------------
   Editable lookup: Server roles (New Server form "+ Role" writes here)
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.server_roles', 'U') IS NULL
CREATE TABLE dbo.server_roles (
    role_name  NVARCHAR(80) NOT NULL PRIMARY KEY,
    created_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
INSERT INTO dbo.server_roles (role_name)
SELECT v.name FROM (VALUES
    (N'Web Server'),(N'Application Server'),(N'Database Server'),(N'File Server'),
    (N'Domain Controller'),(N'DNS Server'),(N'DHCP Server'),(N'Mail Server'),
    (N'Backup Server'),(N'Monitoring Server'),(N'Proxy Server'),(N'Print Server')
) v(name)
WHERE NOT EXISTS (SELECT 1 FROM dbo.server_roles r WHERE r.role_name = v.name);
GO

/* ---------------------------------------------------------------------------
   Location Master — Site > Factory > Floor > Area > Rack (self-referencing
   hierarchy). rack_units only applies to level = 'Rack'.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.locations', 'U') IS NULL
CREATE TABLE dbo.locations (
    location_id VARCHAR(20)   NOT NULL PRIMARY KEY,            -- e.g. LOC-001
    level       VARCHAR(10)   NOT NULL
                CONSTRAINT CK_locations_level CHECK (level IN ('Site','Factory','Floor','Area','Rack')),
    name        NVARCHAR(120) NOT NULL,
    parent_id   VARCHAR(20)   NULL
                CONSTRAINT FK_locations_parent REFERENCES dbo.locations(location_id),
    rack_units  INT           NULL,                            -- rack height (U), level = 'Rack' only
    remarks     NVARCHAR(400) NULL,
    created_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_locations_sibling UNIQUE (level, parent_id, name)
);
GO

/* Seed Location Master from Location Master.xlsx (Site > Factory > Floor).
   Ids are assigned deterministically. Safe to re-run. */
IF NOT EXISTS (SELECT 1 FROM dbo.locations)
BEGIN
    DECLARE @master TABLE (site NVARCHAR(120), factory NVARCHAR(120), floor NVARCHAR(120), seq INT IDENTITY(1,1));
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
        (N'2nd Site', N'Shop Recycle',  N'Floor 1'),
        (N'2nd Site', N'Guard House 2', N'Floor 1'), (N'2nd Site', N'Guard House 3', N'Floor 1'),
        (N'2nd Site', N'Warehouse 3',   N'Floor 1'),
        (N'2nd Site', N'Factory 3',     N'Floor 1'), (N'2nd Site', N'Factory 3',     N'Floor 2');

    -- Sites
    ;WITH sites AS (SELECT DISTINCT site FROM @master)
    INSERT INTO dbo.locations (location_id, level, name, parent_id)
    SELECT 'LOC-S' + RIGHT('00' + CAST(ROW_NUMBER() OVER (ORDER BY site) AS VARCHAR(2)), 2),
           'Site', site, NULL
    FROM sites;

    -- Factories
    ;WITH facs AS (SELECT DISTINCT site, factory FROM @master)
    INSERT INTO dbo.locations (location_id, level, name, parent_id)
    SELECT 'LOC-F' + RIGHT('000' + CAST(ROW_NUMBER() OVER (ORDER BY site, factory) AS VARCHAR(3)), 3),
           'Factory', f.factory, s.location_id
    FROM facs f
    JOIN dbo.locations s ON s.level = 'Site' AND s.name = f.site;

    -- Floors
    ;WITH flrs AS (SELECT DISTINCT site, factory, floor FROM @master)
    INSERT INTO dbo.locations (location_id, level, name, parent_id)
    SELECT 'LOC-L' + RIGHT('000' + CAST(ROW_NUMBER() OVER (ORDER BY site, factory, floor) AS VARCHAR(3)), 3),
           'Floor', fl.floor, fa.location_id
    FROM flrs fl
    JOIN dbo.locations s  ON s.level = 'Site' AND s.name = fl.site
    JOIN dbo.locations fa ON fa.level = 'Factory' AND fa.name = fl.factory AND fa.parent_id = s.location_id;
END
GO

/* ---------------------------------------------------------------------------
   Hardware (asset_type: Server | Storage)
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.hardware', 'U') IS NULL
CREATE TABLE dbo.hardware (
    hardware_id       VARCHAR(20)   NOT NULL PRIMARY KEY,      -- e.g. HW-001
    asset_type        VARCHAR(10)   NOT NULL
                      CONSTRAINT CK_hardware_type CHECK (asset_type IN ('Server','Storage')),
    -- Storage-only identity
    storage_name      NVARCHAR(120) NULL,
    storage_array_type VARCHAR(10)  NULL,                      -- SAN/NAS/DAS/Other
    capacity_gb       INT           NULL,
    used_with         NVARCHAR(MAX) NULL                       -- JSON array of "cluster:X"/"server:Y"
                      CONSTRAINT CK_hardware_usedwith_json CHECK (used_with IS NULL OR ISJSON(used_with) = 1),
    -- Common identity
    manufacturer      NVARCHAR(60)  NULL,
    model             NVARCHAR(120) NULL,
    serial_number     NVARCHAR(120) NOT NULL,
    -- Server-only switch port
    port_no           NVARCHAR(60)  NULL,
    port_name         NVARCHAR(60)  NULL,
    -- Location (free cascade — Site/Location/Rack, separate from Location Master)
    site              NVARCHAR(60)  NULL,
    location          NVARCHAR(120) NULL,
    rack_number       NVARCHAR(60)  NULL,
    u_position        NVARCHAR(30)  NULL,
    -- Lifecycle
    commission_date   DATE          NULL,
    warranty_expiry   DATE          NULL,
    status            VARCHAR(20)   NOT NULL,                  -- In Stock/In Use/Maintenance/Decommissioned
    owner             NVARCHAR(120) NULL,
    cost_center       NVARCHAR(60)  NULL,
    remarks           NVARCHAR(400) NULL,
    created_at        DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at        DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_hardware_serial UNIQUE (serial_number)
);
GO

/* ---------------------------------------------------------------------------
   Clusters + their Hosts/Nodes
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.clusters', 'U') IS NULL
CREATE TABLE dbo.clusters (
    cluster_id          VARCHAR(20)   NOT NULL PRIMARY KEY,    -- e.g. CLU-001
    cluster_name        NVARCHAR(120) NOT NULL,
    hypervisor_platform NVARCHAR(40)  NULL,
    infrastructure_type NVARCHAR(60)  NULL,
    management_console  NVARCHAR(45)  NULL,
    criticality         NVARCHAR(30)  NULL,
    environment         NVARCHAR(20)  NULL,
    status              VARCHAR(20)   NOT NULL,
    owner               NVARCHAR(120) NULL,
    remarks             NVARCHAR(400) NULL,
    created_at          DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_clusters_name UNIQUE (cluster_name)
);
GO

IF OBJECT_ID('dbo.cluster_nodes', 'U') IS NULL
CREATE TABLE dbo.cluster_nodes (
    node_id       VARCHAR(40)  NOT NULL PRIMARY KEY,
    cluster_id    VARCHAR(20)  NOT NULL
                  CONSTRAINT FK_nodes_cluster REFERENCES dbo.clusters(cluster_id) ON DELETE CASCADE,
    hardware_id   VARCHAR(20)  NULL
                  CONSTRAINT FK_nodes_hardware REFERENCES dbo.hardware(hardware_id),
    host_name     NVARCHAR(120) NOT NULL,
    ip_host       NVARCHAR(45)  NULL,
    ip_management NVARCHAR(45)  NULL,
    -- A physical box lives in exactly one node OR one physical server (enforce in API too)
    CONSTRAINT UQ_nodes_hardware UNIQUE (hardware_id)
);
GO

/* ---------------------------------------------------------------------------
   Servers (hosting_type: Virtual | Physical) — includes Server Role
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.servers', 'U') IS NULL
CREATE TABLE dbo.servers (
    server_id        VARCHAR(20)   NOT NULL PRIMARY KEY,       -- e.g. SRV-001
    hosting_type     VARCHAR(10)   NOT NULL
                     CONSTRAINT CK_servers_hosting CHECK (hosting_type IN ('Virtual','Physical')),
    -- Virtual-only
    host_ref         VARCHAR(80)   NULL,                       -- "<cluster_id>::<node_id>"
    cluster_name     NVARCHAR(120) NULL,
    -- Physical-only
    hardware_id      VARCHAR(20)   NULL
                     CONSTRAINT FK_servers_hardware REFERENCES dbo.hardware(hardware_id),
    -- Common identity
    system_group     NVARCHAR(120) NULL,
    system_name      NVARCHAR(120) NOT NULL,
    server_role      NVARCHAR(80)  NULL
                     CONSTRAINT FK_servers_role REFERENCES dbo.server_roles(role_name),
    operating_system NVARCHAR(120) NULL,
    -- Network
    fqdn             NVARCHAR(200) NULL,
    ip_address       NVARCHAR(45)  NOT NULL,
    ip_management    NVARCHAR(45)  NULL,
    service_port     NVARCHAR(120) NULL,
    server_zone      NVARCHAR(30)  NULL,
    -- Capacity
    cpu_cores        INT           NULL,
    ram_gb           INT           NULL,
    storage_gb       NVARCHAR(MAX) NULL                        -- JSON array of sizes
                     CONSTRAINT CK_servers_storage_json CHECK (storage_gb IS NULL OR ISJSON(storage_gb) = 1),
    storage_type     VARCHAR(10)   NULL,
    -- Lifecycle
    criticality      NVARCHAR(30)  NULL,
    environment      NVARCHAR(20)  NULL,
    status           VARCHAR(20)   NOT NULL,
    owner            NVARCHAR(120) NULL,
    remarks          NVARCHAR(400) NULL,
    created_at       DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at       DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_servers_name UNIQUE (system_name),
    CONSTRAINT UQ_servers_ip   UNIQUE (ip_address)
);
GO

/* ---------------------------------------------------------------------------
   Network — VLANs
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.vlans', 'U') IS NULL
CREATE TABLE dbo.vlans (
    vlan_id_pk      VARCHAR(20)   NOT NULL PRIMARY KEY,        -- e.g. VLA-001
    vlan_id         INT           NOT NULL,
    vlan_name       NVARCHAR(80)  NOT NULL,
    purpose         NVARCHAR(120) NULL,
    network_address NVARCHAR(45)  NOT NULL,
    subnet_mask     NVARCHAR(45)  NOT NULL,
    cidr            VARCHAR(6)    NULL,
    usable_ip       NVARCHAR(60)  NULL,
    gateway         NVARCHAR(45)  NULL,
    gateway_device  NVARCHAR(40)  NULL,
    firewall_zone   NVARCHAR(30)  NULL,
    routing         NVARCHAR(120) NULL,
    dhcp_enabled    VARCHAR(3)    NOT NULL DEFAULT 'No',       -- Yes/No
    dhcp_server     NVARCHAR(45)  NULL,
    dhcp_start      NVARCHAR(45)  NULL,
    dhcp_end        NVARCHAR(45)  NULL,
    static_start    NVARCHAR(45)  NULL,
    static_end      NVARCHAR(45)  NULL,
    created_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_vlans_vid  UNIQUE (vlan_id),
    CONSTRAINT UQ_vlans_name UNIQUE (vlan_name),
    CONSTRAINT UQ_vlans_net  UNIQUE (network_address)
);
GO

/* ---------------------------------------------------------------------------
   Network — Devices (Location references a Floor in Location Master)
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.network_devices', 'U') IS NULL
CREATE TABLE dbo.network_devices (
    device_id       VARCHAR(20)   NOT NULL PRIMARY KEY,        -- e.g. NET-001
    status          VARCHAR(20)   NOT NULL,                    -- Use/Standby/Decommissioned
    category        NVARCHAR(60)  NOT NULL,
    subcategory     NVARCHAR(60)  NOT NULL,
    device_name     NVARCHAR(120) NOT NULL,
    brand           NVARCHAR(40)  NULL,
    model           NVARCHAR(120) NULL,
    serial_number   NVARCHAR(120) NOT NULL,
    fixed_asset     NVARCHAR(60)  NULL,
    description     NVARCHAR(400) NULL,
    network_zone    NVARCHAR(30)  NULL,
    role            VARCHAR(4)    NULL,                         -- L2/L3
    detail          NVARCHAR(120) NULL,
    stack_id        VARCHAR(10)   NULL,
    stack_role      NVARCHAR(20)  NULL,
    mac_address     NVARCHAR(20)  NOT NULL,
    ip_management   NVARCHAR(45)  NOT NULL,
    location_id     VARCHAR(20)   NULL                          -- a Floor in dbo.locations
                    CONSTRAINT FK_netdev_location REFERENCES dbo.locations(location_id),
    rack_number     NVARCHAR(60)  NULL,
    commission_date DATE          NULL,
    eol_date        DATE          NULL,
    created_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_netdev_serial UNIQUE (serial_number),
    CONSTRAINT UQ_netdev_mac    UNIQUE (mac_address),
    CONSTRAINT UQ_netdev_name   UNIQUE (device_name),
    CONSTRAINT UQ_netdev_ipmgmt UNIQUE (ip_management)
);
GO

/* ---------------------------------------------------------------------------
   Software catalogue
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.software', 'U') IS NULL
CREATE TABLE dbo.software (
    software_id VARCHAR(20)   NOT NULL PRIMARY KEY,             -- e.g. SFW-001
    name        NVARCHAR(120) NOT NULL,
    vendor      NVARCHAR(120) NULL,
    category    NVARCHAR(60)  NOT NULL,
    version     NVARCHAR(60)  NULL,
    install_type VARCHAR(20)  NOT NULL
                CONSTRAINT CK_software_install CHECK (install_type IN ('On-Premise','Cloud','SaaS')),
    status      VARCHAR(20)   NOT NULL
                CONSTRAINT CK_software_status CHECK (status IN ('Active','Deprecated','EOL')),
    eos_date    DATE          NULL,                            -- end of support
    owner       NVARCHAR(120) NULL,
    remarks     NVARCHAR(400) NULL,
    created_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_software_name UNIQUE (name)
);
GO

/* ---------------------------------------------------------------------------
   License control — status holds the manually-set states (Active/Suspended/
   Terminated); Expiring Soon/Expired are computed by the app from
   expiry_date on top of that, so they can never go stale.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.licenses', 'U') IS NULL
CREATE TABLE dbo.licenses (
    license_id      VARCHAR(20)   NOT NULL PRIMARY KEY,         -- e.g. LIC-001
    software_id     VARCHAR(20)   NOT NULL
                    CONSTRAINT FK_licenses_software REFERENCES dbo.software(software_id),
    license_type    VARCHAR(20)   NOT NULL
                    CONSTRAINT CK_licenses_type CHECK (license_type IN ('Perpetual','Subscription','OEM','Open Source')),
    license_model   VARCHAR(20)   NOT NULL
                    CONSTRAINT CK_licenses_model CHECK (license_model IN ('User','Device','Core','Server','Concurrent')),
    status          VARCHAR(20)   NOT NULL DEFAULT 'Active'
                    CONSTRAINT CK_licenses_status CHECK (status IN ('Active','Suspended','Terminated')),
    license_key     NVARCHAR(200) NULL,
    seats_total     INT           NOT NULL DEFAULT 0,
    seats_used      INT           NOT NULL DEFAULT 0,
    purchase_date   DATE          NULL,
    expiry_date     DATE          NOT NULL,
    agreement_no    NVARCHAR(60)  NULL,
    cost            DECIMAL(12,2) NULL,
    currency        VARCHAR(3)    NULL
                    CONSTRAINT CK_licenses_currency CHECK (currency IN ('THB','USD','EUR','JPY')),
    vendor_contact  NVARCHAR(200) NULL,
    remarks         NVARCHAR(400) NULL,
    created_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------------------------------------------------------------------------
   Server Permission — shared folders on a File Server and the AD group(s)
   that hold Read/Write or Read-only access to them. Surfaced only to Admins
   (Permission Control section).
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.server_permissions', 'U') IS NULL
CREATE TABLE dbo.server_permissions (
    permission_id VARCHAR(20)   NOT NULL PRIMARY KEY,           -- e.g. PRM-001
    server_id     VARCHAR(20)   NOT NULL
                  CONSTRAINT FK_serverperm_server REFERENCES dbo.servers(server_id),
    folder_name   NVARCHAR(150) NOT NULL,
    folder_path   NVARCHAR(400) NULL,
    level         NVARCHAR(40)  NULL,                           -- e.g. Level 1
    department    NVARCHAR(120) NULL,
    rw_group      NVARCHAR(150) NULL,                           -- AD group — Read/Write
    ro_group      NVARCHAR(150) NULL,                           -- AD group — Read only
    quota_gb      INT           NULL,
    owner         NVARCHAR(120) NULL,
    remarks       NVARCHAR(400) NULL,
    created_at    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_serverperm_folder UNIQUE (server_id, folder_name)
);
GO

/* ---------------------------------------------------------------------------
   AD Users — directory of Active Directory accounts and their group
   membership, imported from AD rather than created by hand. Distinct from
   dbo.app_users (this application's own login accounts).
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.ad_users', 'U') IS NULL
CREATE TABLE dbo.ad_users (
    ad_user_id   VARCHAR(20)   NOT NULL PRIMARY KEY,            -- e.g. AD-001
    user_logon   NVARCHAR(60)  NOT NULL,
    display_name NVARCHAR(150) NULL,
    status       VARCHAR(10)   NOT NULL DEFAULT 'Enabled'
                 CONSTRAINT CK_adusers_status CHECK (status IN ('Enabled','Disabled')),
    job_title    NVARCHAR(120) NULL,
    department   NVARCHAR(120) NULL,
    email        NVARCHAR(150) NULL,
    group_count  INT           NULL,
    remarks      NVARCHAR(400) NULL,
    created_at   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_adusers_logon UNIQUE (user_logon)
);
GO

/* ---------------------------------------------------------------------------
   Change history — append-only audit trail of create/update/delete/restore
   actions across every module above (Governance > Change history).
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.audit_log', 'U') IS NULL
CREATE TABLE dbo.audit_log (
    log_id     VARCHAR(40)   NOT NULL PRIMARY KEY,
    table_key  VARCHAR(40)   NOT NULL,                          -- e.g. 'hardware', 'servers'
    record_id  VARCHAR(20)   NULL,
    display    NVARCHAR(200) NULL,                              -- human label, e.g. system_name
    action     VARCHAR(10)   NOT NULL
               CONSTRAINT CK_auditlog_action CHECK (action IN ('Create','Update','Delete','Restore')),
    username   NVARCHAR(60)  NULL,
    changed_at DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------------------------------------------------------------------------
   Recycle bin — soft-deleted records, restorable until purged. record_json
   holds the full original row so Restore can reinsert it as-is.
   (Governance > Recycle bin)
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.recycle_bin', 'U') IS NULL
CREATE TABLE dbo.recycle_bin (
    trash_id     VARCHAR(40)   NOT NULL PRIMARY KEY,
    table_key    VARCHAR(40)   NOT NULL,
    record_json  NVARCHAR(MAX) NOT NULL
                 CONSTRAINT CK_recyclebin_json CHECK (ISJSON(record_json) = 1),
    deleted_by   NVARCHAR(60)  NULL,
    deleted_at   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------------------------------------------------------------------------
   Connection / setup config (mirrors setup.html /api/setup)
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.app_config', 'U') IS NULL
CREATE TABLE dbo.app_config (
    config_key   VARCHAR(60)   NOT NULL PRIMARY KEY,
    config_value NVARCHAR(MAX) NULL,
    updated_at   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------------------------------------------------------------------------
   Key/value store used by the current front-end (/api/data/<key>).
   Optional: lets index.html persist immediately before the API is wired to
   the relational tables above. Each key holds one JSON document.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.app_kv', 'U') IS NULL
CREATE TABLE dbo.app_kv (
    kv_key     VARCHAR(80)   NOT NULL PRIMARY KEY,             -- inv_hardware, inv_vlans, inv_users, inv_server_roles,
                                                                -- inv_software, inv_licenses, inv_server_permissions,
                                                                -- inv_ad_users, inv_audit_log, inv_recycle_bin, ...
    kv_value   NVARCHAR(MAX) NULL,
    updated_at DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* Helpful indexes */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_locations_parent')
    CREATE INDEX IX_locations_parent ON dbo.locations(parent_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_netdev_location')
    CREATE INDEX IX_netdev_location ON dbo.network_devices(location_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_servers_hardware')
    CREATE INDEX IX_servers_hardware ON dbo.servers(hardware_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_nodes_cluster')
    CREATE INDEX IX_nodes_cluster ON dbo.cluster_nodes(cluster_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_licenses_software')
    CREATE INDEX IX_licenses_software ON dbo.licenses(software_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_licenses_expiry')
    CREATE INDEX IX_licenses_expiry ON dbo.licenses(expiry_date);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_serverperm_server')
    CREATE INDEX IX_serverperm_server ON dbo.server_permissions(server_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_adusers_department')
    CREATE INDEX IX_adusers_department ON dbo.ad_users(department);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_auditlog_changedat')
    CREATE INDEX IX_auditlog_changedat ON dbo.audit_log(changed_at DESC);
GO
