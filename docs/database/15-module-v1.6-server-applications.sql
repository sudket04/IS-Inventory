/* ==========================================================================================
   IS-Inventory — IT Inventory Management System
   Module v1.6 : Application Tracking บน Server

   ไฟล์นี้เป็นลำดับที่ 8 ของชุดสคริปต์ ต้องรันตามลำดับนี้เท่านั้น
       02-schema-sqlserver.sql
    -> 04-vlan-module.sql
    -> 06-module-v1.2.sql
    -> 10-module-v1.3a-taxonomy.sql
    -> 11-module-v1.3b-details-rack-ipam.sql
    -> 12-module-v1.4-contracts-temporal.sql
    -> 14-module-v1.5-permission-control.sql
    -> 15-module-v1.6-server-applications.sql      <-- ไฟล์นี้

   ขอบเขต
   ------
   ทะเบียน Application ที่รันอยู่บน Server แต่ละเครื่อง พร้อมข้อมูลติดต่อและ Port
   ที่ใช้ — แยกจาก dbo.server_role_assignments (ไฟล์ 06) โดยเจตนา เพราะตารางนั้นผูกกับ
   dbo.server_roles ซึ่งเป็น Lookup คงที่ (Web Server, Database Server ฯลฯ) และบังคับ
   UNIQUE (asset_id, server_role_id) — หนึ่งเครื่องมีได้แค่ 1 แถวต่อ Role เดียว ไม่รองรับ
   การมี Application หลายตัวชื่อเฉพาะทางที่ต่างกันบนเครื่องเดียวกัน (เช่น มี Web App 3 ตัว
   คนละ Port บนเครื่องเดียว) — ตารางนี้จึงให้กรอกชื่อ Application เป็นอิสระ พร้อมนำ
   dbo.server_roles มาใช้ซ้ำเป็นแค่ "ประเภท Server" (Server Type) เสริมเท่านั้น ไม่บังคับ

   Site (1st Site / 2nd Site) — ใช้ dbo.vlan_sites ตัวเดียวกับที่ VLAN ใช้อยู่แล้ว
   ตามขอบเขตที่ตกลงไว้ว่า Site แบบ 2 สาขานี้ใช้เฉพาะ VLAN และโมดูลใหม่เท่านั้น
   ไม่ย้อนไปแตะ dbo.locations ที่ระบบเดิม (Asset, Contract ฯลฯ) ใช้อยู่

   Functions : 0    Tables : 1    Views : 1
   ========================================================================================== */

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO


/* ============================================================================
   ส่วนที่ 1 — ตาราง Application บน Server
   ========================================================================== */

CREATE TABLE dbo.server_applications (
    application_id      INT             IDENTITY(1,1) NOT NULL,
    asset_id             INT            NOT NULL,       -- Server ที่รัน Application นี้
    server_type_id        INT           NULL,           -- ประเภท Server เสริม (ใช้ dbo.server_roles ซ้ำ)
    application_name      NVARCHAR(150) NOT NULL,
    port_number            NVARCHAR(50) NULL,           -- กรอกได้หลาย Port เช่น "80,443"
    link_url                NVARCHAR(500) NULL,         -- URL เข้าถึง Application
    incharge_name            NVARCHAR(150) NULL,        -- ผู้รับผิดชอบ — ชื่อกรอกมือ ไม่ผูกกับ User Account
    department_id             INT       NULL,
    site_id                    TINYINT  NOT NULL,       -- สาขา — บังคับเลือก (ดู dbo.vlan_sites)
    is_active                  BIT      NOT NULL CONSTRAINT DF_svcapp_active DEFAULT (1),
    notes                      NVARCHAR(500) NULL,
    created_at DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_svcapp_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by INT NULL,
    updated_at DATETIMEOFFSET(3) NULL,
    updated_by INT NULL,

    CONSTRAINT PK_server_applications PRIMARY KEY CLUSTERED (application_id),
    -- Application ชื่อเดียวกันซ้ำบนเครื่องเดียวกันไม่ได้ (คนละเครื่องซ้ำชื่อได้ เช่น "Portal" หลายสาขา)
    CONSTRAINT UX_svcapp UNIQUE (asset_id, application_name),

    CONSTRAINT FK_svcapp_asset      FOREIGN KEY (asset_id)       REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_svcapp_role       FOREIGN KEY (server_type_id) REFERENCES dbo.server_roles(server_role_id),
    CONSTRAINT FK_svcapp_department FOREIGN KEY (department_id)  REFERENCES dbo.departments(department_id),
    CONSTRAINT FK_svcapp_site       FOREIGN KEY (site_id)        REFERENCES dbo.vlan_sites(site_id),
    CONSTRAINT FK_svcapp_created_by FOREIGN KEY (created_by)     REFERENCES dbo.users(user_id),
    CONSTRAINT FK_svcapp_updated_by FOREIGN KEY (updated_by)     REFERENCES dbo.users(user_id)
);
GO

CREATE INDEX IX_svcapp_asset ON dbo.server_applications(asset_id);
CREATE INDEX IX_svcapp_dept  ON dbo.server_applications(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX IX_svcapp_site  ON dbo.server_applications(site_id);
CREATE INDEX IX_svcapp_role  ON dbo.server_applications(server_type_id) WHERE server_type_id IS NOT NULL;
GO


/* ============================================================================
   ส่วนที่ 2 — View แสดงผล (รวมชื่อจริงจาก Lookup ต่างๆ)
   ========================================================================== */

CREATE VIEW dbo.vw_server_applications
AS
SELECT
    sa.application_id,
    sa.asset_id,
    a.asset_tag,
    a.name                  AS server_name,
    sr.name                 AS server_type_name,
    sa.application_name,
    sa.port_number,
    sa.link_url,
    sa.incharge_name,
    d.name                  AS department_name,
    st.name                 AS site_name,
    sa.is_active,
    sa.notes
FROM dbo.server_applications sa
    INNER JOIN dbo.assets       a  ON a.asset_id    = sa.asset_id
    LEFT  JOIN dbo.server_roles sr ON sr.server_role_id = sa.server_type_id
    LEFT  JOIN dbo.departments  d  ON d.department_id   = sa.department_id
    INNER JOIN dbo.vlan_sites   st ON st.site_id        = sa.site_id
WHERE a.is_deleted = 0;
GO


/* ============================================================================
   จบโมดูล Server Applications
   ========================================================================== */
