/* =============================================================================
   IS-Inventory v2 — 03: Physical assets (hardware, clusters, servers)

   Three v1 problems are fixed here:

   1. hardware kept its location as four loose strings (site / location /
      rack_number / u_position) while network_devices already had a proper
      location_id FK. "HDC", "hdc" and "HDC " were three different places, so
      any per-site report — or per-site permission — was built on sand.
      Both tables now point at dbo.locations.

   2. servers.host_ref packed two foreign keys into one string
      ("CLU-001::NODE-005") and hardware.used_with held a JSON array of
      "cluster:X" / "server:Y". Neither could be enforced: delete the cluster
      and the references silently pointed at nothing. They are real columns
      and a real junction table now.

   3. warranty_expiry was free text the user could contradict. It is a
      PERSISTED computed column — commission_date + warranty_years, the same
      arithmetic the form shows — so the stored value cannot drift from the
      rule.
   ============================================================================= */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ---------------------------------------------------------------------------
   Hardware — physical boxes (Server chassis or Storage array)
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.hardware', 'U') IS NULL
CREATE TABLE dbo.hardware (
    hardware_id        VARCHAR(20)   NOT NULL CONSTRAINT PK_hardware PRIMARY KEY,   -- HW-001
    asset_type         VARCHAR(10)   NOT NULL
                       CONSTRAINT CK_hardware_type CHECK (asset_type IN ('Server','Storage')),

    -- Storage-only identity
    storage_name       NVARCHAR(120) NULL,
    storage_array_type VARCHAR(10)   NULL
                       CONSTRAINT CK_hardware_array_type
                       CHECK (storage_array_type IS NULL OR storage_array_type IN ('SAN','NAS','DAS','Other')),
    capacity_gb        INT           NULL,

    -- Common identity
    manufacturer       NVARCHAR(60)  NULL,
    model              NVARCHAR(120) NULL,
    serial_number      NVARCHAR(120) NOT NULL,

    -- Server-only specifications (catalog-backed in the UI)
    cpu                NVARCHAR(150) NULL,
    cpu_cores          INT           NULL,
    memory_gb          INT           NULL,
    storage_capacity   DECIMAL(10,2) NULL,
    storage_unit       VARCHAR(2)    NULL
                       CONSTRAINT CK_hardware_storage_unit
                       CHECK (storage_unit IS NULL OR storage_unit IN ('GB','TB')),
    storage_drive_type VARCHAR(10)   NULL
                       CONSTRAINT CK_hardware_drive_type
                       CHECK (storage_drive_type IS NULL OR storage_drive_type IN ('SSD','HDD','SAN','NAS')),

    -- Server-only switch port
    port_no            NVARCHAR(60)  NULL,
    port_name          NVARCHAR(60)  NULL,

    /* Location: a Rack row in dbo.locations, plus where in that rack.
       rack_u_start/rack_u_size replace the old free-text u_position so the
       API can answer "is U20-U21 of rack A12 already taken?" before saving. */
    location_id        VARCHAR(20)   NULL
                       CONSTRAINT FK_hardware_location REFERENCES dbo.locations(location_id),
    rack_u_start       INT           NULL
                       CONSTRAINT CK_hardware_u_start CHECK (rack_u_start IS NULL OR rack_u_start BETWEEN 1 AND 60),
    rack_u_size        INT           NULL
                       CONSTRAINT CK_hardware_u_size CHECK (rack_u_size IS NULL OR rack_u_size BETWEEN 1 AND 20),

    -- Lifecycle. warranty_expiry is derived, never typed.
    commission_date    DATE          NULL,
    warranty_years     TINYINT       NULL
                       CONSTRAINT CK_hardware_warranty_years
                       CHECK (warranty_years IS NULL OR warranty_years BETWEEN 1 AND 5),
    warranty_expiry    AS (dbo.fn_WarrantyExpiry(commission_date, warranty_years)) PERSISTED,
    eol_date           DATE          NULL,

    status             VARCHAR(20)   NOT NULL
                       CONSTRAINT CK_hardware_status
                       CHECK (status IN ('In Stock','In Use','Maintenance','Decommissioned')),

    /* Current MA period. Locked in the UI — only the "Renew MA" action moves
       it, and every superseded period is kept in hardware_ma_renewals. */
    ma_contract_no     NVARCHAR(60)  NULL,
    ma_provider        NVARCHAR(120) NULL,
    ma_expiry_date     DATE          NULL,
    ma_cost_thb        DECIMAL(12,2) NULL,   -- THB only; v1 carried a currency column, see 05

    owner              NVARCHAR(120) NULL,
    cost_center        NVARCHAR(60)  NULL,
    remarks            NVARCHAR(400) NULL,

    is_deleted         BIT           NOT NULL DEFAULT 0,
    deleted_at         DATETIME2(0)  NULL,
    deleted_by         VARCHAR(20)   NULL CONSTRAINT FK_hardware_deletedby REFERENCES dbo.app_users(user_id),
    created_at         DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by         VARCHAR(20)   NULL CONSTRAINT FK_hardware_createdby REFERENCES dbo.app_users(user_id),
    updated_at         DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by         VARCHAR(20)   NULL CONSTRAINT FK_hardware_updatedby REFERENCES dbo.app_users(user_id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_hardware_serial' AND object_id = OBJECT_ID('dbo.hardware'))
CREATE UNIQUE INDEX UQ_hardware_serial ON dbo.hardware(serial_number) WHERE is_deleted = 0;
GO

/* ---------------------------------------------------------------------------
   MA renewal history — every past maintenance period, for cost audit
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.hardware_ma_renewals', 'U') IS NULL
CREATE TABLE dbo.hardware_ma_renewals (
    renewal_id  VARCHAR(20)   NOT NULL CONSTRAINT PK_hw_ma_renewals PRIMARY KEY,  -- MAR-001
    hardware_id VARCHAR(20)   NOT NULL
                CONSTRAINT FK_hwrenew_hardware REFERENCES dbo.hardware(hardware_id) ON DELETE CASCADE,
    contract_no NVARCHAR(60)  NULL,
    provider    NVARCHAR(120) NULL,
    start_date  DATE          NULL,
    end_date    DATE          NOT NULL,
    cost_thb    DECIMAL(12,2) NOT NULL,
    note        NVARCHAR(400) NULL,
    renewed_by  VARCHAR(20)   NULL CONSTRAINT FK_hwrenew_user REFERENCES dbo.app_users(user_id),
    renewed_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_hwrenew_period CHECK (start_date IS NULL OR end_date >= start_date)
);
GO

/* ---------------------------------------------------------------------------
   Clusters and their nodes
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.clusters', 'U') IS NULL
CREATE TABLE dbo.clusters (
    cluster_id          VARCHAR(20)   NOT NULL CONSTRAINT PK_clusters PRIMARY KEY,  -- CLU-001
    cluster_name        NVARCHAR(120) NOT NULL,
    hypervisor_platform NVARCHAR(40)  NULL,
    infrastructure_type NVARCHAR(60)  NULL,
    management_console  NVARCHAR(45)  NULL,
    criticality         NVARCHAR(30)  NULL,
    environment         NVARCHAR(20)  NULL,
    status              VARCHAR(20)   NOT NULL,
    owner               NVARCHAR(120) NULL,
    remarks             NVARCHAR(400) NULL,

    is_deleted          BIT           NOT NULL DEFAULT 0,
    deleted_at          DATETIME2(0)  NULL,
    deleted_by          VARCHAR(20)   NULL CONSTRAINT FK_clusters_deletedby REFERENCES dbo.app_users(user_id),
    created_at          DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(20)   NULL CONSTRAINT FK_clusters_createdby REFERENCES dbo.app_users(user_id),
    updated_at          DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(20)   NULL CONSTRAINT FK_clusters_updatedby REFERENCES dbo.app_users(user_id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_clusters_name' AND object_id = OBJECT_ID('dbo.clusters'))
CREATE UNIQUE INDEX UQ_clusters_name ON dbo.clusters(cluster_name) WHERE is_deleted = 0;
GO

IF OBJECT_ID('dbo.cluster_nodes', 'U') IS NULL
CREATE TABLE dbo.cluster_nodes (
    node_id     VARCHAR(20)   NOT NULL CONSTRAINT PK_cluster_nodes PRIMARY KEY,  -- NOD-001
    cluster_id  VARCHAR(20)   NOT NULL
                CONSTRAINT FK_nodes_cluster REFERENCES dbo.clusters(cluster_id) ON DELETE CASCADE,
    /* One physical box backs at most one node. Enforced by the filtered
       unique index below rather than a plain UNIQUE, so several nodes may
       legitimately have no hardware assigned yet (NULL). */
    hardware_id VARCHAR(20)   NULL
                CONSTRAINT FK_nodes_hardware REFERENCES dbo.hardware(hardware_id),
    host_name   NVARCHAR(120) NOT NULL,
    created_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_nodes_cluster_host UNIQUE (cluster_id, host_name)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_nodes_hardware' AND object_id = OBJECT_ID('dbo.cluster_nodes'))
CREATE UNIQUE INDEX UQ_nodes_hardware ON dbo.cluster_nodes(hardware_id) WHERE hardware_id IS NOT NULL;
GO

/* ---------------------------------------------------------------------------
   Servers — the logical systems, virtual or physical
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.servers', 'U') IS NULL
CREATE TABLE dbo.servers (
    server_id      VARCHAR(20)   NOT NULL CONSTRAINT PK_servers PRIMARY KEY,   -- SRV-001
    hosting_type   VARCHAR(10)   NOT NULL
                   CONSTRAINT CK_servers_hosting CHECK (hosting_type IN ('Virtual','Physical')),

    /* v1: host_ref VARCHAR(80) holding "<cluster_id>::<node_id>". Now two
       real foreign keys the database can actually enforce. */
    cluster_id     VARCHAR(20)   NULL
                   CONSTRAINT FK_servers_cluster REFERENCES dbo.clusters(cluster_id),
    node_id        VARCHAR(20)   NULL
                   CONSTRAINT FK_servers_node REFERENCES dbo.cluster_nodes(node_id),
    hardware_id    VARCHAR(20)   NULL
                   CONSTRAINT FK_servers_hardware REFERENCES dbo.hardware(hardware_id),

    /* A Virtual server runs on a cluster node and owns no chassis;
       a Physical server owns a chassis and sits on no node. */
    CONSTRAINT CK_servers_hosting_shape CHECK (
        (hosting_type = 'Virtual'  AND hardware_id IS NULL AND cluster_id IS NOT NULL)
     OR (hosting_type = 'Physical' AND cluster_id  IS NULL AND node_id IS NULL)
    ),

    system_group   NVARCHAR(120) NULL,
    system_name    NVARCHAR(120) NOT NULL,   -- logical system; may span several servers
    server_name    NVARCHAR(120) NOT NULL,   -- this specific host
    server_role    NVARCHAR(80)  NULL
                   CONSTRAINT FK_servers_role REFERENCES dbo.server_roles(role_name),
    os_type        VARCHAR(10)   NULL
                   CONSTRAINT CK_servers_os_type
                   CHECK (os_type IS NULL OR os_type IN ('Windows','Linux','Other')),
    os_version     NVARCHAR(120) NULL,

    service_port   NVARCHAR(120) NULL,
    server_zone    NVARCHAR(30)  NULL,

    /* Capacity — Virtual only. A Physical server's specs come from
       dbo.hardware through hardware_id, so they are never stored twice. */
    cpu_cores      INT           NULL,
    ram_gb         INT           NULL,

    criticality    NVARCHAR(30)  NULL,
    environment    NVARCHAR(20)  NULL,
    status         VARCHAR(20)   NOT NULL,
    owner          NVARCHAR(120) NULL,
    remarks        NVARCHAR(400) NULL,

    is_deleted     BIT           NOT NULL DEFAULT 0,
    deleted_at     DATETIME2(0)  NULL,
    deleted_by     VARCHAR(20)   NULL CONSTRAINT FK_servers_deletedby REFERENCES dbo.app_users(user_id),
    created_at     DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by     VARCHAR(20)   NULL CONSTRAINT FK_servers_createdby REFERENCES dbo.app_users(user_id),
    updated_at     DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by     VARCHAR(20)   NULL CONSTRAINT FK_servers_updatedby REFERENCES dbo.app_users(user_id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_servers_server_name' AND object_id = OBJECT_ID('dbo.servers'))
CREATE UNIQUE INDEX UQ_servers_server_name ON dbo.servers(server_name) WHERE is_deleted = 0;
GO

/* Disks: v1 kept them as a JSON array in servers.storage_gb, so "total
   storage across production" needed JSON parsing. One row per disk instead. */
IF OBJECT_ID('dbo.server_disks', 'U') IS NULL
CREATE TABLE dbo.server_disks (
    disk_id      VARCHAR(20)   NOT NULL CONSTRAINT PK_server_disks PRIMARY KEY,  -- DSK-001
    server_id    VARCHAR(20)   NOT NULL
                 CONSTRAINT FK_disks_server REFERENCES dbo.servers(server_id) ON DELETE CASCADE,
    drive_letter NVARCHAR(10)  NULL,          -- 'C:' / '/var'
    capacity     DECIMAL(10,2) NOT NULL,
    unit         VARCHAR(2)    NOT NULL DEFAULT 'GB'
                 CONSTRAINT CK_disks_unit CHECK (unit IN ('GB','TB')),
    /* Normalised to GB so SUM() across mixed units is meaningful. */
    capacity_gb  AS (CASE WHEN unit = 'TB' THEN capacity * 1024 ELSE capacity END) PERSISTED,
    sort_order   INT           NOT NULL DEFAULT 0,
    created_at   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------------------------------------------------------------------------
   Which clusters/servers consume a given Storage array (was: used_with JSON)
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.hardware_usage', 'U') IS NULL
CREATE TABLE dbo.hardware_usage (
    usage_id    VARCHAR(20) NOT NULL CONSTRAINT PK_hardware_usage PRIMARY KEY,  -- HWU-001
    hardware_id VARCHAR(20) NOT NULL
                CONSTRAINT FK_hwusage_hardware REFERENCES dbo.hardware(hardware_id) ON DELETE CASCADE,
    cluster_id  VARCHAR(20) NULL
                CONSTRAINT FK_hwusage_cluster REFERENCES dbo.clusters(cluster_id),
    server_id   VARCHAR(20) NULL
                CONSTRAINT FK_hwusage_server REFERENCES dbo.servers(server_id),
    created_at  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),

    /* Exactly one consumer per row — the relational stand-in for the
       "cluster:X" / "server:Y" prefixes v1 encoded into strings. */
    CONSTRAINT CK_hwusage_one_target CHECK (
        (CASE WHEN cluster_id IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN server_id  IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_hwusage_cluster' AND object_id = OBJECT_ID('dbo.hardware_usage'))
CREATE UNIQUE INDEX UQ_hwusage_cluster ON dbo.hardware_usage(hardware_id, cluster_id) WHERE cluster_id IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_hwusage_server' AND object_id = OBJECT_ID('dbo.hardware_usage'))
CREATE UNIQUE INDEX UQ_hwusage_server ON dbo.hardware_usage(hardware_id, server_id) WHERE server_id IS NOT NULL;
GO
