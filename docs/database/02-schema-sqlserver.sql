/* ============================================================================
   IS-Inventory — IT Inventory Management System
   Database Schema for Microsoft SQL Server (2019+)

   Version : 1.1 (Draft)  -- v1.1 เพิ่มโมดูล VLAN/IPAM ในไฟล์ 04-vlan-module.sql
   Author  : Database Architecture — Phase 3
   Ref     : docs/PRD.md · docs/database/01-database-design.md

   หมายเหตุการติดตั้ง
   ------------------
   1. สคริปต์นี้สร้าง Object ทั้งหมดในสคีมา dbo
   2. รันบนฐานข้อมูลเปล่าที่สร้างไว้แล้ว (ดูส่วน 0)
   3. ลำดับของสคริปต์เรียงตาม Dependency แล้ว ห้ามสลับลำดับ
   4. ทุก Foreign Key เป็น NO ACTION โดยเจตนา เพื่อบังคับกติกา
      "ห้ามลบข้อมูลที่ยังถูกอ้างอิงอยู่" ตาม FR-MD-02
   ========================================================================== */

/* บังคับ ON ทั้งคู่ — จำเป็นสำหรับ Computed Column / Filtered Index / Indexed View
   ที่ใช้ในไฟล์นี้ SSMS ตั้งค่านี้ให้อัตโนมัติ แต่ sqlcmd/CI ไม่ตั้งให้ ถ้าไม่ระบุเอง
   CREATE TABLE/INDEX จะ Fail แบบเงียบและ Object อื่นที่อ้างอิงจะพังตาม */
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO


/* ============================================================================
   ส่วนที่ 0 — การสร้างฐานข้อมูล (รันแยกต่างหากโดย DBA)
   ========================================================================== */
/*
CREATE DATABASE IS_Inventory
  COLLATE Thai_100_CI_AS_SC_UTF8;
GO
ALTER DATABASE IS_Inventory SET RECOVERY FULL;          -- จำเป็นสำหรับ Log Backup ทุก 15 นาที
ALTER DATABASE IS_Inventory SET READ_COMMITTED_SNAPSHOT ON;  -- ลดการบล็อกกันระหว่างอ่าน/เขียน
GO
USE IS_Inventory;
GO
*/


/* ============================================================================
   ส่วนที่ 1 — Identity & Access
   ========================================================================== */

CREATE TABLE dbo.roles (
    role_id         INT            IDENTITY(1,1) NOT NULL,
    code            VARCHAR(20)    NOT NULL,
    name            NVARCHAR(50)   NOT NULL,
    description     NVARCHAR(200)  NULL,
    is_system       BIT            NOT NULL CONSTRAINT DF_roles_is_system DEFAULT (0),
    sort_order      INT            NOT NULL CONSTRAINT DF_roles_sort DEFAULT (0),
    CONSTRAINT PK_roles PRIMARY KEY CLUSTERED (role_id),
    CONSTRAINT UX_roles_code UNIQUE (code)
);
GO

CREATE TABLE dbo.departments (
    department_id   INT            IDENTITY(1,1) NOT NULL,
    code            VARCHAR(20)    NOT NULL,
    name            NVARCHAR(100)  NOT NULL,
    is_active       BIT            NOT NULL CONSTRAINT DF_departments_active DEFAULT (1),
    created_at      DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_departments_created DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_departments PRIMARY KEY CLUSTERED (department_id),
    CONSTRAINT UX_departments_code UNIQUE (code)
);
GO

CREATE TABLE dbo.users (
    user_id                 INT            IDENTITY(1,1) NOT NULL,
    username                NVARCHAR(50)   NOT NULL,
    email                   NVARCHAR(255)  NOT NULL,
    password_hash           NVARCHAR(255)  NOT NULL,   -- Argon2id (FR-AU-02)
    full_name               NVARCHAR(150)  NOT NULL,
    role_id                 INT            NOT NULL,
    department_id           INT            NULL,
    phone                   NVARCHAR(30)   NULL,
    is_active               BIT            NOT NULL CONSTRAINT DF_users_active DEFAULT (1),
    must_change_password    BIT            NOT NULL CONSTRAINT DF_users_mcp DEFAULT (1),
    failed_login_attempts   TINYINT        NOT NULL CONSTRAINT DF_users_fla DEFAULT (0),
    locked_until            DATETIMEOFFSET(3) NULL,     -- NULL = ไม่ถูกล็อก (FR-AU-04)
    last_login_at           DATETIMEOFFSET(3) NULL,
    password_changed_at     DATETIMEOFFSET(3) NULL,
    external_id             NVARCHAR(255)  NULL,        -- เผื่อเชื่อม SSO ในอนาคต
    created_at              DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_users_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by              INT            NULL,
    updated_at              DATETIMEOFFSET(3) NULL,
    updated_by              INT            NULL,
    CONSTRAINT PK_users PRIMARY KEY CLUSTERED (user_id),
    CONSTRAINT UX_users_username UNIQUE (username),
    CONSTRAINT UX_users_email    UNIQUE (email),
    CONSTRAINT FK_users_role       FOREIGN KEY (role_id)       REFERENCES dbo.roles(role_id),
    CONSTRAINT FK_users_department FOREIGN KEY (department_id) REFERENCES dbo.departments(department_id),
    CONSTRAINT FK_users_created_by FOREIGN KEY (created_by)    REFERENCES dbo.users(user_id),
    CONSTRAINT FK_users_updated_by FOREIGN KEY (updated_by)    REFERENCES dbo.users(user_id)
);
GO

CREATE INDEX IX_users_role       ON dbo.users(role_id);
CREATE INDEX IX_users_department ON dbo.users(department_id);
CREATE INDEX IX_users_active     ON dbo.users(is_active) INCLUDE (full_name, email);
GO

CREATE TABLE dbo.refresh_tokens (
    token_id        BIGINT         IDENTITY(1,1) NOT NULL,
    user_id         INT            NOT NULL,
    token_hash      CHAR(64)       NOT NULL,   -- SHA-256 ของ Token ไม่เก็บค่าดิบ
    expires_at      DATETIMEOFFSET(3) NOT NULL,
    revoked_at      DATETIMEOFFSET(3) NULL,
    created_ip      VARCHAR(45)    NULL,
    user_agent      NVARCHAR(400)  NULL,
    created_at      DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_rt_created DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_refresh_tokens PRIMARY KEY CLUSTERED (token_id),
    CONSTRAINT UX_refresh_tokens_hash UNIQUE (token_hash),
    CONSTRAINT FK_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES dbo.users(user_id)
);
GO

CREATE INDEX IX_refresh_tokens_user    ON dbo.refresh_tokens(user_id);
CREATE INDEX IX_refresh_tokens_expires ON dbo.refresh_tokens(expires_at) WHERE revoked_at IS NULL;
GO


/* ============================================================================
   ส่วนที่ 2 — Master Data
   ========================================================================== */

CREATE TABLE dbo.locations (
    location_id         INT            IDENTITY(1,1) NOT NULL,
    parent_location_id  INT            NULL,           -- NULL = ระดับบนสุด (FR-MD-03)
    code                VARCHAR(30)    NOT NULL,
    name                NVARCHAR(150)  NOT NULL,
    location_type       VARCHAR(20)    NOT NULL,
    address             NVARCHAR(400)  NULL,
    sort_order          INT            NOT NULL CONSTRAINT DF_locations_sort DEFAULT (0),
    is_active           BIT            NOT NULL CONSTRAINT DF_locations_active DEFAULT (1),
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_locations_created DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_locations PRIMARY KEY CLUSTERED (location_id),
    CONSTRAINT UX_locations_code UNIQUE (code),
    CONSTRAINT FK_locations_parent FOREIGN KEY (parent_location_id) REFERENCES dbo.locations(location_id),
    CONSTRAINT CK_locations_type CHECK (location_type IN ('SITE','BUILDING','FLOOR','ROOM','RACK')),
    CONSTRAINT CK_locations_not_self CHECK (parent_location_id IS NULL OR parent_location_id <> location_id)
);
GO

CREATE INDEX IX_locations_parent ON dbo.locations(parent_location_id);
GO

CREATE TABLE dbo.vendors (
    vendor_id       INT            IDENTITY(1,1) NOT NULL,
    code            VARCHAR(30)    NOT NULL,
    name            NVARCHAR(200)  NOT NULL,
    contact_person  NVARCHAR(150)  NULL,
    phone           NVARCHAR(50)   NULL,
    email           NVARCHAR(255)  NULL,
    address         NVARCHAR(400)  NULL,
    tax_id          VARCHAR(20)    NULL,
    is_active       BIT            NOT NULL CONSTRAINT DF_vendors_active DEFAULT (1),
    created_at      DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_vendors_created DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_vendors PRIMARY KEY CLUSTERED (vendor_id),
    CONSTRAINT UX_vendors_code UNIQUE (code)
);
GO

CREATE TABLE dbo.manufacturers (
    manufacturer_id INT            IDENTITY(1,1) NOT NULL,
    name            NVARCHAR(150)  NOT NULL,
    support_url     NVARCHAR(400)  NULL,
    is_active       BIT            NOT NULL CONSTRAINT DF_manufacturers_active DEFAULT (1),
    CONSTRAINT PK_manufacturers PRIMARY KEY CLUSTERED (manufacturer_id),
    CONSTRAINT UX_manufacturers_name UNIQUE (name)
);
GO

CREATE TABLE dbo.asset_categories (
    category_id     INT            IDENTITY(1,1) NOT NULL,
    code            VARCHAR(10)    NOT NULL,   -- ใช้เป็น Prefix ของ Asset Tag
    name            NVARCHAR(50)   NOT NULL,
    detail_table    VARCHAR(50)    NULL,       -- ชื่อตารางขยาย NULL = ใช้ custom_attributes
    icon_name       VARCHAR(50)    NULL,
    sort_order      INT            NOT NULL CONSTRAINT DF_categories_sort DEFAULT (0),
    is_active       BIT            NOT NULL CONSTRAINT DF_categories_active DEFAULT (1),
    CONSTRAINT PK_asset_categories PRIMARY KEY CLUSTERED (category_id),
    CONSTRAINT UX_asset_categories_code UNIQUE (code)
);
GO

CREATE TABLE dbo.asset_statuses (
    status_id       INT            IDENTITY(1,1) NOT NULL,
    code            VARCHAR(20)    NOT NULL,
    name            NVARCHAR(50)   NOT NULL,
    color_token     VARCHAR(30)    NOT NULL,   -- อ้างอิง Design System
    is_operational  BIT            NOT NULL CONSTRAINT DF_statuses_op DEFAULT (1),
    sort_order      INT            NOT NULL CONSTRAINT DF_statuses_sort DEFAULT (0),
    is_active       BIT            NOT NULL CONSTRAINT DF_statuses_active DEFAULT (1),
    CONSTRAINT PK_asset_statuses PRIMARY KEY CLUSTERED (status_id),
    CONSTRAINT UX_asset_statuses_code UNIQUE (code)
);
GO

CREATE TABLE dbo.relationship_types (
    relationship_type_id INT       IDENTITY(1,1) NOT NULL,
    code            VARCHAR(30)    NOT NULL,
    forward_name    NVARCHAR(50)   NOT NULL,   -- เช่น "Hosted On"
    inverse_name    NVARCHAR(50)   NOT NULL,   -- เช่น "Hosts"
    is_active       BIT            NOT NULL CONSTRAINT DF_reltypes_active DEFAULT (1),
    CONSTRAINT PK_relationship_types PRIMARY KEY CLUSTERED (relationship_type_id),
    CONSTRAINT UX_relationship_types_code UNIQUE (code)
);
GO


/* ============================================================================
   ส่วนที่ 3 — Core Asset
   ========================================================================== */

CREATE TABLE dbo.asset_tag_sequences (
    category_id     INT            NOT NULL,
    [year]          SMALLINT       NOT NULL,
    last_number     INT            NOT NULL CONSTRAINT DF_tagseq_last DEFAULT (0),
    CONSTRAINT PK_asset_tag_sequences PRIMARY KEY CLUSTERED (category_id, [year]),
    CONSTRAINT FK_tagseq_category FOREIGN KEY (category_id) REFERENCES dbo.asset_categories(category_id)
);
GO

CREATE TABLE dbo.assets (
    asset_id            INT            IDENTITY(1,1) NOT NULL,
    asset_tag           VARCHAR(20)    NOT NULL,   -- SRV-2026-0031
    category_id         INT            NOT NULL,
    name                NVARCHAR(200)  NOT NULL,
    manufacturer_id     INT            NULL,
    model               NVARCHAR(150)  NULL,
    serial_number       NVARCHAR(100)  NULL,
    status_id           INT            NOT NULL,
    location_id         INT            NULL,
    department_id       INT            NULL,
    owner_user_id       INT            NULL,

    -- ข้อมูลการจัดซื้อและความคุ้มครอง
    vendor_id           INT            NULL,
    po_number           NVARCHAR(50)   NULL,
    purchase_date       DATE           NULL,
    purchase_price      DECIMAL(18,2)  NULL,
    currency            CHAR(3)        NOT NULL CONSTRAINT DF_assets_currency DEFAULT ('THB'),
    coverage_start_date DATE           NULL,   -- เริ่มประกัน (ฮาร์ดแวร์) / เริ่ม License (ซอฟต์แวร์)
    coverage_end_date   DATE           NULL,   -- หมดประกัน / หมด License  → สแกนแจ้งเตือนจากคอลัมน์นี้
    support_level       NVARCHAR(100)  NULL,

    -- ข้อมูลเสริม
    notes               NVARCHAR(MAX)  NULL,
    custom_attributes   NVARCHAR(MAX)  NULL,   -- JSON สำหรับ Storage / Peripheral
    last_verified_at    DATE           NULL,   -- วันตรวจนับล่าสุด ใช้หาข้อมูลที่ไม่ถูกแตะต้องนาน

    -- Soft delete และ Audit (FR-AS-10)
    is_deleted          BIT            NOT NULL CONSTRAINT DF_assets_deleted DEFAULT (0),
    deleted_at          DATETIMEOFFSET(3) NULL,
    deleted_by          INT            NULL,
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_assets_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT            NULL,
    updated_at          DATETIMEOFFSET(3) NULL,
    updated_by          INT            NULL,

    CONSTRAINT PK_assets PRIMARY KEY CLUSTERED (asset_id),
    CONSTRAINT UX_assets_asset_tag UNIQUE (asset_tag),
    CONSTRAINT FK_assets_category     FOREIGN KEY (category_id)     REFERENCES dbo.asset_categories(category_id),
    CONSTRAINT FK_assets_status       FOREIGN KEY (status_id)       REFERENCES dbo.asset_statuses(status_id),
    CONSTRAINT FK_assets_location     FOREIGN KEY (location_id)     REFERENCES dbo.locations(location_id),
    CONSTRAINT FK_assets_department   FOREIGN KEY (department_id)   REFERENCES dbo.departments(department_id),
    CONSTRAINT FK_assets_owner        FOREIGN KEY (owner_user_id)   REFERENCES dbo.users(user_id),
    CONSTRAINT FK_assets_vendor       FOREIGN KEY (vendor_id)       REFERENCES dbo.vendors(vendor_id),
    CONSTRAINT FK_assets_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES dbo.manufacturers(manufacturer_id),
    CONSTRAINT FK_assets_created_by   FOREIGN KEY (created_by)      REFERENCES dbo.users(user_id),
    CONSTRAINT FK_assets_updated_by   FOREIGN KEY (updated_by)      REFERENCES dbo.users(user_id),
    CONSTRAINT FK_assets_deleted_by   FOREIGN KEY (deleted_by)      REFERENCES dbo.users(user_id),
    CONSTRAINT CK_assets_price       CHECK (purchase_price IS NULL OR purchase_price >= 0),
    CONSTRAINT CK_assets_coverage    CHECK (coverage_start_date IS NULL
                                         OR coverage_end_date IS NULL
                                         OR coverage_end_date >= coverage_start_date),
    CONSTRAINT CK_assets_custom_json CHECK (custom_attributes IS NULL OR ISJSON(custom_attributes) = 1)
);
GO

/* --- Index ของตาราง assets (ตาม NFR-02) --- */

-- ป้องกัน Serial ซ้ำ เฉพาะแถวที่ยังไม่ถูกลบ (FR-AS-03)
CREATE UNIQUE INDEX UX_assets_serial
    ON dbo.assets(serial_number)
    WHERE serial_number IS NOT NULL AND is_deleted = 0;

-- Covering Index หลักของหน้ารายการ — ตอบ Query ได้โดยไม่ต้องอ่านตารางจริง
CREATE INDEX IX_assets_list_covering
    ON dbo.assets(is_deleted, category_id, status_id)
    INCLUDE (asset_tag, name, model, serial_number, location_id,
             owner_user_id, coverage_end_date, purchase_date, purchase_price);

-- งานสแกนวันหมดอายุรายวันและการ์ด Dashboard (FR-NT-01, FR-DB-03)
CREATE INDEX IX_assets_coverage_end
    ON dbo.assets(coverage_end_date)
    INCLUDE (asset_tag, name, category_id, owner_user_id)
    WHERE is_deleted = 0 AND coverage_end_date IS NOT NULL;

CREATE INDEX IX_assets_status       ON dbo.assets(status_id)     WHERE is_deleted = 0;
CREATE INDEX IX_assets_location     ON dbo.assets(location_id)   WHERE is_deleted = 0;
CREATE INDEX IX_assets_vendor       ON dbo.assets(vendor_id)     WHERE is_deleted = 0;
CREATE INDEX IX_assets_owner        ON dbo.assets(owner_user_id) WHERE is_deleted = 0;
CREATE INDEX IX_assets_department   ON dbo.assets(department_id) WHERE is_deleted = 0;
CREATE INDEX IX_assets_manufacturer ON dbo.assets(manufacturer_id);
CREATE INDEX IX_assets_name         ON dbo.assets(name)          WHERE is_deleted = 0;
CREATE INDEX IX_assets_last_verified ON dbo.assets(last_verified_at) WHERE is_deleted = 0;
GO


/* --- ตารางขยายเฉพาะทาง (Class Table Inheritance) --- */

CREATE TABLE dbo.server_details (
    asset_id                INT            NOT NULL,
    server_type             VARCHAR(10)    NOT NULL,
    hostname                NVARCHAR(100)  NULL,
    ip_address              VARCHAR(45)    NULL,   -- รองรับ IPv6
    mgmt_ip                 VARCHAR(45)    NULL,   -- iDRAC / iLO
    mac_address             VARCHAR(17)    NULL,
    cpu_model               NVARCHAR(150)  NULL,
    cpu_socket_count        TINYINT        NULL,
    cpu_core_count          SMALLINT       NULL,
    ram_gb                  INT            NULL,
    storage_config          NVARCHAR(300)  NULL,
    storage_total_gb        INT            NULL,
    os_name                 NVARCHAR(100)  NULL,
    os_version              NVARCHAR(50)   NULL,
    os_install_date         DATE           NULL,
    last_patch_date         DATE           NULL,
    parent_host_asset_id    INT            NULL,   -- VM อยู่บน Host เครื่องไหน
    CONSTRAINT PK_server_details PRIMARY KEY CLUSTERED (asset_id),
    CONSTRAINT FK_server_details_asset FOREIGN KEY (asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_server_details_host  FOREIGN KEY (parent_host_asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT CK_server_type CHECK (server_type IN ('PHYSICAL','VIRTUAL')),
    CONSTRAINT CK_server_ram  CHECK (ram_gb IS NULL OR ram_gb > 0),
    CONSTRAINT CK_server_not_self_host CHECK (parent_host_asset_id IS NULL OR parent_host_asset_id <> asset_id)
);
GO

CREATE INDEX IX_server_ip       ON dbo.server_details(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX IX_server_hostname ON dbo.server_details(hostname)   WHERE hostname   IS NOT NULL;
CREATE INDEX IX_server_mgmt_ip  ON dbo.server_details(mgmt_ip)    WHERE mgmt_ip    IS NOT NULL;
CREATE INDEX IX_server_host     ON dbo.server_details(parent_host_asset_id);
GO

CREATE TABLE dbo.network_details (
    asset_id            INT            NOT NULL,
    device_type         VARCHAR(20)    NOT NULL,
    hostname            NVARCHAR(100)  NULL,
    mgmt_ip             VARCHAR(45)    NULL,
    mac_address         VARCHAR(17)    NULL,
    port_count          SMALLINT       NULL,
    port_speed          NVARCHAR(50)   NULL,
    poe_support         BIT            NULL,
    firmware_version    NVARCHAR(100)  NULL,
    firmware_updated_at DATE           NULL,
    -- หมายเหตุ: ข้อมูล VLAN ไม่เก็บเป็นข้อความอิสระในตารางนี้
    -- แต่ใช้โครงสร้างจริงในโมดูล VLAN/IPAM (ดู 04-vlan-module.sql)
    -- ความสัมพันธ์ "อุปกรณ์นี้รองรับ VLAN ใดบ้าง" อยู่ในตาราง dbo.vlan_devices
    stack_info          NVARCHAR(200)  NULL,
    uplink_asset_id     INT            NULL,
    CONSTRAINT PK_network_details PRIMARY KEY CLUSTERED (asset_id),
    CONSTRAINT FK_network_details_asset  FOREIGN KEY (asset_id)        REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_network_details_uplink FOREIGN KEY (uplink_asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT CK_network_device_type CHECK (device_type IN ('SWITCH','ROUTER','FIREWALL','ACCESS_POINT','LOAD_BALANCER','OTHER')),
    CONSTRAINT CK_network_port_count  CHECK (port_count IS NULL OR port_count > 0)
);
GO

CREATE INDEX IX_network_mgmt_ip  ON dbo.network_details(mgmt_ip)  WHERE mgmt_ip  IS NOT NULL;
CREATE INDEX IX_network_hostname ON dbo.network_details(hostname) WHERE hostname IS NOT NULL;
GO

CREATE TABLE dbo.computer_details (
    asset_id            INT            NOT NULL,
    computer_type       VARCHAR(20)    NOT NULL,
    hostname            NVARCHAR(100)  NULL,
    ip_address          VARCHAR(45)    NULL,
    mac_address         VARCHAR(17)    NULL,
    cpu_model           NVARCHAR(150)  NULL,
    ram_gb              INT            NULL,
    storage_config      NVARCHAR(200)  NULL,
    os_name             NVARCHAR(100)  NULL,
    os_version          NVARCHAR(50)   NULL,
    assigned_date       DATE           NULL,
    assigned_to_name    NVARCHAR(150)  NULL,   -- กรณีผู้ถือครองไม่มีบัญชีในระบบ
    domain_joined       BIT            NULL,
    CONSTRAINT PK_computer_details PRIMARY KEY CLUSTERED (asset_id),
    CONSTRAINT FK_computer_details_asset FOREIGN KEY (asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT CK_computer_type CHECK (computer_type IN ('DESKTOP','NOTEBOOK','WORKSTATION','TABLET','THIN_CLIENT'))
);
GO

CREATE INDEX IX_computer_hostname ON dbo.computer_details(hostname)   WHERE hostname   IS NOT NULL;
CREATE INDEX IX_computer_ip       ON dbo.computer_details(ip_address) WHERE ip_address IS NOT NULL;
GO

CREATE TABLE dbo.software_details (
    asset_id                INT            NOT NULL,
    publisher               NVARCHAR(150)  NULL,
    [version]               NVARCHAR(50)   NULL,
    edition                 NVARCHAR(100)  NULL,
    license_type            VARCHAR(20)    NOT NULL,
    license_key_encrypted   VARBINARY(1024) NULL,  -- AES-256-GCM เข้ารหัสที่ Application (FR-SW-06)
    seats_purchased         INT            NOT NULL CONSTRAINT DF_software_seats DEFAULT (1),
    is_per_device           BIT            NOT NULL CONSTRAINT DF_software_perdev DEFAULT (1),
    support_level           NVARCHAR(100)  NULL,
    auto_renew              BIT            NOT NULL CONSTRAINT DF_software_autorenew DEFAULT (0),
    license_portal_url      NVARCHAR(400)  NULL,
    CONSTRAINT PK_software_details PRIMARY KEY CLUSTERED (asset_id),
    CONSTRAINT FK_software_details_asset FOREIGN KEY (asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT CK_software_license_type CHECK (license_type IN ('PERPETUAL','SUBSCRIPTION','OEM','VOLUME','CORE_BASED','OPEN_SOURCE')),
    CONSTRAINT CK_software_seats CHECK (seats_purchased > 0)
);
GO


/* ============================================================================
   ส่วนที่ 4 — Relationship & Allocation
   ========================================================================== */

CREATE TABLE dbo.software_installations (
    installation_id     INT            IDENTITY(1,1) NOT NULL,
    software_asset_id   INT            NOT NULL,   -- ต้องเป็นทรัพย์สินประเภท SFT
    target_asset_id     INT            NOT NULL,   -- เครื่องที่ติดตั้ง
    installed_date      DATE           NULL,
    installed_version   NVARCHAR(50)   NULL,
    removed_date        DATE           NULL,       -- NULL = ยังติดตั้งอยู่ → ใช้นับ Seat
    is_active           AS (CASE WHEN removed_date IS NULL THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END) PERSISTED,
    notes               NVARCHAR(400)  NULL,
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_swinst_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT            NULL,
    removed_by          INT            NULL,
    CONSTRAINT PK_software_installations PRIMARY KEY CLUSTERED (installation_id),
    CONSTRAINT FK_swinst_software   FOREIGN KEY (software_asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_swinst_target     FOREIGN KEY (target_asset_id)   REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_swinst_created_by FOREIGN KEY (created_by)        REFERENCES dbo.users(user_id),
    CONSTRAINT FK_swinst_removed_by FOREIGN KEY (removed_by)        REFERENCES dbo.users(user_id),
    CONSTRAINT CK_swinst_not_self  CHECK (software_asset_id <> target_asset_id),
    CONSTRAINT CK_swinst_dates     CHECK (removed_date IS NULL OR installed_date IS NULL OR removed_date >= installed_date)
);
GO

-- FR-SW-05 : ห้ามติดตั้ง Software เดียวกันบนเครื่องเดียวกันซ้ำ (เฉพาะที่ยังใช้งานอยู่)
CREATE UNIQUE INDEX UX_swinst_active
    ON dbo.software_installations(software_asset_id, target_asset_id)
    WHERE removed_date IS NULL;

-- เร่งการนับ Seat (FR-SW-03)
CREATE INDEX IX_swinst_software ON dbo.software_installations(software_asset_id) WHERE removed_date IS NULL;
CREATE INDEX IX_swinst_target   ON dbo.software_installations(target_asset_id)   WHERE removed_date IS NULL;
GO

CREATE TABLE dbo.asset_relationships (
    relationship_id         INT            IDENTITY(1,1) NOT NULL,
    source_asset_id         INT            NOT NULL,
    target_asset_id         INT            NOT NULL,
    relationship_type_id    INT            NOT NULL,
    notes                   NVARCHAR(400)  NULL,
    created_at              DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_relations_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by              INT            NULL,
    CONSTRAINT PK_asset_relationships PRIMARY KEY CLUSTERED (relationship_id),
    CONSTRAINT UX_asset_relationships UNIQUE (source_asset_id, target_asset_id, relationship_type_id),
    CONSTRAINT FK_relations_source     FOREIGN KEY (source_asset_id)      REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_relations_target     FOREIGN KEY (target_asset_id)      REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_relations_type       FOREIGN KEY (relationship_type_id) REFERENCES dbo.relationship_types(relationship_type_id),
    CONSTRAINT FK_relations_created_by FOREIGN KEY (created_by)           REFERENCES dbo.users(user_id),
    CONSTRAINT CK_relations_not_self CHECK (source_asset_id <> target_asset_id)
);
GO

CREATE INDEX IX_relations_source ON dbo.asset_relationships(source_asset_id);
CREATE INDEX IX_relations_target ON dbo.asset_relationships(target_asset_id);
GO


/* ============================================================================
   ส่วนที่ 5 — Supporting
   ========================================================================== */

CREATE TABLE dbo.attachments (
    attachment_id       INT            IDENTITY(1,1) NOT NULL,
    asset_id            INT            NOT NULL,
    original_file_name  NVARCHAR(255)  NOT NULL,   -- ชื่อที่ผู้ใช้เห็น
    stored_file_name    VARCHAR(100)   NOT NULL,   -- UUID.ext บนดิสก์ (กัน Path Traversal)
    storage_path        NVARCHAR(400)  NOT NULL,   -- นอก Web Root เสมอ (FR-AT-04)
    mime_type           VARCHAR(100)   NOT NULL,
    file_size_bytes     INT            NOT NULL,
    file_hash           CHAR(64)       NOT NULL,   -- SHA-256 ตรวจความถูกต้องของไฟล์
    description         NVARCHAR(300)  NULL,
    is_deleted          BIT            NOT NULL CONSTRAINT DF_attachments_deleted DEFAULT (0),
    uploaded_at         DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_attachments_uploaded DEFAULT (SYSDATETIMEOFFSET()),
    uploaded_by         INT            NULL,
    CONSTRAINT PK_attachments PRIMARY KEY CLUSTERED (attachment_id),
    CONSTRAINT UX_attachments_stored_name UNIQUE (stored_file_name),
    CONSTRAINT FK_attachments_asset FOREIGN KEY (asset_id)    REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_attachments_user  FOREIGN KEY (uploaded_by) REFERENCES dbo.users(user_id),
    -- ขนาดไฟล์สูงสุด 10 MB ตามที่กำหนดใน Q4
    CONSTRAINT CK_attachments_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760)
);
GO

CREATE INDEX IX_attachments_asset ON dbo.attachments(asset_id) WHERE is_deleted = 0;
GO

CREATE TABLE dbo.notifications (
    notification_id     BIGINT         IDENTITY(1,1) NOT NULL,
    user_id             INT            NOT NULL,
    notification_type   VARCHAR(40)    NOT NULL,
    title               NVARCHAR(200)  NOT NULL,
    message             NVARCHAR(1000) NULL,
    related_entity_type VARCHAR(40)    NULL,
    related_entity_id   INT            NULL,
    is_read             BIT            NOT NULL CONSTRAINT DF_notifications_read DEFAULT (0),
    read_at             DATETIMEOFFSET(3) NULL,
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_notifications_created DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_notifications PRIMARY KEY CLUSTERED (notification_id),
    CONSTRAINT FK_notifications_user FOREIGN KEY (user_id) REFERENCES dbo.users(user_id)
);
GO

-- กระดิ่งแจ้งเตือนต้องนับรายการที่ยังไม่อ่านได้เร็ว (FR-NT-04)
CREATE INDEX IX_notifications_unread
    ON dbo.notifications(user_id, created_at DESC)
    WHERE is_read = 0;
GO

CREATE TABLE dbo.notification_history (
    history_id              BIGINT         IDENTITY(1,1) NOT NULL,
    asset_id                INT            NOT NULL,
    threshold_days          SMALLINT       NOT NULL,   -- 90 / 60 / 30 / 7
    coverage_end_snapshot   DATE           NOT NULL,   -- เปลี่ยนเมื่อต่ออายุ → เริ่มนับรอบใหม่
    channel                 VARCHAR(10)    NOT NULL,
    recipient               NVARCHAR(255)  NULL,
    status                  VARCHAR(10)    NOT NULL,
    error_message           NVARCHAR(1000) NULL,
    sent_at                 DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_nothist_sent DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_notification_history PRIMARY KEY CLUSTERED (history_id),
    CONSTRAINT FK_nothist_asset FOREIGN KEY (asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT CK_nothist_channel CHECK (channel IN ('EMAIL','IN_APP')),
    CONSTRAINT CK_nothist_status  CHECK (status  IN ('SENT','FAILED'))
);
GO

-- FR-NT-05 : กันส่งอีเมลซ้ำสำหรับรายการเดิมในรอบเดียวกัน
CREATE UNIQUE INDEX UX_notification_dedup
    ON dbo.notification_history(asset_id, threshold_days, coverage_end_snapshot, channel)
    WHERE status = 'SENT';
GO

CREATE TABLE dbo.import_batches (
    batch_id        INT              IDENTITY(1,1) NOT NULL,
    batch_uid       UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_import_uid DEFAULT (NEWID()),
    category_id     INT              NOT NULL,
    file_name       NVARCHAR(255)    NOT NULL,
    total_rows      INT              NOT NULL CONSTRAINT DF_import_total DEFAULT (0),
    success_rows    INT              NOT NULL CONSTRAINT DF_import_success DEFAULT (0),
    failed_rows     INT              NOT NULL CONSTRAINT DF_import_failed DEFAULT (0),
    status          VARCHAR(20)      NOT NULL,
    error_report_path NVARCHAR(400)  NULL,
    started_at      DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_import_started DEFAULT (SYSDATETIMEOFFSET()),
    completed_at    DATETIMEOFFSET(3) NULL,
    imported_by     INT              NULL,
    CONSTRAINT PK_import_batches PRIMARY KEY CLUSTERED (batch_id),
    CONSTRAINT UX_import_batches_uid UNIQUE (batch_uid),
    CONSTRAINT FK_import_category FOREIGN KEY (category_id) REFERENCES dbo.asset_categories(category_id),
    CONSTRAINT FK_import_user     FOREIGN KEY (imported_by) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_import_status CHECK (status IN ('VALIDATING','READY','IMPORTING','COMPLETED','FAILED','CANCELLED'))
);
GO


/* ============================================================================
   ส่วนที่ 6 — Compliance (Append-Only)
   ========================================================================== */

CREATE TABLE dbo.audit_logs (
    audit_id            BIGINT          IDENTITY(1,1) NOT NULL,
    occurred_at         DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_audit_occurred DEFAULT (SYSDATETIMEOFFSET()),
    user_id             INT             NULL,       -- NULL ได้ กรณี Login ล้มเหลวด้วยชื่อที่ไม่มีอยู่จริง
    username_snapshot   NVARCHAR(100)   NULL,       -- สำเนาชื่อ ณ เวลาที่เกิดเหตุ
    [action]            VARCHAR(30)     NOT NULL,
    entity_type         VARCHAR(50)     NULL,
    entity_id           INT             NULL,
    entity_label        NVARCHAR(200)   NULL,       -- SRV-2026-0031
    before_json         NVARCHAR(MAX)   NULL,
    after_json          NVARCHAR(MAX)   NULL,
    changed_fields      NVARCHAR(1000)  NULL,       -- รายชื่อฟิลด์ที่เปลี่ยน คั่นด้วยจุลภาค
    ip_address          VARCHAR(45)     NULL,
    user_agent          NVARCHAR(400)   NULL,
    batch_uid           UNIQUEIDENTIFIER NULL,      -- อ้างอิงชุด Import
    CONSTRAINT PK_audit_logs PRIMARY KEY CLUSTERED (audit_id),
    CONSTRAINT FK_audit_user FOREIGN KEY (user_id) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_audit_action CHECK ([action] IN
        ('CREATE','UPDATE','DELETE','RESTORE','LOGIN','LOGOUT','LOGIN_FAILED',
         'IMPORT','EXPORT','REVEAL_KEY','PASSWORD_CHANGE','PASSWORD_RESET',
         'USER_LOCKED','SETTING_CHANGE','FILE_UPLOAD','FILE_DELETE')),
    CONSTRAINT CK_audit_before_json CHECK (before_json IS NULL OR ISJSON(before_json) = 1),
    CONSTRAINT CK_audit_after_json  CHECK (after_json  IS NULL OR ISJSON(after_json)  = 1)
);
GO

CREATE INDEX IX_audit_occurred ON dbo.audit_logs(occurred_at DESC);
CREATE INDEX IX_audit_user     ON dbo.audit_logs(user_id, occurred_at DESC);
CREATE INDEX IX_audit_entity   ON dbo.audit_logs(entity_type, entity_id, occurred_at DESC);
CREATE INDEX IX_audit_action   ON dbo.audit_logs([action], occurred_at DESC);
CREATE INDEX IX_audit_batch    ON dbo.audit_logs(batch_uid) WHERE batch_uid IS NOT NULL;
GO

-- ตารางเก็บถาวร โครงสร้างเดียวกันแต่ไม่มี IDENTITY (ดู sp_archive_audit_logs)
CREATE TABLE dbo.audit_logs_archive (
    audit_id            BIGINT          NOT NULL,
    occurred_at         DATETIMEOFFSET(3) NOT NULL,
    user_id             INT             NULL,
    username_snapshot   NVARCHAR(100)   NULL,
    [action]            VARCHAR(30)     NOT NULL,
    entity_type         VARCHAR(50)     NULL,
    entity_id           INT             NULL,
    entity_label        NVARCHAR(200)   NULL,
    before_json         NVARCHAR(MAX)   NULL,
    after_json          NVARCHAR(MAX)   NULL,
    changed_fields      NVARCHAR(1000)  NULL,
    ip_address          VARCHAR(45)     NULL,
    user_agent          NVARCHAR(400)   NULL,
    batch_uid           UNIQUEIDENTIFIER NULL,
    archived_at         DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_auditarch_at DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT PK_audit_logs_archive PRIMARY KEY CLUSTERED (audit_id)
);
GO

/* --- ชั้นที่ 1 ของการป้องกัน Append-Only (FR-AD-03) --- */
CREATE TRIGGER dbo.trg_audit_logs_no_modify
ON dbo.audit_logs
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 51000, 'audit_logs is append-only. UPDATE and DELETE are permanently disabled by design (FR-AD-03).', 1;
END;
GO

CREATE TABLE dbo.system_settings (
    setting_key     VARCHAR(100)    NOT NULL,
    setting_value   NVARCHAR(MAX)   NULL,
    value_type      VARCHAR(10)     NOT NULL CONSTRAINT DF_settings_type DEFAULT ('STRING'),
    description     NVARCHAR(400)   NULL,
    is_secret       BIT             NOT NULL CONSTRAINT DF_settings_secret DEFAULT (0),
    updated_at      DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_settings_updated DEFAULT (SYSDATETIMEOFFSET()),
    updated_by      INT             NULL,
    CONSTRAINT PK_system_settings PRIMARY KEY CLUSTERED (setting_key),
    CONSTRAINT FK_settings_user FOREIGN KEY (updated_by) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_settings_type CHECK (value_type IN ('STRING','INT','BOOL','JSON','SECRET'))
);
GO


/* ============================================================================
   ส่วนที่ 7 — Views
   ========================================================================== */

/* -- 7.1 รายการทรัพย์สินสำหรับหน้า List และ Global Search -- */
CREATE VIEW dbo.vw_asset_list
AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name,
    a.model,
    a.serial_number,
    c.code                  AS category_code,
    c.name                  AS category_name,
    s.code                  AS status_code,
    s.name                  AS status_name,
    s.color_token           AS status_color,
    m.name                  AS manufacturer_name,
    l.name                  AS location_name,
    d.name                  AS department_name,
    u.full_name             AS owner_name,
    v.name                  AS vendor_name,
    a.purchase_date,
    a.purchase_price,
    a.currency,
    a.coverage_end_date,
    CASE WHEN a.coverage_end_date IS NULL THEN NULL
         ELSE DATEDIFF(DAY, CAST(SYSDATETIMEOFFSET() AS DATE), a.coverage_end_date)
    END                     AS days_until_expiry,
    -- รวม hostname และ IP จากทุกตารางขยายให้ค้นหาได้จากคอลัมน์เดียว
    COALESCE(sd.hostname, nd.hostname, cd.hostname)          AS hostname,
    COALESCE(sd.ip_address, nd.mgmt_ip, cd.ip_address)       AS ip_address,
    a.last_verified_at,
    a.created_at,
    a.updated_at
FROM dbo.assets a
    INNER JOIN dbo.asset_categories c ON c.category_id = a.category_id
    INNER JOIN dbo.asset_statuses   s ON s.status_id   = a.status_id
    LEFT  JOIN dbo.manufacturers    m ON m.manufacturer_id = a.manufacturer_id
    LEFT  JOIN dbo.locations        l ON l.location_id     = a.location_id
    LEFT  JOIN dbo.departments      d ON d.department_id   = a.department_id
    LEFT  JOIN dbo.users            u ON u.user_id         = a.owner_user_id
    LEFT  JOIN dbo.vendors          v ON v.vendor_id       = a.vendor_id
    LEFT  JOIN dbo.server_details   sd ON sd.asset_id = a.asset_id
    LEFT  JOIN dbo.network_details  nd ON nd.asset_id = a.asset_id
    LEFT  JOIN dbo.computer_details cd ON cd.asset_id = a.asset_id
WHERE a.is_deleted = 0;
GO

/* -- 7.2 การนับ Seat ของ Software (FR-SW-03, FR-SW-04) -- */
CREATE VIEW dbo.vw_software_seat_usage
AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name                              AS software_name,
    sd.publisher,
    sd.[version],
    sd.license_type,
    sd.seats_purchased,
    ISNULL(seat.seats_used, 0)         AS seats_used,
    sd.seats_purchased - ISNULL(seat.seats_used, 0) AS seats_available,
    CASE WHEN ISNULL(seat.seats_used, 0) > sd.seats_purchased
         THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT)
    END                                 AS is_over_deployed,
    CASE WHEN ISNULL(seat.seats_used, 0) > sd.seats_purchased
         THEN ISNULL(seat.seats_used, 0) - sd.seats_purchased ELSE 0
    END                                 AS over_deployed_count,
    a.coverage_end_date                 AS license_end_date,
    CASE WHEN a.coverage_end_date IS NULL THEN NULL
         ELSE DATEDIFF(DAY, CAST(SYSDATETIMEOFFSET() AS DATE), a.coverage_end_date)
    END                                 AS days_until_expiry
FROM dbo.assets a
    INNER JOIN dbo.software_details sd ON sd.asset_id = a.asset_id
    OUTER APPLY (
        SELECT COUNT(*) AS seats_used
        FROM dbo.software_installations si
        WHERE si.software_asset_id = a.asset_id
          AND si.removed_date IS NULL
    ) seat
WHERE a.is_deleted = 0;
GO

/* -- 7.3 รายการใกล้หมดอายุ (FR-DB-03, FR-NT-01) -- */
CREATE VIEW dbo.vw_expiring_assets
AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name,
    c.code                  AS category_code,
    c.name                  AS category_name,
    a.coverage_end_date,
    DATEDIFF(DAY, CAST(SYSDATETIMEOFFSET() AS DATE), a.coverage_end_date) AS days_remaining,
    CASE
        WHEN DATEDIFF(DAY, CAST(SYSDATETIMEOFFSET() AS DATE), a.coverage_end_date) < 0  THEN 'EXPIRED'
        WHEN DATEDIFF(DAY, CAST(SYSDATETIMEOFFSET() AS DATE), a.coverage_end_date) <= 30 THEN 'CRITICAL'
        WHEN DATEDIFF(DAY, CAST(SYSDATETIMEOFFSET() AS DATE), a.coverage_end_date) <= 60 THEN 'WARNING'
        WHEN DATEDIFF(DAY, CAST(SYSDATETIMEOFFSET() AS DATE), a.coverage_end_date) <= 90 THEN 'NOTICE'
        ELSE 'OK'
    END                     AS severity,
    a.owner_user_id,
    u.full_name             AS owner_name,
    u.email                 AS owner_email,
    l.name                  AS location_name,
    v.name                  AS vendor_name
FROM dbo.assets a
    INNER JOIN dbo.asset_categories c ON c.category_id = a.category_id
    LEFT  JOIN dbo.users            u ON u.user_id     = a.owner_user_id
    LEFT  JOIN dbo.locations        l ON l.location_id = a.location_id
    LEFT  JOIN dbo.vendors          v ON v.vendor_id   = a.vendor_id
WHERE a.is_deleted = 0
  AND a.coverage_end_date IS NOT NULL;
GO

/* -- 7.4 ความสัมพันธ์ทั้งขาเข้าและขาออกในมุมมองเดียว (FR-CM-02) -- */
CREATE VIEW dbo.vw_asset_relationships_expanded
AS
SELECT
    r.relationship_id,
    r.source_asset_id       AS from_asset_id,
    r.target_asset_id       AS to_asset_id,
    'OUTGOING'              AS direction,
    rt.forward_name         AS relationship_name,
    a.asset_tag             AS related_asset_tag,
    a.name                  AS related_asset_name,
    s.code                  AS related_status_code,
    r.notes
FROM dbo.asset_relationships r
    INNER JOIN dbo.relationship_types rt ON rt.relationship_type_id = r.relationship_type_id
    INNER JOIN dbo.assets a  ON a.asset_id  = r.target_asset_id
    INNER JOIN dbo.asset_statuses s ON s.status_id = a.status_id
WHERE a.is_deleted = 0

UNION ALL

SELECT
    r.relationship_id,
    r.target_asset_id       AS from_asset_id,
    r.source_asset_id       AS to_asset_id,
    'INCOMING'              AS direction,
    rt.inverse_name         AS relationship_name,
    a.asset_tag             AS related_asset_tag,
    a.name                  AS related_asset_name,
    s.code                  AS related_status_code,
    r.notes
FROM dbo.asset_relationships r
    INNER JOIN dbo.relationship_types rt ON rt.relationship_type_id = r.relationship_type_id
    INNER JOIN dbo.assets a  ON a.asset_id  = r.source_asset_id
    INNER JOIN dbo.asset_statuses s ON s.status_id = a.status_id
WHERE a.is_deleted = 0;
GO

/* -- 7.5 เส้นทางเต็มของสถานที่แบบลำดับชั้น (FR-MD-03) -- */
CREATE VIEW dbo.vw_location_tree
AS
WITH tree AS (
    SELECT
        location_id,
        parent_location_id,
        code,
        name,
        location_type,
        is_active,
        CAST(name AS NVARCHAR(1000))           AS full_path,
        0                                      AS depth
    FROM dbo.locations
    WHERE parent_location_id IS NULL

    UNION ALL

    SELECT
        l.location_id,
        l.parent_location_id,
        l.code,
        l.name,
        l.location_type,
        l.is_active,
        CAST(t.full_path + N' / ' + l.name AS NVARCHAR(1000)),
        t.depth + 1
    FROM dbo.locations l
        INNER JOIN tree t ON t.location_id = l.parent_location_id
)
SELECT location_id, parent_location_id, code, name, location_type, is_active, full_path, depth
FROM tree;
GO


/* ============================================================================
   ส่วนที่ 8 — Stored Procedures
   ========================================================================== */

/* -- 8.1 สร้างรหัสทรัพย์สินแบบปลอดภัยต่อการทำงานพร้อมกัน -- */
CREATE PROCEDURE dbo.sp_generate_asset_tag
    @category_id INT,
    @asset_tag   VARCHAR(20) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @year SMALLINT = YEAR(CAST(SYSDATETIMEOFFSET() AS DATE));
    DECLARE @code VARCHAR(10);
    DECLARE @next INT;

    SELECT @code = code FROM dbo.asset_categories WHERE category_id = @category_id AND is_active = 1;
    IF @code IS NULL
        THROW 51001, 'Unknown or inactive asset category.', 1;

    BEGIN TRANSACTION;

        -- UPDLOCK + HOLDLOCK ป้องกันผู้ใช้สองคนได้รหัสเดียวกันเมื่อบันทึกพร้อมกัน
        UPDATE dbo.asset_tag_sequences WITH (UPDLOCK, HOLDLOCK)
            SET @next = last_number = last_number + 1
        WHERE category_id = @category_id AND [year] = @year;

        IF @@ROWCOUNT = 0
        BEGIN
            SET @next = 1;
            INSERT INTO dbo.asset_tag_sequences (category_id, [year], last_number)
            VALUES (@category_id, @year, 1);
        END

    COMMIT TRANSACTION;

    SET @asset_tag = @code + '-' + CAST(@year AS VARCHAR(4))
                   + '-' + RIGHT('0000' + CAST(@next AS VARCHAR(10)), 4);
END;
GO

/* -- 8.2 ลบทรัพย์สินแบบ Soft Delete พร้อมถอนการติดตั้ง Software (FR-AS-10) -- */
CREATE PROCEDURE dbo.sp_soft_delete_asset
    @asset_id INT,
    @user_id  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.assets WHERE asset_id = @asset_id AND is_deleted = 0)
        THROW 51002, 'Asset not found or already deleted.', 1;

    BEGIN TRANSACTION;

        -- คืน Seat ของ Software ที่ติดตั้งบนเครื่องนี้ เพื่อให้การนับสิทธิ์ยังถูกต้อง
        UPDATE dbo.software_installations
            SET removed_date = CAST(SYSDATETIMEOFFSET() AS DATE),
                removed_by   = @user_id
        WHERE target_asset_id = @asset_id
          AND removed_date IS NULL;

        -- หากตัวมันเองเป็น Software ให้ถอนการติดตั้งทั้งหมดของมันด้วย
        UPDATE dbo.software_installations
            SET removed_date = CAST(SYSDATETIMEOFFSET() AS DATE),
                removed_by   = @user_id
        WHERE software_asset_id = @asset_id
          AND removed_date IS NULL;

        UPDATE dbo.assets
            SET is_deleted = 1,
                deleted_at = SYSDATETIMEOFFSET(),
                deleted_by = @user_id,
                updated_at = SYSDATETIMEOFFSET(),
                updated_by = @user_id
        WHERE asset_id = @asset_id;

    COMMIT TRANSACTION;
END;
GO

/* -- 8.3 ย้าย Audit Log เก่าไปตารางเก็บถาวร (ใช้โดย DBA เท่านั้น) -- */
CREATE PROCEDURE dbo.sp_archive_audit_logs
    @retain_years INT = 3
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @cutoff DATETIMEOFFSET(3) = DATEADD(YEAR, -@retain_years, SYSDATETIMEOFFSET());

    BEGIN TRANSACTION;

        INSERT INTO dbo.audit_logs_archive
            (audit_id, occurred_at, user_id, username_snapshot, [action], entity_type,
             entity_id, entity_label, before_json, after_json, changed_fields,
             ip_address, user_agent, batch_uid)
        SELECT
             audit_id, occurred_at, user_id, username_snapshot, [action], entity_type,
             entity_id, entity_label, before_json, after_json, changed_fields,
             ip_address, user_agent, batch_uid
        FROM dbo.audit_logs
        WHERE occurred_at < @cutoff;

        -- ต้องปิด Trigger ชั่วคราวเพราะตารางถูกป้องกันการลบไว้โดยเจตนา
        DISABLE TRIGGER dbo.trg_audit_logs_no_modify ON dbo.audit_logs;

        DELETE FROM dbo.audit_logs WHERE occurred_at < @cutoff;

        ENABLE TRIGGER dbo.trg_audit_logs_no_modify ON dbo.audit_logs;

    COMMIT TRANSACTION;
END;
GO


/* ============================================================================
   ส่วนที่ 9 — ข้อมูลตั้งต้น (Seed Data)
   ========================================================================== */

INSERT INTO dbo.roles (code, name, description, is_system, sort_order) VALUES
    ('ADMIN',    N'Administrator', N'Full system access including user management and settings', 1, 1),
    ('IT_STAFF', N'IT Staff',      N'Create, update and delete assets; import and export data',  1, 2),
    ('AUDITOR',  N'Auditor',       N'Read-only access including full audit log and reports',     1, 3),
    ('VIEWER',   N'Viewer',        N'Read-only access to asset data',                            1, 4);
GO

INSERT INTO dbo.asset_statuses (code, name, color_token, is_operational, sort_order) VALUES
    ('IN_USE',       N'In Use',       'emerald', 1, 1),
    ('IN_STOCK',     N'In Stock',     'sky',     1, 2),
    ('UNDER_REPAIR', N'Under Repair', 'amber',   1, 3),
    ('RETIRED',      N'Retired',      'slate',   0, 4),
    ('DISPOSED',     N'Disposed',     'rose',    0, 5);
GO

INSERT INTO dbo.asset_categories (code, name, detail_table, icon_name, sort_order) VALUES
    ('SRV', N'Server',           'server_details',   'server',     1),
    ('NET', N'Network Device',   'network_details',  'network',    2),
    ('SFT', N'Software License', 'software_details', 'disc',       3),
    ('PC',  N'Computer',         'computer_details', 'laptop',     4),
    ('STG', N'Storage & Power',  NULL,               'hard-drive', 5),
    ('PER', N'Peripheral',       NULL,               'printer',    6);
GO

INSERT INTO dbo.relationship_types (code, forward_name, inverse_name) VALUES
    ('HOSTED_ON',    N'Hosted On',    N'Hosts'),
    ('CONNECTED_TO', N'Connected To', N'Connected From'),
    ('DEPENDS_ON',   N'Depends On',   N'Required By'),
    ('BACKED_UP_BY', N'Backed Up By', N'Backs Up'),
    ('POWERED_BY',   N'Powered By',   N'Powers');
GO

INSERT INTO dbo.system_settings (setting_key, setting_value, value_type, description, is_secret) VALUES
    ('smtp.host',                 N'',            'STRING', N'SMTP server hostname',                      0),
    ('smtp.port',                 N'587',         'INT',    N'SMTP server port',                          0),
    ('smtp.encryption',           N'STARTTLS',    'STRING', N'NONE / STARTTLS / SSL',                      0),
    ('smtp.username',             N'',            'STRING', N'SMTP auth username',                        0),
    ('smtp.password',             N'',            'SECRET', N'SMTP auth password (encrypted at rest)',     1),
    ('smtp.sender_address',       N'',            'STRING', N'From address for outgoing mail',             0),
    ('notification.thresholds',   N'[90,60,30,7]','JSON',   N'Days before expiry to send alerts',          0),
    ('notification.scan_time',    N'08:00',       'STRING', N'Daily scheduled job time (server local)',    0),
    ('notification.notify_admins',N'true',        'BOOL',   N'Send expiry alerts to all admins',           0),
    ('notification.notify_owner', N'true',        'BOOL',   N'Send expiry alerts to the asset owner',      0),
    ('security.max_login_attempts', N'5',         'INT',    N'Failed attempts before account lock',        0),
    ('security.lockout_minutes',  N'15',          'INT',    N'Lock duration in minutes',                   0),
    ('security.session_idle_minutes', N'60',      'INT',    N'Idle timeout before session expires',        0),
    ('upload.max_file_mb',        N'10',          'INT',    N'Maximum size per attachment',                0),
    ('upload.max_files_per_asset',N'20',          'INT',    N'Maximum attachment count per asset',         0),
    ('upload.allowed_types',      N'["pdf","jpg","jpeg","png","webp","xlsx","docx"]', 'JSON', N'Allowed attachment extensions', 0);
GO

/* --- บัญชีผู้ดูแลระบบเริ่มต้น ---
   ⚠️ ค่า password_hash ด้านล่างเป็นค่าตัวอย่างเท่านั้น
   ต้องแทนที่ด้วย Argon2id hash ที่สร้างจากสคริปต์ติดตั้งจริง
   และบัญชีนี้ถูกบังคับให้เปลี่ยนรหัสผ่านทันทีที่เข้าสู่ระบบครั้งแรก      */
INSERT INTO dbo.users (username, email, password_hash, full_name, role_id, is_active, must_change_password)
SELECT 'admin', 'admin@example.local', '$argon2id$REPLACE_ON_INSTALL', N'System Administrator', r.role_id, 1, 1
FROM dbo.roles r WHERE r.code = 'ADMIN';
GO


/* ============================================================================
   ส่วนที่ 10 — สิทธิ์ของบัญชีที่แอปพลิเคชันใช้ (ชั้นที่ 2 ของ Append-Only)
   ========================================================================== */
/*
   รันหลังสร้าง Login และ User ของแอปพลิเคชันแล้ว
   หลักการ: บัญชีแอปพลิเคชันไม่ควรเป็น db_owner

CREATE ROLE is_inventory_app_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO is_inventory_app_role;

-- ปิดสิทธิ์แก้ไขและลบ Audit Log ที่ระดับฐานข้อมูล
DENY  UPDATE, DELETE ON dbo.audit_logs         TO is_inventory_app_role;
DENY  INSERT, UPDATE, DELETE ON dbo.audit_logs_archive TO is_inventory_app_role;

GRANT EXECUTE ON dbo.sp_generate_asset_tag TO is_inventory_app_role;
GRANT EXECUTE ON dbo.sp_soft_delete_asset  TO is_inventory_app_role;
-- ไม่ให้สิทธิ์ sp_archive_audit_logs แก่แอปพลิเคชัน — DBA เท่านั้น

ALTER ROLE is_inventory_app_role ADD MEMBER [is_inventory_app_user];
*/


/* ============================================================================
   จบสคริปต์
   ========================================================================== */
