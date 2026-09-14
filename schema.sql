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
   Editable lookups (catalogs) — RAM/CPU/Storage size pick-lists and OS
   Version lists. Curated so values stay realistic (e.g. no "5 GB RAM");
   the "+ Add" button in the UI inserts a new row here to extend a catalog.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.catalog_values', 'U') IS NULL
CREATE TABLE dbo.catalog_values (
    catalog_key VARCHAR(40)   NOT NULL,   -- ram_gb / cpu_cores / storage_gb / storage_tb / os_version_windows / os_version_linux / os_version_other
    value       NVARCHAR(80)  NOT NULL,
    sort_order  INT           NOT NULL DEFAULT 0,
    created_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_catalog_values PRIMARY KEY (catalog_key, value)
);
GO
INSERT INTO dbo.catalog_values (catalog_key, value, sort_order)
SELECT v.catalog_key, v.value, v.sort_order FROM (VALUES
    ('ram_gb', N'8', 1), ('ram_gb', N'16', 2), ('ram_gb', N'24', 3), ('ram_gb', N'32', 4),
    ('ram_gb', N'48', 5), ('ram_gb', N'64', 6), ('ram_gb', N'96', 7), ('ram_gb', N'128', 8),
    ('ram_gb', N'192', 9), ('ram_gb', N'256', 10), ('ram_gb', N'384', 11), ('ram_gb', N'512', 12),
    ('ram_gb', N'768', 13), ('ram_gb', N'1024', 14),
    ('cpu_cores', N'1', 1), ('cpu_cores', N'2', 2), ('cpu_cores', N'4', 3), ('cpu_cores', N'6', 4),
    ('cpu_cores', N'8', 5), ('cpu_cores', N'10', 6), ('cpu_cores', N'12', 7), ('cpu_cores', N'16', 8),
    ('cpu_cores', N'20', 9), ('cpu_cores', N'24', 10), ('cpu_cores', N'28', 11), ('cpu_cores', N'32', 12),
    ('cpu_cores', N'36', 13), ('cpu_cores', N'40', 14), ('cpu_cores', N'48', 15), ('cpu_cores', N'56', 16), ('cpu_cores', N'64', 17),
    ('storage_gb', N'120', 1), ('storage_gb', N'128', 2), ('storage_gb', N'240', 3), ('storage_gb', N'250', 4),
    ('storage_gb', N'256', 5), ('storage_gb', N'480', 6), ('storage_gb', N'500', 7), ('storage_gb', N'512', 8),
    ('storage_gb', N'600', 9), ('storage_gb', N'800', 10), ('storage_gb', N'960', 11), ('storage_gb', N'1024', 12),
    ('storage_tb', N'1', 1), ('storage_tb', N'2', 2), ('storage_tb', N'3', 3), ('storage_tb', N'4', 4),
    ('storage_tb', N'6', 5), ('storage_tb', N'8', 6), ('storage_tb', N'10', 7), ('storage_tb', N'12', 8),
    ('storage_tb', N'16', 9), ('storage_tb', N'20', 10), ('storage_tb', N'24', 11), ('storage_tb', N'30', 12),
    ('storage_tb', N'32', 13), ('storage_tb', N'40', 14), ('storage_tb', N'48', 15), ('storage_tb', N'64', 16),
    ('storage_tb', N'96', 17), ('storage_tb', N'128', 18),
    ('os_version_windows', N'Windows Server 2025 Datacenter', 1), ('os_version_windows', N'Windows Server 2025 Standard', 2),
    ('os_version_windows', N'Windows Server 2022 Datacenter', 3), ('os_version_windows', N'Windows Server 2022 Standard', 4),
    ('os_version_windows', N'Windows Server 2019 Datacenter', 5), ('os_version_windows', N'Windows Server 2019 Standard', 6),
    ('os_version_windows', N'Windows Server 2016 Datacenter', 7), ('os_version_windows', N'Windows Server 2016 Standard', 8),
    ('os_version_windows', N'Windows Server 2012 R2 Datacenter', 9), ('os_version_windows', N'Windows Server 2012 R2 Standard', 10),
    ('os_version_windows', N'Windows Server 2012 Datacenter', 11), ('os_version_windows', N'Windows Server 2012 Standard', 12),
    ('os_version_windows', N'Windows Server 2008 R2 Datacenter', 13), ('os_version_windows', N'Windows Server 2008 R2 Standard', 14),
    ('os_version_windows', N'Windows Server 2008 Datacenter', 15), ('os_version_windows', N'Windows Server 2008 Standard', 16),
    ('os_version_linux', N'Ubuntu Server 24.04 LTS', 1), ('os_version_linux', N'Ubuntu Server 22.04 LTS', 2), ('os_version_linux', N'Ubuntu Server 20.04 LTS', 3),
    ('os_version_linux', N'Red Hat Enterprise Linux 9', 4), ('os_version_linux', N'Red Hat Enterprise Linux 8', 5),
    ('os_version_linux', N'Rocky Linux 9', 6), ('os_version_linux', N'Rocky Linux 8', 7),
    ('os_version_linux', N'CentOS Linux 8', 8), ('os_version_linux', N'CentOS Linux 7', 9),
    ('os_version_linux', N'Debian 12', 10), ('os_version_linux', N'Debian 11', 11)
) v(catalog_key, value, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM dbo.catalog_values c WHERE c.catalog_key = v.catalog_key AND c.value = v.value);
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
    -- Server-only specifications (catalog-backed in the UI — see dbo.catalog_values)
    cpu               NVARCHAR(150) NULL,
    cpu_cores         INT           NULL,
    memory_gb         INT           NULL,
    storage_capacity  DECIMAL(10,2) NULL,
    storage_unit      VARCHAR(2)    NULL
                      CONSTRAINT CK_hardware_storage_unit CHECK (storage_unit IS NULL OR storage_unit IN ('GB','TB')),
    storage_drive_type VARCHAR(10)  NULL,                      -- SSD/HDD/SAN/NAS
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
    warranty_expiry   DATE          NULL,                      -- one-time vendor warranty
    status            VARCHAR(20)   NOT NULL,                  -- In Stock/In Use/Maintenance/Decommissioned
    -- Current MA (Maintenance Agreement) period — locked in the UI, only the
    -- "Renew MA" action changes these; every past period is archived in
    -- dbo.hardware_ma_renewals below for cost audit.
    ma_contract_no    NVARCHAR(60)  NULL,
    ma_provider       NVARCHAR(120) NULL,
    ma_expiry_date    DATE          NULL,
    ma_cost           DECIMAL(12,2) NULL,                      -- THB only
    owner             NVARCHAR(120) NULL,
    cost_center       NVARCHAR(60)  NULL,
    remarks           NVARCHAR(400) NULL,
    created_at        DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at        DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_hardware_serial UNIQUE (serial_number)
);
GO

/* Hardware MA renewal history — one row per renewal, unlimited (never
   rotated out), so total MA spend can be audited over any time range. */
IF OBJECT_ID('dbo.hardware_ma_renewals', 'U') IS NULL
CREATE TABLE dbo.hardware_ma_renewals (
    renewal_id  VARCHAR(40)   NOT NULL PRIMARY KEY,
    hardware_id VARCHAR(20)   NOT NULL
                CONSTRAINT FK_hwrenew_hardware REFERENCES dbo.hardware(hardware_id) ON DELETE CASCADE,
    contract_no NVARCHAR(60)  NULL,
    provider    NVARCHAR(120) NULL,
    start_date  DATE          NULL,
    end_date    DATE          NOT NULL,
    cost_thb    DECIMAL(12,2) NOT NULL,
    note        NVARCHAR(400) NULL,
    renewed_by  NVARCHAR(60)  NULL,
    renewed_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
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
    system_name      NVARCHAR(120) NOT NULL,                   -- the logical system/application (can span several Server Names)
    server_name      NVARCHAR(120) NOT NULL,                   -- this specific server's name (replaces the old fqdn field)
    server_role      NVARCHAR(80)  NULL
                     CONSTRAINT FK_servers_role REFERENCES dbo.server_roles(role_name),
    os_type          VARCHAR(10)   NULL
                     CONSTRAINT CK_servers_os_type CHECK (os_type IS NULL OR os_type IN ('Windows','Linux','Other')),
    os_version       NVARCHAR(120) NULL,                       -- catalog-backed in the UI — see dbo.catalog_values
    -- Network
    ip_address       NVARCHAR(45)  NOT NULL,
    ip_management    NVARCHAR(45)  NULL,
    service_port     NVARCHAR(120) NULL,
    server_zone      NVARCHAR(30)  NULL,
    -- Capacity — Virtual only (manually set, catalog-backed); Physical
    -- servers derive their specs from dbo.hardware via hardware_id instead.
    cpu_cores        INT           NULL,
    ram_gb           INT           NULL,
    storage_unit     VARCHAR(2)    NULL
                     CONSTRAINT CK_servers_storage_unit CHECK (storage_unit IS NULL OR storage_unit IN ('GB','TB')),
    storage_gb       NVARCHAR(MAX) NULL                        -- JSON array of sizes, in storage_unit
                     CONSTRAINT CK_servers_storage_json CHECK (storage_gb IS NULL OR ISJSON(storage_gb) = 1),
    -- Lifecycle
    criticality      NVARCHAR(30)  NULL,
    environment      NVARCHAR(20)  NULL,
    status           VARCHAR(20)   NOT NULL,
    owner            NVARCHAR(120) NULL,
    remarks          NVARCHAR(400) NULL,
    created_at       DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at       DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_servers_name        UNIQUE (system_name),
    CONSTRAINT UQ_servers_server_name UNIQUE (server_name),
    CONSTRAINT UQ_servers_ip          UNIQUE (ip_address)
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
    warranty_expiry DATE          NULL,
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
    software_id     VARCHAR(20)   NULL                          -- optional — a per-Cluster/Server MA may have no Software title
                    CONSTRAINT FK_licenses_software REFERENCES dbo.software(software_id),
    license_type    VARCHAR(30)   NOT NULL
                    CONSTRAINT CK_licenses_type CHECK (license_type IN ('Perpetual','Subscription','Maintenance Agreement (MA)','OEM','Open Source')),
    license_model   VARCHAR(20)   NOT NULL
                    CONSTRAINT CK_licenses_model CHECK (license_model IN ('User','Device','Core','Server','Concurrent')),
    status          VARCHAR(20)   NOT NULL DEFAULT 'Active'
                    CONSTRAINT CK_licenses_status CHECK (status IN ('Active','Suspended','Terminated')),
    license_key     NVARCHAR(200) NULL,
    seats_total     INT           NOT NULL DEFAULT 0,
    seats_used      INT           NOT NULL DEFAULT 0,
    purchase_date   DATE          NULL,
    -- Current period — locked in the UI, only the "Renew" action changes
    -- these; every past period is archived in dbo.license_renewals below.
    agreement_no    NVARCHAR(60)  NULL,
    expiry_date     DATE          NULL,
    cost            DECIMAL(12,2) NULL,                        -- THB only
    vendor_contact  NVARCHAR(200) NULL,
    remarks         NVARCHAR(400) NULL,
    created_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
    -- Must be anchored to something: software_id set, or at least one row in
    -- dbo.license_linked_assets below — enforced in the API/app layer, since
    -- a CHECK constraint here can't see another table's rows.
);
GO

/* A License/MA can link directly to one or more Cluster/Server records
   (e.g. a per-cluster VMware vCenter subscription with no separate
   "software title" concept in this register). */
IF OBJECT_ID('dbo.license_linked_assets', 'U') IS NULL
CREATE TABLE dbo.license_linked_assets (
    license_id VARCHAR(20) NOT NULL
               CONSTRAINT FK_licasset_license REFERENCES dbo.licenses(license_id) ON DELETE CASCADE,
    asset_type VARCHAR(10) NOT NULL
               CONSTRAINT CK_licasset_type CHECK (asset_type IN ('cluster','server')),
    asset_id   VARCHAR(20) NOT NULL,
    CONSTRAINT PK_license_linked_assets PRIMARY KEY (license_id, asset_type, asset_id)
);
GO

/* License/Subscription renewal history — one row per renewal, unlimited
   (never rotated out), so total spend can be audited over any time range. */
IF OBJECT_ID('dbo.license_renewals', 'U') IS NULL
CREATE TABLE dbo.license_renewals (
    renewal_id  VARCHAR(40)   NOT NULL PRIMARY KEY,
    license_id  VARCHAR(20)   NOT NULL
                CONSTRAINT FK_licrenew_license REFERENCES dbo.licenses(license_id) ON DELETE CASCADE,
    contract_no NVARCHAR(60)  NULL,
    provider    NVARCHAR(120) NULL,
    start_date  DATE          NULL,
    end_date    DATE          NOT NULL,
    cost_thb    DECIMAL(12,2) NOT NULL,
    note        NVARCHAR(400) NULL,
    renewed_by  NVARCHAR(60)  NULL,
    renewed_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
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
   AD group membership — which AD group(s) each AD user belongs to. Backs
   group_count on dbo.ad_users and lets Permission dashboard / Access check
   resolve real folder access via server_permissions.rw_group/ro_group
   instead of a flat count.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.ad_memberships', 'U') IS NULL
CREATE TABLE dbo.ad_memberships (
    membership_id VARCHAR(20)   NOT NULL PRIMARY KEY,            -- e.g. MBR-001
    ad_user_id    VARCHAR(20)   NOT NULL
                  CONSTRAINT FK_admember_user REFERENCES dbo.ad_users(ad_user_id),
    group_name    NVARCHAR(150) NOT NULL,
    created_at    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_admember_user_group UNIQUE (ad_user_id, group_name)
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
               CONSTRAINT CK_auditlog_action CHECK (action IN ('Create','Update','Delete','Restore','Renew','RenewMA')),
    username   NVARCHAR(60)  NULL,
    changed_at DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------------------------------------------------------------------------
   Per-record version snapshots — the last 3 versions of every record on
   every module, used by the History modal to show a field-level diff
   between versions (old value in red, new value in green). Deliberately
   capped to 3 per (table_key, record_id) in the app layer (oldest rotates
   out) — unlike audit_log/recycle_bin above, this is not meant to be an
   unlimited archive.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.record_versions', 'U') IS NULL
CREATE TABLE dbo.record_versions (
    version_id    VARCHAR(40)   NOT NULL PRIMARY KEY,
    table_key     VARCHAR(40)   NOT NULL,
    record_id     VARCHAR(20)   NULL,
    snapshot_json NVARCHAR(MAX) NOT NULL
                  CONSTRAINT CK_recordversions_json CHECK (ISJSON(snapshot_json) = 1),
    username      NVARCHAR(60)  NULL,
    changed_at    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
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
                                                                -- inv_ad_users, inv_audit_log, inv_recycle_bin,
                                                                -- inv_catalogs, inv_record_versions, ...
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
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_recordversions_record')
    CREATE INDEX IX_recordversions_record ON dbo.record_versions(table_key, record_id, changed_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_hwrenew_hardware')
    CREATE INDEX IX_hwrenew_hardware ON dbo.hardware_ma_renewals(hardware_id, renewed_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_licrenew_license')
    CREATE INDEX IX_licrenew_license ON dbo.license_renewals(license_id, renewed_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_licasset_asset')
    CREATE INDEX IX_licasset_asset ON dbo.license_linked_assets(asset_type, asset_id);
GO
