/* ============================================================================
   KKND — IT Inventory Management System
   Module v1.3b : Detail Tables · Rack Elevation · IP Address Management

   Requires: 10-module-v1.3a-taxonomy.sql ต้องรันสำเร็จก่อน

   ขอบเขตของไฟล์นี้
   ----------------
   1. ตารางขยาย 4 หมวดใหม่ : Storage · Power · Peripheral · Mobile/IoT
   2. Rack และการจองตำแหน่ง U พร้อมกติกากันซ้อนทับ
   3. ตาราง ip_addresses แบบ IPAM เต็มรูปแบบ พร้อมย้ายข้อมูล IP เดิมเข้ามา
   4. สร้าง View ที่อ้างถึงคอลัมน์ IP เดิมขึ้นใหม่ทั้งหมด

   สิ่งที่เพิ่ม : 8 ตาราง · 1 Function · 8 View · 2 Trigger
   ========================================================================== */


/* ============================================================================
   ส่วนที่ 1 — ตารางขยายหมวด Storage
   ========================================================================== */

CREATE TABLE dbo.storage_details (
    asset_id                INT             NOT NULL,
    hostname                NVARCHAR(100)   NULL,
    mgmt_url                NVARCHAR(400)   NULL,
    controller_count        TINYINT         NULL,   -- HA = 2
    disk_bay_total          SMALLINT        NULL,
    disk_bay_used           SMALLINT        NULL,
    raw_capacity_tb         DECIMAL(12,2)   NULL,   -- ความจุดิบรวม
    usable_capacity_tb      DECIMAL(12,2)   NULL,   -- ความจุใช้งานได้หลังทำ RAID
    cache_gb                INT             NULL,
    supported_protocols     NVARCHAR(200)   NULL,   -- FC · iSCSI · NFS · SMB · S3
    expansion_shelf_count   TINYINT         NULL,
    firmware_version        NVARCHAR(100)   NULL,
    firmware_updated_at     DATE            NULL,
    has_dedup               BIT             NULL,
    has_compression         BIT             NULL,
    has_snapshot            BIT             NULL,
    has_replication         BIT             NULL,
    CONSTRAINT PK_storage_details PRIMARY KEY CLUSTERED (asset_id),
    CONSTRAINT FK_storage_details_asset FOREIGN KEY (asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT CK_stg_bays     CHECK (disk_bay_used IS NULL OR disk_bay_total IS NULL OR disk_bay_used <= disk_bay_total),
    CONSTRAINT CK_stg_capacity CHECK (usable_capacity_tb IS NULL OR raw_capacity_tb IS NULL OR usable_capacity_tb <= raw_capacity_tb),
    CONSTRAINT CK_stg_positive CHECK ((raw_capacity_tb IS NULL OR raw_capacity_tb > 0)
                                  AND (cache_gb        IS NULL OR cache_gb        > 0))
);
GO
CREATE INDEX IX_storage_hostname ON dbo.storage_details(hostname) WHERE hostname IS NOT NULL;
GO


/* ============================================================================
   ส่วนที่ 2 — ตารางขยายหมวด Power & Cooling
   ========================================================================== */

CREATE TABLE dbo.power_details (
    asset_id                    INT             NOT NULL,
    capacity_kva                DECIMAL(8,2)    NULL,   -- กำลังไฟฟ้าปรากฏ
    capacity_kw                 DECIMAL(8,2)    NULL,   -- กำลังไฟฟ้าจริง
    input_phase                 TINYINT         NULL,   -- 1 หรือ 3 เฟส
    input_voltage               NVARCHAR(50)    NULL,
    output_voltage              NVARCHAR(50)    NULL,
    outlet_count                SMALLINT        NULL,
    outlet_type                 NVARCHAR(100)   NULL,   -- C13 · C19 · NEMA 5-15R

    /* ---------- แบตเตอรี่ ---------- */
    battery_count               SMALLINT        NULL,
    battery_model               NVARCHAR(100)   NULL,
    battery_install_date        DATE            NULL,
    battery_replace_due         DATE            NULL,   -- ⭐ เข้าระบบแจ้งเตือนเดียวกับวันหมดประกัน
    runtime_minutes_full_load   SMALLINT        NULL,

    /* ---------- ค่าที่วัดได้ ต้องมีวันที่วัดกำกับเสมอ ---------- */
    current_load_percent        DECIMAL(5,1)    NULL,
    load_measured_at            DATE            NULL,

    has_bypass                  BIT             NULL,
    has_snmp_card               BIT             NULL,
    firmware_version            NVARCHAR(100)   NULL,

    /* ---------- สำหรับระบบทำความเย็น ---------- */
    cooling_capacity_btu        INT             NULL,
    refrigerant_type            NVARCHAR(50)    NULL,
    last_service_date           DATE            NULL,

    CONSTRAINT PK_power_details PRIMARY KEY CLUSTERED (asset_id),
    CONSTRAINT FK_power_details_asset FOREIGN KEY (asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT CK_pwr_phase   CHECK (input_phase IS NULL OR input_phase IN (1,3)),
    CONSTRAINT CK_pwr_load    CHECK (current_load_percent IS NULL OR current_load_percent BETWEEN 0 AND 200),
    CONSTRAINT CK_pwr_kva     CHECK (capacity_kva IS NULL OR capacity_kva > 0),
    CONSTRAINT CK_pwr_battery CHECK (battery_replace_due IS NULL OR battery_install_date IS NULL
                                     OR battery_replace_due >= battery_install_date),
    -- ⭐ วินัยข้อมูล : ถ้าบันทึกค่าโหลด ต้องบอกด้วยว่าวัดเมื่อไร
    CONSTRAINT CK_pwr_measured CHECK (current_load_percent IS NULL OR load_measured_at IS NOT NULL)
);
GO
CREATE INDEX IX_power_battery_due ON dbo.power_details(battery_replace_due)
    WHERE battery_replace_due IS NOT NULL;
GO


/* ============================================================================
   ส่วนที่ 3 — ตารางขยายหมวด Peripheral
   ========================================================================== */

CREATE TABLE dbo.peripheral_details (
    asset_id            INT             NOT NULL,

    /* ---------- ร่วมทุกประเภท ---------- */
    connection_type     VARCHAR(20)     NULL,   -- USB / NETWORK / HDMI / BLUETOOTH / WIRELESS / SERIAL
    firmware_version    NVARCHAR(100)   NULL,

    /* ---------- กลุ่มงานพิมพ์ ---------- */
    print_technology    VARCHAR(20)     NULL,   -- LASER / INKJET / THERMAL / DOT_MATRIX / LED
    is_color            BIT             NULL,
    max_paper_size      VARCHAR(10)     NULL,   -- A4 / A3 / A2 / A1 / A0
    has_duplex          BIT             NULL,
    has_adf             BIT             NULL,   -- ถาดป้อนกระดาษอัตโนมัติ
    page_counter_mono   INT             NULL,
    page_counter_color  INT             NULL,
    counter_read_date   DATE            NULL,   -- ⭐ ค่าที่วัดได้ ต้องมีวันที่กำกับ
    toner_model         NVARCHAR(100)   NULL,

    /* ---------- กลุ่มจอภาพ ---------- */
    screen_size_inch    DECIMAL(5,1)    NULL,
    resolution          NVARCHAR(30)    NULL,   -- 1920x1080 · 3840x2160
    panel_type          VARCHAR(10)     NULL,   -- IPS / VA / TN / OLED
    refresh_rate_hz     SMALLINT        NULL,
    has_speaker         BIT             NULL,
    mount_type          VARCHAR(20)     NULL,   -- DESK / VESA / WALL / CEILING

    CONSTRAINT PK_peripheral_details PRIMARY KEY CLUSTERED (asset_id),
    CONSTRAINT FK_peripheral_details_asset FOREIGN KEY (asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT CK_per_conn  CHECK (connection_type IS NULL OR connection_type IN
        ('USB','NETWORK','HDMI','BLUETOOTH','WIRELESS','SERIAL','PARALLEL','DISPLAYPORT')),
    CONSTRAINT CK_per_print CHECK (print_technology IS NULL OR print_technology IN
        ('LASER','INKJET','THERMAL','DOT_MATRIX','LED','RESIN','FDM')),
    CONSTRAINT CK_per_panel CHECK (panel_type IS NULL OR panel_type IN ('IPS','VA','TN','OLED','LED')),
    CONSTRAINT CK_per_mount CHECK (mount_type IS NULL OR mount_type IN ('DESK','VESA','WALL','CEILING','FLOOR')),
    CONSTRAINT CK_per_paper CHECK (max_paper_size IS NULL OR max_paper_size IN ('A4','A3','A2','A1','A0','LETTER','LEGAL')),
    -- ⭐ วินัยข้อมูล : ถ้าบันทึกเลขหน้าพิมพ์ ต้องบอกด้วยว่าอ่านค่าเมื่อไร
    CONSTRAINT CK_per_counter CHECK ((page_counter_mono IS NULL AND page_counter_color IS NULL)
                                     OR counter_read_date IS NOT NULL)
);
GO


/* ============================================================================
   ส่วนที่ 4 — ตารางขยายหมวด Mobile & IoT/OT
   ========================================================================== */

CREATE TABLE dbo.mobile_iot_details (
    asset_id            INT             NOT NULL,

    /* ---------- กลุ่มอุปกรณ์พกพา ---------- */
    imei                VARCHAR(20)     NULL,
    phone_number        NVARCHAR(30)    NULL,
    sim_provider        NVARCHAR(80)    NULL,
    os_name             NVARCHAR(100)   NULL,
    os_version          NVARCHAR(50)    NULL,
    is_mdm_enrolled     BIT             NULL,
    mdm_platform        NVARCHAR(80)    NULL,

    /* ---------- ร่วมทุกประเภท ---------- */
    hostname            NVARCHAR(100)   NULL,
    mac_address         VARCHAR(17)     NULL,
    firmware_version    NVARCHAR(100)   NULL,

    /* ---------- กลุ่ม OT ---------- */
    device_protocol     VARCHAR(30)     NULL,   -- MODBUS / OPC_UA / BACNET / MQTT / PROFINET
    controller_model    NVARCHAR(100)   NULL,
    io_point_count      SMALLINT        NULL,

    /* ---------- กลุ่มกล้องวงจรปิด ---------- */
    resolution          NVARCHAR(30)    NULL,
    has_ptz             BIT             NULL,
    has_ir              BIT             NULL,
    storage_type        VARCHAR(20)     NULL,   -- SD_CARD / NVR / CLOUD / NONE

    /* ---------- ผู้ถือครอง ---------- */
    assigned_to_name    NVARCHAR(150)   NULL,
    assigned_date       DATE            NULL,

    CONSTRAINT PK_mobile_iot_details PRIMARY KEY CLUSTERED (asset_id),
    CONSTRAINT FK_mobile_iot_details_asset FOREIGN KEY (asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT CK_iot_protocol CHECK (device_protocol IS NULL OR device_protocol IN
        ('MODBUS','OPC_UA','BACNET','MQTT','PROFINET','ETHERNET_IP','SNMP','ONVIF','OTHER')),
    CONSTRAINT CK_iot_storage  CHECK (storage_type IS NULL OR storage_type IN ('SD_CARD','NVR','CLOUD','NAS','NONE')),
    CONSTRAINT CK_iot_imei     CHECK (imei IS NULL OR (LEN(imei) = 15 AND imei NOT LIKE '%[^0-9]%'))
);
GO
CREATE INDEX IX_iot_imei ON dbo.mobile_iot_details(imei) WHERE imei IS NOT NULL;
GO


/* ============================================================================
   ส่วนที่ 5 — Rack และการจองตำแหน่ง U
   ========================================================================== */

CREATE TABLE dbo.racks (
    rack_id             INT             IDENTITY(1,1) NOT NULL,
    location_id         INT             NOT NULL,   -- ห้องที่ตู้ตั้งอยู่
    code                VARCHAR(30)     NOT NULL,   -- RACK-A2
    name                NVARCHAR(120)   NOT NULL,
    total_u             TINYINT         NOT NULL CONSTRAINT DF_racks_total_u DEFAULT (42),
    width_mm            SMALLINT        NULL,
    depth_mm            SMALLINT        NULL,
    max_weight_kg       DECIMAL(8,2)    NULL,   -- ⭐ ใช้เตือนก่อนติดตั้งเกิน
    max_power_kw        DECIMAL(6,2)    NULL,   -- ⭐ ใช้เตือนก่อนติดตั้งเกิน
    numbering_direction VARCHAR(10)     NOT NULL CONSTRAINT DF_racks_dir DEFAULT ('BOTTOM_UP'),
    has_front_door      BIT             NULL,
    has_rear_door       BIT             NULL,
    notes               NVARCHAR(400)   NULL,
    is_active           BIT             NOT NULL CONSTRAINT DF_racks_active DEFAULT (1),
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_racks_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT             NULL,
    updated_at          DATETIMEOFFSET(3) NULL,
    updated_by          INT             NULL,
    CONSTRAINT PK_racks PRIMARY KEY CLUSTERED (rack_id),
    CONSTRAINT UX_racks_code UNIQUE (code),
    CONSTRAINT FK_racks_location   FOREIGN KEY (location_id) REFERENCES dbo.locations(location_id),
    CONSTRAINT FK_racks_created_by FOREIGN KEY (created_by)  REFERENCES dbo.users(user_id),
    CONSTRAINT FK_racks_updated_by FOREIGN KEY (updated_by)  REFERENCES dbo.users(user_id),
    CONSTRAINT CK_racks_total_u CHECK (total_u BETWEEN 1 AND 60),
    CONSTRAINT CK_racks_dir     CHECK (numbering_direction IN ('BOTTOM_UP','TOP_DOWN'))
);
GO
CREATE INDEX IX_racks_location ON dbo.racks(location_id) WHERE is_active = 1;
GO

CREATE TABLE dbo.rack_mounts (
    rack_mount_id   INT             IDENTITY(1,1) NOT NULL,
    rack_id         INT             NOT NULL,
    asset_id        INT             NOT NULL,
    start_u         TINYINT         NOT NULL,   -- ตำแหน่ง U ล่างสุดของอุปกรณ์
    u_height        TINYINT         NOT NULL,   -- เติมอัตโนมัติจาก Model Catalog
    mount_face      VARCHAR(10)     NOT NULL CONSTRAINT DF_rm_face DEFAULT ('FRONT'),
    orientation     VARCHAR(10)     NOT NULL CONSTRAINT DF_rm_orient DEFAULT ('NORMAL'),
    mounted_date    DATE            NULL,
    removed_date    DATE            NULL,       -- NULL = ยังติดตั้งอยู่
    notes           NVARCHAR(300)   NULL,
    created_at      DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_rm_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by      INT             NULL,
    updated_at      DATETIMEOFFSET(3) NULL,
    updated_by      INT             NULL,
    CONSTRAINT PK_rack_mounts PRIMARY KEY CLUSTERED (rack_mount_id),
    CONSTRAINT FK_rm_rack       FOREIGN KEY (rack_id)    REFERENCES dbo.racks(rack_id),
    CONSTRAINT FK_rm_asset      FOREIGN KEY (asset_id)   REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_rm_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_rm_updated_by FOREIGN KEY (updated_by) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_rm_start   CHECK (start_u >= 1),
    CONSTRAINT CK_rm_height  CHECK (u_height BETWEEN 1 AND 60),
    CONSTRAINT CK_rm_face    CHECK (mount_face IN ('FRONT','REAR','BOTH')),
    CONSTRAINT CK_rm_orient  CHECK (orientation IN ('NORMAL','REVERSED')),
    CONSTRAINT CK_rm_dates   CHECK (removed_date IS NULL OR mounted_date IS NULL OR removed_date >= mounted_date)
);
GO

-- อุปกรณ์ 1 ชิ้นอยู่ได้ตำแหน่งเดียว ณ เวลาหนึ่ง
CREATE UNIQUE INDEX UX_rm_asset_active ON dbo.rack_mounts(asset_id) WHERE removed_date IS NULL;
CREATE INDEX IX_rm_rack ON dbo.rack_mounts(rack_id, start_u) WHERE removed_date IS NULL;
GO

/* ⭐ กติกาหลัก : ตำแหน่ง U ห้ามซ้อนทับกัน และห้ามเกินความสูงของตู้ */
CREATE TRIGGER dbo.trg_rack_mounts_validate
ON dbo.rack_mounts
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    /* (1) ตำแหน่งต้องอยู่ภายในความสูงของตู้ */
    IF EXISTS (
        SELECT 1 FROM inserted i
            INNER JOIN dbo.racks r ON r.rack_id = i.rack_id
        WHERE i.removed_date IS NULL
          AND (i.start_u < 1 OR i.start_u + i.u_height - 1 > r.total_u)
    )
        THROW 51030, 'Mount position exceeds the rack height. Check start U and device height.', 1;

    /* (2) ห้ามซ้อนทับกับอุปกรณ์อื่นในตู้และด้านเดียวกัน */
    IF EXISTS (
        SELECT 1
        FROM inserted i
            INNER JOIN dbo.rack_mounts m
                ON  m.rack_id       = i.rack_id
                AND m.rack_mount_id <> i.rack_mount_id
                AND m.removed_date IS NULL
        WHERE i.removed_date IS NULL
          AND (m.mount_face = i.mount_face OR m.mount_face = 'BOTH' OR i.mount_face = 'BOTH')
          AND i.start_u <= m.start_u + m.u_height - 1
          AND m.start_u <= i.start_u + i.u_height - 1
    )
        THROW 51031, 'Mount position overlaps another device in this rack on the same face.', 1;
END;
GO


/* ============================================================================
   ส่วนที่ 6 — IP Address Management (IPAM)
   ========================================================================== */

/* -- 6.1 ตารางช่วยนับเลข ใช้คำนวณ IP ที่ว่าง -- */
CREATE TABLE dbo.tally (n INT NOT NULL CONSTRAINT PK_tally PRIMARY KEY CLUSTERED);
GO
WITH e1(n) AS (SELECT 1 FROM (VALUES(1),(1),(1),(1),(1),(1),(1),(1),(1),(1)) t(n)),
     e2(n) AS (SELECT 1 FROM e1 a CROSS JOIN e1 b),
     e4(n) AS (SELECT 1 FROM e2 a CROSS JOIN e2 b),
     nums  AS (SELECT TOP (65536) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 AS n
               FROM e4 a CROSS JOIN e4 b)
INSERT INTO dbo.tally (n) SELECT n FROM nums;
GO

/* -- 6.2 ตารางหลักของ IPAM --
   เก็บเฉพาะ IP ที่ถูกจองหรือใช้งานแล้วเท่านั้น
   IP ที่ว่างไม่ต้องสร้างแถวไว้ล่วงหน้า เพราะ Subnet ใหญ่จะทำให้ตารางบวมโดยไม่จำเป็น  */
CREATE TABLE dbo.ip_addresses (
    ip_id               BIGINT          IDENTITY(1,1) NOT NULL,
    ip_address          VARCHAR(45)     NOT NULL,
    ip_numeric          AS (dbo.fn_ipv4_to_bigint(ip_address)) PERSISTED,
    vlan_id             INT             NULL,
    range_id            INT             NULL,
    asset_id            INT             NULL,   -- NULL = จองไว้แต่ยังไม่ผูกกับเครื่อง
    interface_name      NVARCHAR(50)    NULL,   -- eth0 · NIC1 · vmk0 · port3
    ip_purpose          VARCHAR(20)     NOT NULL CONSTRAINT DF_ip_purpose DEFAULT ('SERVICE'),
    assignment_type     VARCHAR(20)     NOT NULL CONSTRAINT DF_ip_assign  DEFAULT ('STATIC'),
    status              VARCHAR(15)     NOT NULL CONSTRAINT DF_ip_status  DEFAULT ('IN_USE'),
    is_primary          BIT             NOT NULL CONSTRAINT DF_ip_primary DEFAULT (0),
    mac_address         VARCHAR(17)     NULL,
    hostname            NVARCHAR(100)   NULL,
    dns_name            NVARCHAR(255)   NULL,
    description         NVARCHAR(300)   NULL,
    assigned_date       DATE            NULL,
    released_date       DATE            NULL,   -- NULL = ยังถือครองอยู่
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_ip_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT             NULL,
    updated_at          DATETIMEOFFSET(3) NULL,
    updated_by          INT             NULL,

    CONSTRAINT PK_ip_addresses PRIMARY KEY CLUSTERED (ip_id),
    CONSTRAINT FK_ip_vlan       FOREIGN KEY (vlan_id)    REFERENCES dbo.vlans(vlan_id),
    CONSTRAINT FK_ip_range      FOREIGN KEY (range_id)   REFERENCES dbo.vlan_ip_ranges(range_id),
    CONSTRAINT FK_ip_asset      FOREIGN KEY (asset_id)   REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_ip_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_ip_updated_by FOREIGN KEY (updated_by) REFERENCES dbo.users(user_id),

    CONSTRAINT CK_ip_format  CHECK (dbo.fn_is_valid_ip(ip_address) = 1),
    CONSTRAINT CK_ip_purpose CHECK (ip_purpose IN
        ('SERVICE','MANAGEMENT','CLUSTER','ISCSI','VMOTION','BACKUP','VIP','ILO','REPLICATION','OTHER')),
    CONSTRAINT CK_ip_assign  CHECK (assignment_type IN ('STATIC','DHCP_RESERVED','DHCP_DYNAMIC')),
    CONSTRAINT CK_ip_status  CHECK (status IN ('RESERVED','IN_USE','RELEASED','QUARANTINE')),
    -- สถานะใช้งานอยู่ ต้องผูกกับเครื่องเสมอ
    CONSTRAINT CK_ip_inuse_asset CHECK (status <> 'IN_USE' OR asset_id IS NOT NULL),
    -- คืน IP แล้วต้องมีวันที่คืน
    CONSTRAINT CK_ip_released    CHECK (status <> 'RELEASED' OR released_date IS NOT NULL)
);
GO

-- ⭐ IP เดียวกันถือครองซ้ำซ้อนไม่ได้
CREATE UNIQUE INDEX UX_ip_active ON dbo.ip_addresses(ip_address) WHERE released_date IS NULL;
-- ⭐ เครื่องหนึ่งมี IP หลักได้เพียงหนึ่งเดียว
CREATE UNIQUE INDEX UX_ip_primary_per_asset ON dbo.ip_addresses(asset_id)
    WHERE is_primary = 1 AND released_date IS NULL AND asset_id IS NOT NULL;

CREATE INDEX IX_ip_asset   ON dbo.ip_addresses(asset_id)   WHERE released_date IS NULL;
CREATE INDEX IX_ip_vlan    ON dbo.ip_addresses(vlan_id)    WHERE released_date IS NULL;
CREATE INDEX IX_ip_range   ON dbo.ip_addresses(range_id)   WHERE released_date IS NULL;
CREATE INDEX IX_ip_numeric ON dbo.ip_addresses(ip_numeric) WHERE released_date IS NULL;
GO


/* ============================================================================
   ส่วนที่ 7 — ย้าย IP เดิมเข้า IPAM แล้วลบคอลัมน์เก่าทิ้ง
   ========================================================================== */

/* -- 7.1 ย้ายข้อมูล (ไม่มีผลหากยังไม่มีข้อมูล) -- */
INSERT INTO dbo.ip_addresses (ip_address, vlan_id, asset_id, ip_purpose, assignment_type, status, is_primary, hostname, assigned_date)
SELECT sd.ip_address, v.vlan_id, a.asset_id, 'SERVICE', 'STATIC', 'IN_USE', 1, sd.hostname, a.purchase_date
FROM dbo.assets a
    INNER JOIN dbo.server_details sd ON sd.asset_id = a.asset_id
    OUTER APPLY (SELECT TOP (1) vl.vlan_id FROM dbo.vlans vl
                 WHERE dbo.fn_ipv4_to_bigint(sd.ip_address) BETWEEN vl.network_numeric
                       AND vl.network_numeric + POWER(CAST(2 AS BIGINT), 32 - vl.prefix_length) - 1) v
WHERE sd.ip_address IS NOT NULL AND dbo.fn_is_valid_ipv4(sd.ip_address) = 1;

INSERT INTO dbo.ip_addresses (ip_address, vlan_id, asset_id, ip_purpose, assignment_type, status, hostname)
SELECT sd.mgmt_ip, v.vlan_id, a.asset_id, 'ILO', 'STATIC', 'IN_USE', sd.hostname
FROM dbo.assets a
    INNER JOIN dbo.server_details sd ON sd.asset_id = a.asset_id
    OUTER APPLY (SELECT TOP (1) vl.vlan_id FROM dbo.vlans vl
                 WHERE dbo.fn_ipv4_to_bigint(sd.mgmt_ip) BETWEEN vl.network_numeric
                       AND vl.network_numeric + POWER(CAST(2 AS BIGINT), 32 - vl.prefix_length) - 1) v
WHERE sd.mgmt_ip IS NOT NULL AND dbo.fn_is_valid_ipv4(sd.mgmt_ip) = 1;

INSERT INTO dbo.ip_addresses (ip_address, vlan_id, asset_id, ip_purpose, assignment_type, status, is_primary, hostname)
SELECT nd.mgmt_ip, v.vlan_id, a.asset_id, 'MANAGEMENT', 'STATIC', 'IN_USE', 1, nd.hostname
FROM dbo.assets a
    INNER JOIN dbo.network_details nd ON nd.asset_id = a.asset_id
    OUTER APPLY (SELECT TOP (1) vl.vlan_id FROM dbo.vlans vl
                 WHERE dbo.fn_ipv4_to_bigint(nd.mgmt_ip) BETWEEN vl.network_numeric
                       AND vl.network_numeric + POWER(CAST(2 AS BIGINT), 32 - vl.prefix_length) - 1) v
WHERE nd.mgmt_ip IS NOT NULL AND dbo.fn_is_valid_ipv4(nd.mgmt_ip) = 1;

INSERT INTO dbo.ip_addresses (ip_address, vlan_id, asset_id, ip_purpose, assignment_type, status, is_primary, hostname)
SELECT cd.ip_address, v.vlan_id, a.asset_id, 'SERVICE', 'STATIC', 'IN_USE', 1, cd.hostname
FROM dbo.assets a
    INNER JOIN dbo.computer_details cd ON cd.asset_id = a.asset_id
    OUTER APPLY (SELECT TOP (1) vl.vlan_id FROM dbo.vlans vl
                 WHERE dbo.fn_ipv4_to_bigint(cd.ip_address) BETWEEN vl.network_numeric
                       AND vl.network_numeric + POWER(CAST(2 AS BIGINT), 32 - vl.prefix_length) - 1) v
WHERE cd.ip_address IS NOT NULL AND dbo.fn_is_valid_ipv4(cd.ip_address) = 1;
GO

/* -- 7.2 ลบ View ที่อ้างถึงคอลัมน์ IP เดิม -- */
DROP VIEW IF EXISTS dbo.vw_all_ip_addresses;
DROP VIEW IF EXISTS dbo.vw_asset_list;
DROP VIEW IF EXISTS dbo.vw_gateway_capable_devices;
DROP VIEW IF EXISTS dbo.vw_dhcp_capable_devices;
GO

/* -- 7.3 ลบคอลัมน์ IP เดิม เพื่อไม่ให้มีข้อมูลสองแหล่งขัดแย้งกัน -- */
DROP INDEX IX_server_ip       ON dbo.server_details;
DROP INDEX IX_server_mgmt_ip  ON dbo.server_details;
DROP INDEX IX_network_mgmt_ip ON dbo.network_details;
DROP INDEX IX_computer_ip     ON dbo.computer_details;
GO
ALTER TABLE dbo.server_details   DROP CONSTRAINT CK_server_ip_format;
ALTER TABLE dbo.server_details   DROP CONSTRAINT CK_server_mgmt_ip_format;
ALTER TABLE dbo.network_details  DROP CONSTRAINT CK_network_mgmt_ip_format;
ALTER TABLE dbo.computer_details DROP CONSTRAINT CK_computer_ip_format;
GO
ALTER TABLE dbo.server_details   DROP COLUMN ip_address, mgmt_ip;
ALTER TABLE dbo.network_details  DROP COLUMN mgmt_ip;
ALTER TABLE dbo.computer_details DROP COLUMN ip_address;
GO


/* ============================================================================
   ส่วนที่ 8 — Views และ Function
   ========================================================================== */

/* -- 8.1 สร้าง vw_all_ip_addresses ขึ้นใหม่ให้อ่านจาก IPAM (รูปแบบคอลัมน์เดิม) -- */
CREATE VIEW dbo.vw_all_ip_addresses
AS
SELECT
    ip.asset_id,
    a.asset_tag,
    a.name              AS asset_name,
    c.code              AS category_code,
    ip.ip_purpose,
    ip.ip_address,
    ip.ip_numeric
FROM dbo.ip_addresses ip
    INNER JOIN dbo.assets           a ON a.asset_id    = ip.asset_id
    INNER JOIN dbo.asset_categories c ON c.category_id = a.category_id
WHERE ip.released_date IS NULL
  AND ip.status IN ('IN_USE','RESERVED')
  AND a.is_deleted = 0;
GO

/* -- 8.2 IP หลักของแต่ละเครื่อง ใช้แสดงในตารางรายการ -- */
CREATE VIEW dbo.vw_asset_primary_ip
AS
SELECT
    ip.asset_id,
    ip.ip_address       AS primary_ip,
    ip.hostname,
    ip.vlan_id,
    v.vlan_number,
    v.name              AS vlan_name,
    z.code              AS zone_code,
    z.name              AS zone_name
FROM dbo.ip_addresses ip
    LEFT JOIN dbo.vlans         v ON v.vlan_id = ip.vlan_id
    LEFT JOIN dbo.network_zones z ON z.zone_id = v.zone_id
WHERE ip.is_primary = 1 AND ip.released_date IS NULL;
GO

/* -- 8.3 ⭐ Function หา IP ที่ว่างในช่วงที่ระบุ (ขั้นสุดท้ายของ Cascading) -- */
CREATE FUNCTION dbo.fn_available_ips (@range_id INT, @max_rows INT)
RETURNS TABLE
AS
RETURN
    SELECT TOP (@max_rows)
        dbo.fn_bigint_to_ipv4(r.start_numeric + t.n) AS ip_address,
        r.start_numeric + t.n                        AS ip_numeric,
        r.vlan_id,
        r.range_id
    FROM dbo.vlan_ip_ranges r
        INNER JOIN dbo.tally t
            ON t.n <= r.end_numeric - r.start_numeric
    WHERE r.range_id = @range_id
      AND r.is_active = 1
      AND NOT EXISTS (
            SELECT 1 FROM dbo.ip_addresses ip
            WHERE ip.ip_numeric = r.start_numeric + t.n
              AND ip.released_date IS NULL)
    ORDER BY r.start_numeric + t.n;
GO

/* -- 8.4 สรุปการใช้ IP ของแต่ละช่วง -- */
CREATE VIEW dbo.vw_ip_range_usage
AS
SELECT
    r.range_id,
    r.vlan_id,
    v.vlan_number,
    v.name                          AS vlan_name,
    r.range_type,
    r.start_ip,
    r.end_ip,
    r.end_numeric - r.start_numeric + 1          AS range_size,
    ISNULL(u.used_count, 0)                      AS used_count,
    r.end_numeric - r.start_numeric + 1 - ISNULL(u.used_count, 0) AS available_count,
    CAST(100.0 * ISNULL(u.used_count, 0)
         / NULLIF(r.end_numeric - r.start_numeric + 1, 0) AS DECIMAL(5,1)) AS used_percent,
    r.description,
    r.is_active
FROM dbo.vlan_ip_ranges r
    INNER JOIN dbo.vlans v ON v.vlan_id = r.vlan_id
    OUTER APPLY (
        SELECT COUNT(*) AS used_count
        FROM dbo.ip_addresses ip
        WHERE ip.released_date IS NULL
          AND ip.ip_numeric BETWEEN r.start_numeric AND r.end_numeric
    ) u;
GO

/* -- 8.5 การใช้พื้นที่ น้ำหนัก และกำลังไฟของแต่ละตู้ Rack -- */
CREATE VIEW dbo.vw_rack_utilization
AS
SELECT
    r.rack_id,
    r.code                  AS rack_code,
    r.name                  AS rack_name,
    lt.full_path            AS location_path,
    r.total_u,
    ISNULL(m.used_u, 0)                 AS used_u,
    r.total_u - ISNULL(m.used_u, 0)     AS free_u,
    CAST(100.0 * ISNULL(m.used_u, 0) / NULLIF(r.total_u, 0) AS DECIMAL(5,1)) AS u_used_percent,
    ISNULL(m.device_count, 0)           AS device_count,
    m.total_weight_kg,
    r.max_weight_kg,
    CAST(100.0 * m.total_weight_kg / NULLIF(r.max_weight_kg, 0) AS DECIMAL(5,1)) AS weight_used_percent,
    CAST(m.total_power_watt / 1000.0 AS DECIMAL(8,2)) AS total_power_kw,
    r.max_power_kw,
    CAST(100.0 * (m.total_power_watt / 1000.0) / NULLIF(r.max_power_kw, 0) AS DECIMAL(5,1)) AS power_used_percent,
    CASE WHEN m.total_weight_kg   > r.max_weight_kg THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS is_over_weight,
    CASE WHEN m.total_power_watt / 1000.0 > r.max_power_kw THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS is_over_power,
    r.is_active
FROM dbo.racks r
    LEFT JOIN dbo.vw_location_tree lt ON lt.location_id = r.location_id
    OUTER APPLY (
        SELECT
            SUM(CAST(rm.u_height AS INT))   AS used_u,
            COUNT(*)                        AS device_count,
            SUM(dm.weight_kg)               AS total_weight_kg,
            SUM(CAST(dm.power_draw_watt AS INT)) AS total_power_watt
        FROM dbo.rack_mounts rm
            INNER JOIN dbo.assets a  ON a.asset_id = rm.asset_id AND a.is_deleted = 0
            LEFT  JOIN dbo.device_models dm ON dm.model_id = a.model_id
        WHERE rm.rack_id = r.rack_id AND rm.removed_date IS NULL
    ) m;
GO

/* -- 8.6 ผังตำแหน่งในตู้ สำหรับวาดหน้า Rack Elevation -- */
CREATE VIEW dbo.vw_rack_elevation
AS
SELECT
    rm.rack_mount_id,
    rm.rack_id,
    r.code              AS rack_code,
    rm.asset_id,
    a.asset_tag,
    a.name              AS asset_name,
    m.name              AS manufacturer_name,
    ISNULL(dm.model_name, a.model) AS model_name,
    t.name              AS type_name,
    c.code              AS category_code,
    rm.start_u,
    rm.u_height,
    rm.start_u + rm.u_height - 1    AS end_u,
    rm.mount_face,
    rm.orientation,
    s.code              AS status_code,
    s.color_token       AS status_color,
    dm.power_draw_watt,
    dm.weight_kg,
    rm.mounted_date
FROM dbo.rack_mounts rm
    INNER JOIN dbo.racks            r  ON r.rack_id      = rm.rack_id
    INNER JOIN dbo.assets           a  ON a.asset_id     = rm.asset_id
    INNER JOIN dbo.asset_categories c  ON c.category_id  = a.category_id
    INNER JOIN dbo.asset_statuses   s  ON s.status_id    = a.status_id
    LEFT  JOIN dbo.asset_types      t  ON t.asset_type_id = a.asset_type_id
    LEFT  JOIN dbo.manufacturers    m  ON m.manufacturer_id = a.manufacturer_id
    LEFT  JOIN dbo.device_models    dm ON dm.model_id    = a.model_id
WHERE rm.removed_date IS NULL AND a.is_deleted = 0;
GO

/* -- 8.7 สร้าง View กรอง Gateway และ DHCP ขึ้นใหม่ให้อ่าน IP จาก IPAM -- */
CREATE VIEW dbo.vw_gateway_capable_devices
AS
SELECT
    a.asset_id, a.asset_tag, a.name AS asset_name,
    t.name          AS device_type_name,
    pt.name         AS device_class_name,
    t.gateway_role_code AS gateway_device_role,
    t.is_layer3,
    nd.hostname     AS device_hostname,
    pip.primary_ip  AS device_ip,
    l.name          AS location_name,
    s.code          AS status_code,
    a.name + N' (' + a.asset_tag + N')' + ISNULL(N' · ' + pip.primary_ip, N'') AS display_label
FROM dbo.assets a
    INNER JOIN dbo.asset_types     t   ON t.asset_type_id  = a.asset_type_id
    LEFT  JOIN dbo.asset_types     pt  ON pt.asset_type_id = t.parent_type_id
    INNER JOIN dbo.network_details nd  ON nd.asset_id      = a.asset_id
    INNER JOIN dbo.asset_statuses  s   ON s.status_id      = a.status_id
    LEFT  JOIN dbo.locations       l   ON l.location_id    = a.location_id
    LEFT  JOIN dbo.vw_asset_primary_ip pip ON pip.asset_id = a.asset_id
WHERE a.is_deleted = 0 AND t.can_be_gateway = 1 AND t.is_active = 1 AND s.is_operational = 1;
GO

CREATE VIEW dbo.vw_dhcp_capable_devices
AS
SELECT
    a.asset_id, a.asset_tag, a.name AS asset_name,
    'NETWORK'       AS device_kind,
    t.name          AS device_type_name,
    pt.name         AS device_class_name,
    t.dhcp_source_code AS dhcp_source_type,
    nd.hostname     AS device_hostname,
    pip.primary_ip  AS device_ip,
    l.name          AS location_name,
    s.code          AS status_code,
    a.name + N' (' + a.asset_tag + N')' + ISNULL(N' · ' + pip.primary_ip, N'') AS display_label
FROM dbo.assets a
    INNER JOIN dbo.asset_types     t   ON t.asset_type_id  = a.asset_type_id
    LEFT  JOIN dbo.asset_types     pt  ON pt.asset_type_id = t.parent_type_id
    INNER JOIN dbo.network_details nd  ON nd.asset_id      = a.asset_id
    INNER JOIN dbo.asset_statuses  s   ON s.status_id      = a.status_id
    LEFT  JOIN dbo.locations       l   ON l.location_id    = a.location_id
    LEFT  JOIN dbo.vw_asset_primary_ip pip ON pip.asset_id = a.asset_id
WHERE a.is_deleted = 0 AND t.can_provide_dhcp = 1 AND t.is_active = 1 AND s.is_operational = 1

UNION ALL

SELECT
    a.asset_id, a.asset_tag, a.name,
    'SERVER', r.name, N'Server Role', 'DHCP_SERVER',
    sd.hostname, pip.primary_ip, l.name, s.code,
    a.name + N' (' + a.asset_tag + N')' + ISNULL(N' · ' + sd.hostname, N'')
FROM dbo.assets a
    INNER JOIN dbo.server_details          sd  ON sd.asset_id      = a.asset_id
    INNER JOIN dbo.server_role_assignments sra ON sra.asset_id     = a.asset_id
    INNER JOIN dbo.server_roles            r   ON r.server_role_id = sra.server_role_id
    INNER JOIN dbo.asset_statuses          s   ON s.status_id      = a.status_id
    LEFT  JOIN dbo.locations               l   ON l.location_id    = a.location_id
    LEFT  JOIN dbo.vw_asset_primary_ip     pip ON pip.asset_id     = a.asset_id
WHERE a.is_deleted = 0 AND r.is_dhcp_provider = 1 AND r.is_active = 1 AND s.is_operational = 1;
GO

/* -- 8.8 ตรวจความผิดปกติของ IP -- */
CREATE VIEW dbo.vw_ip_validation_issues
AS
-- (1) IP ที่ระบุ VLAN ไว้ แต่ค่าจริงไม่ได้อยู่ใน Subnet ของ VLAN นั้น
SELECT ip.ip_id, ip.ip_address, ip.asset_id,
       'IP_VLAN_MISMATCH' AS issue_code, 'ERROR' AS severity,
       ip.ip_address + N' is assigned to VLAN ' + CAST(v.vlan_number AS NVARCHAR(10))
         + N' but falls outside ' + v.network_address + N'/' + CAST(v.prefix_length AS NVARCHAR(2)) AS issue_detail
FROM dbo.ip_addresses ip
    INNER JOIN dbo.vlans v ON v.vlan_id = ip.vlan_id
WHERE ip.released_date IS NULL
  AND (ip.ip_numeric < v.network_numeric
    OR ip.ip_numeric > v.network_numeric + POWER(CAST(2 AS BIGINT), 32 - v.prefix_length) - 1)

UNION ALL

-- (2) IP ที่ใช้งานอยู่แต่ยังไม่ได้ระบุว่าอยู่ VLAN ใด
SELECT ip.ip_id, ip.ip_address, ip.asset_id,
       'IP_NO_VLAN', 'WARNING',
       ip.ip_address + N' is not linked to any VLAN'
FROM dbo.ip_addresses ip
WHERE ip.released_date IS NULL AND ip.vlan_id IS NULL

UNION ALL

-- (3) เครื่องที่ประเภทกำหนดว่าต้องมี IP แต่ยังไม่ได้บันทึก IP ไว้
SELECT NULL, NULL, a.asset_id,
       'ASSET_MISSING_IP', 'WARNING',
       a.asset_tag + N' (' + t.name + N') requires an IP address but none is recorded'
FROM dbo.assets a
    INNER JOIN dbo.asset_types   t ON t.asset_type_id = a.asset_type_id
    INNER JOIN dbo.asset_statuses s ON s.status_id    = a.status_id
WHERE a.is_deleted = 0 AND t.requires_ip = 1 AND s.is_operational = 1
  AND NOT EXISTS (SELECT 1 FROM dbo.ip_addresses ip
                  WHERE ip.asset_id = a.asset_id AND ip.released_date IS NULL);
GO


/* ============================================================================
   จบไฟล์ 11 — ขั้นถัดไป : 12-module-v1.4-contracts-temporal.sql
   (vw_asset_list จะถูกสร้างขึ้นใหม่ในไฟล์ 12 พร้อมข้อมูลสัญญา)
   ========================================================================== */
