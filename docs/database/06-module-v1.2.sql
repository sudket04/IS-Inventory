/* ============================================================================
   KKND — IT Inventory Management System
   Module v1.2 : Device Classification · Storage & Cluster · DHCP Source Control

   Requires: 02-schema-sqlserver.sql และ 04-vlan-module.sql ต้องรันสำเร็จก่อน

   โมดูลนี้ตอบ 3 ความต้องการ
   -------------------------
   1. แบ่งประเภทบทบาทของ Server (File / DHCP / Database / Application ...)
      และจัดกลุ่มอุปกรณ์ Network (Network Device / Network Security Device / ...)
   2. เก็บข้อมูล Storage ให้รองรับ Cluster VM, Veeam Backup และ Shared Storage
   3. จำกัดรายการอุปกรณ์ DHCP และ Gateway ให้เลือกได้เฉพาะเครื่องที่เข้าข่ายจริง

   สิ่งที่เพิ่ม : 6 ตาราง · 6 View · 3 Trigger
   ========================================================================== */


/* ============================================================================
   ส่วนที่ 1 — บทบาทของ Server (Server Roles)
   เซิร์ฟเวอร์ 1 เครื่องมีได้หลายบทบาทพร้อมกัน จึงออกแบบเป็นความสัมพันธ์ M:N
   ========================================================================== */

CREATE TABLE dbo.server_roles (
    server_role_id      INT            IDENTITY(1,1) NOT NULL,
    code                VARCHAR(30)    NOT NULL,
    name                NVARCHAR(80)   NOT NULL,
    role_group          VARCHAR(20)    NOT NULL,   -- INFRASTRUCTURE / DATA / APPLICATION / SECURITY / BACKUP / MANAGEMENT
    description         NVARCHAR(300)  NULL,
    is_dhcp_provider    BIT            NOT NULL CONSTRAINT DF_srvrole_dhcp DEFAULT (0),  -- ⭐ ใช้กรองรายการ DHCP
    is_critical_service BIT            NOT NULL CONSTRAINT DF_srvrole_crit DEFAULT (0),  -- บริการที่ล่มแล้วกระทบทั้งองค์กร
    icon_name           VARCHAR(50)    NULL,
    sort_order          INT            NOT NULL CONSTRAINT DF_srvrole_sort DEFAULT (0),
    is_active           BIT            NOT NULL CONSTRAINT DF_srvrole_active DEFAULT (1),
    CONSTRAINT PK_server_roles PRIMARY KEY CLUSTERED (server_role_id),
    CONSTRAINT UX_server_roles_code UNIQUE (code),
    CONSTRAINT CK_server_roles_group CHECK (role_group IN
        ('INFRASTRUCTURE','DATA','APPLICATION','SECURITY','BACKUP','MANAGEMENT'))
);
GO

CREATE TABLE dbo.server_role_assignments (
    assignment_id   INT            IDENTITY(1,1) NOT NULL,
    asset_id        INT            NOT NULL,
    server_role_id  INT            NOT NULL,
    is_primary      BIT            NOT NULL CONSTRAINT DF_srvra_primary DEFAULT (0),
    service_name    NVARCHAR(150)  NULL,   -- เช่น ชื่อ Instance ของ SQL Server หรือชื่อ Application
    service_port    NVARCHAR(50)   NULL,
    notes           NVARCHAR(300)  NULL,
    created_at      DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_srvra_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by      INT            NULL,
    CONSTRAINT PK_server_role_assignments PRIMARY KEY CLUSTERED (assignment_id),
    CONSTRAINT UX_server_role_assignments UNIQUE (asset_id, server_role_id),
    CONSTRAINT FK_srvra_asset      FOREIGN KEY (asset_id)       REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_srvra_role       FOREIGN KEY (server_role_id) REFERENCES dbo.server_roles(server_role_id),
    CONSTRAINT FK_srvra_created_by FOREIGN KEY (created_by)     REFERENCES dbo.users(user_id)
);
GO

-- เซิร์ฟเวอร์หนึ่งเครื่องมีบทบาทหลักได้เพียงบทบาทเดียว ใช้เป็นชื่อกำกับในตารางรายการ
CREATE UNIQUE INDEX UX_server_primary_role
    ON dbo.server_role_assignments(asset_id) WHERE is_primary = 1;
CREATE INDEX IX_srvra_role ON dbo.server_role_assignments(server_role_id);
GO


/* ============================================================================
   ส่วนที่ 2 — ประเภทอุปกรณ์เครือข่าย พร้อมการจัดกลุ่ม
   แทนที่ CHECK Constraint แบบตายตัวเดิมด้วย Lookup Table ที่ Admin เพิ่มเองได้
   ========================================================================== */

CREATE TABLE dbo.network_device_types (
    device_type_id      INT            IDENTITY(1,1) NOT NULL,
    code                VARCHAR(30)    NOT NULL,
    name                NVARCHAR(80)   NOT NULL,
    device_class        VARCHAR(20)    NOT NULL,   -- ⭐ การจัดกลุ่มตามที่ต้องการ
    description         NVARCHAR(300)  NULL,
    is_layer3           BIT            NOT NULL CONSTRAINT DF_ndt_l3 DEFAULT (0),
    can_be_gateway      BIT            NOT NULL CONSTRAINT DF_ndt_gw DEFAULT (0),   -- ⭐ กรองรายการ Gateway
    can_provide_dhcp    BIT            NOT NULL CONSTRAINT DF_ndt_dhcp DEFAULT (0), -- ⭐ กรองรายการ DHCP
    gateway_role_code   VARCHAR(20)    NULL,   -- ค่าที่จะไปตรงกับ vlans.gateway_device_role
    dhcp_source_code    VARCHAR(20)    NULL,   -- ค่าที่จะไปตรงกับ vlans.dhcp_source_type
    icon_name           VARCHAR(50)    NULL,
    sort_order          INT            NOT NULL CONSTRAINT DF_ndt_sort DEFAULT (0),
    is_active           BIT            NOT NULL CONSTRAINT DF_ndt_active DEFAULT (1),
    CONSTRAINT PK_network_device_types PRIMARY KEY CLUSTERED (device_type_id),
    CONSTRAINT UX_network_device_types_code UNIQUE (code),
    CONSTRAINT CK_ndt_class CHECK (device_class IN
        ('NETWORK','SECURITY','WIRELESS','OPTIMIZATION','VOICE','MANAGEMENT')),
    CONSTRAINT CK_ndt_gw_code CHECK (gateway_role_code IS NULL OR gateway_role_code IN
        ('FIREWALL','CORE_SWITCH','L3_SWITCH','ROUTER','OTHER')),
    CONSTRAINT CK_ndt_dhcp_code CHECK (dhcp_source_code IS NULL OR dhcp_source_code IN
        ('FIREWALL','CORE_SWITCH','L3_SWITCH','ROUTER')),
    -- อุปกรณ์ที่เป็น Gateway ได้ ต้องระบุว่าจะไปตรงกับบทบาทใด
    CONSTRAINT CK_ndt_gw_consistency   CHECK (can_be_gateway = 0   OR gateway_role_code IS NOT NULL),
    CONSTRAINT CK_ndt_dhcp_consistency CHECK (can_provide_dhcp = 0 OR dhcp_source_code  IS NOT NULL)
);
GO


/* --- แปลง network_details.device_type จาก VARCHAR เป็น Foreign Key --- */

ALTER TABLE dbo.network_details DROP CONSTRAINT CK_network_device_type;
GO
ALTER TABLE dbo.network_details ADD device_type_id INT NULL;
GO

-- ข้อมูลตั้งต้นของประเภทอุปกรณ์ (ต้องมีก่อนย้ายข้อมูล)
INSERT INTO dbo.network_device_types
    (code, name, device_class, is_layer3, can_be_gateway, can_provide_dhcp,
     gateway_role_code, dhcp_source_code, icon_name, sort_order) VALUES
-- ===== NETWORK : อุปกรณ์เครือข่ายทั่วไป =====
 ('CORE_SWITCH',         N'Core Switch',           'NETWORK',      1,1,1,'CORE_SWITCH','CORE_SWITCH','network',      1),
 ('DISTRIBUTION_SWITCH', N'Distribution Switch',   'NETWORK',      1,1,1,'L3_SWITCH',  'L3_SWITCH',  'network',      2),
 ('L3_SWITCH',           N'Layer 3 Switch',        'NETWORK',      1,1,1,'L3_SWITCH',  'L3_SWITCH',  'network',      3),
 ('ACCESS_SWITCH',       N'Access Switch',         'NETWORK',      0,0,0,NULL,         NULL,         'network',      4),
 ('ROUTER',              N'Router',                'NETWORK',      1,1,1,'ROUTER',     'ROUTER',     'route',        5),
 ('MODEM',               N'Modem / ONU',           'NETWORK',      0,0,0,NULL,         NULL,         'router',       6),
 ('MEDIA_CONVERTER',     N'Media Converter',       'NETWORK',      0,0,0,NULL,         NULL,         'cable',        7),
-- ===== SECURITY : อุปกรณ์ความปลอดภัยเครือข่าย =====
 ('FIREWALL',            N'Firewall',              'SECURITY',     1,1,1,'FIREWALL',   'FIREWALL',   'shield',      11),
 ('UTM',                 N'UTM Appliance',         'SECURITY',     1,1,1,'FIREWALL',   'FIREWALL',   'shield',      12),
 ('IPS_IDS',             N'IPS / IDS',             'SECURITY',     0,0,0,NULL,         NULL,         'shield-alert',13),
 ('WAF',                 N'Web Application Firewall','SECURITY',   0,0,0,NULL,         NULL,         'shield-check',14),
 ('VPN_GATEWAY',         N'VPN Gateway',           'SECURITY',     1,1,0,'FIREWALL',   NULL,         'lock',        15),
 ('NAC',                 N'Network Access Control','SECURITY',     0,0,0,NULL,         NULL,         'user-check',  16),
 ('PROXY_APPLIANCE',     N'Proxy / Secure Web GW', 'SECURITY',     0,0,0,NULL,         NULL,         'globe-lock',  17),
 ('EMAIL_SECURITY_GW',   N'Email Security Gateway','SECURITY',     0,0,0,NULL,         NULL,         'mail-check',  18),
 ('DDOS_MITIGATION',     N'DDoS Mitigation',       'SECURITY',     0,0,0,NULL,         NULL,         'shield-x',    19),
-- ===== WIRELESS =====
 ('WIRELESS_AP',         N'Wireless Access Point', 'WIRELESS',     0,0,0,NULL,         NULL,         'wifi',        21),
 ('WIRELESS_CONTROLLER', N'Wireless Controller',   'WIRELESS',     1,0,1,NULL,         'L3_SWITCH',  'wifi-cog',    22),
-- ===== OPTIMIZATION =====
 ('LOAD_BALANCER',       N'Load Balancer',         'OPTIMIZATION', 1,1,0,'OTHER',      NULL,         'scale',       31),
 ('SD_WAN_EDGE',         N'SD-WAN Edge',           'OPTIMIZATION', 1,1,1,'ROUTER',     'ROUTER',     'waypoints',   32),
 ('WAN_OPTIMIZER',       N'WAN Optimizer',         'OPTIMIZATION', 0,0,0,NULL,         NULL,         'gauge',       33),
-- ===== VOICE =====
 ('IP_PBX',              N'IP-PBX',                'VOICE',        0,0,0,NULL,         NULL,         'phone',       41),
 ('VOICE_GATEWAY',       N'Voice Gateway',         'VOICE',        0,0,0,NULL,         NULL,         'phone-call',  42),
-- ===== MANAGEMENT =====
 ('KVM_SWITCH',          N'KVM Switch',            'MANAGEMENT',   0,0,0,NULL,         NULL,         'monitor-cog', 51),
 ('CONSOLE_SERVER',      N'Console / Terminal Server','MANAGEMENT',0,0,0,NULL,         NULL,         'terminal',    52),
 ('OTHER_NETWORK',       N'Other Network Device',  'NETWORK',      0,0,0,NULL,         NULL,         'network',     99);
GO

-- ย้ายข้อมูลเดิม (ไม่มีผลหากยังไม่มีข้อมูล)
UPDATE nd
   SET device_type_id = t.device_type_id
FROM dbo.network_details nd
    INNER JOIN dbo.network_device_types t
        ON t.code = CASE nd.device_type
                        WHEN 'SWITCH'        THEN 'ACCESS_SWITCH'
                        WHEN 'ACCESS_POINT'  THEN 'WIRELESS_AP'
                        WHEN 'OTHER'         THEN 'OTHER_NETWORK'
                        ELSE nd.device_type
                    END;
GO

ALTER TABLE dbo.network_details ALTER COLUMN device_type_id INT NOT NULL;
GO
ALTER TABLE dbo.network_details
    ADD CONSTRAINT FK_network_device_type FOREIGN KEY (device_type_id)
        REFERENCES dbo.network_device_types(device_type_id);
GO
ALTER TABLE dbo.network_details DROP COLUMN device_type;
GO
CREATE INDEX IX_network_device_type ON dbo.network_details(device_type_id);
GO


/* ============================================================================
   ส่วนที่ 3 — Cluster (VM Cluster, Veeam SOBR, Database AlwaysOn ฯลฯ)
   ========================================================================== */

CREATE TABLE dbo.clusters (
    cluster_id          INT            IDENTITY(1,1) NOT NULL,
    code                VARCHAR(30)    NOT NULL,
    name                NVARCHAR(120)  NOT NULL,
    cluster_type        VARCHAR(30)    NOT NULL,
    vendor_product      NVARCHAR(120)  NULL,   -- เช่น VMware vSphere 8.0, Veeam B&R 12.1
    expected_node_count SMALLINT       NULL,
    quorum_type         VARCHAR(30)    NULL,
    management_ip       VARCHAR(45)    NULL,   -- vCenter IP หรือ Cluster VIP
    management_url      NVARCHAR(400)  NULL,
    site_location_id    INT            NULL,
    description         NVARCHAR(400)  NULL,
    is_active           BIT            NOT NULL CONSTRAINT DF_clusters_active DEFAULT (1),
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_clusters_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT            NULL,
    updated_at          DATETIMEOFFSET(3) NULL,
    updated_by          INT            NULL,
    CONSTRAINT PK_clusters PRIMARY KEY CLUSTERED (cluster_id),
    CONSTRAINT UX_clusters_code UNIQUE (code),
    CONSTRAINT FK_clusters_site       FOREIGN KEY (site_location_id) REFERENCES dbo.locations(location_id),
    CONSTRAINT FK_clusters_created_by FOREIGN KEY (created_by)       REFERENCES dbo.users(user_id),
    CONSTRAINT FK_clusters_updated_by FOREIGN KEY (updated_by)       REFERENCES dbo.users(user_id),
    CONSTRAINT CK_clusters_type CHECK (cluster_type IN
        ('VMWARE_HA','VMWARE_DRS','HYPERV_FAILOVER','WINDOWS_FAILOVER','PROXMOX','NUTANIX',
         'KUBERNETES','DB_ALWAYSON','DB_RAC','VEEAM_SOBR','STORAGE_HA','NLB','OTHER')),
    CONSTRAINT CK_clusters_quorum CHECK (quorum_type IS NULL OR quorum_type IN
        ('NODE_MAJORITY','WITNESS_DISK','FILE_SHARE_WITNESS','CLOUD_WITNESS','NONE')),
    CONSTRAINT CK_clusters_mgmt_ip CHECK (management_ip IS NULL OR dbo.fn_is_valid_ip(management_ip) = 1)
);
GO

CREATE INDEX IX_clusters_site ON dbo.clusters(site_location_id);
GO

CREATE TABLE dbo.cluster_members (
    member_id       INT            IDENTITY(1,1) NOT NULL,
    cluster_id      INT            NOT NULL,
    asset_id        INT            NOT NULL,
    member_role     VARCHAR(20)    NOT NULL,
    node_priority   SMALLINT       NULL,   -- ลำดับความสำคัญ / Preferred Owner
    joined_date     DATE           NULL,
    left_date       DATE           NULL,   -- NULL = ยังเป็นสมาชิกอยู่
    is_active       AS (CASE WHEN left_date IS NULL THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END) PERSISTED,
    notes           NVARCHAR(300)  NULL,
    created_at      DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_clmem_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by      INT            NULL,
    CONSTRAINT PK_cluster_members PRIMARY KEY CLUSTERED (member_id),
    CONSTRAINT FK_clmem_cluster    FOREIGN KEY (cluster_id) REFERENCES dbo.clusters(cluster_id),
    CONSTRAINT FK_clmem_asset      FOREIGN KEY (asset_id)   REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_clmem_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_clmem_role CHECK (member_role IN
        ('HOST','NODE','WITNESS','MANAGER','PROXY','REPOSITORY','GATEWAY','TAPE_SERVER','REPLICA')),
    CONSTRAINT CK_clmem_dates CHECK (left_date IS NULL OR joined_date IS NULL OR left_date >= joined_date)
);
GO

CREATE UNIQUE INDEX UX_cluster_members_active
    ON dbo.cluster_members(cluster_id, asset_id, member_role) WHERE left_date IS NULL;
CREATE INDEX IX_clmem_asset ON dbo.cluster_members(asset_id) WHERE left_date IS NULL;
GO


/* ============================================================================
   ส่วนที่ 4 — Storage Volume
   แทนที่ฟิลด์ storage_config แบบข้อความอิสระ ให้เก็บได้ทั้ง Local Disk,
   SAN LUN, VM Datastore, Cluster Shared Volume และ Veeam Backup Repository
   ========================================================================== */

CREATE TABLE dbo.storage_volumes (
    volume_id           INT             IDENTITY(1,1) NOT NULL,

    /* ---------- ผูกกับอะไร (ต้องมีอย่างน้อยหนึ่งอย่าง) ---------- */
    asset_id            INT             NULL,   -- เครื่องที่ถือครอง Volume นี้
    cluster_id          INT             NULL,   -- Shared Storage ของ Cluster
    provider_asset_id   INT             NULL,   -- อุปกรณ์ที่จ่าย Storage (SAN / NAS / Storage Array)

    volume_name         NVARCHAR(150)   NOT NULL,
    volume_type         VARCHAR(30)     NOT NULL,
    storage_protocol    VARCHAR(20)     NULL,
    raid_level          VARCHAR(20)     NULL,
    disk_type           VARCHAR(20)     NULL,   -- SSD / NVME / SAS / SATA / TAPE / CLOUD

    /* ---------- ความจุ ---------- */
    capacity_gb         DECIMAL(18,2)   NOT NULL,
    used_gb             DECIMAL(18,2)   NULL,
    free_gb             AS (capacity_gb - used_gb) PERSISTED,
    used_percent        AS (CAST(100.0 * used_gb / NULLIF(capacity_gb, 0) AS DECIMAL(5,1))),
    last_measured_at    DATE            NULL,

    /* ---------- คุณสมบัติเฉพาะทาง ---------- */
    mount_path          NVARCHAR(300)   NULL,   -- C:\ · /vmfs/volumes/ds01 · \\nas01\backup
    is_shared           BIT             NOT NULL CONSTRAINT DF_vol_shared DEFAULT (0),
    is_thin_provisioned BIT             NULL,
    encryption_enabled  BIT             NULL,
    immutability_days   INT             NULL,   -- Veeam Hardened Repository
    retention_days      INT             NULL,   -- นโยบายเก็บข้อมูลสำรอง
    dedup_ratio         DECIMAL(5,2)    NULL,   -- อัตราการลดขนาดข้อมูล เช่น 3.50

    notes               NVARCHAR(400)   NULL,
    is_active           BIT             NOT NULL CONSTRAINT DF_vol_active DEFAULT (1),
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_vol_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT             NULL,
    updated_at          DATETIMEOFFSET(3) NULL,
    updated_by          INT             NULL,

    CONSTRAINT PK_storage_volumes PRIMARY KEY CLUSTERED (volume_id),
    CONSTRAINT FK_vol_asset      FOREIGN KEY (asset_id)          REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_vol_cluster    FOREIGN KEY (cluster_id)        REFERENCES dbo.clusters(cluster_id),
    CONSTRAINT FK_vol_provider   FOREIGN KEY (provider_asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_vol_created_by FOREIGN KEY (created_by)        REFERENCES dbo.users(user_id),
    CONSTRAINT FK_vol_updated_by FOREIGN KEY (updated_by)        REFERENCES dbo.users(user_id),

    CONSTRAINT CK_vol_type CHECK (volume_type IN
        ('LOCAL_DISK','SAN_LUN','NAS_SHARE','VM_DATASTORE','CLUSTER_SHARED_VOLUME',
         'BACKUP_REPOSITORY','SCALE_OUT_REPOSITORY','OBJECT_STORAGE','TAPE_POOL','CLOUD_TIER')),
    CONSTRAINT CK_vol_protocol CHECK (storage_protocol IS NULL OR storage_protocol IN
        ('SAS','SATA','NVME','ISCSI','FC','FCOE','NFS','SMB','S3','LTO','LOCAL')),
    CONSTRAINT CK_vol_disk_type CHECK (disk_type IS NULL OR disk_type IN
        ('SSD','NVME','SAS','SATA','TAPE','CLOUD','MIXED')),
    CONSTRAINT CK_vol_capacity CHECK (capacity_gb > 0),
    CONSTRAINT CK_vol_used     CHECK (used_gb IS NULL OR (used_gb >= 0 AND used_gb <= capacity_gb)),
    CONSTRAINT CK_vol_immutable CHECK (immutability_days IS NULL OR immutability_days > 0),

    -- ⭐ Volume ต้องผูกกับเครื่องหรือ Cluster อย่างน้อยหนึ่งอย่าง จะลอยอิสระไม่ได้
    CONSTRAINT CK_vol_owner CHECK (asset_id IS NOT NULL OR cluster_id IS NOT NULL),

    -- Shared Volume ต้องผูกกับ Cluster เสมอ
    CONSTRAINT CK_vol_shared_cluster CHECK (is_shared = 0 OR cluster_id IS NOT NULL)
);
GO

CREATE INDEX IX_vol_asset    ON dbo.storage_volumes(asset_id)          WHERE is_active = 1;
CREATE INDEX IX_vol_cluster  ON dbo.storage_volumes(cluster_id)        WHERE is_active = 1;
CREATE INDEX IX_vol_provider ON dbo.storage_volumes(provider_asset_id) WHERE is_active = 1;
CREATE INDEX IX_vol_type     ON dbo.storage_volumes(volume_type)       WHERE is_active = 1;
GO


/* --- ยกเลิกฟิลด์ข้อความอิสระเดิม เพื่อไม่ให้มีข้อมูลสองแหล่งที่ขัดแย้งกัน --- */
ALTER TABLE dbo.server_details DROP CONSTRAINT CK_server_ram;
GO
ALTER TABLE dbo.server_details DROP COLUMN storage_config;
ALTER TABLE dbo.server_details DROP COLUMN storage_total_gb;
GO
ALTER TABLE dbo.server_details
    ADD CONSTRAINT CK_server_ram CHECK (ram_gb IS NULL OR ram_gb > 0);
GO
/* หมายเหตุ: computer_details.storage_config ยังคงเป็นข้อความอิสระตามเดิมโดยเจตนา
   เพราะเครื่อง PC/Notebook ระบุแค่ "512GB NVMe" ก็เพียงพอ
   ไม่คุ้มกับการสร้างแถว Volume ให้เครื่องผู้ใช้กว่าพันเครื่อง                      */


/* ============================================================================
   ส่วนที่ 5 — Views
   ========================================================================== */

/* -- 5.1 ⭐ รายการอุปกรณ์ที่ "เข้าข่าย" เป็นแหล่ง DHCP ได้ --
   ใช้เป็นแหล่งข้อมูลของ Dropdown บนหน้าเว็บ และใช้ตรวจสอบใน Trigger          */
CREATE VIEW dbo.vw_dhcp_capable_devices
AS
-- (1) อุปกรณ์เครือข่ายที่รองรับการจ่าย DHCP
SELECT
    a.asset_id,
    a.asset_tag,
    a.name                                  AS asset_name,
    'NETWORK'                               AS device_kind,
    t.name                                  AS device_type_name,
    t.device_class,
    t.dhcp_source_code                      AS dhcp_source_type,
    nd.hostname                             AS device_hostname,
    nd.mgmt_ip                              AS device_ip,
    l.name                                  AS location_name,
    s.code                                  AS status_code,
    -- ข้อความที่แสดงใน Dropdown : ชื่ออุปกรณ์ · รหัส · IP
    a.name + N' (' + a.asset_tag + N')'
           + ISNULL(N' · ' + nd.mgmt_ip, N'') AS display_label
FROM dbo.assets a
    INNER JOIN dbo.network_details      nd ON nd.asset_id       = a.asset_id
    INNER JOIN dbo.network_device_types t  ON t.device_type_id  = nd.device_type_id
    INNER JOIN dbo.asset_statuses       s  ON s.status_id       = a.status_id
    LEFT  JOIN dbo.locations            l  ON l.location_id     = a.location_id
WHERE a.is_deleted = 0
  AND t.can_provide_dhcp = 1
  AND t.is_active = 1
  AND s.is_operational = 1          -- ไม่แสดงเครื่องที่ปลดระวางหรือตัดจำหน่ายแล้ว

UNION ALL

-- (2) เซิร์ฟเวอร์ที่ได้รับบทบาท DHCP Server
SELECT
    a.asset_id,
    a.asset_tag,
    a.name,
    'SERVER',
    r.name,
    'SERVER_ROLE',
    'DHCP_SERVER',
    sd.hostname,
    sd.ip_address,
    l.name,
    s.code,
    a.name + N' (' + a.asset_tag + N')'
           + ISNULL(N' · ' + sd.hostname, N'')
           + ISNULL(N' · ' + sd.ip_address, N'')
FROM dbo.assets a
    INNER JOIN dbo.server_details          sd  ON sd.asset_id       = a.asset_id
    INNER JOIN dbo.server_role_assignments sra ON sra.asset_id      = a.asset_id
    INNER JOIN dbo.server_roles            r   ON r.server_role_id  = sra.server_role_id
    INNER JOIN dbo.asset_statuses          s   ON s.status_id       = a.status_id
    LEFT  JOIN dbo.locations               l   ON l.location_id     = a.location_id
WHERE a.is_deleted = 0
  AND r.is_dhcp_provider = 1
  AND r.is_active = 1
  AND s.is_operational = 1;
GO


/* -- 5.2 ⭐ รายการอุปกรณ์ที่ "เข้าข่าย" เป็น Gateway ได้ -- */
CREATE VIEW dbo.vw_gateway_capable_devices
AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name                                  AS asset_name,
    t.name                                  AS device_type_name,
    t.device_class,
    t.gateway_role_code                     AS gateway_device_role,
    t.is_layer3,
    nd.hostname                             AS device_hostname,
    nd.mgmt_ip                              AS device_ip,
    l.name                                  AS location_name,
    s.code                                  AS status_code,
    a.name + N' (' + a.asset_tag + N')'
           + ISNULL(N' · ' + nd.mgmt_ip, N'') AS display_label
FROM dbo.assets a
    INNER JOIN dbo.network_details      nd ON nd.asset_id      = a.asset_id
    INNER JOIN dbo.network_device_types t  ON t.device_type_id = nd.device_type_id
    INNER JOIN dbo.asset_statuses       s  ON s.status_id      = a.status_id
    LEFT  JOIN dbo.locations            l  ON l.location_id    = a.location_id
WHERE a.is_deleted = 0
  AND t.can_be_gateway = 1
  AND t.is_active = 1
  AND s.is_operational = 1;
GO


/* -- 5.3 สรุปบทบาทของเซิร์ฟเวอร์แต่ละเครื่อง -- */
CREATE VIEW dbo.vw_server_roles_summary
AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name              AS server_name,
    sd.hostname,
    sd.ip_address,
    sd.server_type,
    pr.name             AS primary_role,
    pr.role_group       AS primary_role_group,
    agg.role_count,
    agg.role_list,
    agg.has_critical_service
FROM dbo.assets a
    INNER JOIN dbo.server_details sd ON sd.asset_id = a.asset_id
    OUTER APPLY (
        SELECT TOP (1) r.name, r.role_group
        FROM dbo.server_role_assignments sra
            INNER JOIN dbo.server_roles r ON r.server_role_id = sra.server_role_id
        WHERE sra.asset_id = a.asset_id AND sra.is_primary = 1
    ) pr
    OUTER APPLY (
        SELECT
            COUNT(*) AS role_count,
            MAX(CAST(r.is_critical_service AS INT)) AS has_critical_service,
            STRING_AGG(r.name, N', ') WITHIN GROUP (ORDER BY r.sort_order) AS role_list
        FROM dbo.server_role_assignments sra
            INNER JOIN dbo.server_roles r ON r.server_role_id = sra.server_role_id
        WHERE sra.asset_id = a.asset_id
    ) agg
WHERE a.is_deleted = 0;
GO


/* -- 5.4 สรุปพื้นที่จัดเก็บรายเครื่อง -- */
CREATE VIEW dbo.vw_asset_storage_summary
AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name                              AS asset_name,
    COUNT(v.volume_id)                  AS volume_count,
    SUM(v.capacity_gb)                  AS total_capacity_gb,
    SUM(v.used_gb)                      AS total_used_gb,
    SUM(v.capacity_gb) - SUM(v.used_gb) AS total_free_gb,
    CAST(100.0 * SUM(v.used_gb) / NULLIF(SUM(v.capacity_gb), 0) AS DECIMAL(5,1)) AS used_percent,
    MAX(v.last_measured_at)             AS last_measured_at
FROM dbo.assets a
    INNER JOIN dbo.storage_volumes v ON v.asset_id = a.asset_id AND v.is_active = 1
WHERE a.is_deleted = 0
GROUP BY a.asset_id, a.asset_tag, a.name;
GO


/* -- 5.5 ภาพรวม Cluster พร้อมพื้นที่จัดเก็บที่ใช้ร่วมกัน -- */
CREATE VIEW dbo.vw_cluster_overview
AS
SELECT
    c.cluster_id,
    c.code                          AS cluster_code,
    c.name                          AS cluster_name,
    c.cluster_type,
    c.vendor_product,
    c.management_ip,
    c.expected_node_count,
    ISNULL(m.active_members, 0)     AS active_members,
    CASE WHEN c.expected_node_count IS NOT NULL
              AND ISNULL(m.active_members, 0) < c.expected_node_count
         THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT)
    END                             AS is_degraded,
    m.member_list,
    ISNULL(s.shared_volume_count, 0) AS shared_volume_count,
    s.shared_capacity_gb,
    s.shared_used_gb,
    CAST(100.0 * s.shared_used_gb / NULLIF(s.shared_capacity_gb, 0) AS DECIMAL(5,1)) AS shared_used_percent,
    l.name                          AS site_name,
    c.is_active
FROM dbo.clusters c
    LEFT JOIN dbo.locations l ON l.location_id = c.site_location_id
    OUTER APPLY (
        SELECT COUNT(*) AS active_members,
               STRING_AGG(a.name, N', ') WITHIN GROUP (ORDER BY cm.node_priority, a.name) AS member_list
        FROM dbo.cluster_members cm
            INNER JOIN dbo.assets a ON a.asset_id = cm.asset_id AND a.is_deleted = 0
        WHERE cm.cluster_id = c.cluster_id AND cm.left_date IS NULL
    ) m
    OUTER APPLY (
        SELECT COUNT(*) AS shared_volume_count,
               SUM(v.capacity_gb) AS shared_capacity_gb,
               SUM(v.used_gb)     AS shared_used_gb
        FROM dbo.storage_volumes v
        WHERE v.cluster_id = c.cluster_id AND v.is_active = 1
    ) s;
GO


/* -- 5.6 พื้นที่สำรองข้อมูล (Veeam Repository และอื่นๆ) -- */
CREATE VIEW dbo.vw_backup_repositories
AS
SELECT
    v.volume_id,
    v.volume_name,
    v.volume_type,
    owner_a.asset_tag           AS backup_server_tag,
    owner_a.name                AS backup_server_name,
    c.name                      AS cluster_name,
    prov.asset_tag              AS storage_provider_tag,
    prov.name                   AS storage_provider_name,
    v.storage_protocol,
    v.disk_type,
    v.capacity_gb,
    v.used_gb,
    v.free_gb,
    v.used_percent,
    v.immutability_days,
    v.retention_days,
    v.dedup_ratio,
    v.encryption_enabled,
    CASE WHEN v.used_percent >= 90 THEN 'CRITICAL'
         WHEN v.used_percent >= 80 THEN 'WARNING'
         ELSE 'OK' END          AS capacity_status,
    CASE WHEN v.immutability_days IS NULL OR v.immutability_days = 0
         THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT)
    END                         AS lacks_immutability,   -- ความเสี่ยงต่อ Ransomware
    v.last_measured_at
FROM dbo.storage_volumes v
    LEFT JOIN dbo.assets   owner_a ON owner_a.asset_id = v.asset_id
    LEFT JOIN dbo.assets   prov    ON prov.asset_id    = v.provider_asset_id
    LEFT JOIN dbo.clusters c       ON c.cluster_id     = v.cluster_id
WHERE v.is_active = 1
  AND v.volume_type IN ('BACKUP_REPOSITORY','SCALE_OUT_REPOSITORY','TAPE_POOL','CLOUD_TIER');
GO


/* ============================================================================
   ส่วนที่ 6 — Trigger บังคับให้เลือกอุปกรณ์จากรายการที่เข้าข่ายเท่านั้น
   (SQL Server ไม่รองรับ Subquery ใน CHECK Constraint จึงต้องใช้ Trigger)
   ========================================================================== */

CREATE TRIGGER dbo.trg_vlans_validate_device_refs
ON dbo.vlans
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    /* (1) DHCP Server ต้องเป็นอุปกรณ์ที่เข้าข่ายเท่านั้น */
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE i.dhcp_server_asset_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM dbo.vw_dhcp_capable_devices d
                          WHERE d.asset_id = i.dhcp_server_asset_id)
    )
        THROW 51010, 'Selected DHCP server is not a DHCP-capable device. Choose a network device that supports DHCP, or a server assigned the DHCP Server role.', 1;

    /* (2) ชนิดของแหล่ง DHCP ต้องตรงกับชนิดของอุปกรณ์ที่เลือกจริง */
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE i.dhcp_server_asset_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM dbo.vw_dhcp_capable_devices d
                          WHERE d.asset_id = i.dhcp_server_asset_id
                            AND d.dhcp_source_type = i.dhcp_source_type)
    )
        THROW 51011, 'DHCP source type does not match the selected device type.', 1;

    /* (3) แหล่ง DHCP ภายนอกระบบ ต้องไม่ผูกกับอุปกรณ์ใด */
    IF EXISTS (SELECT 1 FROM inserted i
               WHERE i.dhcp_source_type = 'EXTERNAL' AND i.dhcp_server_asset_id IS NOT NULL)
        THROW 51012, 'DHCP source EXTERNAL must not reference an asset in this system.', 1;

    /* (4) Gateway ต้องเป็นอุปกรณ์ที่ทำหน้าที่ Gateway ได้ */
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE i.gateway_asset_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM dbo.vw_gateway_capable_devices g
                          WHERE g.asset_id = i.gateway_asset_id)
    )
        THROW 51013, 'Selected gateway device cannot act as a gateway (Layer 3 routing required).', 1;

    /* (5) บทบาท Gateway ต้องตรงกับชนิดของอุปกรณ์ที่เลือก */
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE i.gateway_asset_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM dbo.vw_gateway_capable_devices g
                          WHERE g.asset_id = i.gateway_asset_id
                            AND g.gateway_device_role = i.gateway_device_role)
    )
        THROW 51014, 'Gateway device role does not match the selected device type.', 1;
END;
GO


CREATE TRIGGER dbo.trg_vlan_ranges_validate_dhcp
ON dbo.vlan_ip_ranges
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE i.dhcp_server_asset_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM dbo.vw_dhcp_capable_devices d
                          WHERE d.asset_id = i.dhcp_server_asset_id
                            AND (i.dhcp_source_type IS NULL OR d.dhcp_source_type = i.dhcp_source_type))
    )
        THROW 51015, 'Selected DHCP server for this IP range is not a DHCP-capable device, or its type does not match.', 1;
END;
GO


/* บทบาท DHCP Server ห้ามถูกถอนออก หากยังมี VLAN อ้างอิงเครื่องนั้นเป็นแหล่ง DHCP อยู่ */
CREATE TRIGGER dbo.trg_server_roles_protect_dhcp
ON dbo.server_role_assignments
AFTER DELETE, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM deleted d
            INNER JOIN dbo.server_roles r ON r.server_role_id = d.server_role_id
            INNER JOIN dbo.vlans v        ON v.dhcp_server_asset_id = d.asset_id
        WHERE r.is_dhcp_provider = 1
          AND NOT EXISTS (SELECT 1 FROM dbo.vw_dhcp_capable_devices c WHERE c.asset_id = d.asset_id)
    )
        THROW 51016, 'Cannot remove the DHCP Server role: one or more VLANs still reference this server as their DHCP source.', 1;
END;
GO


/* ============================================================================
   ส่วนที่ 7 — ข้อมูลตั้งต้นของบทบาท Server
   ========================================================================== */

INSERT INTO dbo.server_roles (code, name, role_group, is_dhcp_provider, is_critical_service, icon_name, sort_order) VALUES
-- ===== INFRASTRUCTURE =====
 ('AD_DC',           N'Active Directory Domain Controller', 'INFRASTRUCTURE', 0, 1, 'network',        1),
 ('DNS',             N'DNS Server',                         'INFRASTRUCTURE', 0, 1, 'globe',          2),
 ('DHCP',            N'DHCP Server',                        'INFRASTRUCTURE', 1, 1, 'router',         3),
 ('FILE',            N'File Server',                        'INFRASTRUCTURE', 0, 1, 'folder',         4),
 ('PRINT',           N'Print Server',                       'INFRASTRUCTURE', 0, 0, 'printer',        5),
 ('NTP',             N'NTP / Time Server',                  'INFRASTRUCTURE', 0, 0, 'clock',          6),
 ('CERT_AUTHORITY',  N'Certificate Authority',              'INFRASTRUCTURE', 0, 1, 'badge-check',    7),
 ('HYPERVISOR',      N'Virtualization Host (Hypervisor)',   'INFRASTRUCTURE', 0, 1, 'layers',         8),
 ('CONTAINER_HOST',  N'Container Host',                     'INFRASTRUCTURE', 0, 0, 'box',            9),
-- ===== DATA =====
 ('DATABASE',        N'Database Server',                    'DATA',           0, 1, 'database',      11),
 ('DATA_WAREHOUSE',  N'Data Warehouse',                     'DATA',           0, 0, 'database',      12),
 ('REPORTING',       N'Reporting / BI Server',              'DATA',           0, 0, 'bar-chart',     13),
-- ===== APPLICATION =====
 ('APPLICATION',     N'Application Server',                 'APPLICATION',    0, 1, 'app-window',    21),
 ('WEB',             N'Web Server',                         'APPLICATION',    0, 1, 'globe',         22),
 ('MAIL',            N'Mail Server',                        'APPLICATION',    0, 1, 'mail',          23),
 ('ERP',             N'ERP Server',                         'APPLICATION',    0, 1, 'building',      24),
 ('MIDDLEWARE',      N'Middleware / Integration',           'APPLICATION',    0, 0, 'shuffle',       25),
 ('API_GATEWAY',     N'API Gateway',                        'APPLICATION',    0, 0, 'plug',          26),
 ('TERMINAL',        N'Terminal / RDS Server',              'APPLICATION',    0, 0, 'monitor',       27),
-- ===== SECURITY =====
 ('ANTIVIRUS',       N'Antivirus / EDR Management',         'SECURITY',       0, 1, 'shield',        31),
 ('SIEM',            N'SIEM / Log Server',                  'SECURITY',       0, 0, 'file-search',   32),
 ('RADIUS',          N'RADIUS / AAA Server',                'SECURITY',       0, 1, 'key-round',     33),
 ('PAM',             N'Privileged Access Management',       'SECURITY',       0, 1, 'lock',          34),
 ('JUMP_HOST',       N'Jump Host / Bastion',                'SECURITY',       0, 0, 'terminal',      35),
-- ===== BACKUP =====
 ('BACKUP',          N'Backup Server',                      'BACKUP',         0, 1, 'save',          41),
 ('BACKUP_PROXY',    N'Backup Proxy',                       'BACKUP',         0, 0, 'save',          42),
 ('BACKUP_REPO',     N'Backup Repository Server',           'BACKUP',         0, 1, 'hard-drive',    43),
 ('TAPE_SERVER',     N'Tape Server',                        'BACKUP',         0, 0, 'disc',          44),
-- ===== MANAGEMENT =====
 ('MONITORING',      N'Monitoring Server',                  'MANAGEMENT',     0, 0, 'activity',      51),
 ('PATCH_MGMT',      N'Patch Management (WSUS / SCCM)',     'MANAGEMENT',     0, 0, 'download',      52),
 ('DEPLOYMENT',      N'Deployment / Imaging Server',        'MANAGEMENT',     0, 0, 'upload',        53),
 ('OTHER_ROLE',      N'Other',                              'MANAGEMENT',     0, 0, 'circle',        99);
GO


/* ============================================================================
   ส่วนที่ 8 — ตัวอย่างการใช้งาน (คอมเมนต์ไว้ ใช้ทดสอบ)
   ========================================================================== */
/*
-- ตัวอย่าง 1 : เซิร์ฟเวอร์ 1 เครื่องทำหลายบทบาท
INSERT INTO dbo.server_role_assignments (asset_id, server_role_id, is_primary, service_name)
SELECT 1, server_role_id, CASE WHEN code = 'AD_DC' THEN 1 ELSE 0 END, NULL
FROM dbo.server_roles WHERE code IN ('AD_DC','DNS','DHCP');
-- ผลลัพธ์: เครื่องนี้จะปรากฏใน vw_dhcp_capable_devices ทันที เพราะมีบทบาท DHCP

-- ตัวอย่าง 2 : VMware Cluster พร้อม Shared Datastore
INSERT INTO dbo.clusters (code, name, cluster_type, vendor_product, expected_node_count, quorum_type, management_ip)
VALUES ('CL-VM-HQ', N'HQ Production VMware Cluster', 'VMWARE_HA', N'VMware vSphere 8.0', 3, 'NODE_MAJORITY', '10.10.10.50');

DECLARE @c INT = SCOPE_IDENTITY();
INSERT INTO dbo.cluster_members (cluster_id, asset_id, member_role, node_priority) VALUES
    (@c, 1, 'HOST', 1), (@c, 2, 'HOST', 2), (@c, 3, 'HOST', 3);

-- Datastore ที่ทั้ง 3 โฮสต์ใช้ร่วมกัน ผูกกับ Cluster ไม่ใช่กับเครื่องใดเครื่องหนึ่ง
INSERT INTO dbo.storage_volumes
    (cluster_id, provider_asset_id, volume_name, volume_type, storage_protocol,
     disk_type, capacity_gb, used_gb, mount_path, is_shared, is_thin_provisioned)
VALUES
    (@c, 10, N'DS-PROD-01', 'VM_DATASTORE', 'FC', 'SSD', 20480, 14336, '/vmfs/volumes/DS-PROD-01', 1, 1);

-- ตัวอย่าง 3 : Veeam Backup Repository แบบ Immutable
INSERT INTO dbo.storage_volumes
    (asset_id, provider_asset_id, volume_name, volume_type, storage_protocol,
     disk_type, capacity_gb, used_gb, immutability_days, retention_days, dedup_ratio, encryption_enabled)
VALUES
    (20, 21, N'REPO-HARDENED-01', 'BACKUP_REPOSITORY', 'ISCSI', 'SATA',
     102400, 71680, 14, 90, 3.20, 1);

-- ตรวจผล
SELECT * FROM dbo.vw_cluster_overview;
SELECT * FROM dbo.vw_backup_repositories;
SELECT * FROM dbo.vw_dhcp_capable_devices;
*/


/* ============================================================================
   จบโมดูล v1.2
   ========================================================================== */
