/* ============================================================================
   IS-Inventory — IT Inventory Management System
   Module v1.7 : Server Domain — Server Inventory (Hardware) · Server List
                 (Virtual/Physical) · Multi-entry CPU/Memory/Storage ·
                 OS Type/Version · Server Status · Storage Multi-consumer

   Requires: 02, 04, 06, 10, 11, 12, 14, 15 ต้องรันสำเร็จก่อน (เรียงตามเลขไฟล์)

   สรุปสิ่งที่เพิ่ม/แก้
   --------------------
   1. Lookup ใหม่ 3 ตัว: os_types, os_versions (cascade), server_statuses
      (แยกจาก asset_statuses เพราะ Server List ต้องการค่าเฉพาะ เช่น Standby/POC
      ที่ไม่ควรกระทบ Asset หมวดอื่น)
   2. network_zones เพิ่มค่า "Untrust"
   3. server_details (Temporal Table — ต้องปิด/เปิด System Versioning ตามขั้นตอน
      ที่ระบุไว้ใน 12-module-v1.4-contracts-temporal.sql ส่วนที่ 8):
      - ตัดคอลัมน์ cpu_model/cpu_socket_count/cpu_core_count/ram_gb ออก
        (ย้ายไปตารางลูก server_cpus/server_memory_modules — เพิ่มได้หลายรายการ)
      - ตัดคอลัมน์ os_name/os_version (Free Text) ออก แทนด้วย os_type_id/
        os_version_id (Lookup)
      - ตัดคอลัมน์ parent_host_asset_id ออก (VM ผูกกับ cluster_id แทน — เสถียร
        กว่าเพราะ VM ย้าย Host ได้ตลอดผ่าน vMotion/Live Migration)
      - เพิ่ม cluster_id, system_group, fqdn, server_zone_id, environment,
        criticality, server_status_id, os_type_id, os_version_id
      - Virtual/Physical **ไม่มีคอลัมน์ใหม่** — อ่านจาก asset_types.is_virtual
        ผ่าน assets.asset_type_id ที่มีอยู่แล้ว (เคยมี server_type ซ้ำซ้อนกับ
        is_virtual แล้วถูกลบทิ้งไปตอน v1.3a — ดูเหตุผลในไฟล์ 10 บรรทัด ~511)
   4. ตารางลูกใหม่ 3 ตัว (ใช้ทั้ง Server Inventory และ Server List Virtual):
      server_cpus, server_memory_modules, server_local_disks — Add ได้หลาย
      รายการต่อเครื่อง ตามรูปแบบที่ตกลงกับผู้ใช้ (ไม่ใช่ Temporal Table ตาม
      Convention ของตารางที่เพิ่มหลัง v1.4 เช่น server_applications ใน v1.6)
   5. storage_volume_consumers — ตารางเชื่อมเสริมจาก storage_volumes เดิม
      (Additive เท่านั้น ไม่แตะ Route/Constraint เดิมที่ทดสอบผ่านแล้ว) ให้
      Storage 1 Volume ใช้งานร่วมกับ Server หลายเครื่องได้โดยไม่ต้องอยู่
      Cluster เดียวกัน
   6. vw_server_hardware_summary — รวมยอด CPU Core/RAM/Storage ต่อเครื่อง
      (คำนวณจากตารางลูก ไม่เก็บค่ารวมซ้ำ ตาม Pattern View ที่ใช้ทั้งโปรเจกต์)

   สิ่งที่ไม่เปลี่ยน (Additive/อ้างอิงของเดิม)
   -------------------------------------------
   - storage_volumes, server_role_assignments, server_applications,
     cluster_members, ip_addresses, asset_types ไม่ถูกแก้โครงสร้างเลย
   ========================================================================== */

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO


/* ============================================================================
   ส่วนที่ 1 — OS Type / OS Version (Lookup แบบ Cascade, เพิ่มได้จากฟอร์มโดยตรง)
   ========================================================================== */

CREATE TABLE dbo.os_types (
    os_type_id   INT            IDENTITY(1,1) NOT NULL,
    code         VARCHAR(30)    NOT NULL,
    name         NVARCHAR(60)   NOT NULL,
    sort_order   INT            NOT NULL CONSTRAINT DF_ost_sort   DEFAULT (0),
    is_active    BIT            NOT NULL CONSTRAINT DF_ost_active DEFAULT (1),
    CONSTRAINT PK_os_types PRIMARY KEY CLUSTERED (os_type_id),
    CONSTRAINT UX_os_types_code UNIQUE (code)
);
GO

INSERT INTO dbo.os_types (code, name, sort_order) VALUES
    ('WINDOWS', N'Windows', 1),
    ('LINUX',   N'Linux',   2),
    ('OTHER',   N'Other',   3);
GO

CREATE TABLE dbo.os_versions (
    os_version_id INT            IDENTITY(1,1) NOT NULL,
    os_type_id    INT            NOT NULL,
    name          NVARCHAR(80)   NOT NULL,
    sort_order    INT            NOT NULL CONSTRAINT DF_osv_sort   DEFAULT (0),
    is_active     BIT            NOT NULL CONSTRAINT DF_osv_active DEFAULT (1),
    CONSTRAINT PK_os_versions PRIMARY KEY CLUSTERED (os_version_id),
    CONSTRAINT UX_os_versions UNIQUE (os_type_id, name),
    CONSTRAINT FK_osv_type FOREIGN KEY (os_type_id) REFERENCES dbo.os_types(os_type_id)
);
CREATE INDEX IX_osv_type ON dbo.os_versions(os_type_id) WHERE is_active = 1;
GO

INSERT INTO dbo.os_versions (os_type_id, name, sort_order)
SELECT t.os_type_id, v.name, v.ord
FROM dbo.os_types t
CROSS APPLY (VALUES
    (N'Windows Server 2025',    1), (N'Windows Server 2022',    2),
    (N'Windows Server 2019',    3), (N'Windows Server 2016',    4),
    (N'Windows Server 2012 R2', 5), (N'Windows Server 2008 R2', 6)
) v(name, ord)
WHERE t.code = 'WINDOWS';

INSERT INTO dbo.os_versions (os_type_id, name, sort_order)
SELECT t.os_type_id, v.name, v.ord
FROM dbo.os_types t
CROSS APPLY (VALUES
    (N'Ubuntu 24.04 LTS', 1), (N'Ubuntu 22.04 LTS', 2), (N'Ubuntu 20.04 LTS', 3),
    (N'Rocky Linux 9',    4), (N'Rocky Linux 8',    5),
    (N'RHEL 9',           6), (N'RHEL 8',           7),
    (N'Debian 12',        8), (N'CentOS 7',         9)
) v(name, ord)
WHERE t.code = 'LINUX';
GO


/* ============================================================================
   ส่วนที่ 2 — Server Status (แยกจาก asset_statuses — เฉพาะ Server List)
   ========================================================================== */

CREATE TABLE dbo.server_statuses (
    server_status_id INT            IDENTITY(1,1) NOT NULL,
    code             VARCHAR(30)    NOT NULL,
    name             NVARCHAR(60)   NOT NULL,
    color_token      VARCHAR(30)    NOT NULL,
    sort_order       INT            NOT NULL CONSTRAINT DF_sst_sort   DEFAULT (0),
    is_active        BIT            NOT NULL CONSTRAINT DF_sst_active DEFAULT (1),
    CONSTRAINT PK_server_statuses PRIMARY KEY CLUSTERED (server_status_id),
    CONSTRAINT UX_server_statuses_code UNIQUE (code)
);
GO

INSERT INTO dbo.server_statuses (code, name, color_token, sort_order) VALUES
    ('ACTIVE',         N'Active',         'emerald', 1),
    ('MAINTENANCE',    N'Maintenance',    'amber',   2),
    ('STANDBY',        N'Standby',        'sky',     3),
    ('POC',            N'POC',            'violet',  4),
    ('DECOMMISSIONED', N'Decommissioned', 'slate',   5);
GO


/* ============================================================================
   ส่วนที่ 3 — network_zones เพิ่มค่า "Untrust"
   ========================================================================== */

INSERT INTO dbo.network_zones (code, name, description, trust_level, color_token, is_internet_facing, sort_order) VALUES
    ('UNTRUST', N'Untrust', N'Untrusted external-facing segment (firewall Untrust zone)', 0, 'rose', 1, 7);
GO


/* ============================================================================
   ส่วนที่ 4 — server_details: ปิด System Versioning ชั่วคราวเพื่อแก้โครงสร้าง
   (ตามขั้นตอนที่ระบุไว้ใน 12-module-v1.4-contracts-temporal.sql ส่วนที่ 8)
   ========================================================================== */

ALTER TABLE dbo.server_details SET (SYSTEM_VERSIONING = OFF);
GO

/* -- 4.1 ตัดของเดิมที่ไม่ใช้แล้ว (ทั้งตารางหลักและตารางประวัติ) -- */
ALTER TABLE dbo.server_details DROP CONSTRAINT CK_server_not_self_host;
GO
ALTER TABLE dbo.server_details DROP CONSTRAINT FK_server_details_host;
GO
DROP INDEX IX_server_host ON dbo.server_details;
GO
-- CK_server_ram ถูกเพิ่มกลับมาใหม่ในโมดูล v1.2 (ชื่อเดิมจากไฟล์ 02) ต้องตัดก่อน DROP COLUMN ram_gb
ALTER TABLE dbo.server_details DROP CONSTRAINT CK_server_ram;
GO

ALTER TABLE dbo.server_details DROP COLUMN
    cpu_model, cpu_socket_count, cpu_core_count, ram_gb,
    os_name, os_version, parent_host_asset_id;
GO
ALTER TABLE dbo.server_details_history DROP COLUMN
    cpu_model, cpu_socket_count, cpu_core_count, ram_gb,
    os_name, os_version, parent_host_asset_id;
GO

/* -- 4.2 เพิ่มคอลัมน์ใหม่ (ทั้งสองตาราง คอลัมน์ต้องตรงกันก่อนเปิด Versioning) -- */
ALTER TABLE dbo.server_details ADD
    cluster_id        INT            NULL,   -- Virtual เท่านั้น — บังคับที่ชั้น App
    system_group      NVARCHAR(100)  NULL,
    fqdn              NVARCHAR(255)  NULL,
    server_zone_id    INT            NULL,
    environment       VARCHAR(20)    NULL,
    criticality       VARCHAR(20)    NULL,
    server_status_id  INT            NULL,
    os_type_id        INT            NULL,
    os_version_id     INT            NULL;
GO
ALTER TABLE dbo.server_details_history ADD
    cluster_id        INT            NULL,
    system_group      NVARCHAR(100)  NULL,
    fqdn              NVARCHAR(255)  NULL,
    server_zone_id    INT            NULL,
    environment       VARCHAR(20)    NULL,
    criticality       VARCHAR(20)    NULL,
    server_status_id  INT            NULL,
    os_type_id        INT            NULL,
    os_version_id     INT            NULL;
GO

/* -- 4.3 Constraint เฉพาะตารางหลัก (ตารางประวัติไม่ใส่ FK/CHECK ตาม Convention
        ของ Temporal Table — แถวประวัติอาจอ้างอิงคีย์ที่ถูกลบไปแล้ว) -- */
ALTER TABLE dbo.server_details ADD
    CONSTRAINT FK_sd_cluster    FOREIGN KEY (cluster_id)       REFERENCES dbo.clusters(cluster_id),
    CONSTRAINT FK_sd_zone       FOREIGN KEY (server_zone_id)   REFERENCES dbo.network_zones(zone_id),
    CONSTRAINT FK_sd_status     FOREIGN KEY (server_status_id) REFERENCES dbo.server_statuses(server_status_id),
    CONSTRAINT FK_sd_os_type    FOREIGN KEY (os_type_id)       REFERENCES dbo.os_types(os_type_id),
    CONSTRAINT FK_sd_os_version FOREIGN KEY (os_version_id)    REFERENCES dbo.os_versions(os_version_id),
    CONSTRAINT CK_sd_environment CHECK (environment IS NULL OR environment IN ('PRODUCTION','UAT','DEVELOPMENT','DR')),
    CONSTRAINT CK_sd_criticality CHECK (criticality  IS NULL OR criticality  IN ('TIER1','TIER2','TIER3'));
GO
CREATE INDEX IX_sd_cluster ON dbo.server_details(cluster_id) WHERE cluster_id IS NOT NULL;
GO

/* -- 4.4 เปิด System Versioning กลับ -- */
ALTER TABLE dbo.server_details SET (SYSTEM_VERSIONING = ON
    (HISTORY_TABLE = dbo.server_details_history, DATA_CONSISTENCY_CHECK = ON));
GO


/* ============================================================================
   ส่วนที่ 5 — CPU / Memory / Local Disk แบบ Multi-entry
   ใช้ร่วมกันทั้ง Server Inventory (Physical) และ Server List (Virtual)
   ไม่ใช่ Temporal Table — ตาม Convention ของตารางที่เพิ่มหลัง v1.4
   (เทียบ server_applications ใน 15-module-v1.6 ที่ก็ไม่ใช่ Temporal เช่นกัน)
   ========================================================================== */

CREATE TABLE dbo.server_cpus (
    server_cpu_id  INT            IDENTITY(1,1) NOT NULL,
    asset_id       INT            NOT NULL,
    cpu_model      NVARCHAR(150)  NOT NULL,
    core_count     SMALLINT       NOT NULL,
    sort_order     INT            NOT NULL CONSTRAINT DF_scpu_sort DEFAULT (0),
    created_at     DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_scpu_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by     INT            NULL,
    CONSTRAINT PK_server_cpus PRIMARY KEY CLUSTERED (server_cpu_id),
    CONSTRAINT FK_scpu_asset      FOREIGN KEY (asset_id)   REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_scpu_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_scpu_cores CHECK (core_count BETWEEN 1 AND 128)
);
CREATE INDEX IX_scpu_asset ON dbo.server_cpus(asset_id);
GO

CREATE TABLE dbo.server_memory_modules (
    memory_module_id INT            IDENTITY(1,1) NOT NULL,
    asset_id         INT            NOT NULL,
    capacity_gb      DECIMAL(10,2)  NOT NULL,
    memory_type      VARCHAR(20)    NULL,   -- DDR3 / DDR4 / DDR5 / OTHER
    sort_order       INT            NOT NULL CONSTRAINT DF_smem_sort DEFAULT (0),
    created_at       DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_smem_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by       INT            NULL,
    CONSTRAINT PK_server_memory_modules PRIMARY KEY CLUSTERED (memory_module_id),
    CONSTRAINT FK_smem_asset      FOREIGN KEY (asset_id)   REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_smem_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_smem_capacity CHECK (capacity_gb > 0),
    CONSTRAINT CK_smem_type CHECK (memory_type IS NULL OR memory_type IN ('DDR3','DDR4','DDR5','OTHER'))
);
CREATE INDEX IX_smem_asset ON dbo.server_memory_modules(asset_id);
GO

CREATE TABLE dbo.server_local_disks (
    local_disk_id  INT            IDENTITY(1,1) NOT NULL,
    asset_id       INT            NOT NULL,
    disk_label     NVARCHAR(80)   NULL,
    capacity_gb    DECIMAL(10,2)  NOT NULL,
    disk_type      VARCHAR(20)    NULL,   -- SSD / HDD / NVME / VIRTUAL_DISK / OTHER
    sort_order     INT            NOT NULL CONSTRAINT DF_sdisk_sort DEFAULT (0),
    created_at     DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_sdisk_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by     INT            NULL,
    CONSTRAINT PK_server_local_disks PRIMARY KEY CLUSTERED (local_disk_id),
    CONSTRAINT FK_sdisk_asset      FOREIGN KEY (asset_id)   REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_sdisk_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_sdisk_capacity CHECK (capacity_gb > 0),
    CONSTRAINT CK_sdisk_type CHECK (disk_type IS NULL OR disk_type IN ('SSD','HDD','NVME','VIRTUAL_DISK','OTHER'))
);
CREATE INDEX IX_sdisk_asset ON dbo.server_local_disks(asset_id);
GO


/* ============================================================================
   ส่วนที่ 6 — storage_volume_consumers (Additive M:N — ไม่แตะ storage_volumes เดิม)
   ให้ Storage Volume 1 ตัวถูกใช้งานโดย Server หลายเครื่องได้ นอกเหนือจาก
   เจ้าของหลัก (asset_id) หรือ Cluster (cluster_id) เดิมของ storage_volumes
   ========================================================================== */

CREATE TABLE dbo.storage_volume_consumers (
    consumer_id   INT            IDENTITY(1,1) NOT NULL,
    volume_id     INT            NOT NULL,
    asset_id      INT            NOT NULL,
    notes         NVARCHAR(300)  NULL,
    created_at    DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_svc_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by    INT            NULL,
    CONSTRAINT PK_storage_volume_consumers PRIMARY KEY CLUSTERED (consumer_id),
    CONSTRAINT UX_storage_volume_consumers UNIQUE (volume_id, asset_id),
    CONSTRAINT FK_svc_volume     FOREIGN KEY (volume_id)  REFERENCES dbo.storage_volumes(volume_id),
    CONSTRAINT FK_svc_asset      FOREIGN KEY (asset_id)   REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_svc_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(user_id)
);
CREATE INDEX IX_svc_asset  ON dbo.storage_volume_consumers(asset_id);
CREATE INDEX IX_svc_volume ON dbo.storage_volume_consumers(volume_id);
GO


/* ============================================================================
   ส่วนที่ 7 — View สรุปยอดรวม CPU / RAM / Storage ต่อเครื่อง
   คำนวณจากตารางลูกเสมอ ไม่เก็บค่ารวมซ้ำในตารางหลัก (Pattern เดียวกับ
   vw_expiring_assets / vw_asset_tco ที่ใช้อยู่แล้วทั้งโปรเจกต์)
   ========================================================================== */

CREATE VIEW dbo.vw_server_hardware_summary
AS
SELECT
    a.asset_id,
    ISNULL(cpu.socket_count, 0)  AS cpu_socket_count,
    ISNULL(cpu.total_cores, 0)   AS cpu_total_cores,
    ISNULL(mem.total_ram_gb, 0)  AS total_ram_gb,
    ISNULL(disk.total_gb, 0)     AS total_storage_gb
FROM dbo.assets a
LEFT JOIN (
    SELECT asset_id, COUNT(*) AS socket_count, SUM(core_count) AS total_cores
    FROM dbo.server_cpus GROUP BY asset_id
) cpu ON cpu.asset_id = a.asset_id
LEFT JOIN (
    SELECT asset_id, SUM(capacity_gb) AS total_ram_gb
    FROM dbo.server_memory_modules GROUP BY asset_id
) mem ON mem.asset_id = a.asset_id
LEFT JOIN (
    SELECT asset_id, SUM(capacity_gb) AS total_gb
    FROM dbo.server_local_disks GROUP BY asset_id
) disk ON disk.asset_id = a.asset_id;
GO


/* ============================================================================
   จบโมดูล v1.7
   ========================================================================== */
