/* ============================================================================
   KKND — IT Inventory Management System
   VLAN & IP Address Management (IPAM) Module

   Version : 1.1 (Draft)
   Requires: 02-schema-sqlserver.sql ต้องรันสำเร็จก่อน

   ขอบเขตของโมดูลนี้
   -----------------
   1. เก็บข้อมูล VLAN พร้อม Subnet และ Zone ด้านความปลอดภัย
   2. ระบุว่า Gateway ของแต่ละ VLAN อยู่ที่อุปกรณ์ตัวใด (Firewall / Core / Router)
   3. ระบุรูปแบบการจ่าย IP: Static เท่านั้น / DHCP เท่านั้น / ผสมทั้งสองแบบ
      และหากเป็น DHCP มาจากอุปกรณ์ตัวใด
   4. คำนวณจำนวน IP ทั้งหมด ที่ใช้ไป และคงเหลือ แยกระหว่างช่วง Static กับ DHCP
   5. บังคับให้ทุกฟิลด์ที่เป็น IP กรอกในรูปแบบ IP ที่ถูกต้องเท่านั้น

   สิ่งที่เพิ่มเข้ามา
   -----------------
   Functions : 4    Tables : 5    Views : 4
   ========================================================================== */


/* ============================================================================
   ส่วนที่ 1 — ฟังก์ชันช่วยจัดการ IP Address
   ========================================================================== */

/* -- 1.1 ตรวจสอบว่าเป็น IPv4 ที่ถูกต้องหรือไม่ (เข้มงวด) --
   ใช้เป็นด่านบังคับใน CHECK Constraint ของทุกฟิลด์ที่เป็น IP
   WITH SCHEMABINDING จำเป็น เพื่อให้ใช้ในคอลัมน์คำนวณแบบ PERSISTED ได้           */
CREATE FUNCTION dbo.fn_is_valid_ipv4 (@ip VARCHAR(45))
RETURNS BIT
WITH SCHEMABINDING
AS
BEGIN
    DECLARE @i INT = 1;
    DECLARE @part VARCHAR(45);
    DECLARE @num INT;

    IF @ip IS NULL RETURN 0;
    IF LEN(@ip) < 7 OR LEN(@ip) > 15 RETURN 0;         -- 0.0.0.0 ถึง 255.255.255.255
    IF @ip LIKE '%[^0-9.]%' RETURN 0;                  -- อนุญาตเฉพาะตัวเลขและจุด
    IF PARSENAME(@ip, 4) IS NULL RETURN 0;             -- ต้องมีครบ 4 ส่วน

    WHILE @i <= 4
    BEGIN
        SET @part = PARSENAME(@ip, @i);
        IF @part IS NULL OR LEN(@part) = 0 OR LEN(@part) > 3 RETURN 0;
        SET @num = TRY_CAST(@part AS INT);
        IF @num IS NULL OR @num > 255 RETURN 0;
        IF LEN(@part) > 1 AND LEFT(@part, 1) = '0' RETURN 0;  -- กันเลขนำหน้าศูนย์ เช่น 192.168.01.1
        SET @i = @i + 1;
    END
    RETURN 1;
END;
GO

/* -- 1.2 ตรวจสอบ IP ทั่วไป (ยอมรับทั้ง IPv4 และรูปแบบ IPv6 เบื้องต้น) --
   ใช้กับฟิลด์ IP ของอุปกรณ์ซึ่งอาจเป็น IPv6 ได้ในอนาคต                          */
CREATE FUNCTION dbo.fn_is_valid_ip (@ip VARCHAR(45))
RETURNS BIT
WITH SCHEMABINDING
AS
BEGIN
    IF @ip IS NULL RETURN 0;
    IF dbo.fn_is_valid_ipv4(@ip) = 1 RETURN 1;

    -- ตรวจรูปแบบ IPv6 อย่างหลวมๆ การตรวจเข้มทำที่ Application Layer
    IF @ip LIKE '%:%'
       AND @ip NOT LIKE '%[^0-9a-fA-F:]%'
       AND LEN(@ip) BETWEEN 2 AND 45
        RETURN 1;

    RETURN 0;
END;
GO

/* -- 1.3 แปลง IPv4 เป็นตัวเลข เพื่อใช้เปรียบเทียบช่วงและทำ Index -- */
CREATE FUNCTION dbo.fn_ipv4_to_bigint (@ip VARCHAR(45))
RETURNS BIGINT
WITH SCHEMABINDING
AS
BEGIN
    RETURN  TRY_CAST(PARSENAME(@ip, 4) AS BIGINT) * 16777216
          + TRY_CAST(PARSENAME(@ip, 3) AS BIGINT) * 65536
          + TRY_CAST(PARSENAME(@ip, 2) AS BIGINT) * 256
          + TRY_CAST(PARSENAME(@ip, 1) AS BIGINT);
END;
GO

/* -- 1.4 แปลงตัวเลขกลับเป็น IPv4 เพื่อคำนวณ Broadcast / Subnet Mask -- */
CREATE FUNCTION dbo.fn_bigint_to_ipv4 (@n BIGINT)
RETURNS VARCHAR(15)
WITH SCHEMABINDING
AS
BEGIN
    IF @n IS NULL OR @n < 0 OR @n > 4294967295 RETURN NULL;
    RETURN CAST((@n / 16777216) % 256 AS VARCHAR(3)) + '.'
         + CAST((@n / 65536)    % 256 AS VARCHAR(3)) + '.'
         + CAST((@n / 256)      % 256 AS VARCHAR(3)) + '.'
         + CAST( @n             % 256 AS VARCHAR(3));
END;
GO


/* ============================================================================
   ส่วนที่ 2 — ตาราง Network Zone
   ========================================================================== */

CREATE TABLE dbo.network_zones (
    zone_id             INT            IDENTITY(1,1) NOT NULL,
    code                VARCHAR(30)    NOT NULL,
    name                NVARCHAR(80)   NOT NULL,
    description         NVARCHAR(400)  NULL,
    trust_level         TINYINT        NOT NULL,   -- 0 = เชื่อถือน้อยที่สุด, 100 = เชื่อถือมากที่สุด
    color_token         VARCHAR(30)    NOT NULL,   -- อ้างอิง Design System
    is_internet_facing  BIT            NOT NULL CONSTRAINT DF_zones_internet DEFAULT (0),
    sort_order          INT            NOT NULL CONSTRAINT DF_zones_sort DEFAULT (0),
    is_active           BIT            NOT NULL CONSTRAINT DF_zones_active DEFAULT (1),
    CONSTRAINT PK_network_zones PRIMARY KEY CLUSTERED (zone_id),
    CONSTRAINT UX_network_zones_code UNIQUE (code),
    CONSTRAINT CK_network_zones_trust CHECK (trust_level BETWEEN 0 AND 100)
);
GO


/* ============================================================================
   ส่วนที่ 2.5 — ตาราง Site สำหรับ VLAN (แยกจาก dbo.locations โดยเจตนา)

   องค์กรมี 2 สาขาเท่านั้น (1st Site / 2nd Site) และ VLAN ต้องเลือกได้แค่ว่า
   อยู่สาขาไหน — ไม่ต้องลงรายละเอียดระดับ Building/Floor/Room/Rack แบบที่
   dbo.locations ใช้กับ Asset ทางกายภาพ จึงแยกเป็น Lookup ของตัวเองที่นี่
   เพื่อไม่ให้หน้าจอ VLAN ต้องพา Location Tree ทั้งต้นมาให้เลือก
   ========================================================================== */

CREATE TABLE dbo.vlan_sites (
    site_id      TINYINT        NOT NULL,
    code         VARCHAR(20)    NOT NULL,
    name         NVARCHAR(80)   NOT NULL,
    sort_order   INT            NOT NULL CONSTRAINT DF_vlan_sites_sort DEFAULT (0),
    is_active    BIT            NOT NULL CONSTRAINT DF_vlan_sites_active DEFAULT (1),
    CONSTRAINT PK_vlan_sites PRIMARY KEY CLUSTERED (site_id),
    CONSTRAINT UX_vlan_sites_code UNIQUE (code)
);
GO

INSERT INTO dbo.vlan_sites (site_id, code, name, sort_order) VALUES
    (1, 'SITE_1', N'สาขาที่ 1', 1),
    (2, 'SITE_2', N'สาขาที่ 2', 2);
GO


/* ============================================================================
   ส่วนที่ 3 — ตาราง VLAN
   ========================================================================== */

CREATE TABLE dbo.vlans (
    vlan_id                 INT            IDENTITY(1,1) NOT NULL,
    vlan_number             SMALLINT       NOT NULL,   -- หมายเลข 802.1Q (1–4094)
    name                    NVARCHAR(100)  NOT NULL,
    description             NVARCHAR(400)  NULL,
    zone_id                 INT            NOT NULL,   -- Trust / DMZ / OA / OT ฯลฯ

    /* ---------- Subnet ---------- */
    network_address         VARCHAR(15)    NOT NULL,   -- เช่น 10.10.20.0
    prefix_length           TINYINT        NOT NULL,   -- เช่น 24
    network_numeric         AS (dbo.fn_ipv4_to_bigint(network_address)) PERSISTED,

    /* ---------- Gateway : อยู่ที่อุปกรณ์ตัวไหน ---------- */
    gateway_ip              VARCHAR(15)    NULL,
    gateway_device_role     VARCHAR(20)    NULL,   -- FIREWALL / CORE_SWITCH / L3_SWITCH / ROUTER
    gateway_asset_id        INT            NULL,   -- ชี้ไปยังอุปกรณ์จริงในระบบ
    gateway_interface       NVARCHAR(50)   NULL,   -- เช่น Vlan20, port3, Gi1/0/1

    /* ---------- รูปแบบการจ่าย IP ---------- */
    ip_assignment_mode      VARCHAR(12)    NOT NULL,   -- STATIC_ONLY / DHCP_ONLY / MIXED
    dhcp_source_type        VARCHAR(20)    NULL,       -- FIREWALL / CORE_SWITCH / L3_SWITCH / ROUTER / DHCP_SERVER / EXTERNAL
    dhcp_server_asset_id    INT            NULL,       -- อุปกรณ์ที่ทำหน้าที่จ่าย DHCP
    dhcp_relay_ip           VARCHAR(15)    NULL,       -- IP Helper Address
    dhcp_lease_hours        INT            NULL,

    /* ---------- DNS ---------- */
    dns_primary             VARCHAR(15)    NULL,
    dns_secondary           VARCHAR(15)    NULL,
    domain_name             NVARCHAR(100)  NULL,

    /* ---------- อื่นๆ ---------- */
    site_id                 TINYINT        NOT NULL,   -- สาขา — บังคับเลือก (ดู dbo.vlan_sites)
    is_active               BIT            NOT NULL CONSTRAINT DF_vlans_active DEFAULT (1),
    notes                   NVARCHAR(MAX)  NULL,
    created_at              DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_vlans_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by              INT            NULL,
    updated_at              DATETIMEOFFSET(3) NULL,
    updated_by              INT            NULL,

    CONSTRAINT PK_vlans PRIMARY KEY CLUSTERED (vlan_id),
    CONSTRAINT UX_vlans_number  UNIQUE (vlan_number),
    CONSTRAINT UX_vlans_network UNIQUE (network_address, prefix_length),

    CONSTRAINT FK_vlans_zone        FOREIGN KEY (zone_id)              REFERENCES dbo.network_zones(zone_id),
    CONSTRAINT FK_vlans_gateway     FOREIGN KEY (gateway_asset_id)     REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_vlans_dhcp_server FOREIGN KEY (dhcp_server_asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_vlans_site        FOREIGN KEY (site_id)              REFERENCES dbo.vlan_sites(site_id),
    CONSTRAINT FK_vlans_created_by  FOREIGN KEY (created_by)           REFERENCES dbo.users(user_id),
    CONSTRAINT FK_vlans_updated_by  FOREIGN KEY (updated_by)           REFERENCES dbo.users(user_id),

    /* ---------- บังคับรูปแบบ IP ทุกฟิลด์ ---------- */
    CONSTRAINT CK_vlans_network_ip   CHECK (dbo.fn_is_valid_ipv4(network_address) = 1),
    CONSTRAINT CK_vlans_gateway_ip   CHECK (gateway_ip    IS NULL OR dbo.fn_is_valid_ipv4(gateway_ip)    = 1),
    CONSTRAINT CK_vlans_relay_ip     CHECK (dhcp_relay_ip IS NULL OR dbo.fn_is_valid_ipv4(dhcp_relay_ip) = 1),
    CONSTRAINT CK_vlans_dns1_ip      CHECK (dns_primary   IS NULL OR dbo.fn_is_valid_ipv4(dns_primary)   = 1),
    CONSTRAINT CK_vlans_dns2_ip      CHECK (dns_secondary IS NULL OR dbo.fn_is_valid_ipv4(dns_secondary) = 1),

    /* ---------- กติกาทางเครือข่าย ---------- */
    CONSTRAINT CK_vlans_number_range CHECK (vlan_number BETWEEN 1 AND 4094),
    CONSTRAINT CK_vlans_prefix       CHECK (prefix_length BETWEEN 8 AND 32),

    -- network_address ต้องเป็นเลขที่อยู่เครือข่ายจริง ไม่ใช่ IP ของโฮสต์
    -- เช่น 10.10.20.5/24 จะถูกปฏิเสธ เพราะที่ถูกต้องคือ 10.10.20.0/24
    CONSTRAINT CK_vlans_network_boundary CHECK (
        dbo.fn_ipv4_to_bigint(network_address) % POWER(CAST(2 AS BIGINT), 32 - prefix_length) = 0
    ),

    -- Gateway ต้องอยู่ภายใน Subnet ของ VLAN นี้เท่านั้น
    -- ยกเว้น /31 และ /32 ซึ่งเป็นลิงก์แบบจุดต่อจุดตาม RFC 3021 ที่ไม่มีที่อยู่สำรอง
    CONSTRAINT CK_vlans_gateway_in_subnet CHECK (
        gateway_ip IS NULL
        OR prefix_length >= 31
        OR (    dbo.fn_ipv4_to_bigint(gateway_ip) > dbo.fn_ipv4_to_bigint(network_address)
            AND dbo.fn_ipv4_to_bigint(gateway_ip) < dbo.fn_ipv4_to_bigint(network_address)
                                                  + POWER(CAST(2 AS BIGINT), 32 - prefix_length) - 1)
    ),

    CONSTRAINT CK_vlans_gw_role CHECK (
        gateway_device_role IS NULL OR
        gateway_device_role IN ('FIREWALL','CORE_SWITCH','L3_SWITCH','ROUTER','OTHER')
    ),

    CONSTRAINT CK_vlans_mode CHECK (
        ip_assignment_mode IN ('STATIC_ONLY','DHCP_ONLY','MIXED')
    ),

    CONSTRAINT CK_vlans_dhcp_source CHECK (
        dhcp_source_type IS NULL OR
        dhcp_source_type IN ('FIREWALL','CORE_SWITCH','L3_SWITCH','ROUTER','DHCP_SERVER','EXTERNAL')
    ),

    /* ⭐ กติกาหลักตามที่กำหนด:
       ถ้า VLAN ใช้ DHCP (DHCP_ONLY หรือ MIXED) ต้องระบุแหล่งที่มาของ DHCP เสมอ
       ถ้าเป็น STATIC_ONLY ห้ามมีข้อมูล DHCP ค้างอยู่                             */
    CONSTRAINT CK_vlans_dhcp_consistency CHECK (
        (ip_assignment_mode = 'STATIC_ONLY'
            AND dhcp_source_type IS NULL
            AND dhcp_server_asset_id IS NULL
            AND dhcp_relay_ip IS NULL)
        OR
        (ip_assignment_mode IN ('DHCP_ONLY','MIXED')
            AND dhcp_source_type IS NOT NULL)
    ),

    CONSTRAINT CK_vlans_lease CHECK (dhcp_lease_hours IS NULL OR dhcp_lease_hours > 0)
);
GO

CREATE INDEX IX_vlans_zone        ON dbo.vlans(zone_id);
CREATE INDEX IX_vlans_gateway     ON dbo.vlans(gateway_asset_id);
CREATE INDEX IX_vlans_dhcp_server ON dbo.vlans(dhcp_server_asset_id);
CREATE INDEX IX_vlans_site        ON dbo.vlans(site_id);
CREATE INDEX IX_vlans_numeric     ON dbo.vlans(network_numeric, prefix_length);
GO


/* ============================================================================
   ส่วนที่ 4 — ช่วง IP ภายใน VLAN (รองรับกรณีมีทั้ง Static และ DHCP)
   ========================================================================== */

CREATE TABLE dbo.vlan_ip_ranges (
    range_id            INT            IDENTITY(1,1) NOT NULL,
    vlan_id             INT            NOT NULL,
    range_type          VARCHAR(12)    NOT NULL,   -- STATIC / DHCP / RESERVED / EXCLUDED
    start_ip            VARCHAR(15)    NOT NULL,
    end_ip              VARCHAR(15)    NOT NULL,
    start_numeric       AS (dbo.fn_ipv4_to_bigint(start_ip)) PERSISTED,
    end_numeric         AS (dbo.fn_ipv4_to_bigint(end_ip))   PERSISTED,
    dhcp_source_type    VARCHAR(20)    NULL,   -- เผื่อกรณี VLAN เดียวมี DHCP มากกว่า 1 แหล่ง
    dhcp_server_asset_id INT           NULL,
    description         NVARCHAR(200)  NULL,
    is_active           BIT            NOT NULL CONSTRAINT DF_ranges_active DEFAULT (1),
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_ranges_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT            NULL,

    CONSTRAINT PK_vlan_ip_ranges PRIMARY KEY CLUSTERED (range_id),
    CONSTRAINT FK_ranges_vlan        FOREIGN KEY (vlan_id)              REFERENCES dbo.vlans(vlan_id),
    CONSTRAINT FK_ranges_dhcp_server FOREIGN KEY (dhcp_server_asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_ranges_created_by  FOREIGN KEY (created_by)           REFERENCES dbo.users(user_id),

    CONSTRAINT CK_ranges_type     CHECK (range_type IN ('STATIC','DHCP','RESERVED','EXCLUDED')),
    CONSTRAINT CK_ranges_start_ip CHECK (dbo.fn_is_valid_ipv4(start_ip) = 1),
    CONSTRAINT CK_ranges_end_ip   CHECK (dbo.fn_is_valid_ipv4(end_ip)   = 1),
    CONSTRAINT CK_ranges_order    CHECK (dbo.fn_ipv4_to_bigint(start_ip) <= dbo.fn_ipv4_to_bigint(end_ip)),
    CONSTRAINT CK_ranges_dhcp_src CHECK (
        dhcp_source_type IS NULL OR
        dhcp_source_type IN ('FIREWALL','CORE_SWITCH','L3_SWITCH','ROUTER','DHCP_SERVER','EXTERNAL')
    ),
    -- ช่วงที่ไม่ใช่ DHCP ห้ามระบุแหล่ง DHCP
    CONSTRAINT CK_ranges_dhcp_only CHECK (
        range_type = 'DHCP' OR (dhcp_source_type IS NULL AND dhcp_server_asset_id IS NULL)
    )
);
GO

CREATE INDEX IX_ranges_vlan  ON dbo.vlan_ip_ranges(vlan_id, range_type) WHERE is_active = 1;
CREATE INDEX IX_ranges_span  ON dbo.vlan_ip_ranges(start_numeric, end_numeric) INCLUDE (vlan_id, range_type);
GO


/* ============================================================================
   ส่วนที่ 5 — อุปกรณ์ที่รองรับ VLAN (แทนที่ฟิลด์ vlan_info แบบข้อความเดิม)
   ========================================================================== */

CREATE TABLE dbo.vlan_devices (
    vlan_device_id  INT            IDENTITY(1,1) NOT NULL,
    vlan_id         INT            NOT NULL,
    asset_id        INT            NOT NULL,
    device_role     VARCHAR(20)    NOT NULL,   -- GATEWAY / DHCP_SERVER / DHCP_RELAY / TRUNK / ACCESS
    interface_name  NVARCHAR(50)   NULL,       -- เช่น Vlan20, Gi1/0/24, port5
    is_tagged       BIT            NULL,       -- true = Tagged (Trunk), false = Untagged (Access)
    notes           NVARCHAR(300)  NULL,
    created_at      DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_vlandev_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by      INT            NULL,

    CONSTRAINT PK_vlan_devices PRIMARY KEY CLUSTERED (vlan_device_id),
    CONSTRAINT UX_vlan_devices UNIQUE (vlan_id, asset_id, device_role),
    CONSTRAINT FK_vlandev_vlan       FOREIGN KEY (vlan_id)    REFERENCES dbo.vlans(vlan_id),
    CONSTRAINT FK_vlandev_asset      FOREIGN KEY (asset_id)   REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_vlandev_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_vlandev_role CHECK (
        device_role IN ('GATEWAY','DHCP_SERVER','DHCP_RELAY','TRUNK','ACCESS')
    )
);
GO

CREATE INDEX IX_vlandev_vlan  ON dbo.vlan_devices(vlan_id);
CREATE INDEX IX_vlandev_asset ON dbo.vlan_devices(asset_id);
GO


/* ============================================================================
   ส่วนที่ 6 — บังคับรูปแบบ IP กับฟิลด์เดิมที่มีอยู่แล้ว
   (ตามข้อกำหนด "บังคับกรอกข้อมูลในรูปแบบ IP เท่านั้น")
   ========================================================================== */

ALTER TABLE dbo.server_details   WITH CHECK
    ADD CONSTRAINT CK_server_ip_format      CHECK (ip_address IS NULL OR dbo.fn_is_valid_ip(ip_address) = 1);
ALTER TABLE dbo.server_details   WITH CHECK
    ADD CONSTRAINT CK_server_mgmt_ip_format CHECK (mgmt_ip    IS NULL OR dbo.fn_is_valid_ip(mgmt_ip)    = 1);
ALTER TABLE dbo.network_details  WITH CHECK
    ADD CONSTRAINT CK_network_mgmt_ip_format CHECK (mgmt_ip   IS NULL OR dbo.fn_is_valid_ip(mgmt_ip)    = 1);
ALTER TABLE dbo.computer_details WITH CHECK
    ADD CONSTRAINT CK_computer_ip_format    CHECK (ip_address IS NULL OR dbo.fn_is_valid_ip(ip_address) = 1);
GO


/* ============================================================================
   ส่วนที่ 7 — Views สำหรับการคำนวณ IP
   ========================================================================== */

/* -- 7.1 รวม IP ทั้งหมดที่มีอยู่ในระบบไว้ในมุมมองเดียว --
   เป็นฐานของการคำนวณว่า IP ใดถูกใช้ไปแล้วบ้าง                                   */
CREATE VIEW dbo.vw_all_ip_addresses
AS
SELECT a.asset_id, a.asset_tag, a.name AS asset_name, c.code AS category_code,
       'SERVICE'    AS ip_purpose, sd.ip_address AS ip_address,
       dbo.fn_ipv4_to_bigint(sd.ip_address) AS ip_numeric
FROM dbo.assets a
    INNER JOIN dbo.asset_categories c ON c.category_id = a.category_id
    INNER JOIN dbo.server_details  sd ON sd.asset_id   = a.asset_id
WHERE a.is_deleted = 0 AND sd.ip_address IS NOT NULL AND dbo.fn_is_valid_ipv4(sd.ip_address) = 1

UNION ALL

SELECT a.asset_id, a.asset_tag, a.name, c.code,
       'MANAGEMENT', sd.mgmt_ip, dbo.fn_ipv4_to_bigint(sd.mgmt_ip)
FROM dbo.assets a
    INNER JOIN dbo.asset_categories c ON c.category_id = a.category_id
    INNER JOIN dbo.server_details  sd ON sd.asset_id   = a.asset_id
WHERE a.is_deleted = 0 AND sd.mgmt_ip IS NOT NULL AND dbo.fn_is_valid_ipv4(sd.mgmt_ip) = 1

UNION ALL

SELECT a.asset_id, a.asset_tag, a.name, c.code,
       'MANAGEMENT', nd.mgmt_ip, dbo.fn_ipv4_to_bigint(nd.mgmt_ip)
FROM dbo.assets a
    INNER JOIN dbo.asset_categories c ON c.category_id = a.category_id
    INNER JOIN dbo.network_details nd ON nd.asset_id   = a.asset_id
WHERE a.is_deleted = 0 AND nd.mgmt_ip IS NOT NULL AND dbo.fn_is_valid_ipv4(nd.mgmt_ip) = 1

UNION ALL

SELECT a.asset_id, a.asset_tag, a.name, c.code,
       'SERVICE', cd.ip_address, dbo.fn_ipv4_to_bigint(cd.ip_address)
FROM dbo.assets a
    INNER JOIN dbo.asset_categories c  ON c.category_id = a.category_id
    INNER JOIN dbo.computer_details cd ON cd.asset_id   = a.asset_id
WHERE a.is_deleted = 0 AND cd.ip_address IS NOT NULL AND dbo.fn_is_valid_ipv4(cd.ip_address) = 1;
GO


/* -- 7.2 ⭐ สรุปและคำนวณ IP ของแต่ละ VLAN (View หลักของโมดูลนี้) -- */
CREATE VIEW dbo.vw_vlan_summary
AS
SELECT
    v.vlan_id,
    v.vlan_number,
    v.name                                  AS vlan_name,
    v.description,

    /* --- Zone --- */
    z.code                                  AS zone_code,
    z.name                                  AS zone_name,
    z.trust_level,
    z.color_token                           AS zone_color,
    z.is_internet_facing,

    /* --- Subnet --- */
    v.network_address,
    v.prefix_length,
    v.network_address + '/' + CAST(v.prefix_length AS VARCHAR(2)) AS cidr,
    dbo.fn_bigint_to_ipv4(4294967295 - (t.total_addr - 1))        AS subnet_mask,
    dbo.fn_bigint_to_ipv4(v.network_numeric + t.total_addr - 1)   AS broadcast_address,
    CASE WHEN v.prefix_length <= 30
         THEN dbo.fn_bigint_to_ipv4(v.network_numeric + 1) END    AS first_usable_ip,
    CASE WHEN v.prefix_length <= 30
         THEN dbo.fn_bigint_to_ipv4(v.network_numeric + t.total_addr - 2) END AS last_usable_ip,
    t.total_addr                            AS total_addresses,
    ua.usable_addr                          AS usable_addresses,

    /* --- Gateway --- */
    v.gateway_ip,
    v.gateway_device_role,
    v.gateway_interface,
    gw.asset_tag                            AS gateway_asset_tag,
    gw.name                                 AS gateway_asset_name,

    /* --- รูปแบบการจ่าย IP --- */
    v.ip_assignment_mode,
    v.dhcp_source_type,
    dh.asset_tag                            AS dhcp_server_asset_tag,
    dh.name                                 AS dhcp_server_asset_name,
    v.dhcp_relay_ip,
    v.dhcp_lease_hours,

    /* --- DNS --- */
    v.dns_primary,
    v.dns_secondary,
    v.domain_name,

    /* --- ขนาดของแต่ละช่วง (Pool) --- */
    ISNULL(p.static_pool_size,   0)         AS static_pool_size,
    ISNULL(p.dhcp_pool_size,     0)         AS dhcp_pool_size,
    ISNULL(p.reserved_pool_size, 0)         AS reserved_pool_size,
    ISNULL(p.excluded_pool_size, 0)         AS excluded_pool_size,

    /* --- ⭐ การคำนวณ IP ที่ใช้ไปและคงเหลือ --- */
    ISNULL(u.known_ips_total, 0)            AS known_ips_in_subnet,
    ISNULL(u.static_ips_used, 0)            AS static_ips_used,
    ISNULL(p.static_pool_size, 0) - ISNULL(u.static_ips_used, 0) AS static_ips_available,
    ISNULL(u.ips_outside_pool, 0)           AS ips_outside_any_pool,

    /* ที่อยู่ที่ยังไม่ถูกจัดสรรเข้า Pool ใดเลย */
    ua.usable_addr
      - ISNULL(p.static_pool_size,   0)
      - ISNULL(p.dhcp_pool_size,     0)
      - ISNULL(p.reserved_pool_size, 0)
      - ISNULL(p.excluded_pool_size, 0)     AS unplanned_addresses,

    /* --- เปอร์เซ็นต์ --- */
    CAST(100.0 * (ISNULL(p.static_pool_size,0) + ISNULL(p.dhcp_pool_size,0)
                + ISNULL(p.reserved_pool_size,0) + ISNULL(p.excluded_pool_size,0))
         / NULLIF(ua.usable_addr, 0) AS DECIMAL(5,1))            AS pool_coverage_percent,
    CAST(100.0 * ISNULL(u.static_ips_used, 0)
         / NULLIF(ISNULL(p.static_pool_size, 0), 0) AS DECIMAL(5,1)) AS static_utilization_percent,

    v.site_id,
    st.name                                 AS site_name,
    v.is_active,
    v.notes
FROM dbo.vlans v
    INNER JOIN dbo.network_zones z    ON z.zone_id  = v.zone_id
    INNER JOIN dbo.vlan_sites   st    ON st.site_id = v.site_id
    LEFT  JOIN dbo.assets    gw  ON gw.asset_id    = v.gateway_asset_id
    LEFT  JOIN dbo.assets    dh  ON dh.asset_id    = v.dhcp_server_asset_id

    /* จำนวนที่อยู่ทั้งหมดของ Subnet = 2^(32 - prefix) */
    CROSS APPLY (
        SELECT POWER(CAST(2 AS BIGINT), 32 - v.prefix_length) AS total_addr
    ) t

    /* จำนวนที่อยู่ที่ใช้ได้จริง — /31 และ /32 เป็นกรณีพิเศษตาม RFC 3021 */
    CROSS APPLY (
        SELECT CASE WHEN v.prefix_length <= 30 THEN t.total_addr - 2
                    WHEN v.prefix_length = 31  THEN CAST(2 AS BIGINT)
                    ELSE CAST(1 AS BIGINT) END AS usable_addr
    ) ua

    /* ขนาดของแต่ละ Pool */
    OUTER APPLY (
        SELECT
            SUM(CASE WHEN r.range_type = 'STATIC'   THEN r.end_numeric - r.start_numeric + 1 ELSE 0 END) AS static_pool_size,
            SUM(CASE WHEN r.range_type = 'DHCP'     THEN r.end_numeric - r.start_numeric + 1 ELSE 0 END) AS dhcp_pool_size,
            SUM(CASE WHEN r.range_type = 'RESERVED' THEN r.end_numeric - r.start_numeric + 1 ELSE 0 END) AS reserved_pool_size,
            SUM(CASE WHEN r.range_type = 'EXCLUDED' THEN r.end_numeric - r.start_numeric + 1 ELSE 0 END) AS excluded_pool_size
        FROM dbo.vlan_ip_ranges r
        WHERE r.vlan_id = v.vlan_id AND r.is_active = 1
    ) p

    /* IP ที่บันทึกไว้จริงในระบบ และอยู่ภายใน Subnet ของ VLAN นี้ */
    OUTER APPLY (
        SELECT
            COUNT(*) AS known_ips_total,
            SUM(CASE WHEN EXISTS (
                    SELECT 1 FROM dbo.vlan_ip_ranges rs
                    WHERE rs.vlan_id = v.vlan_id AND rs.range_type = 'STATIC' AND rs.is_active = 1
                      AND ip.ip_numeric BETWEEN rs.start_numeric AND rs.end_numeric)
                THEN 1 ELSE 0 END) AS static_ips_used,
            SUM(CASE WHEN NOT EXISTS (
                    SELECT 1 FROM dbo.vlan_ip_ranges ra
                    WHERE ra.vlan_id = v.vlan_id AND ra.is_active = 1
                      AND ip.ip_numeric BETWEEN ra.start_numeric AND ra.end_numeric)
                THEN 1 ELSE 0 END) AS ips_outside_pool
        FROM dbo.vw_all_ip_addresses ip
        WHERE ip.ip_numeric >= v.network_numeric
          AND ip.ip_numeric <= v.network_numeric + t.total_addr - 1
    ) u;
GO


/* -- 7.3 จับคู่ IP ที่ใช้งานอยู่กับ VLAN และประเภทของช่วงที่ตกอยู่ -- */
CREATE VIEW dbo.vw_vlan_ip_allocation
AS
SELECT
    v.vlan_id,
    v.vlan_number,
    v.name              AS vlan_name,
    z.code              AS zone_code,
    ip.asset_id,
    ip.asset_tag,
    ip.asset_name,
    ip.category_code,
    ip.ip_purpose,
    ip.ip_address,
    ip.ip_numeric,
    ISNULL(r.range_type, 'UNPLANNED') AS range_type,
    r.description       AS range_description,
    CASE WHEN ip.ip_address = v.gateway_ip THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS is_gateway
FROM dbo.vw_all_ip_addresses ip
    INNER JOIN dbo.vlans v
        ON  ip.ip_numeric >= v.network_numeric
        AND ip.ip_numeric <= v.network_numeric + POWER(CAST(2 AS BIGINT), 32 - v.prefix_length) - 1
    INNER JOIN dbo.network_zones z ON z.zone_id = v.zone_id
    OUTER APPLY (
        SELECT TOP (1) rr.range_type, rr.description
        FROM dbo.vlan_ip_ranges rr
        WHERE rr.vlan_id = v.vlan_id AND rr.is_active = 1
          AND ip.ip_numeric BETWEEN rr.start_numeric AND rr.end_numeric
        ORDER BY rr.range_id
    ) r;
GO


/* -- 7.4 ตรวจหาความผิดปกติของการตั้งค่า VLAN --
   ใช้แสดงคำเตือนในหน้าเว็บ แทนการปล่อยให้ผู้ใช้ค้นพบปัญหาเองตอนระบบล่ม        */
CREATE VIEW dbo.vw_vlan_validation_issues
AS
/* (1) ช่วง IP อยู่นอก Subnet ของ VLAN */
SELECT v.vlan_id, v.vlan_number, v.name AS vlan_name,
       'RANGE_OUTSIDE_SUBNET' AS issue_code,
       'ERROR'                AS severity,
       'IP range ' + r.start_ip + ' - ' + r.end_ip + ' falls outside '
         + v.network_address + '/' + CAST(v.prefix_length AS VARCHAR(2)) AS issue_detail
FROM dbo.vlans v
    INNER JOIN dbo.vlan_ip_ranges r ON r.vlan_id = v.vlan_id AND r.is_active = 1
WHERE r.start_numeric < v.network_numeric
   OR r.end_numeric   > v.network_numeric + POWER(CAST(2 AS BIGINT), 32 - v.prefix_length) - 1

UNION ALL

/* (2) ช่วง IP ซ้อนทับกันเองภายใน VLAN เดียวกัน */
SELECT v.vlan_id, v.vlan_number, v.name,
       'RANGE_OVERLAP', 'ERROR',
       'Range ' + r1.start_ip + ' - ' + r1.end_ip + ' (' + r1.range_type + ') overlaps '
         + r2.start_ip + ' - ' + r2.end_ip + ' (' + r2.range_type + ')'
FROM dbo.vlans v
    INNER JOIN dbo.vlan_ip_ranges r1 ON r1.vlan_id = v.vlan_id AND r1.is_active = 1
    INNER JOIN dbo.vlan_ip_ranges r2 ON r2.vlan_id = v.vlan_id AND r2.is_active = 1
                                    AND r2.range_id > r1.range_id
WHERE r1.start_numeric <= r2.end_numeric
  AND r2.start_numeric <= r1.end_numeric

UNION ALL

/* (3) ระบุว่าใช้ DHCP แต่ยังไม่ได้กำหนดช่วง DHCP */
SELECT v.vlan_id, v.vlan_number, v.name,
       'DHCP_POOL_MISSING', 'WARNING',
       'Assignment mode is ' + v.ip_assignment_mode + ' but no active DHCP range is defined'
FROM dbo.vlans v
WHERE v.ip_assignment_mode IN ('DHCP_ONLY','MIXED')
  AND NOT EXISTS (SELECT 1 FROM dbo.vlan_ip_ranges r
                  WHERE r.vlan_id = v.vlan_id AND r.range_type = 'DHCP' AND r.is_active = 1)

UNION ALL

/* (4) ระบุว่าเป็น Static เท่านั้น แต่กลับมีช่วง DHCP อยู่ */
SELECT v.vlan_id, v.vlan_number, v.name,
       'UNEXPECTED_DHCP_POOL', 'ERROR',
       'Assignment mode is STATIC_ONLY but a DHCP range exists'
FROM dbo.vlans v
WHERE v.ip_assignment_mode = 'STATIC_ONLY'
  AND EXISTS (SELECT 1 FROM dbo.vlan_ip_ranges r
              WHERE r.vlan_id = v.vlan_id AND r.range_type = 'DHCP' AND r.is_active = 1)

UNION ALL

/* (5) มี IP ที่ใช้งานอยู่แต่ไม่อยู่ในช่วงใดเลย */
SELECT v.vlan_id, v.vlan_number, v.name,
       'IP_OUTSIDE_POOL', 'WARNING',
       CAST(COUNT(*) AS VARCHAR(10)) + ' address(es) in use are not covered by any defined range'
FROM dbo.vlans v
    INNER JOIN dbo.vw_all_ip_addresses ip
        ON  ip.ip_numeric >= v.network_numeric
        AND ip.ip_numeric <= v.network_numeric + POWER(CAST(2 AS BIGINT), 32 - v.prefix_length) - 1
WHERE NOT EXISTS (SELECT 1 FROM dbo.vlan_ip_ranges r
                  WHERE r.vlan_id = v.vlan_id AND r.is_active = 1
                    AND ip.ip_numeric BETWEEN r.start_numeric AND r.end_numeric)
GROUP BY v.vlan_id, v.vlan_number, v.name

UNION ALL

/* (6) ยังไม่ได้ผูก Gateway กับอุปกรณ์จริงในระบบ */
SELECT v.vlan_id, v.vlan_number, v.name,
       'GATEWAY_DEVICE_UNLINKED', 'WARNING',
       'Gateway IP ' + v.gateway_ip + ' is not linked to any asset record'
FROM dbo.vlans v
WHERE v.gateway_ip IS NOT NULL AND v.gateway_asset_id IS NULL

UNION ALL

/* (7) ระบุว่า DHCP มาจากอุปกรณ์ภายใน แต่ยังไม่ได้ผูกกับอุปกรณ์จริง */
SELECT v.vlan_id, v.vlan_number, v.name,
       'DHCP_DEVICE_UNLINKED', 'WARNING',
       'DHCP source is ' + v.dhcp_source_type + ' but no asset is linked'
FROM dbo.vlans v
WHERE v.dhcp_source_type IN ('FIREWALL','CORE_SWITCH','L3_SWITCH','ROUTER','DHCP_SERVER')
  AND v.dhcp_server_asset_id IS NULL;
GO


/* ============================================================================
   ส่วนที่ 8 — ข้อมูลตั้งต้นของ Network Zone
   ========================================================================== */

INSERT INTO dbo.network_zones (code, name, description, trust_level, color_token, is_internet_facing, sort_order) VALUES
    ('TRUST',        N'Trust',         N'Internal trusted network — core corporate systems',        100, 'emerald', 0, 1),
    ('OA_NETWORK',   N'OA Network',    N'Office Automation — user workstations and office devices',  80, 'sky',     0, 2),
    ('OT_NETWORK',   N'OT Network',    N'Operational Technology — production and control systems',    70, 'violet',  0, 3),
    ('SERVER_DMZ',   N'Server DMZ',    N'Internal-facing server segment isolated from user network',  50, 'indigo',  0, 4),
    ('DMZ',          N'DMZ',           N'Demilitarized zone for semi-trusted services',               30, 'amber',   0, 5),
    ('INTERNET_DMZ', N'Internet DMZ',  N'Internet-facing services exposed to the public network',     10, 'rose',    1, 6);
GO


/* ============================================================================
   ส่วนที่ 9 — ตัวอย่างข้อมูล (ลบออกได้ ใช้เพื่อทดสอบการคำนวณ)
   ========================================================================== */
/*
-- VLAN 20 : OA Network แบบผสมทั้ง Static และ DHCP (สาขาที่ 1)
INSERT INTO dbo.vlans
    (vlan_number, name, description, zone_id, network_address, prefix_length,
     gateway_ip, gateway_device_role, ip_assignment_mode, dhcp_source_type,
     dns_primary, dns_secondary, domain_name, site_id)
SELECT 20, N'OA-USER-BKK', N'Office user network, HQ Bangkok', z.zone_id,
       '10.10.20.0', 24, '10.10.20.1', 'FIREWALL', 'MIXED', 'FIREWALL',
       '10.10.10.10', '10.10.10.11', N'corp.local', 1
FROM dbo.network_zones z WHERE z.code = 'OA_NETWORK';

DECLARE @v INT = SCOPE_IDENTITY();

INSERT INTO dbo.vlan_ip_ranges (vlan_id, range_type, start_ip, end_ip, description) VALUES
    (@v, 'RESERVED', '10.10.20.1',   '10.10.20.10',  N'Gateway and network infrastructure'),
    (@v, 'STATIC',   '10.10.20.11',  '10.10.20.99',  N'Printers, IP phones, fixed devices');
INSERT INTO dbo.vlan_ip_ranges (vlan_id, range_type, start_ip, end_ip, description, dhcp_source_type) VALUES
    (@v, 'DHCP',     '10.10.20.100', '10.10.20.250', N'User workstation pool', 'FIREWALL');

-- ตรวจผลการคำนวณ
SELECT vlan_number, cidr, subnet_mask, broadcast_address,
       usable_addresses, static_pool_size, dhcp_pool_size, reserved_pool_size,
       static_ips_used, static_ips_available, unplanned_addresses,
       pool_coverage_percent, static_utilization_percent
FROM dbo.vw_vlan_summary WHERE vlan_number = 20;

-- ผลลัพธ์ที่คาดหวัง:
--   usable_addresses    = 254   (2^8 - 2)
--   reserved_pool_size  = 10
--   static_pool_size    = 89
--   dhcp_pool_size      = 151
--   unplanned_addresses = 254 - 10 - 89 - 151 = 4   (10.10.20.251 ถึง .254)
*/


/* ============================================================================
   จบโมดูล VLAN / IPAM
   ========================================================================== */
