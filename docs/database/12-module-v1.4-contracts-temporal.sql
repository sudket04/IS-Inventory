/* ============================================================================
   KKND — IT Inventory Management System
   Module v1.4 : Master Asset · Contracts & MA History · Temporal Tables

   Requires: 10 และ 11 ต้องรันสำเร็จก่อน  (ลำดับ: 10 → 11 → 12)

   ขอบเขตของไฟล์นี้
   ----------------
   1. ฟิลด์ Master Asset : Fixed Asset · Service Tag · วันที่ในวงจรชีวิต 6 ค่า
   2. ตาราง contracts + contract_assets รองรับสัญญาทั้งเครื่องเดียวและหลายเครื่อง
      พร้อมโซ่การต่อสัญญา (Renewal Chain) และจำนวน Seat รายงวด
   3. ย้ายวันหมดอายุและจำนวน Seat ออกจากตารางเดิม
   4. เปิด System-Versioned Temporal Tables เก็บประวัติทุกการแก้ไข

   สิ่งที่เพิ่ม : 2 ตาราง · 8 View · 1 Trigger · ตารางประวัติอัตโนมัติ 27 ตาราง
   ========================================================================== */


/* ============================================================================
   ส่วนที่ 1 — ฟิลด์ Master Asset
   ========================================================================== */

ALTER TABLE dbo.assets ADD
    /* ---------- รหัสอ้างอิงเพิ่มเติม ---------- */
    fixed_asset_no      NVARCHAR(50)    NULL,   -- ⭐ เลขครุภัณฑ์จากฝ่ายบัญชี (กรอกเอง)
    service_tag         NVARCHAR(50)    NULL,   -- Dell Service Tag / รหัสบริการของผู้ผลิต
    system_uuid         NVARCHAR(100)   NULL,   -- UUID ของเครื่อง

    /* ---------- วันที่ในวงจรชีวิต ---------- */
    received_date       DATE            NULL,   -- วันรับของเข้าคลัง
    install_date        DATE            NULL,   -- วันติดตั้งเสร็จ
    service_start_date  DATE            NULL,   -- ⭐ วันเริ่มใช้งานจริง ใช้นับอายุการใช้งาน
    retire_date         DATE            NULL,   -- วันปลดระวาง
    disposal_date       DATE            NULL,   -- วันตัดจำหน่าย
    disposal_method     VARCHAR(20)     NULL,   -- SOLD / DONATED / RECYCLED / DESTROYED / RETURNED
    disposal_reference  NVARCHAR(100)   NULL,   -- เลขที่เอกสารอนุมัติ

    /* ---------- ข้อมูลงบประมาณ ---------- */
    cost_center         NVARCHAR(50)    NULL,
    budget_year         SMALLINT        NULL;
GO

ALTER TABLE dbo.assets ADD
    CONSTRAINT CK_assets_disposal_method CHECK (disposal_method IS NULL OR disposal_method IN
        ('SOLD','DONATED','RECYCLED','DESTROYED','RETURNED','LOST','OTHER')),
    CONSTRAINT CK_assets_budget_year CHECK (budget_year IS NULL OR budget_year BETWEEN 2000 AND 2999),
    /* ลำดับเหตุการณ์ต้องสมเหตุสมผล */
    CONSTRAINT CK_assets_lifecycle_order CHECK (
            (received_date      IS NULL OR purchase_date      IS NULL OR received_date      >= purchase_date)
        AND (install_date       IS NULL OR received_date      IS NULL OR install_date       >= received_date)
        AND (service_start_date IS NULL OR install_date       IS NULL OR service_start_date >= install_date)
        AND (retire_date        IS NULL OR service_start_date IS NULL OR retire_date        >= service_start_date)
        AND (disposal_date      IS NULL OR retire_date        IS NULL OR disposal_date      >= retire_date)
    );
GO

-- เลขครุภัณฑ์ห้ามซ้ำ เฉพาะรายการที่ยังไม่ถูกลบ
CREATE UNIQUE INDEX UX_assets_fixed_asset_no ON dbo.assets(fixed_asset_no)
    WHERE fixed_asset_no IS NOT NULL AND is_deleted = 0;
CREATE UNIQUE INDEX UX_assets_service_tag ON dbo.assets(service_tag)
    WHERE service_tag IS NOT NULL AND is_deleted = 0;
CREATE INDEX IX_assets_service_start ON dbo.assets(service_start_date) WHERE is_deleted = 0;
GO


/* ============================================================================
   ส่วนที่ 2 — ตาราง contracts (สัญญาและการต่อสัญญา)
   ========================================================================== */

CREATE TABLE dbo.contracts (
    contract_id             INT             IDENTITY(1,1) NOT NULL,
    contract_no             NVARCHAR(80)    NOT NULL,   -- เลขที่สัญญาภายใน
    vendor_contract_no      NVARCHAR(80)    NULL,       -- เลขที่อ้างอิงของผู้ขาย
    contract_type           VARCHAR(20)     NOT NULL,
    vendor_id               INT             NULL,
    previous_contract_id    INT             NULL,       -- ⭐ โซ่การต่อสัญญา

    /* ---------- ช่วงเวลาและมูลค่า ---------- */
    start_date              DATE            NOT NULL,
    end_date                DATE            NOT NULL,
    contract_value          DECIMAL(18,2)   NULL,
    currency                CHAR(3)         NOT NULL CONSTRAINT DF_contracts_currency DEFAULT ('THB'),
    exchange_rate           DECIMAL(12,6)   NULL,       -- อัตราแลกเปลี่ยน ณ วันทำสัญญา
    po_number               NVARCHAR(50)    NULL,

    /* ---------- ระดับบริการ ---------- */
    coverage_hours          VARCHAR(10)     NULL,       -- 8x5 / 24x7 / 5x8
    service_type            VARCHAR(20)     NULL,       -- ONSITE / RETURN_TO_BASE / REMOTE / PARTS_ONLY
    sla_response_hours      SMALLINT        NULL,
    sla_resolution_hours    SMALLINT        NULL,

    /* ---------- การต่ออายุ ---------- */
    auto_renew              BIT             NOT NULL CONSTRAINT DF_contracts_autorenew DEFAULT (0),
    renewal_notice_days     SMALLINT        NULL,       -- ต้องแจ้งล่วงหน้ากี่วันหากจะไม่ต่อ
    status                  VARCHAR(15)     NOT NULL CONSTRAINT DF_contracts_status DEFAULT ('ACTIVE'),

    /* ---------- ผู้รับผิดชอบ ---------- */
    owner_user_id           INT             NULL,       -- ⭐ ผู้ดูแลสัญญา แยกจากผู้ดูแลเครื่อง
    contact_person          NVARCHAR(150)   NULL,
    contact_phone           NVARCHAR(50)    NULL,
    contact_email           NVARCHAR(255)   NULL,

    notes                   NVARCHAR(MAX)   NULL,
    created_at              DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_contracts_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by              INT             NULL,
    updated_at              DATETIMEOFFSET(3) NULL,
    updated_by              INT             NULL,

    CONSTRAINT PK_contracts PRIMARY KEY CLUSTERED (contract_id),
    CONSTRAINT UX_contracts_no UNIQUE (contract_no),
    CONSTRAINT FK_contracts_vendor     FOREIGN KEY (vendor_id)            REFERENCES dbo.vendors(vendor_id),
    CONSTRAINT FK_contracts_previous   FOREIGN KEY (previous_contract_id) REFERENCES dbo.contracts(contract_id),
    CONSTRAINT FK_contracts_owner      FOREIGN KEY (owner_user_id)        REFERENCES dbo.users(user_id),
    CONSTRAINT FK_contracts_created_by FOREIGN KEY (created_by)           REFERENCES dbo.users(user_id),
    CONSTRAINT FK_contracts_updated_by FOREIGN KEY (updated_by)           REFERENCES dbo.users(user_id),

    CONSTRAINT CK_contracts_type CHECK (contract_type IN
        ('WARRANTY','MA','SUPPORT','SUBSCRIPTION','LEASE','RENTAL','LICENSE','INSURANCE')),
    CONSTRAINT CK_contracts_status CHECK (status IN
        ('DRAFT','ACTIVE','EXPIRED','CANCELLED','SUPERSEDED')),
    CONSTRAINT CK_contracts_hours   CHECK (coverage_hours IS NULL OR coverage_hours IN ('5x8','8x5','12x5','24x5','24x7')),
    CONSTRAINT CK_contracts_service CHECK (service_type IS NULL OR service_type IN
        ('ONSITE','RETURN_TO_BASE','REMOTE','PARTS_ONLY','ADVANCE_EXCHANGE')),
    CONSTRAINT CK_contracts_dates   CHECK (end_date >= start_date),
    CONSTRAINT CK_contracts_value   CHECK (contract_value IS NULL OR contract_value >= 0),
    CONSTRAINT CK_contracts_not_self CHECK (previous_contract_id IS NULL OR previous_contract_id <> contract_id)
);
GO

CREATE INDEX IX_contracts_vendor   ON dbo.contracts(vendor_id);
CREATE INDEX IX_contracts_previous ON dbo.contracts(previous_contract_id);
CREATE INDEX IX_contracts_owner    ON dbo.contracts(owner_user_id);
CREATE INDEX IX_contracts_end_date ON dbo.contracts(end_date) INCLUDE (contract_no, contract_type, status);
CREATE INDEX IX_contracts_status   ON dbo.contracts(status, end_date);
GO


/* ============================================================================
   ส่วนที่ 3 — ตาราง contract_assets (สัญญาครอบคลุมทรัพย์สินใด)
   ========================================================================== */

CREATE TABLE dbo.contract_assets (
    contract_asset_id   INT             IDENTITY(1,1) NOT NULL,
    contract_id         INT             NOT NULL,
    asset_id            INT             NOT NULL,
    coverage_start      DATE            NOT NULL,
    coverage_end        DATE            NOT NULL,
    allocated_cost      DECIMAL(18,2)   NULL,   -- ต้นทุนที่ปันส่วนให้เครื่องนี้
    seat_count          INT             NULL,   -- ⭐ จำนวน Seat ของงวดนี้ (สำหรับ Software)
    service_level_note  NVARCHAR(300)   NULL,
    notes               NVARCHAR(300)   NULL,
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_ca_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT             NULL,
    updated_at          DATETIMEOFFSET(3) NULL,
    updated_by          INT             NULL,

    CONSTRAINT PK_contract_assets PRIMARY KEY CLUSTERED (contract_asset_id),
    CONSTRAINT UX_contract_assets UNIQUE (contract_id, asset_id),
    CONSTRAINT FK_ca_contract   FOREIGN KEY (contract_id) REFERENCES dbo.contracts(contract_id),
    CONSTRAINT FK_ca_asset      FOREIGN KEY (asset_id)    REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_ca_created_by FOREIGN KEY (created_by)  REFERENCES dbo.users(user_id),
    CONSTRAINT FK_ca_updated_by FOREIGN KEY (updated_by)  REFERENCES dbo.users(user_id),
    CONSTRAINT CK_ca_dates  CHECK (coverage_end >= coverage_start),
    CONSTRAINT CK_ca_cost   CHECK (allocated_cost IS NULL OR allocated_cost >= 0),
    CONSTRAINT CK_ca_seats  CHECK (seat_count IS NULL OR seat_count > 0)
);
GO

-- ⭐ Index หลักของงานสแกนวันหมดอายุรายวัน (แทน assets.coverage_end_date เดิม)
CREATE INDEX IX_ca_coverage_end ON dbo.contract_assets(coverage_end)
    INCLUDE (asset_id, contract_id, seat_count);
CREATE INDEX IX_ca_asset ON dbo.contract_assets(asset_id, coverage_end DESC);
GO


/* ============================================================================
   ส่วนที่ 4 — ไฟล์แนบผูกกับสัญญาได้ด้วย
   ========================================================================== */

-- SQL Server ไม่ยอมให้เปลี่ยน Nullability ของคอลัมน์ที่ถูกใช้ใน Index
-- จึงต้องลบ Index ออกก่อน แล้วสร้างใหม่หลังแก้เสร็จ
DROP INDEX IX_attachments_asset ON dbo.attachments;
GO
ALTER TABLE dbo.attachments ALTER COLUMN asset_id INT NULL;
GO
CREATE INDEX IX_attachments_asset ON dbo.attachments(asset_id)
    WHERE is_deleted = 0 AND asset_id IS NOT NULL;
GO
ALTER TABLE dbo.attachments ADD contract_id INT NULL;
GO
ALTER TABLE dbo.attachments ADD
    CONSTRAINT FK_attachments_contract FOREIGN KEY (contract_id) REFERENCES dbo.contracts(contract_id),
    -- ไฟล์แนบต้องผูกกับทรัพย์สินหรือสัญญาอย่างใดอย่างหนึ่ง จะลอยอิสระไม่ได้
    CONSTRAINT CK_attachments_owner CHECK (asset_id IS NOT NULL OR contract_id IS NOT NULL);
GO
CREATE INDEX IX_attachments_contract ON dbo.attachments(contract_id) WHERE is_deleted = 0;
GO


/* ============================================================================
   ส่วนที่ 5 — ย้ายข้อมูลเดิมเข้าสัญญา แล้วลบคอลัมน์เก่า
   ========================================================================== */

/* -- 5.1 สร้างสัญญา WARRANTY จากวันหมดอายุเดิมของแต่ละเครื่อง -- */
INSERT INTO dbo.contracts (contract_no, contract_type, vendor_id, start_date, end_date,
                           coverage_hours, service_type, status, notes)
SELECT
    'MIG-' + a.asset_tag,
    CASE WHEN c.code = 'SFT' THEN 'SUBSCRIPTION' ELSE 'WARRANTY' END,
    a.vendor_id,
    ISNULL(a.coverage_start_date, ISNULL(a.purchase_date, a.coverage_end_date)),
    a.coverage_end_date,
    NULL,
    NULL,
    CASE WHEN a.coverage_end_date >= CAST(SYSDATETIMEOFFSET() AS DATE) THEN 'ACTIVE' ELSE 'EXPIRED' END,
    N'Migrated from asset coverage fields (v1.4). Original support level: ' + ISNULL(a.support_level, N'-')
FROM dbo.assets a
    INNER JOIN dbo.asset_categories c ON c.category_id = a.category_id
WHERE a.coverage_end_date IS NOT NULL;
GO

INSERT INTO dbo.contract_assets (contract_id, asset_id, coverage_start, coverage_end, seat_count)
SELECT ct.contract_id, a.asset_id, ct.start_date, ct.end_date, sd.seats_purchased
FROM dbo.contracts ct
    INNER JOIN dbo.assets a  ON 'MIG-' + a.asset_tag = ct.contract_no
    LEFT  JOIN dbo.software_details sd ON sd.asset_id = a.asset_id
WHERE ct.contract_no LIKE 'MIG-%';
GO

/* -- 5.2 ลบ View ที่อ้างถึงคอลัมน์ที่กำลังจะถูกลบ -- */
DROP VIEW IF EXISTS dbo.vw_expiring_assets;
DROP VIEW IF EXISTS dbo.vw_software_seat_usage;
GO

/* -- 5.3 ลบคอลัมน์เดิม -- */
DROP INDEX IX_assets_coverage_end ON dbo.assets;
GO
ALTER TABLE dbo.assets DROP CONSTRAINT CK_assets_coverage;
GO
ALTER TABLE dbo.assets DROP COLUMN coverage_start_date, coverage_end_date, support_level;
GO
ALTER TABLE dbo.software_details DROP CONSTRAINT CK_software_seats;
ALTER TABLE dbo.software_details DROP CONSTRAINT DF_software_seats;
GO
ALTER TABLE dbo.software_details DROP COLUMN seats_purchased;
GO

/* -- 5.4 อัปเดต Index ของ Covering Index หลัก (คอลัมน์ที่อ้างถูกลบไปแล้ว) -- */
DROP INDEX IX_assets_list_covering ON dbo.assets;
GO
CREATE INDEX IX_assets_list_covering
    ON dbo.assets(is_deleted, category_id, status_id)
    INCLUDE (asset_tag, name, model, serial_number, asset_type_id, model_id,
             location_id, owner_user_id, purchase_date, purchase_price, fixed_asset_no);
GO


/* ============================================================================
   ส่วนที่ 6 — Views ของสัญญา
   ========================================================================== */

/* -- 6.1 ⭐ ความคุ้มครองปัจจุบันของแต่ละทรัพย์สิน (แทน coverage_end_date เดิม) -- */
CREATE VIEW dbo.vw_asset_coverage
AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name              AS asset_name,
    cur.contract_id,
    cur.contract_no,
    cur.contract_type,
    cur.vendor_name,
    cur.coverage_start,
    cur.coverage_end,
    cur.coverage_hours,
    cur.service_type,
    cur.seat_count,
    cur.contract_status,
    CASE WHEN cur.coverage_end IS NULL THEN NULL
         ELSE DATEDIFF(DAY, CAST(SYSDATETIMEOFFSET() AS DATE), cur.coverage_end)
    END                 AS days_remaining,
    CASE
        WHEN cur.coverage_end IS NULL THEN 'NOT_COVERED'
        WHEN cur.coverage_end <  CAST(SYSDATETIMEOFFSET() AS DATE) THEN 'EXPIRED'
        WHEN DATEDIFF(DAY, CAST(SYSDATETIMEOFFSET() AS DATE), cur.coverage_end) <= 30 THEN 'CRITICAL'
        WHEN DATEDIFF(DAY, CAST(SYSDATETIMEOFFSET() AS DATE), cur.coverage_end) <= 60 THEN 'WARNING'
        WHEN DATEDIFF(DAY, CAST(SYSDATETIMEOFFSET() AS DATE), cur.coverage_end) <= 90 THEN 'NOTICE'
        ELSE 'OK'
    END                 AS coverage_status
FROM dbo.assets a
    OUTER APPLY (
        SELECT TOP (1)
            ca.contract_id, c.contract_no, c.contract_type, v.name AS vendor_name,
            ca.coverage_start, ca.coverage_end, c.coverage_hours, c.service_type,
            ca.seat_count, c.status AS contract_status
        FROM dbo.contract_assets ca
            INNER JOIN dbo.contracts c ON c.contract_id = ca.contract_id
            LEFT  JOIN dbo.vendors   v ON v.vendor_id   = c.vendor_id
        WHERE ca.asset_id = a.asset_id
          AND c.status IN ('ACTIVE','EXPIRED','SUPERSEDED')
        ORDER BY ca.coverage_end DESC, c.contract_id DESC
    ) cur
WHERE a.is_deleted = 0;
GO

/* -- 6.2 ⭐ เส้นเวลาของสัญญาแต่ละทรัพย์สิน พร้อมอัตราการขึ้นราคา -- */
CREATE VIEW dbo.vw_contract_timeline
AS
SELECT
    ca.asset_id,
    a.asset_tag,
    c.contract_id,
    c.contract_no,
    c.vendor_contract_no,
    c.contract_type,
    v.name                  AS vendor_name,
    c.previous_contract_id,
    prev.contract_no        AS previous_contract_no,
    ca.coverage_start,
    ca.coverage_end,
    ISNULL(ca.allocated_cost, c.contract_value) AS period_cost,
    c.currency,
    ca.seat_count,
    c.coverage_hours,
    c.service_type,
    c.sla_response_hours,
    c.auto_renew,
    c.status,
    u.full_name             AS contract_owner,
    /* ลำดับที่ของสัญญาในโซ่ */
    ROW_NUMBER() OVER (PARTITION BY ca.asset_id ORDER BY ca.coverage_start) AS sequence_no,
    /* ⭐ อัตราการเปลี่ยนแปลงราคาจากงวดก่อนหน้า */
    CAST(100.0 * (ISNULL(ca.allocated_cost, c.contract_value)
         - LAG(ISNULL(ca.allocated_cost, c.contract_value))
               OVER (PARTITION BY ca.asset_id ORDER BY ca.coverage_start))
         / NULLIF(LAG(ISNULL(ca.allocated_cost, c.contract_value))
               OVER (PARTITION BY ca.asset_id ORDER BY ca.coverage_start), 0)
         AS DECIMAL(6,1)) AS cost_change_percent,
    /* ⭐ จำนวนวันที่ไม่มีความคุ้มครองต่อจากงวดก่อนหน้า */
    DATEDIFF(DAY,
        LAG(ca.coverage_end) OVER (PARTITION BY ca.asset_id ORDER BY ca.coverage_start),
        ca.coverage_start) - 1 AS gap_days_from_previous
FROM dbo.contract_assets ca
    INNER JOIN dbo.contracts c    ON c.contract_id = ca.contract_id
    INNER JOIN dbo.assets    a    ON a.asset_id    = ca.asset_id
    LEFT  JOIN dbo.vendors   v    ON v.vendor_id   = c.vendor_id
    LEFT  JOIN dbo.contracts prev ON prev.contract_id = c.previous_contract_id
    LEFT  JOIN dbo.users     u    ON u.user_id     = c.owner_user_id
WHERE a.is_deleted = 0;
GO

/* -- 6.3 ต้นทุนรวมตลอดอายุการใช้งาน -- */
CREATE VIEW dbo.vw_asset_tco
AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name                  AS asset_name,
    a.fixed_asset_no,
    a.purchase_price,
    a.currency,
    a.service_start_date,
    CASE WHEN a.service_start_date IS NOT NULL
         THEN DATEDIFF(MONTH, a.service_start_date, CAST(SYSDATETIMEOFFSET() AS DATE))
    END                     AS months_in_service,
    ISNULL(ct.contract_count, 0)        AS contract_count,
    ISNULL(ct.total_contract_cost, 0)   AS total_contract_cost,
    ISNULL(a.purchase_price, 0) + ISNULL(ct.total_contract_cost, 0) AS total_cost_of_ownership,
    CAST(100.0 * ISNULL(ct.total_contract_cost, 0)
         / NULLIF(a.purchase_price, 0) AS DECIMAL(6,1)) AS support_cost_vs_purchase_percent
FROM dbo.assets a
    OUTER APPLY (
        SELECT COUNT(*) AS contract_count,
               SUM(ISNULL(ca.allocated_cost, c.contract_value)) AS total_contract_cost
        FROM dbo.contract_assets ca
            INNER JOIN dbo.contracts c ON c.contract_id = ca.contract_id
        WHERE ca.asset_id = a.asset_id AND c.status <> 'CANCELLED'
    ) ct
WHERE a.is_deleted = 0;
GO

/* -- 6.4 สร้าง vw_expiring_assets ขึ้นใหม่ให้อ่านจากสัญญา -- */
CREATE VIEW dbo.vw_expiring_assets
AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name,
    c.code                  AS category_code,
    c.name                  AS category_name,
    cov.contract_id,
    cov.contract_no,
    cov.contract_type,
    cov.coverage_end        AS coverage_end_date,
    cov.days_remaining,
    CASE cov.coverage_status
        WHEN 'EXPIRED'  THEN 'EXPIRED'
        WHEN 'CRITICAL' THEN 'CRITICAL'
        WHEN 'WARNING'  THEN 'WARNING'
        WHEN 'NOTICE'   THEN 'NOTICE'
        ELSE 'OK'
    END                     AS severity,
    a.owner_user_id,
    au.full_name            AS owner_name,
    au.email                AS owner_email,
    cov.contract_id         AS current_contract_id,
    cu.full_name            AS contract_owner_name,
    cu.email                AS contract_owner_email,
    l.name                  AS location_name,
    cov.vendor_name,
    cov.seat_count
FROM dbo.assets a
    INNER JOIN dbo.asset_categories c   ON c.category_id = a.category_id
    INNER JOIN dbo.vw_asset_coverage cov ON cov.asset_id = a.asset_id
    LEFT  JOIN dbo.users            au  ON au.user_id    = a.owner_user_id
    LEFT  JOIN dbo.locations        l   ON l.location_id = a.location_id
    LEFT  JOIN dbo.contracts        ct  ON ct.contract_id = cov.contract_id
    LEFT  JOIN dbo.users            cu  ON cu.user_id    = ct.owner_user_id
WHERE a.is_deleted = 0 AND cov.coverage_end IS NOT NULL;
GO

/* -- 6.5 สร้าง vw_software_seat_usage ขึ้นใหม่ให้อ่าน Seat จากสัญญา -- */
CREATE VIEW dbo.vw_software_seat_usage
AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name                              AS software_name,
    sd.publisher,
    sd.[version],
    sd.license_type,
    ISNULL(cov.seat_count, 0)           AS seats_purchased,
    ISNULL(seat.seats_used, 0)          AS seats_used,
    ISNULL(cov.seat_count, 0) - ISNULL(seat.seats_used, 0) AS seats_available,
    CASE WHEN ISNULL(seat.seats_used, 0) > ISNULL(cov.seat_count, 0)
         THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS is_over_deployed,
    CASE WHEN ISNULL(seat.seats_used, 0) > ISNULL(cov.seat_count, 0)
         THEN ISNULL(seat.seats_used, 0) - ISNULL(cov.seat_count, 0) ELSE 0
    END                                 AS over_deployed_count,
    cov.coverage_end                    AS license_end_date,
    cov.days_remaining                  AS days_until_expiry,
    cov.contract_no                     AS current_contract_no,
    cov.vendor_name
FROM dbo.assets a
    INNER JOIN dbo.software_details sd  ON sd.asset_id = a.asset_id
    LEFT  JOIN dbo.vw_asset_coverage cov ON cov.asset_id = a.asset_id
    OUTER APPLY (
        SELECT COUNT(*) AS seats_used
        FROM dbo.software_installations si
        WHERE si.software_asset_id = a.asset_id AND si.removed_date IS NULL
    ) seat
WHERE a.is_deleted = 0;
GO

/* -- 6.6 ⭐ ตรวจความขัดแย้งระหว่างวันสิ้นสุดการสนับสนุนของรุ่น กับวันสิ้นสุดสัญญา -- */
CREATE VIEW dbo.vw_eos_contract_conflicts
AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name              AS asset_name,
    m.name              AS manufacturer_name,
    dm.model_name,
    dm.eos_date,
    ca.coverage_end,
    c.contract_no,
    DATEDIFF(DAY, dm.eos_date, ca.coverage_end) AS days_paid_beyond_eos,
    ISNULL(ca.allocated_cost, c.contract_value) AS contract_cost
FROM dbo.contract_assets ca
    INNER JOIN dbo.contracts     c  ON c.contract_id = ca.contract_id
    INNER JOIN dbo.assets        a  ON a.asset_id    = ca.asset_id
    INNER JOIN dbo.device_models dm ON dm.model_id   = a.model_id
    LEFT  JOIN dbo.manufacturers m  ON m.manufacturer_id = dm.manufacturer_id
WHERE a.is_deleted = 0
  AND c.status IN ('ACTIVE','DRAFT')
  AND dm.eos_date IS NOT NULL
  AND ca.coverage_end > dm.eos_date;
GO

/* -- 6.7 สร้าง vw_asset_list ขึ้นใหม่ (IP · ประเภท · รุ่น · ความคุ้มครอง) -- */
CREATE VIEW dbo.vw_asset_list
AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.fixed_asset_no,
    a.name,
    a.serial_number,
    a.service_tag,
    c.code                  AS category_code,
    c.name                  AS category_name,
    t.name                  AS type_name,
    pt.name                 AS type_group_name,
    s.code                  AS status_code,
    s.name                  AS status_name,
    s.color_token           AS status_color,
    m.name                  AS manufacturer_name,
    ISNULL(dm.model_name, a.model) AS model_name,
    lt.full_path            AS location_path,
    l.name                  AS location_name,
    rk.code                 AS rack_code,
    rm.start_u,
    d.name                  AS department_name,
    u.full_name             AS owner_name,
    v.name                  AS vendor_name,
    a.purchase_date,
    a.service_start_date,
    a.purchase_price,
    a.currency,
    cov.coverage_end,
    cov.days_remaining,
    cov.coverage_status,
    cov.contract_no,
    pip.primary_ip          AS ip_address,
    pip.hostname,
    pip.vlan_number,
    pip.zone_name,
    srv.primary_role        AS server_primary_role,
    a.last_verified_at,
    a.created_at,
    a.updated_at
FROM dbo.assets a
    INNER JOIN dbo.asset_categories c  ON c.category_id = a.category_id
    INNER JOIN dbo.asset_statuses   s  ON s.status_id   = a.status_id
    LEFT  JOIN dbo.asset_types      t  ON t.asset_type_id  = a.asset_type_id
    LEFT  JOIN dbo.asset_types      pt ON pt.asset_type_id = t.parent_type_id
    LEFT  JOIN dbo.manufacturers    m  ON m.manufacturer_id = a.manufacturer_id
    LEFT  JOIN dbo.device_models    dm ON dm.model_id      = a.model_id
    LEFT  JOIN dbo.locations        l  ON l.location_id    = a.location_id
    LEFT  JOIN dbo.vw_location_tree lt ON lt.location_id   = a.location_id
    LEFT  JOIN dbo.departments      d  ON d.department_id  = a.department_id
    LEFT  JOIN dbo.users            u  ON u.user_id        = a.owner_user_id
    LEFT  JOIN dbo.vendors          v  ON v.vendor_id      = a.vendor_id
    LEFT  JOIN dbo.vw_asset_coverage   cov ON cov.asset_id = a.asset_id
    LEFT  JOIN dbo.vw_asset_primary_ip pip ON pip.asset_id = a.asset_id
    LEFT  JOIN dbo.vw_server_roles_summary srv ON srv.asset_id = a.asset_id
    LEFT  JOIN dbo.rack_mounts      rm ON rm.asset_id = a.asset_id AND rm.removed_date IS NULL
    LEFT  JOIN dbo.racks            rk ON rk.rack_id  = rm.rack_id
WHERE a.is_deleted = 0;
GO

/* -- 6.8 Trigger : สัญญาที่ต่อจากฉบับก่อน ต้องปิดสถานะฉบับเดิมเป็น SUPERSEDED -- */
CREATE TRIGGER dbo.trg_contracts_supersede
ON dbo.contracts
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    /* สัญญาใหม่ห้ามเริ่มก่อนสัญญาที่ตนเองต่อมา */
    IF EXISTS (
        SELECT 1 FROM inserted i
            INNER JOIN dbo.contracts p ON p.contract_id = i.previous_contract_id
        WHERE i.start_date < p.start_date
    )
        THROW 51040, 'A renewal contract cannot start before the contract it renews.', 1;

    /* ปิดสถานะสัญญาฉบับก่อนหน้าเป็น SUPERSEDED อัตโนมัติ */
    UPDATE p
       SET status = 'SUPERSEDED',
           updated_at = SYSDATETIMEOFFSET()
    FROM dbo.contracts p
        INNER JOIN inserted i ON i.previous_contract_id = p.contract_id
    WHERE p.status IN ('ACTIVE','EXPIRED')
      AND i.status IN ('ACTIVE','DRAFT');
END;
GO


/* ============================================================================
   ส่วนที่ 7 — เปิด System-Versioned Temporal Tables
   ========================================================================== */

/* -- 7.1 ตรวจสอบก่อนเปิด Versioning : แสดงตารางที่มีคอลัมน์คำนวณ --

   ⚠️ ข้อควรทราบ
   SQL Server สร้างตารางประวัติให้อัตโนมัติโดยแปลงคอลัมน์คำนวณเป็นคอลัมน์ธรรมดา
   ซึ่งตามปกติทำงานได้ แต่ควรตรวจก่อนเพื่อความมั่นใจ

   ตารางในระบบนี้ที่มีคอลัมน์คำนวณ
     - software_installations.is_active        (PERSISTED)
     - cluster_members.is_active               (PERSISTED)
     - vlans.network_numeric                   (PERSISTED)
     - vlan_ip_ranges.start_numeric/end_numeric(PERSISTED)
     - ip_addresses.ip_numeric                 (PERSISTED)
     - storage_volumes.free_gb                 (PERSISTED)
     - storage_volumes.used_percent            (ไม่ PERSISTED)

   หากคำสั่งในส่วนที่ 7.2 ล้มเหลวที่ตารางใด ให้ทำดังนี้
     1. ตัดชื่อตารางนั้นออกจากรายการในส่วนที่ 7.2 แล้วรันส่วนที่เหลือให้ผ่านก่อน
     2. แปลงคอลัมน์คำนวณของตารางนั้นเป็นคอลัมน์ธรรมดา
        หรือย้ายการคำนวณไปไว้ใน View แทน
     3. เปิด Versioning ของตารางนั้นแยกภายหลัง

   ให้ DBA ตรวจผลลัพธ์ของคำสั่งด้านล่างก่อน แล้วจึงรันส่วนที่ 7.2 ต่อ           */
SELECT OBJECT_SCHEMA_NAME(c.object_id) AS [schema],
       OBJECT_NAME(c.object_id)        AS table_name,
       c.name                          AS computed_column,
       c.is_persisted
FROM sys.computed_columns c
ORDER BY table_name, c.name;
GO

/* -- 7.2 เปิด Versioning ทีละตาราง --
   คอลัมน์ valid_from / valid_to ตั้งเป็น HIDDEN เพื่อไม่ให้ SELECT * เปลี่ยนรูปแบบ
   ทำให้แอปพลิเคชันเดิมทำงานต่อได้โดยไม่ต้องแก้โค้ด                            */
DECLARE @tbl SYSNAME, @sql NVARCHAR(MAX);

DECLARE tbl_cursor CURSOR LOCAL FAST_FORWARD FOR
SELECT v.name FROM (VALUES
    /* --- ข้อมูลหลักที่ถูกตรวจสอบ --- */
    ('assets'), ('server_details'), ('network_details'), ('computer_details'),
    ('software_details'), ('storage_details'), ('power_details'),
    ('peripheral_details'), ('mobile_iot_details'),
    /* --- สัญญา --- */
    ('contracts'), ('contract_assets'),
    /* --- การผูกโยงที่ต้องมีประวัติตามที่กำหนด --- */
    ('software_installations'), ('ip_addresses'), ('rack_mounts'),
    ('server_role_assignments'), ('cluster_members'), ('asset_relationships'),
    /* --- โครงสร้างพื้นฐาน --- */
    ('storage_volumes'), ('clusters'), ('racks'),
    ('vlans'), ('vlan_ip_ranges'), ('vlan_devices'),
    /* --- Master Data และผู้ใช้ --- */
    ('users'), ('device_models'), ('asset_types'), ('locations'),
    ('vendors'), ('manufacturers'), ('departments'), ('attachments')
) v(name);

OPEN tbl_cursor;
FETCH NEXT FROM tbl_cursor INTO @tbl;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'
ALTER TABLE dbo.' + QUOTENAME(@tbl) + N' ADD
    valid_from DATETIME2(3) GENERATED ALWAYS AS ROW START HIDDEN NOT NULL
        CONSTRAINT ' + QUOTENAME('DF_' + @tbl + '_valid_from') + N'
        DEFAULT SYSUTCDATETIME(),
    valid_to   DATETIME2(3) GENERATED ALWAYS AS ROW END   HIDDEN NOT NULL
        CONSTRAINT ' + QUOTENAME('DF_' + @tbl + '_valid_to') + N'
        DEFAULT CONVERT(DATETIME2(3), ''9999-12-31 23:59:59.999''),
    PERIOD FOR SYSTEM_TIME (valid_from, valid_to);';
    EXEC sys.sp_executesql @sql;

    SET @sql = N'
ALTER TABLE dbo.' + QUOTENAME(@tbl) + N'
    SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.' + QUOTENAME(@tbl + '_history')
       + N', DATA_CONSISTENCY_CHECK = ON));';
    EXEC sys.sp_executesql @sql;

    PRINT 'System versioning enabled : dbo.' + @tbl;
    FETCH NEXT FROM tbl_cursor INTO @tbl;
END

CLOSE tbl_cursor;
DEALLOCATE tbl_cursor;
GO

/* -- 7.3 ตรวจผล -- */
SELECT t.name AS table_name, h.name AS history_table, t.temporal_type_desc
FROM sys.tables t
    LEFT JOIN sys.tables h ON h.object_id = t.history_table_id
WHERE t.temporal_type = 2
ORDER BY t.name;
GO


/* ============================================================================
   ส่วนที่ 8 — ⚠️ ข้อบังคับสำหรับทีมพัฒนา
   ========================================================================== */
/*
   Temporal Table บันทึกว่า "เมื่อไร" แต่ไม่บันทึกว่า "ใคร"
   ค่าที่บอกว่าใครแก้ คือคอลัมน์ updated_by ซึ่งจะถูกคัดลอกเข้าตารางประวัติ
   ต่อเมื่อแอปพลิเคชันตั้งค่าไว้ก่อนสั่ง UPDATE เท่านั้น

   ⛔ ห้ามพึ่งพาความจำของนักพัฒนา ต้องบังคับที่ชั้น Middleware ชั้นเดียว

   ตัวอย่างสำหรับ Prisma
   ---------------------
   const prisma = new PrismaClient().$extends({
     query: {
       $allModels: {
         async update({ args, query }) {
           args.data = { ...args.data,
             updated_by: getCurrentUserId(),
             updated_at: new Date() };
           return query(args);
         },
         async updateMany({ args, query }) { ... เช่นเดียวกัน ... },
       },
     },
   });

   ตัวอย่างสำหรับ EF Core
   ----------------------
   public class AuditInterceptor : SaveChangesInterceptor
   {
       public override ValueTask<InterceptionResult<int>> SavingChangesAsync(...)
       {
           foreach (var e in ctx.ChangeTracker.Entries()
                                .Where(x => x.State == EntityState.Modified))
           {
               e.Property("updated_by").CurrentValue = _currentUser.Id;
               e.Property("updated_at").CurrentValue = DateTimeOffset.Now;
           }
           ...
       }
   }

   การดึงประวัติกลับมาใช้
   ----------------------
   -- ข้อมูลเครื่องนี้ ณ วันที่กำหนด
   SELECT * FROM dbo.assets FOR SYSTEM_TIME AS OF '2025-01-01T00:00:00'
   WHERE asset_tag = 'SRV-2026-0031';

   -- ประวัติการเปลี่ยนแปลงทั้งหมด พร้อมผู้แก้ไข
   SELECT valid_from, valid_to, status_id, location_id, owner_user_id, updated_by
   FROM dbo.assets FOR SYSTEM_TIME ALL
   WHERE asset_tag = 'SRV-2026-0031' ORDER BY valid_from;

   การแก้โครงสร้างตารางในอนาคต
   ---------------------------
   ALTER TABLE dbo.assets SET (SYSTEM_VERSIONING = OFF);
   ... ALTER TABLE ตามต้องการ (ต้องแก้ตารางประวัติให้ตรงกันด้วย) ...
   ALTER TABLE dbo.assets SET (SYSTEM_VERSIONING = ON
       (HISTORY_TABLE = dbo.assets_history, DATA_CONSISTENCY_CHECK = ON));
*/


/* ============================================================================
   จบโมดูล v1.4 — ฐานข้อมูลครบสมบูรณ์
   ========================================================================== */
