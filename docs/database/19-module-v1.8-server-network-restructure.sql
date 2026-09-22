/* ============================================================================
   IS-Inventory — IT Inventory Management System
   Module v1.8 : Server / Network restructure — parity with the approved
                 Server+Network reference design (menu "Server Add").

   Requires: 02, 04, 06, 10, 11, 12, 14, 15, 16, 17, 18 ต้องรันสำเร็จก่อน

   สรุปสิ่งที่เพิ่ม
   ----------------
   1. Catalog เล็ก 4 ตัว — ค่าที่ "ขายจริง" สำหรับ CPU cores / RAM (GB) /
      Storage (GB, TB) ผู้ใช้กด "+ Add" จากฟอร์มเพื่อเพิ่มค่าใหม่ถาวรได้ (ผ่าน
      Lookups endpoint สิทธิ์ต่ำกว่า Admin master data ปกติ — ดู Sprint ถัดไป)
   2. cluster_members — เพิ่ม host_name / ip_host / ip_mgmt ต่อแถวสมาชิก
      (Host/Node ในหน้า Cluster แต่ละแถวมีชื่อ Host และ IP ของตัวเอง แยกจาก
      Hardware asset ที่อ้างอิง — Hardware ตัวเดียวอาจถูกนำมาใช้ใหม่เป็นคนละ
      Host ได้ถ้า Node เดิมถูกถอนออกไปแล้ว)
   3. storage_volume_consumers — แก้ asset_id ให้ NULL ได้ และเพิ่ม cluster_id
      เพื่อให้ "Used With" ของ Storage Hardware อ้างอิงได้ทั้ง Cluster และ
      Server เครื่องเดียว (ของเดิมรองรับเฉพาะ Server/Asset)

   หมายเหตุ: mgmt_ip และ device_type_id ของ network_details, และ Location
   hierarchy (Site > Factory > Floor > Area > Rack) มีอยู่แล้วในสคีมาตั้งแต่
   02/06/10/11 — Sprint นี้แค่ผูก EF Entity/DTO/Frontend ที่ขาดหายไป ไม่ต้อง
   แก้โครงสร้างตาราง
   ========================================================================== */

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO


/* ============================================================================
   ส่วนที่ 1 — Catalog: CPU core count / RAM (GB) / Storage (GB, TB)
   ========================================================================== */

CREATE TABLE dbo.cpu_core_options (
    cpu_core_option_id INT IDENTITY(1,1) NOT NULL,
    core_count          SMALLINT NOT NULL,
    sort_order          INT NOT NULL CONSTRAINT DF_cco_sort DEFAULT (0),
    is_active           BIT NOT NULL CONSTRAINT DF_cco_active DEFAULT (1),
    CONSTRAINT PK_cpu_core_options PRIMARY KEY CLUSTERED (cpu_core_option_id),
    CONSTRAINT UX_cpu_core_options UNIQUE (core_count),
    CONSTRAINT CK_cco_positive CHECK (core_count > 0)
);
GO
INSERT INTO dbo.cpu_core_options (core_count, sort_order)
SELECT v.n, ROW_NUMBER() OVER (ORDER BY v.n)
FROM (VALUES (1),(2),(4),(6),(8),(10),(12),(16),(20),(24),(28),(32),(36),(40),(48),(56),(64)) v(n);
GO

CREATE TABLE dbo.ram_size_options (
    ram_size_option_id INT IDENTITY(1,1) NOT NULL,
    size_gb             INT NOT NULL,
    sort_order          INT NOT NULL CONSTRAINT DF_rso_sort DEFAULT (0),
    is_active           BIT NOT NULL CONSTRAINT DF_rso_active DEFAULT (1),
    CONSTRAINT PK_ram_size_options PRIMARY KEY CLUSTERED (ram_size_option_id),
    CONSTRAINT UX_ram_size_options UNIQUE (size_gb),
    CONSTRAINT CK_rso_positive CHECK (size_gb > 0)
);
GO
INSERT INTO dbo.ram_size_options (size_gb, sort_order)
SELECT v.n, ROW_NUMBER() OVER (ORDER BY v.n)
FROM (VALUES (8),(16),(24),(32),(48),(64),(96),(128),(192),(256),(384),(512),(768),(1024)) v(n);
GO

CREATE TABLE dbo.storage_size_options_gb (
    storage_size_gb_id INT IDENTITY(1,1) NOT NULL,
    size_gb             INT NOT NULL,
    sort_order          INT NOT NULL CONSTRAINT DF_ssg_sort DEFAULT (0),
    is_active           BIT NOT NULL CONSTRAINT DF_ssg_active DEFAULT (1),
    CONSTRAINT PK_storage_size_options_gb PRIMARY KEY CLUSTERED (storage_size_gb_id),
    CONSTRAINT UX_storage_size_options_gb UNIQUE (size_gb),
    CONSTRAINT CK_ssg_positive CHECK (size_gb > 0)
);
GO
INSERT INTO dbo.storage_size_options_gb (size_gb, sort_order)
SELECT v.n, ROW_NUMBER() OVER (ORDER BY v.n)
FROM (VALUES (120),(128),(240),(250),(256),(480),(500),(512),(600),(800),(960),(1024)) v(n);
GO

CREATE TABLE dbo.storage_size_options_tb (
    storage_size_tb_id INT IDENTITY(1,1) NOT NULL,
    size_tb             INT NOT NULL,
    sort_order          INT NOT NULL CONSTRAINT DF_sstb_sort DEFAULT (0),
    is_active           BIT NOT NULL CONSTRAINT DF_sstb_active DEFAULT (1),
    CONSTRAINT PK_storage_size_options_tb PRIMARY KEY CLUSTERED (storage_size_tb_id),
    CONSTRAINT UX_storage_size_options_tb UNIQUE (size_tb),
    CONSTRAINT CK_sstb_positive CHECK (size_tb > 0)
);
GO
INSERT INTO dbo.storage_size_options_tb (size_tb, sort_order)
SELECT v.n, ROW_NUMBER() OVER (ORDER BY v.n)
FROM (VALUES (1),(2),(3),(4),(6),(8),(10),(12),(16),(20),(24),(30),(32),(40),(48),(64),(96),(128)) v(n);
GO


/* ============================================================================
   ส่วนที่ 2 — cluster_members: เพิ่มฟิลด์ต่อ Host/Node
   ========================================================================== */

ALTER TABLE dbo.cluster_members ADD
    host_name NVARCHAR(100) NULL,
    ip_host   VARCHAR(45)   NULL,
    ip_mgmt   VARCHAR(45)   NULL;
GO
ALTER TABLE dbo.cluster_members ADD
    CONSTRAINT CK_clmem_ip_host CHECK (ip_host IS NULL OR dbo.fn_is_valid_ip(ip_host) = 1),
    CONSTRAINT CK_clmem_ip_mgmt CHECK (ip_mgmt IS NULL OR dbo.fn_is_valid_ip(ip_mgmt) = 1);
GO
-- Host name / IP ต้องไม่ซ้ำกันข้าม Cluster ทั้งระบบ ขณะที่ยังเป็นสมาชิกอยู่
-- (ตรงกับกติกาในฟอร์ม reference — validateNodes)
CREATE UNIQUE INDEX UX_clmem_host_name ON dbo.cluster_members(host_name) WHERE left_date IS NULL AND host_name IS NOT NULL;
CREATE UNIQUE INDEX UX_clmem_ip_host   ON dbo.cluster_members(ip_host)   WHERE left_date IS NULL AND ip_host   IS NOT NULL;
CREATE UNIQUE INDEX UX_clmem_ip_mgmt   ON dbo.cluster_members(ip_mgmt)   WHERE left_date IS NULL AND ip_mgmt   IS NOT NULL;
GO


/* ============================================================================
   ส่วนที่ 3 — storage_volume_consumers: รองรับ "Used With" ทั้ง Cluster และ Server
   ========================================================================== */

ALTER TABLE dbo.storage_volume_consumers DROP CONSTRAINT UX_storage_volume_consumers;
GO
ALTER TABLE dbo.storage_volume_consumers DROP CONSTRAINT FK_svc_asset;
GO
ALTER TABLE dbo.storage_volume_consumers ALTER COLUMN asset_id INT NULL;
GO
ALTER TABLE dbo.storage_volume_consumers ADD cluster_id INT NULL;
GO
ALTER TABLE dbo.storage_volume_consumers ADD
    CONSTRAINT FK_svc_asset   FOREIGN KEY (asset_id)   REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_svc_cluster FOREIGN KEY (cluster_id) REFERENCES dbo.clusters(cluster_id),
    -- ต้องระบุอย่างใดอย่างหนึ่งเท่านั้น (Cluster หรือ Server) ไม่ใช่ทั้งคู่หรือไม่มีเลย
    CONSTRAINT CK_svc_target CHECK (
        (CASE WHEN asset_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN cluster_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    );
GO
CREATE UNIQUE INDEX UX_svc_volume_asset   ON dbo.storage_volume_consumers(volume_id, asset_id)   WHERE asset_id   IS NOT NULL;
CREATE UNIQUE INDEX UX_svc_volume_cluster ON dbo.storage_volume_consumers(volume_id, cluster_id) WHERE cluster_id IS NOT NULL;
CREATE INDEX IX_svc_cluster ON dbo.storage_volume_consumers(cluster_id);
GO


/* ============================================================================
   ส่วนที่ 4 — Menu ใหม่: Network Hardware (แยกจาก Assets ทั่วไป ตามที่ตกลง)
   ========================================================================== */

INSERT INTO dbo.menus (menu_key, name, sort_order) VALUES
    ('network_hardware', N'Network Hardware', 65);   -- sort_order สูงเกิน 19 เดิมโดยเจตนา กันชนของเดิม จัดลำดับจริงที่ role_menu_permissions/nav.ts
GO

-- ให้สิทธิ์เริ่มต้นเหมือนกลุ่ม A ของ vlans/server_inventory (View ทั้ง 4 Role, Create/Edit/Delete เฉพาะ ADMIN/IT_STAFF)
INSERT INTO dbo.role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete)
SELECT
    r.role_id,
    m.menu_id,
    1,
    CASE WHEN r.code IN ('ADMIN','IT_STAFF') THEN 1 ELSE 0 END,
    CASE WHEN r.code IN ('ADMIN','IT_STAFF') THEN 1 ELSE 0 END,
    CASE WHEN r.code IN ('ADMIN','IT_STAFF') THEN 1 ELSE 0 END
FROM dbo.roles r
CROSS JOIN dbo.menus m
WHERE m.menu_key = 'network_hardware';
GO


/* ============================================================================
   จบโมดูล v1.8
   ========================================================================== */
