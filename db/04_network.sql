/* =============================================================================
   IS-Inventory v2 — 04: Network and IP address management

   v1 scattered IP addresses across four tables as NVARCHAR(45):
   servers.ip_address, servers.ip_management, cluster_nodes.ip_host,
   cluster_nodes.ip_management, network_devices.ip_management, plus
   vlans.gateway and vlans.dhcp_server. Only two of those were UNIQUE, and
   only within their own table — so 10.10.120.50 could be a server's address
   and a switch's management address at the same time and nothing complained.

   Here every address in the estate is one row in dbo.ip_allocations with a
   UNIQUE constraint across the whole system. The owning tables no longer
   carry IP columns at all; 09_views.sql exposes each asset's primary address
   so day-to-day queries stay short.

   Addresses are BIGINT (see 01_functions.sql). That is what lets
   "everything in 10.10.120.0/24" be a range scan, and what lets the DHCP
   pool be computed by the database instead of trusted from the browser.
   ============================================================================= */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ---------------------------------------------------------------------------
   VLANs / subnets
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.vlans', 'U') IS NULL
CREATE TABLE dbo.vlans (
    vlan_id_pk       VARCHAR(20)   NOT NULL CONSTRAINT PK_vlans PRIMARY KEY,   -- VLA-001
    vlan_id          INT           NOT NULL
                     CONSTRAINT CK_vlans_tag CHECK (vlan_id BETWEEN 1 AND 4094),
    vlan_name        NVARCHAR(80)  NOT NULL,
    purpose          NVARCHAR(120) NULL,

    /* The subnet, stored as a number + prefix length rather than two dotted
       strings. subnet_mask is still exposed for the UI, derived not typed. */
    network_num      BIGINT        NOT NULL,
    prefix_len       TINYINT       NOT NULL
                     CONSTRAINT CK_vlans_prefix CHECK (prefix_len BETWEEN 8 AND 32),

    network_address  AS (dbo.fn_IntToIp(network_num))        PERSISTED,
    subnet_mask      AS (dbo.fn_PrefixToMask(prefix_len))    PERSISTED,
    broadcast_num    AS (dbo.fn_Broadcast(network_num, prefix_len))   PERSISTED,
    first_usable_num AS (dbo.fn_FirstUsable(network_num, prefix_len)) PERSISTED,
    last_usable_num  AS (dbo.fn_LastUsable(network_num, prefix_len))  PERSISTED,
    usable_count     AS (dbo.fn_LastUsable(network_num, prefix_len)
                       - dbo.fn_FirstUsable(network_num, prefix_len) + 1) PERSISTED,

    /* network_num must actually be the network address for this prefix —
       10.10.10.5/24 is a typo, not a subnet. */
    CONSTRAINT CK_vlans_is_network_address CHECK (
        network_num = network_num & (CAST(4294967295 AS BIGINT) - (LEFT_SHIFT(CAST(1 AS BIGINT), 32 - prefix_len) - 1))
    ),

    gateway_num      BIGINT        NULL,
    gateway_device   NVARCHAR(40)  NULL,
    firewall_zone    NVARCHAR(30)  NULL,
    routing          NVARCHAR(120) NULL,

    /* Reserved static block — optional. When set, DHCP starts after it. */
    static_start_num BIGINT        NULL,
    static_end_num   BIGINT        NULL,
    CONSTRAINT CK_vlans_static_order CHECK (
        static_start_num IS NULL OR static_end_num IS NULL OR static_end_num >= static_start_num
    ),

    /* DHCP. Defaults to off; the form hides every DHCP field until it is on. */
    dhcp_enabled     BIT           NOT NULL DEFAULT 0,
    dhcp_server_num  BIGINT        NULL,

    /* Derived, never typed — the form renders these read-only. NULL when the
       subnet has no room left once gateway and static block are excluded,
       which is the condition the save-time validation reports. */
    dhcp_start_num   AS (CASE WHEN dhcp_enabled = 1
                              THEN dbo.fn_DhcpStart(network_num, prefix_len, gateway_num,
                                                    static_start_num, static_end_num)
                         END) PERSISTED,
    dhcp_end_num     AS (CASE WHEN dhcp_enabled = 1
                              THEN dbo.fn_LastUsable(network_num, prefix_len)
                         END) PERSISTED,

    /* A DHCP-enabled VLAN must name the server handing out the leases. */
    CONSTRAINT CK_vlans_dhcp_server CHECK (dhcp_enabled = 0 OR dhcp_server_num IS NOT NULL),

    is_deleted       BIT           NOT NULL DEFAULT 0,
    deleted_at       DATETIME2(0)  NULL,
    deleted_by       VARCHAR(20)   NULL CONSTRAINT FK_vlans_deletedby REFERENCES dbo.app_users(user_id),
    created_at       DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by       VARCHAR(20)   NULL CONSTRAINT FK_vlans_createdby REFERENCES dbo.app_users(user_id),
    updated_at       DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by       VARCHAR(20)   NULL CONSTRAINT FK_vlans_updatedby REFERENCES dbo.app_users(user_id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_vlans_tag' AND object_id = OBJECT_ID('dbo.vlans'))
CREATE UNIQUE INDEX UQ_vlans_tag ON dbo.vlans(vlan_id) WHERE is_deleted = 0;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_vlans_name' AND object_id = OBJECT_ID('dbo.vlans'))
CREATE UNIQUE INDEX UQ_vlans_name ON dbo.vlans(vlan_name) WHERE is_deleted = 0;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_vlans_network' AND object_id = OBJECT_ID('dbo.vlans'))
CREATE UNIQUE INDEX UQ_vlans_network ON dbo.vlans(network_num, prefix_len) WHERE is_deleted = 0;
GO

/* ---------------------------------------------------------------------------
   Network devices — switches, routers, firewalls, APs
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.network_devices', 'U') IS NULL
CREATE TABLE dbo.network_devices (
    device_id       VARCHAR(20)   NOT NULL CONSTRAINT PK_network_devices PRIMARY KEY,  -- NET-001
    status          VARCHAR(20)   NOT NULL
                    CONSTRAINT CK_netdev_status CHECK (status IN ('Use','Standby','Decommissioned')),
    category        NVARCHAR(60)  NOT NULL,
    subcategory     NVARCHAR(60)  NOT NULL,
    device_name     NVARCHAR(120) NOT NULL,
    brand           NVARCHAR(40)  NULL,
    model           NVARCHAR(120) NULL,
    serial_number   NVARCHAR(120) NOT NULL,
    fixed_asset     NVARCHAR(60)  NULL,
    description     NVARCHAR(400) NULL,
    network_zone    NVARCHAR(30)  NULL,
    device_role     VARCHAR(4)    NULL
                    CONSTRAINT CK_netdev_role CHECK (device_role IS NULL OR device_role IN ('L2','L3')),
    detail          NVARCHAR(120) NULL,

    stack_enabled   BIT           NOT NULL DEFAULT 0,
    stack_id        VARCHAR(10)   NULL,
    stack_role      NVARCHAR(20)  NULL,
    CONSTRAINT CK_netdev_stack_shape CHECK (stack_enabled = 1 OR (stack_id IS NULL AND stack_role IS NULL)),

    /* Optional since the v1 UI change — plenty of gear is catalogued before
       anyone walks over to read the MAC off the label. Format-checked when
       present; the filtered index below keeps it unique among live rows.
       REGEXP_LIKE is SQL Server 2025+. On 2022 swap the constraint for:
         CHECK (mac_address IS NULL OR mac_address LIKE
                '[0-9A-Fa-f][0-9A-Fa-f]:[0-9A-Fa-f][0-9A-Fa-f]:[0-9A-Fa-f][0-9A-Fa-f]:[0-9A-Fa-f][0-9A-Fa-f]:[0-9A-Fa-f][0-9A-Fa-f]:[0-9A-Fa-f][0-9A-Fa-f]') */
    mac_address     NVARCHAR(20)  NULL
                    CONSTRAINT CK_netdev_mac_format
                    CHECK (mac_address IS NULL OR REGEXP_LIKE(mac_address, '^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$')),

    location_id     VARCHAR(20)   NULL
                    CONSTRAINT FK_netdev_location REFERENCES dbo.locations(location_id),
    rack_u_start    INT           NULL,

    commission_date DATE          NULL,
    warranty_years  TINYINT       NULL
                    CONSTRAINT CK_netdev_warranty_years
                    CHECK (warranty_years IS NULL OR warranty_years BETWEEN 1 AND 5),
    warranty_expiry AS (dbo.fn_WarrantyExpiry(commission_date, warranty_years)) PERSISTED,
    eol_date        DATE          NULL,

    is_deleted      BIT           NOT NULL DEFAULT 0,
    deleted_at      DATETIME2(0)  NULL,
    deleted_by      VARCHAR(20)   NULL CONSTRAINT FK_netdev_deletedby REFERENCES dbo.app_users(user_id),
    created_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by      VARCHAR(20)   NULL CONSTRAINT FK_netdev_createdby REFERENCES dbo.app_users(user_id),
    updated_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by      VARCHAR(20)   NULL CONSTRAINT FK_netdev_updatedby REFERENCES dbo.app_users(user_id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_netdev_serial' AND object_id = OBJECT_ID('dbo.network_devices'))
CREATE UNIQUE INDEX UQ_netdev_serial ON dbo.network_devices(serial_number) WHERE is_deleted = 0;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_netdev_name' AND object_id = OBJECT_ID('dbo.network_devices'))
CREATE UNIQUE INDEX UQ_netdev_name ON dbo.network_devices(device_name) WHERE is_deleted = 0;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_netdev_mac' AND object_id = OBJECT_ID('dbo.network_devices'))
CREATE UNIQUE INDEX UQ_netdev_mac ON dbo.network_devices(mac_address) WHERE mac_address IS NOT NULL AND is_deleted = 0;
GO

/* ---------------------------------------------------------------------------
   IP allocations — the single registry of every address in the estate
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.ip_allocations', 'U') IS NULL
CREATE TABLE dbo.ip_allocations (
    /* Surrogate BIGINT rather than the 'IPA-001' style used elsewhere: these
       rows are plumbing generated in bulk, never quoted by a person the way
       "SRV-042" is. */
    alloc_id     BIGINT        IDENTITY(1,1) CONSTRAINT PK_ip_allocations PRIMARY KEY,
    ip_num       BIGINT        NOT NULL,
    ip_address   AS (dbo.fn_IntToIp(ip_num)) PERSISTED,

    vlan_id_pk   VARCHAR(20)   NULL
                 CONSTRAINT FK_ipalloc_vlan REFERENCES dbo.vlans(vlan_id_pk),

    assign_type  VARCHAR(10)   NOT NULL DEFAULT 'Static'
                 CONSTRAINT CK_ipalloc_assign CHECK (assign_type IN ('Static','DHCP','Reserved')),
    purpose      VARCHAR(20)   NOT NULL DEFAULT 'service'
                 CONSTRAINT CK_ipalloc_purpose
                 CHECK (purpose IN ('service','management','gateway','vip','dhcp-server','other')),

    /* Polymorphic ownership done with real foreign keys: one nullable column
       per possible owner, and a CHECK that at most one is filled. A single
       "owner_table + owner_id" pair would have been shorter but would carry
       no referential integrity at all — which is exactly how v1 lost track of
       software allocations when a server was renamed. */
    server_id    VARCHAR(20)   NULL CONSTRAINT FK_ipalloc_server REFERENCES dbo.servers(server_id),
    device_id    VARCHAR(20)   NULL CONSTRAINT FK_ipalloc_device REFERENCES dbo.network_devices(device_id),
    node_id      VARCHAR(20)   NULL CONSTRAINT FK_ipalloc_node   REFERENCES dbo.cluster_nodes(node_id),
    hardware_id  VARCHAR(20)   NULL CONSTRAINT FK_ipalloc_hw     REFERENCES dbo.hardware(hardware_id),

    CONSTRAINT CK_ipalloc_one_owner CHECK (
        (CASE WHEN server_id   IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN device_id   IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN node_id     IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN hardware_id IS NOT NULL THEN 1 ELSE 0 END) <= 1
    ),

    hostname     NVARCHAR(120) NULL,
    remarks      NVARCHAR(400) NULL,
    created_at   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by   VARCHAR(20)   NULL CONSTRAINT FK_ipalloc_createdby REFERENCES dbo.app_users(user_id),
    updated_at   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by   VARCHAR(20)   NULL CONSTRAINT FK_ipalloc_updatedby REFERENCES dbo.app_users(user_id),

    /* The whole point: an address belongs to one thing, estate-wide. */
    CONSTRAINT UQ_ipalloc_address UNIQUE (ip_num)
);
GO

/* An IP has to sit inside the subnet it claims to belong to. A CHECK
   constraint cannot read another table, so this is a trigger — kept to the
   one rule it exists for, and set-based so a bulk insert stays one statement. */
CREATE OR ALTER TRIGGER dbo.trg_ip_allocations_in_subnet
ON dbo.ip_allocations
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
          FROM inserted i
          JOIN dbo.vlans v ON v.vlan_id_pk = i.vlan_id_pk
         WHERE i.ip_num NOT BETWEEN v.network_num AND v.broadcast_num
    )
    BEGIN
        THROW 50001, 'IP address falls outside the network range of the VLAN it is assigned to.', 1;
    END
END;
GO
