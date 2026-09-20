/* ==========================================================================================
   IT Inventory System — Module v1.5 : Permission Control
   ------------------------------------------------------------------------------------------
   ไฟล์นี้เป็นลำดับที่ 7 ของชุดสคริปต์ ต้องรันตามลำดับนี้เท่านั้น
       02-schema-sqlserver.sql
    -> 04-vlan-module.sql
    -> 06-module-v1.2.sql
    -> 10-module-v1.3a-taxonomy.sql
    -> 11-module-v1.3b-details-rack-ipam.sql
    -> 12-module-v1.4-contracts-temporal.sql
    -> 14-module-v1.5-permission-control.sql      <-- ไฟล์นี้

   ขอบเขต
       - ทะเบียนโฟลเดอร์บน File Server พร้อมชั้นความลับและแผนกเจ้าของ
       - สิทธิ์ AD Group ต่อโฟลเดอร์ (กรอกมือ) แบบ Read-Write / Read-Only
       - นโยบายการใช้ Internet ผูกกับ AD Group (กรอกมือ)
       - ข้อมูลผู้ใช้และกลุ่มจาก Active Directory (Sync อย่างเดียว ไม่เขียนกลับ)
       - Quota / Usage จาก FSRM (Sync อย่างเดียว)
       - ประวัติการเปลี่ยนแปลงสิทธิ์ ย้อนหลังได้ พร้อมชื่อผู้แก้ไข

   สิ่งที่โมดูลนี้ไม่ทำ
       - ไม่สแกน NTFS ACL ของจริง
       - ไม่เขียนข้อมูลกลับไปที่ Active Directory หรือ File Server
       - ไม่เชื่อมต่อ API ของ Proxy หรือ Firewall

   หมายเหตุสำคัญ
       ห้ามหยุดการรันสคริปต์กลางคัน เพราะมีการ DROP แล้วสร้าง View ใหม่ในภายหลัง
       และมีการเปิด System-Versioning ในส่วนท้ายซึ่งต้องทำหลังสร้างตารางครบแล้ว
   ========================================================================================== */

/* บังคับ ON ทั้งคู่ — จำเป็นสำหรับ Computed Column / Filtered Index / Indexed View
   ที่ใช้ในไฟล์นี้ SSMS ตั้งค่านี้ให้อัตโนมัติ แต่ sqlcmd/CI ไม่ตั้งให้ ถ้าไม่ระบุเอง
   CREATE TABLE/INDEX จะ Fail แบบเงียบและ Object อื่นที่อ้างอิงจะพังตาม */
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/* ==========================================================================================
   ส่วนที่ 0 : ตรวจสอบก่อนเริ่ม
   ========================================================================================== */

IF OBJECT_ID('dbo.server_role_assignments', 'U') IS NULL
    THROW 51099, 'ยังไม่ได้รัน 06-module-v1.2.sql — กรุณารันตามลำดับที่ระบุไว้ด้านบน', 1;

IF OBJECT_ID('dbo.contracts', 'U') IS NULL
    THROW 51099, 'ยังไม่ได้รัน 12-module-v1.4-contracts-temporal.sql — กรุณารันตามลำดับ', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.server_roles WHERE code = 'FILE')
    THROW 51099, 'ไม่พบบทบาท File Server (code = FILE) ในตาราง server_roles', 1;
GO

PRINT N'>>> เริ่มติดตั้ง Module v1.5 : Permission Control';
GO


/* ==========================================================================================
   ส่วนที่ 1 : ตารางอ้างอิง (Lookup)
   ========================================================================================== */

/* ------------------------------------------------------------------------------------------
   1.1 ชั้นความลับของโฟลเดอร์

   sensitivity_rank : 1 = ลับที่สุด  ->  เลขมากขึ้น = ความลับน้อยลง
   ออกแบบเป็นตารางอ้างอิงไม่ใช่ CHECK Constraint เพื่อให้สลับลำดับหรือเพิ่มชั้นใหม่ได้
   ด้วยคำสั่ง UPDATE/INSERT แถวเดียว โดยไม่ต้องแก้โครงสร้างฐานข้อมูล
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.folder_classification_levels (
    classification_id   INT             IDENTITY(1,1) NOT NULL,
    code                VARCHAR(30)     NOT NULL,
    name_th             NVARCHAR(60)    NOT NULL,
    name_en             NVARCHAR(60)    NOT NULL,
    sensitivity_rank    TINYINT         NOT NULL,   -- 1 = ลับที่สุด
    color_token         VARCHAR(20)     NOT NULL,
    requires_view_audit BIT             NOT NULL CONSTRAINT DF_fcl_viewaudit DEFAULT (0),
    description         NVARCHAR(300)   NULL,
    is_active           BIT             NOT NULL CONSTRAINT DF_fcl_active   DEFAULT (1),
    CONSTRAINT PK_folder_classification_levels PRIMARY KEY CLUSTERED (classification_id),
    CONSTRAINT UX_fcl_code UNIQUE (code),
    CONSTRAINT UX_fcl_rank UNIQUE (sensitivity_rank),
    CONSTRAINT CK_fcl_rank CHECK (sensitivity_rank BETWEEN 1 AND 99)
);
GO

INSERT INTO dbo.folder_classification_levels
    (code, name_th, name_en, sensitivity_rank, color_token, requires_view_audit, description)
VALUES
    ('TOP_SECRET',   N'ลับที่สุด',     N'Top Secret',   1, 'red',     1, N'เปิดเผยแล้วเกิดความเสียหายร้ายแรงที่สุดต่อองค์กร'),
    ('SECRET',       N'ลับมาก',        N'Secret',       2, 'orange',  1, N'เปิดเผยแล้วเกิดความเสียหายร้ายแรงต่อองค์กร'),
    ('CONFIDENTIAL', N'ลับ',           N'Confidential', 3, 'amber',   1, N'เปิดเผยแล้วเกิดความเสียหายต่อองค์กร'),
    ('SECTION',      N'ระดับฝ่าย',      N'Section',      4, 'yellow',  0, N'ใช้ภายในฝ่ายหรือแผนกเดียว'),
    ('SHARE',        N'ใช้ร่วมกัน',     N'Share',        5, 'sky',     0, N'ใช้ร่วมกันระหว่างหลายหน่วยงาน'),
    ('CENTER',       N'ส่วนกลาง',       N'Center',       6, 'emerald', 0, N'ข้อมูลกลางที่พนักงานทั่วไปเข้าถึงได้'),
    ('SPECIAL',      N'เฉพาะกิจ',       N'Special',      7, 'violet',  0, N'โครงการหรืองานเฉพาะกิจที่มีระยะเวลาจำกัด');
GO

/* ------------------------------------------------------------------------------------------
   1.2 ระดับสิทธิ์การเข้าถึง

   ปัจจุบันมี 2 ค่าตามที่ตกลง แต่ทำเป็นตารางอ้างอิงเผื่อเพิ่ม FULL_CONTROL หรือ DENY
   ในอนาคตโดยไม่ต้องแก้โครงสร้าง
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.access_levels (
    access_level_id INT             IDENTITY(1,1) NOT NULL,
    code            VARCHAR(20)     NOT NULL,
    name_th         NVARCHAR(50)    NOT NULL,
    name_en         NVARCHAR(50)    NOT NULL,
    can_write       BIT             NOT NULL,
    privilege_rank  TINYINT         NOT NULL,   -- เลขมาก = สิทธิ์สูงกว่า ใช้เลือกสิทธิ์สูงสุดเมื่อได้มาหลายทาง
    color_token     VARCHAR(20)     NOT NULL,
    is_active       BIT             NOT NULL CONSTRAINT DF_al_active DEFAULT (1),
    CONSTRAINT PK_access_levels PRIMARY KEY CLUSTERED (access_level_id),
    CONSTRAINT UX_access_levels_code UNIQUE (code)
);
GO

INSERT INTO dbo.access_levels (code, name_th, name_en, can_write, privilege_rank, color_token) VALUES
    ('READ_ONLY',  N'อ่านอย่างเดียว', N'Read Only',  0, 10, 'sky'),
    ('READ_WRITE', N'อ่านและเขียน',   N'Read/Write', 1, 20, 'amber');
GO

/* ------------------------------------------------------------------------------------------
   1.3 บทบาทไหนเห็นชั้นความลับไหนได้

   ไม่ใช้ Row-Level Security ของ SQL Server (เคยตัดออกไปแล้วตั้งแต่ต้นโปรเจกต์)
   แต่ให้ชั้น API เป็นผู้บังคับใช้โดยอ่านจากตารางนี้
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.classification_role_visibility (
    classification_id   INT NOT NULL,
    role_id             INT NOT NULL,
    can_view            BIT NOT NULL CONSTRAINT DF_crv_view   DEFAULT (1),
    can_edit            BIT NOT NULL CONSTRAINT DF_crv_edit   DEFAULT (0),
    can_export          BIT NOT NULL CONSTRAINT DF_crv_export DEFAULT (0),
    CONSTRAINT PK_classification_role_visibility PRIMARY KEY CLUSTERED (classification_id, role_id),
    CONSTRAINT FK_crv_classification FOREIGN KEY (classification_id) REFERENCES dbo.folder_classification_levels(classification_id),
    CONSTRAINT FK_crv_role           FOREIGN KEY (role_id)           REFERENCES dbo.roles(role_id)
);
GO

/* ข้อมูลตั้งต้น — ปรับได้ภายหลังผ่านหน้าจอผู้ดูแลระบบ
       ADMIN     เห็นและแก้ไขได้ทุกชั้น
       AUDITOR   เห็นได้ทุกชั้น ส่งออกได้ แต่แก้ไขไม่ได้ (ต้องตรวจสอบได้ครบถึงทำหน้าที่ได้)
       IT_STAFF  เห็นและแก้ไขได้ตั้งแต่ชั้น 3 (ลับ) ลงมา
       VIEWER    เห็นได้ตั้งแต่ชั้น 4 (ระดับฝ่าย) ลงมา ส่งออกไม่ได้                                */
INSERT INTO dbo.classification_role_visibility (classification_id, role_id, can_view, can_edit, can_export)
SELECT c.classification_id, r.role_id,
       CASE r.code
            WHEN 'ADMIN'    THEN 1
            WHEN 'AUDITOR'  THEN 1
            WHEN 'IT_STAFF' THEN CASE WHEN c.sensitivity_rank >= 3 THEN 1 ELSE 0 END
            WHEN 'VIEWER'   THEN CASE WHEN c.sensitivity_rank >= 4 THEN 1 ELSE 0 END
            ELSE 0 END,
       CASE r.code
            WHEN 'ADMIN'    THEN 1
            WHEN 'IT_STAFF' THEN CASE WHEN c.sensitivity_rank >= 3 THEN 1 ELSE 0 END
            ELSE 0 END,
       CASE r.code
            WHEN 'ADMIN'    THEN 1
            WHEN 'AUDITOR'  THEN 1
            WHEN 'IT_STAFF' THEN CASE WHEN c.sensitivity_rank >= 4 THEN 1 ELSE 0 END
            ELSE 0 END
FROM dbo.folder_classification_levels c
CROSS JOIN dbo.roles r;
GO

/* ------------------------------------------------------------------------------------------
   1.4 หมวดหมู่เว็บไซต์ (ช่องเสริมของนโยบาย Internet)
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.web_categories (
    category_id INT             IDENTITY(1,1) NOT NULL,
    code        VARCHAR(40)     NOT NULL,
    name_th     NVARCHAR(80)    NOT NULL,
    name_en     NVARCHAR(80)    NOT NULL,
    risk_level  TINYINT         NOT NULL CONSTRAINT DF_wc_risk DEFAULT (1),  -- 1 ต่ำ .. 5 สูง
    sort_order  INT             NOT NULL CONSTRAINT DF_wc_sort DEFAULT (0),
    is_active   BIT             NOT NULL CONSTRAINT DF_wc_active DEFAULT (1),
    CONSTRAINT PK_web_categories PRIMARY KEY CLUSTERED (category_id),
    CONSTRAINT UX_web_categories_code UNIQUE (code),
    CONSTRAINT CK_wc_risk CHECK (risk_level BETWEEN 1 AND 5)
);
GO

INSERT INTO dbo.web_categories (code, name_th, name_en, risk_level, sort_order) VALUES
    ('BUSINESS',       N'เว็บไซต์เพื่อธุรกิจ',        N'Business / Corporate',   1,  1),
    ('GOVERNMENT',     N'หน่วยงานราชการ',            N'Government',             1,  2),
    ('NEWS',           N'ข่าวสาร',                   N'News / Media',           1,  3),
    ('EDUCATION',      N'การศึกษา',                  N'Education',              1,  4),
    ('SEARCH_ENGINE',  N'เครื่องมือค้นหา',            N'Search Engines',         1,  5),
    ('WEBMAIL',        N'อีเมลผ่านเว็บ',              N'Webmail',                3,  6),
    ('SOCIAL_MEDIA',   N'สื่อสังคมออนไลน์',           N'Social Media',           3,  7),
    ('STREAMING',      N'สตรีมมิ่งวิดีโอและเพลง',      N'Streaming Media',        3,  8),
    ('FILE_SHARING',   N'แชร์ไฟล์และคลาวด์',          N'File Sharing / Cloud',   4,  9),
    ('REMOTE_ACCESS',  N'รีโมตเข้าเครื่อง',            N'Remote Access Tools',    4, 10),
    ('GAMING',         N'เกมออนไลน์',                N'Online Gaming',          3, 11),
    ('SHOPPING',       N'ซื้อขายออนไลน์',             N'Shopping / E-Commerce',  2, 12),
    ('AI_TOOLS',       N'เครื่องมือปัญญาประดิษฐ์',     N'AI / LLM Services',      4, 13),
    ('CRYPTO',         N'สินทรัพย์ดิจิทัล',            N'Cryptocurrency',         5, 14),
    ('GAMBLING',       N'การพนัน',                   N'Gambling',               5, 15),
    ('ADULT',          N'เนื้อหาสำหรับผู้ใหญ่',        N'Adult Content',          5, 16),
    ('MALWARE',        N'แหล่งมัลแวร์',               N'Malware / Phishing',     5, 17),
    ('PROXY_ANON',     N'เว็บพรางตัวตน',              N'Proxy / Anonymizer',     5, 18),
    ('UNCATEGORIZED',  N'ยังไม่จัดหมวด',              N'Uncategorized',          3, 99);
GO

PRINT N'    [1/10] ตารางอ้างอิง เสร็จสิ้น';
GO


/* ==========================================================================================
   ส่วนที่ 2 : ข้อมูลจาก Active Directory (Sync อย่างเดียว)
   ========================================================================================== */

/* ------------------------------------------------------------------------------------------
   2.1 ผู้ใช้จาก AD

   หลักการสำคัญ 2 ข้อ
   (1) จับคู่ด้วย object_guid ไม่ใช่ชื่อบัญชี
       objectGUID ของ AD ไม่เปลี่ยนแม้จะเปลี่ยนชื่อบัญชีหรือย้าย OU
       ถ้าจับคู่ด้วยชื่อ วันที่มีการเปลี่ยนชื่อบัญชีระบบจะเข้าใจว่าเป็นคนละคน
   (2) เมื่อผู้ใช้หายจาก AD ห้าม DELETE ให้ตั้ง is_present_in_ad = 0 แทน
       เพราะประวัติสิทธิ์ย้อนหลังยังอ้างอิงถึงแถวนี้อยู่
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.ad_users (
    ad_user_id              INT              IDENTITY(1,1) NOT NULL,
    object_guid             UNIQUEIDENTIFIER NOT NULL,              -- กุญแจถาวรจาก AD
    object_sid              VARCHAR(184)     NULL,
    sam_account_name        NVARCHAR(256)    NOT NULL,
    user_principal_name     NVARCHAR(320)    NULL,
    display_name            NVARCHAR(256)    NULL,
    email                   NVARCHAR(320)    NULL,
    employee_id             NVARCHAR(50)     NULL,
    job_title               NVARCHAR(150)    NULL,
    department_name_raw     NVARCHAR(150)    NULL,                  -- ค่าดิบจากช่อง department ของ AD
    department_id           INT              NULL,                  -- จับคู่กับตาราง departments ของระบบ
    distinguished_name      NVARCHAR(1000)   NOT NULL,
    ou_path                 NVARCHAR(1000)   NULL,
    primary_group_sid       VARCHAR(184)     NULL,                  -- ใช้เติมกลุ่ม Domain Users ที่ไม่โผล่ใน memberOf
    is_enabled              BIT              NOT NULL CONSTRAINT DF_adu_enabled DEFAULT (1),
    account_expires_at      DATETIMEOFFSET(3) NULL,
    last_logon_at           DATETIMEOFFSET(3) NULL,
    password_last_set_at    DATETIMEOFFSET(3) NULL,
    is_present_in_ad        BIT              NOT NULL CONSTRAINT DF_adu_present DEFAULT (1),
    first_seen_at           DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_adu_firstseen DEFAULT (SYSDATETIMEOFFSET()),
    disappeared_at          DATETIMEOFFSET(3) NULL,
    linked_user_id          INT              NULL,                  -- เชื่อมกับบัญชีผู้ใช้ของระบบ ถ้ามี
    CONSTRAINT PK_ad_users PRIMARY KEY CLUSTERED (ad_user_id),
    CONSTRAINT UX_ad_users_guid UNIQUE (object_guid),
    CONSTRAINT FK_adu_department FOREIGN KEY (department_id)  REFERENCES dbo.departments(department_id),
    CONSTRAINT FK_adu_user       FOREIGN KEY (linked_user_id) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_adu_disappeared CHECK (is_present_in_ad = 1 OR disappeared_at IS NOT NULL)
);
GO

CREATE UNIQUE INDEX UX_ad_users_sam    ON dbo.ad_users(sam_account_name) WHERE is_present_in_ad = 1;
CREATE INDEX        IX_ad_users_name   ON dbo.ad_users(display_name);
CREATE INDEX        IX_ad_users_dept   ON dbo.ad_users(department_id)    WHERE is_present_in_ad = 1;
CREATE INDEX        IX_ad_users_status ON dbo.ad_users(is_enabled, is_present_in_ad);
CREATE INDEX        IX_ad_users_linked ON dbo.ad_users(linked_user_id)   WHERE linked_user_id IS NOT NULL;
GO

/* ------------------------------------------------------------------------------------------
   2.2 กลุ่มจาก AD
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.ad_groups (
    ad_group_id         INT              IDENTITY(1,1) NOT NULL,
    object_guid         UNIQUEIDENTIFIER NOT NULL,
    object_sid          VARCHAR(184)     NULL,
    sam_account_name    NVARCHAR(256)    NOT NULL,
    display_name        NVARCHAR(256)    NULL,
    distinguished_name  NVARCHAR(1000)   NOT NULL,
    ou_path             NVARCHAR(1000)   NULL,
    description         NVARCHAR(1000)   NULL,
    group_scope         VARCHAR(20)      NULL,   -- GLOBAL / DOMAIN_LOCAL / UNIVERSAL
    group_category      VARCHAR(20)      NULL,   -- SECURITY / DISTRIBUTION
    managed_by_dn       NVARCHAR(1000)   NULL,
    direct_member_count INT              NOT NULL CONSTRAINT DF_adg_dmc DEFAULT (0),
    is_present_in_ad    BIT              NOT NULL CONSTRAINT DF_adg_present DEFAULT (1),
    first_seen_at       DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_adg_firstseen DEFAULT (SYSDATETIMEOFFSET()),
    disappeared_at      DATETIMEOFFSET(3) NULL,
    CONSTRAINT PK_ad_groups PRIMARY KEY CLUSTERED (ad_group_id),
    CONSTRAINT UX_ad_groups_guid UNIQUE (object_guid),
    CONSTRAINT CK_adg_scope    CHECK (group_scope    IS NULL OR group_scope    IN ('GLOBAL','DOMAIN_LOCAL','UNIVERSAL')),
    CONSTRAINT CK_adg_category CHECK (group_category IS NULL OR group_category IN ('SECURITY','DISTRIBUTION')),
    CONSTRAINT CK_adg_disappeared CHECK (is_present_in_ad = 1 OR disappeared_at IS NOT NULL)
);
GO

CREATE UNIQUE INDEX UX_ad_groups_sam  ON dbo.ad_groups(sam_account_name) WHERE is_present_in_ad = 1;
CREATE INDEX        IX_ad_groups_name ON dbo.ad_groups(display_name);
GO

/* ------------------------------------------------------------------------------------------
   2.3 สมาชิกของกลุ่ม — เก็บเฉพาะความสัมพันธ์โดยตรงเท่านั้น

   กลุ่มซ้อนกลุ่มจะถูกคลี่ตอน Query ด้วย vw_ad_group_expanded
   เก็บเฉพาะความสัมพันธ์ตรงทำให้ข้อมูลไม่ซ้ำซ้อน และเมื่อ AD เปลี่ยนโครงสร้างกลุ่ม
   ผลลัพธ์จะถูกต้องทันทีโดยไม่ต้องคำนวณใหม่ทั้งระบบ
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.ad_group_members (
    membership_id       BIGINT  IDENTITY(1,1) NOT NULL,
    ad_group_id         INT     NOT NULL,
    member_user_id      INT     NULL,
    member_group_id     INT     NULL,
    is_primary_group    BIT     NOT NULL CONSTRAINT DF_agm_primary DEFAULT (0),  -- มาจาก primaryGroupID ไม่ใช่ memberOf
    CONSTRAINT PK_ad_group_members PRIMARY KEY CLUSTERED (membership_id),
    CONSTRAINT FK_agm_group        FOREIGN KEY (ad_group_id)     REFERENCES dbo.ad_groups(ad_group_id),
    CONSTRAINT FK_agm_member_user  FOREIGN KEY (member_user_id)  REFERENCES dbo.ad_users(ad_user_id),
    CONSTRAINT FK_agm_member_group FOREIGN KEY (member_group_id) REFERENCES dbo.ad_groups(ad_group_id),
    /* ต้องเป็นสมาชิกประเภทใดประเภทหนึ่งเท่านั้น */
    CONSTRAINT CK_agm_one_member CHECK (
            (member_user_id IS NOT NULL AND member_group_id IS NULL)
         OR (member_user_id IS NULL     AND member_group_id IS NOT NULL) ),
    /* กันกลุ่มเป็นสมาชิกของตัวเอง ซึ่งจะทำให้การคลี่กลุ่มวนไม่รู้จบ */
    CONSTRAINT CK_agm_no_self CHECK (member_group_id IS NULL OR member_group_id <> ad_group_id)
);
GO

CREATE UNIQUE INDEX UX_agm_user  ON dbo.ad_group_members(ad_group_id, member_user_id)  WHERE member_user_id  IS NOT NULL;
CREATE UNIQUE INDEX UX_agm_group ON dbo.ad_group_members(ad_group_id, member_group_id) WHERE member_group_id IS NOT NULL;
CREATE INDEX IX_agm_by_user  ON dbo.ad_group_members(member_user_id)  INCLUDE (ad_group_id) WHERE member_user_id  IS NOT NULL;
CREATE INDEX IX_agm_by_group ON dbo.ad_group_members(member_group_id) INCLUDE (ad_group_id) WHERE member_group_id IS NOT NULL;
GO

/* ------------------------------------------------------------------------------------------
   2.4 สถานะการ Sync รายวัตถุ — แยกออกมาโดยเจตนา

   ค่าอย่าง last_seen_at เปลี่ยนทุกรอบ Sync ถ้าเก็บไว้ในตาราง ad_users/ad_groups
   ที่เปิด System-Versioning จะทำให้ทุกแถวถูกบันทึกประวัติทุกวันแม้ไม่มีอะไรเปลี่ยนจริง
   ตารางนี้จึงไม่เปิด System-Versioning
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.ad_object_sync_state (
    object_guid     UNIQUEIDENTIFIER NOT NULL,
    object_type     VARCHAR(10)      NOT NULL,   -- USER / GROUP
    last_seen_at    DATETIMEOFFSET(3) NOT NULL,
    last_run_id     BIGINT           NULL,
    CONSTRAINT PK_ad_object_sync_state PRIMARY KEY CLUSTERED (object_guid),
    CONSTRAINT CK_aoss_type CHECK (object_type IN ('USER','GROUP'))
);
GO

PRINT N'    [2/10] ตารางข้อมูล Active Directory เสร็จสิ้น';
GO


/* ==========================================================================================
   ส่วนที่ 3 : โฟลเดอร์บน File Server
   ========================================================================================== */

/* ------------------------------------------------------------------------------------------
   3.1 ทะเบียนโฟลเดอร์

   asset_id ต้องเป็นเครื่องที่มีบทบาท File Server เท่านั้น บังคับด้วย Trigger ในส่วนที่ 7
   ไม่ใช้ Foreign Key ได้เพราะเงื่อนไขอยู่ที่ตารางอื่น (server_role_assignments)
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.file_shares (
    share_id            INT             IDENTITY(1,1) NOT NULL,
    asset_id            INT             NOT NULL,
    share_name          NVARCHAR(128)   NOT NULL,
    folder_path         NVARCHAR(500)   NOT NULL,   -- UNC เต็ม เช่น \\FS01\Finance\Budget
    classification_id   INT             NOT NULL,
    owner_department_id INT             NOT NULL,   -- บังคับ โฟลเดอร์ต้องมีเจ้าของเสมอ
    owner_user_id       INT             NULL,       -- ผู้รับผิดชอบรายบุคคล
    business_purpose    NVARCHAR(500)   NULL,       -- ใช้ทำอะไร จำเป็นตอนทบทวนสิทธิ์
    fsrm_quota_template NVARCHAR(128)   NULL,
    is_quota_managed    BIT             NOT NULL CONSTRAINT DF_fs_quotamanaged DEFAULT (1),
    last_reviewed_at    DATE            NULL,
    last_reviewed_by    INT             NULL,
    review_note         NVARCHAR(500)   NULL,
    notes               NVARCHAR(1000)  NULL,
    is_deleted          BIT             NOT NULL CONSTRAINT DF_fs_deleted DEFAULT (0),
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_fs_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT             NULL,
    updated_at          DATETIMEOFFSET(3) NULL,
    updated_by          INT             NULL,
    CONSTRAINT PK_file_shares PRIMARY KEY CLUSTERED (share_id),
    CONSTRAINT FK_fs_asset          FOREIGN KEY (asset_id)            REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_fs_classification FOREIGN KEY (classification_id)   REFERENCES dbo.folder_classification_levels(classification_id),
    CONSTRAINT FK_fs_department     FOREIGN KEY (owner_department_id) REFERENCES dbo.departments(department_id),
    CONSTRAINT FK_fs_owner          FOREIGN KEY (owner_user_id)       REFERENCES dbo.users(user_id),
    CONSTRAINT FK_fs_reviewed_by    FOREIGN KEY (last_reviewed_by)    REFERENCES dbo.users(user_id),
    CONSTRAINT FK_fs_created_by     FOREIGN KEY (created_by)          REFERENCES dbo.users(user_id),
    CONSTRAINT FK_fs_updated_by     FOREIGN KEY (updated_by)          REFERENCES dbo.users(user_id),
    CONSTRAINT CK_fs_path    CHECK (folder_path LIKE '\\%'),
    CONSTRAINT CK_fs_review  CHECK (last_reviewed_at IS NULL OR last_reviewed_by IS NOT NULL)
);
GO

CREATE UNIQUE INDEX UX_file_shares_path ON dbo.file_shares(asset_id, folder_path) WHERE is_deleted = 0;
CREATE INDEX IX_file_shares_asset  ON dbo.file_shares(asset_id)            WHERE is_deleted = 0;
CREATE INDEX IX_file_shares_class  ON dbo.file_shares(classification_id)   WHERE is_deleted = 0;
CREATE INDEX IX_file_shares_dept   ON dbo.file_shares(owner_department_id) WHERE is_deleted = 0;
CREATE INDEX IX_file_shares_review ON dbo.file_shares(last_reviewed_at)    WHERE is_deleted = 0;
GO

/* ------------------------------------------------------------------------------------------
   3.2 สิทธิ์ AD Group ต่อโฟลเดอร์ — หัวใจของโมดูลนี้

   เก็บทั้ง ad_group_id (Foreign Key) และ ad_group_name_raw (ข้อความ) โดยเจตนา
       - กรณีปกติ          ad_group_id มีค่า ใช้เทียบกับผู้ใช้ได้
       - กลุ่มถูกลบจาก AD   ad_group_id ยังชี้ไปที่แถวที่ทำเครื่องหมายว่าหายแล้ว -> ขึ้นเตือน
       - กลุ่มถูกเปลี่ยนชื่อ  ad_group_id ยังถูกต้องเพราะผูกด้วย GUID ส่วนชื่อดิบบอกว่าเดิมชื่ออะไร

   ad_group_id เป็น NULL ได้ เพื่อรองรับกรณีบันทึกสิทธิ์ไว้ก่อนที่จะ Sync ข้อมูล AD เข้ามา
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.file_share_permissions (
    permission_id       INT             IDENTITY(1,1) NOT NULL,
    share_id            INT             NOT NULL,
    ad_group_id         INT             NULL,
    ad_group_name_raw   NVARCHAR(256)   NOT NULL,   -- ชื่อ ณ ตอนที่บันทึก
    access_level_id     INT             NOT NULL,
    granted_reason      NVARCHAR(500)   NULL,       -- เหตุผลที่ให้สิทธิ์ ใช้ตอนทบทวน
    request_reference   NVARCHAR(100)   NULL,       -- เลขที่ใบคำขอ ถ้ามี
    is_deleted          BIT             NOT NULL CONSTRAINT DF_fsp_deleted DEFAULT (0),
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_fsp_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT             NULL,
    updated_at          DATETIMEOFFSET(3) NULL,
    updated_by          INT             NULL,
    CONSTRAINT PK_file_share_permissions PRIMARY KEY CLUSTERED (permission_id),
    CONSTRAINT FK_fsp_share      FOREIGN KEY (share_id)        REFERENCES dbo.file_shares(share_id),
    CONSTRAINT FK_fsp_group      FOREIGN KEY (ad_group_id)     REFERENCES dbo.ad_groups(ad_group_id),
    CONSTRAINT FK_fsp_level      FOREIGN KEY (access_level_id) REFERENCES dbo.access_levels(access_level_id),
    CONSTRAINT FK_fsp_created_by FOREIGN KEY (created_by)      REFERENCES dbo.users(user_id),
    CONSTRAINT FK_fsp_updated_by FOREIGN KEY (updated_by)      REFERENCES dbo.users(user_id)
);
GO

/* กลุ่มเดียวกันมีได้ระดับสิทธิ์เดียวต่อโฟลเดอร์ */
CREATE UNIQUE INDEX UX_fsp_group ON dbo.file_share_permissions(share_id, ad_group_id)
    WHERE is_deleted = 0 AND ad_group_id IS NOT NULL;
CREATE INDEX IX_fsp_share ON dbo.file_share_permissions(share_id)    WHERE is_deleted = 0;
CREATE INDEX IX_fsp_group ON dbo.file_share_permissions(ad_group_id) WHERE is_deleted = 0;
GO

/* ------------------------------------------------------------------------------------------
   3.3 ค่าที่วัดได้จาก FSRM — แยกตารางโดยเจตนา

   ถ้าเก็บ used_bytes ไว้ในตาราง file_shares ที่เปิด System-Versioning
   ประวัติของโฟลเดอร์จะกลายเป็นบันทึกการใช้พื้นที่รายวัน กลบประวัติการเปลี่ยนสิทธิ์
   ซึ่งเป็นสิ่งที่ต้องการดูจริง ๆ

   ตารางนี้เพิ่มแถวอย่างเดียว ไม่เปิด System-Versioning และได้กราฟแนวโน้มมาฟรี
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.file_share_usage_snapshots (
    snapshot_id     BIGINT  IDENTITY(1,1) NOT NULL,
    share_id        INT     NOT NULL,
    measured_at     DATETIMEOFFSET(3) NOT NULL,
    quota_bytes     BIGINT  NULL,       -- NULL = ยังไม่ได้ตั้ง Quota ใน FSRM
    used_bytes      BIGINT  NOT NULL,
    peak_usage_bytes BIGINT NULL,
    quota_type      VARCHAR(10) NULL,   -- HARD / SOFT
    file_count      BIGINT  NULL,
    folder_count    BIGINT  NULL,
    run_id          BIGINT  NULL,
    usage_percent   AS (CASE WHEN quota_bytes > 0
                             THEN CAST(used_bytes * 100.0 / quota_bytes AS DECIMAL(6,2))
                        END) PERSISTED,
    CONSTRAINT PK_file_share_usage_snapshots PRIMARY KEY CLUSTERED (snapshot_id),
    CONSTRAINT FK_fsus_share FOREIGN KEY (share_id) REFERENCES dbo.file_shares(share_id),
    CONSTRAINT CK_fsus_used  CHECK (used_bytes >= 0),
    CONSTRAINT CK_fsus_quota CHECK (quota_bytes IS NULL OR quota_bytes > 0),
    CONSTRAINT CK_fsus_type  CHECK (quota_type IS NULL OR quota_type IN ('HARD','SOFT'))
);
GO

CREATE UNIQUE INDEX UX_fsus_share_time ON dbo.file_share_usage_snapshots(share_id, measured_at DESC);
CREATE INDEX IX_fsus_measured ON dbo.file_share_usage_snapshots(measured_at DESC);
GO

PRINT N'    [3/10] ตารางโฟลเดอร์ File Server เสร็จสิ้น';
GO


/* ==========================================================================================
   ส่วนที่ 4 : นโยบายการใช้ Internet
   ========================================================================================== */

CREATE TABLE dbo.internet_policies (
    policy_id           INT             IDENTITY(1,1) NOT NULL,
    policy_code         VARCHAR(40)     NOT NULL,
    policy_name         NVARCHAR(150)   NOT NULL,
    description         NVARCHAR(1000)  NULL,
    proxy_asset_id      INT             NULL,       -- ช่องเสริม อุปกรณ์ที่บังคับใช้นโยบายนี้
    external_policy_ref NVARCHAR(150)   NULL,       -- ชื่อ Policy ฝั่ง Proxy เพื่อให้เทียบกันได้ด้วยตา
    is_default          BIT             NOT NULL CONSTRAINT DF_intpol_default DEFAULT (0),
    is_active           BIT             NOT NULL CONSTRAINT DF_intpol_active  DEFAULT (1),
    notes               NVARCHAR(1000)  NULL,
    is_deleted          BIT             NOT NULL CONSTRAINT DF_intpol_deleted DEFAULT (0),
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_intpol_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT             NULL,
    updated_at          DATETIMEOFFSET(3) NULL,
    updated_by          INT             NULL,
    CONSTRAINT PK_internet_policies PRIMARY KEY CLUSTERED (policy_id),
    -- หมายเหตุ: ตั้งใจไม่ใช้ prefix "ip" (ย่อจาก internet_policies) เพราะ dbo.ip_addresses
    -- (ไฟล์ 11) จองชื่อ Constraint prefix "ip" ไปแล้วก่อนหน้า — DEFAULT/FOREIGN KEY
    -- ชื่อซ้ำกันไม่ได้แม้อยู่คนละตาราง เพราะ SQL Server บังคับให้ไม่ซ้ำทั้งฐานข้อมูล
    -- (พบจากการรันจริง ไม่ใช่จากเอกสาร) จึงใช้ "intpol" แทนเพื่อกันชนในทุกไฟล์
    CONSTRAINT FK_intpol_proxy      FOREIGN KEY (proxy_asset_id) REFERENCES dbo.assets(asset_id),
    CONSTRAINT FK_intpol_created_by FOREIGN KEY (created_by)     REFERENCES dbo.users(user_id),
    CONSTRAINT FK_intpol_updated_by FOREIGN KEY (updated_by)     REFERENCES dbo.users(user_id)
);
GO

CREATE UNIQUE INDEX UX_internet_policies_code ON dbo.internet_policies(policy_code) WHERE is_deleted = 0;
/* มีนโยบายเริ่มต้นได้เพียงหนึ่งเดียว */
CREATE UNIQUE INDEX UX_internet_policies_default ON dbo.internet_policies(is_default)
    WHERE is_default = 1 AND is_deleted = 0;
GO

/* นโยบาย 1 ฉบับผูกได้หลาย AD Group และกลุ่มหนึ่งอยู่ได้หลายนโยบาย */
CREATE TABLE dbo.internet_policy_groups (
    policy_group_id     INT             IDENTITY(1,1) NOT NULL,
    policy_id           INT             NOT NULL,
    ad_group_id         INT             NULL,
    ad_group_name_raw   NVARCHAR(256)   NOT NULL,
    notes               NVARCHAR(300)   NULL,
    is_deleted          BIT             NOT NULL CONSTRAINT DF_ipg_deleted DEFAULT (0),
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_ipg_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT             NULL,
    updated_at          DATETIMEOFFSET(3) NULL,
    updated_by          INT             NULL,
    CONSTRAINT PK_internet_policy_groups PRIMARY KEY CLUSTERED (policy_group_id),
    CONSTRAINT FK_ipg_policy     FOREIGN KEY (policy_id)   REFERENCES dbo.internet_policies(policy_id),
    CONSTRAINT FK_ipg_group      FOREIGN KEY (ad_group_id) REFERENCES dbo.ad_groups(ad_group_id),
    CONSTRAINT FK_ipg_created_by FOREIGN KEY (created_by)  REFERENCES dbo.users(user_id),
    CONSTRAINT FK_ipg_updated_by FOREIGN KEY (updated_by)  REFERENCES dbo.users(user_id)
);
GO

CREATE UNIQUE INDEX UX_ipg ON dbo.internet_policy_groups(policy_id, ad_group_id)
    WHERE is_deleted = 0 AND ad_group_id IS NOT NULL;
CREATE INDEX IX_ipg_group ON dbo.internet_policy_groups(ad_group_id) WHERE is_deleted = 0;
GO

/* หมวดเว็บของแต่ละนโยบาย — ช่องเสริม ไม่กรอกก็ได้ */
CREATE TABLE dbo.internet_policy_categories (
    policy_category_id  INT         IDENTITY(1,1) NOT NULL,
    policy_id           INT         NOT NULL,
    category_id         INT         NOT NULL,
    policy_action       VARCHAR(10) NOT NULL,   -- ALLOW / BLOCK / WARN
    notes               NVARCHAR(300) NULL,
    CONSTRAINT PK_internet_policy_categories PRIMARY KEY CLUSTERED (policy_category_id),
    CONSTRAINT UX_ipc UNIQUE (policy_id, category_id),
    CONSTRAINT FK_ipc_policy   FOREIGN KEY (policy_id)   REFERENCES dbo.internet_policies(policy_id),
    CONSTRAINT FK_ipc_category FOREIGN KEY (category_id) REFERENCES dbo.web_categories(category_id),
    CONSTRAINT CK_ipc_action   CHECK (policy_action IN ('ALLOW','BLOCK','WARN'))
);
GO

PRINT N'    [4/10] ตารางนโยบาย Internet เสร็จสิ้น';
GO


/* ==========================================================================================
   ส่วนที่ 5 : Collector Agent และงาน Sync
   ========================================================================================== */

/* ------------------------------------------------------------------------------------------
   5.1 ทะเบียน Collector Agent

   api_key_hash เก็บเป็น SHA-256 ไม่เก็บค่าจริง แนวทางเดียวกับ Refresh Token ในไฟล์ 02
   ถ้าฐานข้อมูลรั่ว ผู้ได้ไปจะใช้ Key ไม่ได้
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.collector_agents (
    agent_id            INT             IDENTITY(1,1) NOT NULL,
    agent_code          VARCHAR(40)     NOT NULL,
    agent_name          NVARCHAR(150)   NOT NULL,
    description         NVARCHAR(500)   NULL,
    api_key_hash        VARCHAR(64)     NOT NULL,   -- SHA-256 ของ API Key
    api_key_prefix      VARCHAR(12)     NOT NULL,   -- 8 ตัวแรกของ Key ไว้ให้ผู้ดูแลระบบระบุตัวได้
    allowed_source_ips  NVARCHAR(500)   NULL,       -- คั่นด้วยจุลภาค เว้นว่าง = ไม่จำกัด
    agent_version       VARCHAR(30)     NULL,
    hostname            NVARCHAR(150)   NULL,
    last_heartbeat_at   DATETIMEOFFSET(3) NULL,
    api_key_expires_at  DATETIMEOFFSET(3) NULL,
    is_enabled          BIT             NOT NULL CONSTRAINT DF_cagt_enabled DEFAULT (1),
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_cagt_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT             NULL,
    CONSTRAINT PK_collector_agents PRIMARY KEY CLUSTERED (agent_id),
    CONSTRAINT UX_collector_agents_code UNIQUE (agent_code),
    CONSTRAINT UX_collector_agents_hash UNIQUE (api_key_hash),
    -- "cagt" แทน "ca" เพราะ dbo.contract_assets (ไฟล์ 12) จองชื่อ Constraint prefix "ca" ไปแล้ว
    CONSTRAINT FK_cagt_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(user_id)
);
GO

/* ------------------------------------------------------------------------------------------
   5.2 ขอบเขต OU ที่จะ Sync
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.sync_ou_scopes (
    scope_id            INT             IDENTITY(1,1) NOT NULL,
    distinguished_name  NVARCHAR(1000)  NOT NULL,
    -- Unique Index บน NVARCHAR(1000) ตรงๆ ยาวถึง 2000 byte เกิน Limit 1700 byte ของ
    -- Nonclustered Index (พบเป็น Warning จากการรันจริง) จึงต้อง Unique ผ่าน Hash แทน
    -- HASHBYTES เป็น Deterministic Function (ต่างจาก PARSENAME) จึงใช้ PERSISTED ได้ปกติ
    dn_hash              AS (CONVERT(BINARY(32), HASHBYTES('SHA2_256', distinguished_name))) PERSISTED,
    scope_label         NVARCHAR(150)   NOT NULL,
    object_types        VARCHAR(20)     NOT NULL CONSTRAINT DF_sos_types DEFAULT ('BOTH'),  -- USER / GROUP / BOTH
    include_subtree     BIT             NOT NULL CONSTRAINT DF_sos_subtree DEFAULT (1),
    ldap_filter         NVARCHAR(500)   NULL,       -- ตัวกรองเพิ่มเติม เช่น (!userAccountControl:1.2.840.113556.1.4.803:=2)
    is_enabled          BIT             NOT NULL CONSTRAINT DF_sos_enabled DEFAULT (1),
    notes               NVARCHAR(500)   NULL,
    CONSTRAINT PK_sync_ou_scopes PRIMARY KEY CLUSTERED (scope_id),
    CONSTRAINT UX_sync_ou_scopes UNIQUE (dn_hash),
    CONSTRAINT CK_sos_types CHECK (object_types IN ('USER','GROUP','BOTH'))
);
GO

/* ------------------------------------------------------------------------------------------
   5.3 งาน Sync ตามตารางเวลา
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.sync_jobs (
    job_id              INT             IDENTITY(1,1) NOT NULL,
    job_code            VARCHAR(40)     NOT NULL,
    job_name            NVARCHAR(150)   NOT NULL,
    job_type            VARCHAR(30)     NOT NULL,   -- AD_USERS / AD_GROUPS / AD_MEMBERSHIP / FSRM_QUOTA
    cron_expression     VARCHAR(100)    NOT NULL,
    timeout_seconds     INT             NOT NULL CONSTRAINT DF_sj_timeout DEFAULT (1800),
    stale_after_hours   INT             NOT NULL CONSTRAINT DF_sj_stale   DEFAULT (48),  -- เกินเท่านี้ถือว่าข้อมูลเก่า
    is_enabled          BIT             NOT NULL CONSTRAINT DF_sj_enabled DEFAULT (1),
    notes               NVARCHAR(500)   NULL,
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_sj_created DEFAULT (SYSDATETIMEOFFSET()),
    updated_at          DATETIMEOFFSET(3) NULL,
    updated_by          INT             NULL,
    CONSTRAINT PK_sync_jobs PRIMARY KEY CLUSTERED (job_id),
    CONSTRAINT UX_sync_jobs_code UNIQUE (job_code),
    CONSTRAINT FK_sj_updated_by FOREIGN KEY (updated_by) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_sj_type CHECK (job_type IN ('AD_USERS','AD_GROUPS','AD_MEMBERSHIP','FSRM_QUOTA')),
    CONSTRAINT CK_sj_timeout CHECK (timeout_seconds BETWEEN 30 AND 86400),
    CONSTRAINT CK_sj_stale   CHECK (stale_after_hours BETWEEN 1 AND 8760)
);
GO

/* ------------------------------------------------------------------------------------------
   5.4 ประวัติการรัน — เพิ่มอย่างเดียว ไม่เปิด System-Versioning เพราะเป็นประวัติอยู่แล้ว
   ------------------------------------------------------------------------------------------ */
CREATE TABLE dbo.sync_job_runs (
    run_id              BIGINT          IDENTITY(1,1) NOT NULL,
    job_id              INT             NOT NULL,
    agent_id            INT             NULL,
    started_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_sjr_started DEFAULT (SYSDATETIMEOFFSET()),
    finished_at         DATETIMEOFFSET(3) NULL,
    run_status          VARCHAR(15)     NOT NULL CONSTRAINT DF_sjr_status DEFAULT ('RUNNING'),
    records_read        INT             NOT NULL CONSTRAINT DF_sjr_read      DEFAULT (0),
    records_created     INT             NOT NULL CONSTRAINT DF_sjr_created   DEFAULT (0),
    records_updated     INT             NOT NULL CONSTRAINT DF_sjr_updated   DEFAULT (0),
    records_unchanged   INT             NOT NULL CONSTRAINT DF_sjr_unchanged DEFAULT (0),
    records_vanished    INT             NOT NULL CONSTRAINT DF_sjr_vanished  DEFAULT (0),
    records_failed      INT             NOT NULL CONSTRAINT DF_sjr_failed    DEFAULT (0),
    error_message       NVARCHAR(2000)  NULL,
    error_detail_json   NVARCHAR(MAX)   NULL,
    triggered_by        VARCHAR(15)     NOT NULL CONSTRAINT DF_sjr_trigger DEFAULT ('SCHEDULE'),
    triggered_by_user   INT             NULL,
    duration_seconds    AS (CASE WHEN finished_at IS NOT NULL
                                 THEN DATEDIFF(SECOND, started_at, finished_at)
                            END) PERSISTED,
    CONSTRAINT PK_sync_job_runs PRIMARY KEY CLUSTERED (run_id),
    CONSTRAINT FK_sjr_job     FOREIGN KEY (job_id)           REFERENCES dbo.sync_jobs(job_id),
    CONSTRAINT FK_sjr_agent   FOREIGN KEY (agent_id)         REFERENCES dbo.collector_agents(agent_id),
    CONSTRAINT FK_sjr_user    FOREIGN KEY (triggered_by_user) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_sjr_status  CHECK (run_status  IN ('RUNNING','SUCCESS','PARTIAL','FAILED','TIMEOUT')),
    CONSTRAINT CK_sjr_trigger CHECK (triggered_by IN ('SCHEDULE','MANUAL','STARTUP')),
    CONSTRAINT CK_sjr_json    CHECK (error_detail_json IS NULL OR ISJSON(error_detail_json) = 1),
    CONSTRAINT CK_sjr_finish  CHECK (finished_at IS NULL OR finished_at >= started_at)
);
GO

CREATE INDEX IX_sjr_job_time ON dbo.sync_job_runs(job_id, started_at DESC);
CREATE INDEX IX_sjr_status   ON dbo.sync_job_runs(run_status, started_at DESC);
GO

/* ข้อมูลตั้งต้นของงาน Sync — ปรับเวลาได้ผ่านหน้าจอผู้ดูแลระบบ */
INSERT INTO dbo.sync_jobs (job_code, job_name, job_type, cron_expression, stale_after_hours, notes) VALUES
    ('AD_USERS',      N'ดึงผู้ใช้จาก Active Directory',  'AD_USERS',      '0 2 * * *',  48, N'ทุกวันเวลา 02:00 ตามขอบเขต OU ที่กำหนด'),
    ('AD_GROUPS',     N'ดึงกลุ่มจาก Active Directory',   'AD_GROUPS',     '20 2 * * *', 48, N'ทุกวันเวลา 02:20 ต้องรันหลังงานดึงผู้ใช้'),
    ('AD_MEMBERSHIP', N'ดึงสมาชิกของกลุ่ม',              'AD_MEMBERSHIP', '40 2 * * *', 48, N'ทุกวันเวลา 02:40 ต้องรันหลังงานดึงกลุ่ม'),
    ('FSRM_QUOTA',    N'ดึง Quota และ Usage จาก FSRM',   'FSRM_QUOTA',    '0 3 * * *',  48, N'ทุกวันเวลา 03:00 เฉพาะโฟลเดอร์ที่ลงทะเบียนไว้');
GO

PRINT N'    [5/10] ตาราง Collector และงาน Sync เสร็จสิ้น';
GO


/* ==========================================================================================
   ส่วนที่ 6 : ขยายระบบบันทึกการตรวจสอบเดิม

   ระบบเดิมบันทึกเฉพาะตอนแก้ไขข้อมูล โมดูลนี้ต้องบันทึกตอน "เปิดดู" ชั้นความลับสูงด้วย
   เพราะหน้าจอที่บอกว่ากลุ่มไหนเข้าโฟลเดอร์ลับที่สุดได้ คือแผนที่สำหรับผู้บุกรุก
   ========================================================================================== */

ALTER TABLE dbo.audit_logs DROP CONSTRAINT CK_audit_action;
GO

ALTER TABLE dbo.audit_logs ADD CONSTRAINT CK_audit_action CHECK ([action] IN
    ('CREATE','UPDATE','DELETE','RESTORE','LOGIN','LOGOUT','LOGIN_FAILED',
     'IMPORT','EXPORT','REVEAL_KEY','PASSWORD_CHANGE','PASSWORD_RESET',
     'USER_LOCKED','SETTING_CHANGE','FILE_UPLOAD','FILE_DELETE',
     /* เพิ่มใหม่ใน v1.5 */
     'VIEW_SENSITIVE','SYNC_START','SYNC_FINISH','PERMISSION_REVIEW'));
GO

PRINT N'    [6/10] ขยายประเภทเหตุการณ์ใน audit_logs เสร็จสิ้น';
GO


/* ==========================================================================================
   ส่วนที่ 7 : Trigger ตรวจสอบความถูกต้อง
   ========================================================================================== */

/* ------------------------------------------------------------------------------------------
   7.1 โฟลเดอร์ต้องอยู่บนเครื่องที่เป็น File Server จริง

   เป็นชั้นสุดท้ายของการป้องกัน 3 ชั้น
       ชั้นที่ 1  Dropdown บนหน้าจอกรองให้เลือกได้เฉพาะ File Server
       ชั้นที่ 2  API ตรวจซ้ำก่อนบันทึก
       ชั้นที่ 3  Trigger นี้ — กันกรณีมีคนเขียนลงฐานข้อมูลโดยตรง
   ------------------------------------------------------------------------------------------ */
CREATE TRIGGER dbo.trg_file_shares_validate
ON dbo.file_shares
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM   inserted i
        JOIN   dbo.assets a ON a.asset_id = i.asset_id
        WHERE  i.is_deleted = 0
          AND (a.is_deleted = 1
               OR NOT EXISTS (
                      SELECT 1
                      FROM   dbo.server_role_assignments sra
                      JOIN   dbo.server_roles sr ON sr.server_role_id = sra.server_role_id
                      WHERE  sra.asset_id = i.asset_id
                        AND  sr.code      = 'FILE' )))
    BEGIN
        THROW 51050, 'เครื่องที่เลือกไม่ได้เป็น File Server หรือถูกลบไปแล้ว — โฟลเดอร์ต้องผูกกับเครื่องที่มีบทบาท File Server (code = FILE) เท่านั้น', 1;
    END
END;
GO

/* ------------------------------------------------------------------------------------------
   7.2 นโยบาย Internet ต้องผูกกับอุปกรณ์ที่ทำหน้าที่ Proxy ได้จริง

   ยอมรับได้ทั้งอุปกรณ์ Proxy โดยตรง และอุปกรณ์ความมั่นคงปลอดภัยที่ทำ Web Filtering ได้
   เช่น Firewall หรือ UTM ซึ่งในทางปฏิบัติมักทำหน้าที่นี้แทน Proxy แยกตัว
   ------------------------------------------------------------------------------------------ */
CREATE TRIGGER dbo.trg_internet_policies_validate
ON dbo.internet_policies
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM   inserted i
        JOIN   dbo.assets a ON a.asset_id = i.proxy_asset_id
        LEFT   JOIN dbo.asset_types t ON t.asset_type_id = a.asset_type_id
        WHERE  i.proxy_asset_id IS NOT NULL
          AND  i.is_deleted = 0
          AND (a.is_deleted = 1
               OR t.asset_type_id IS NULL
               OR t.code NOT IN ('NET_PROXY','NET_FIREWALL','NET_UTM','NET_WAF')))
    BEGIN
        THROW 51051, 'อุปกรณ์ที่เลือกไม่สามารถบังคับใช้นโยบาย Internet ได้ — ต้องเป็น Proxy, Firewall, UTM หรือ WAF เท่านั้น', 1;
    END
END;
GO

/* ------------------------------------------------------------------------------------------
   7.3 กันกลุ่มซ้อนกันเป็นวงกลม

   AD ป้องกันวงวนภายในโดเมนเดียวกันอยู่แล้ว แต่ข้ามโดเมนหรือข้อมูลที่ Sync ผิดพลาด
   อาจทำให้เกิด A -> B -> A ได้ ซึ่งจะทำให้ Recursive CTE ทำงานไม่จบ
   ------------------------------------------------------------------------------------------ */
CREATE TRIGGER dbo.trg_ad_group_members_no_cycle
ON dbo.ad_group_members
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM inserted WHERE member_group_id IS NOT NULL)
        RETURN;

    /* ใช้ตัวแปรตารางรับผลลัพธ์ เพราะ Trigger ต้องไม่คืนชุดข้อมูลกลับไปให้ผู้เรียก
       และ CTE ใช้ภายใน IF EXISTS โดยตรงไม่ได้ */
    DECLARE @cycles TABLE (origin_group_id INT);

    ;WITH walk AS (
        SELECT  i.ad_group_id     AS origin_group_id,
                i.member_group_id AS current_group_id,
                1                 AS depth
        FROM    inserted i
        WHERE   i.member_group_id IS NOT NULL

        UNION ALL

        SELECT  w.origin_group_id,
                m.member_group_id,
                w.depth + 1
        FROM    walk w
        JOIN    dbo.ad_group_members m ON m.ad_group_id = w.current_group_id
        WHERE   m.member_group_id IS NOT NULL
          AND   w.depth < 30
          AND   w.current_group_id <> w.origin_group_id
    )
    INSERT INTO @cycles (origin_group_id)
    SELECT DISTINCT origin_group_id FROM walk WHERE current_group_id = origin_group_id;

    IF EXISTS (SELECT 1 FROM @cycles)
        THROW 51052, 'พบการซ้อนกลุ่มเป็นวงกลมใน Active Directory — กลุ่มไม่สามารถเป็นสมาชิกของตัวเองทั้งทางตรงและทางอ้อมได้', 1;
END;
GO

PRINT N'    [7/10] Trigger ตรวจสอบความถูกต้อง เสร็จสิ้น';
GO


/* ==========================================================================================
   ส่วนที่ 8 : มุมมองข้อมูล (ยังไม่รวมมุมมองที่ต้องใช้ประวัติ)
   ========================================================================================== */

/* ------------------------------------------------------------------------------------------
   8.1 คลี่กลุ่มซ้อนกลุ่ม — เป็นฐานของมุมมองอื่นทั้งหมด

   ผลลัพธ์  root_group_id -> กลุ่มทั้งหมดที่อยู่ข้างในรวมถึงตัวมันเอง (depth = 0)

   การกันวงวนใช้ 2 ชั้น
       (1) เก็บเส้นทางที่เดินมาแล้วใน id_path และไม่เดินซ้ำ
       (2) จำกัดความลึกไม่เกิน 20 ชั้น ซึ่งลึกกว่าที่องค์กรทั่วไปใช้จริงมาก

   หมายเหตุ  ไม่สามารถใส่ OPTION (MAXRECURSION n) ภายใน View ได้
             ถ้าจำเป็นให้ใส่ที่คำสั่ง SELECT ที่เรียกใช้ View นี้
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_ad_group_expanded
AS
WITH tree AS (
    SELECT  g.ad_group_id AS root_group_id,
            g.ad_group_id AS nested_group_id,
            0             AS depth,
            CAST('|' + CAST(g.ad_group_id AS VARCHAR(20)) + '|' AS VARCHAR(4000)) AS id_path,
            CAST(g.sam_account_name AS NVARCHAR(4000)) AS name_path
    FROM    dbo.ad_groups g
    WHERE   g.is_present_in_ad = 1

    UNION ALL

    SELECT  p.root_group_id,
            m.member_group_id,
            p.depth + 1,
            CAST(p.id_path + CAST(m.member_group_id AS VARCHAR(20)) + '|' AS VARCHAR(4000)),
            CAST(p.name_path + N' > ' + g.sam_account_name AS NVARCHAR(4000))
    FROM    tree p
    JOIN    dbo.ad_group_members m ON m.ad_group_id     = p.nested_group_id
    JOIN    dbo.ad_groups        g ON g.ad_group_id     = m.member_group_id
    WHERE   m.member_group_id IS NOT NULL
      AND   g.is_present_in_ad = 1
      AND   p.depth < 20
      AND   p.id_path NOT LIKE '%|' + CAST(m.member_group_id AS VARCHAR(20)) + '|%'
)
SELECT root_group_id, nested_group_id, depth, id_path, name_path
FROM   tree;
GO

/* ------------------------------------------------------------------------------------------
   8.2 เส้นทางที่ผู้ใช้ได้รับสิทธิ์มา — ตอบคำถาม "ทำไมคนนี้ถึงเข้าได้"

   สำคัญที่ต้องแสดง access_path ด้วย ไม่ใช่แค่ผลลัพธ์ว่าเข้าได้หรือไม่
   เพราะคนที่ต้องไปถอนสิทธิ์ต้องรู้ว่าต้องไปถอนที่กลุ่มไหน
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_user_access_paths
AS
SELECT
    u.ad_user_id,
    u.sam_account_name,
    u.display_name              AS user_display_name,
    u.is_enabled,
    s.share_id,
    s.share_name,
    s.folder_path,
    c.code                      AS classification_code,
    c.name_th                   AS classification_name,
    c.sensitivity_rank,
    al.code                     AS access_level_code,
    al.name_th                  AS access_level_name,
    al.privilege_rank,
    granting.sam_account_name   AS granting_group_name,   -- กลุ่มที่ผูกไว้กับโฟลเดอร์
    member_of.sam_account_name  AS member_of_group_name,  -- กลุ่มที่ผู้ใช้เป็นสมาชิกโดยตรง
    e.depth                     AS nesting_depth,
    e.name_path                 AS access_path,
    CASE WHEN e.depth = 0 THEN N'สมาชิกโดยตรง'
         ELSE N'ผ่านกลุ่มซ้อน ' + CAST(e.depth AS NVARCHAR(3)) + N' ชั้น' END AS access_route
FROM        dbo.file_share_permissions p
JOIN        dbo.file_shares            s         ON s.share_id        = p.share_id       AND s.is_deleted = 0
JOIN        dbo.folder_classification_levels c   ON c.classification_id = s.classification_id
JOIN        dbo.access_levels          al        ON al.access_level_id = p.access_level_id
JOIN        dbo.ad_groups              granting  ON granting.ad_group_id = p.ad_group_id
JOIN        dbo.vw_ad_group_expanded   e         ON e.root_group_id    = p.ad_group_id
JOIN        dbo.ad_groups              member_of ON member_of.ad_group_id = e.nested_group_id
JOIN        dbo.ad_group_members       m         ON m.ad_group_id      = e.nested_group_id
                                                AND m.member_user_id IS NOT NULL
JOIN        dbo.ad_users               u         ON u.ad_user_id       = m.member_user_id
WHERE       p.is_deleted = 0
  AND       u.is_present_in_ad = 1;
GO

/* ------------------------------------------------------------------------------------------
   8.3 สิทธิ์สุทธิของผู้ใช้ต่อโฟลเดอร์ — เมื่อได้สิทธิ์มาหลายทาง ให้ถือระดับสูงสุด
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_user_effective_access
AS
SELECT
    ap.ad_user_id,
    ap.sam_account_name,
    ap.user_display_name,
    ap.is_enabled,
    ap.share_id,
    ap.share_name,
    ap.folder_path,
    ap.classification_code,
    ap.classification_name,
    ap.sensitivity_rank,
    MAX(ap.privilege_rank)  AS effective_privilege_rank,
    COUNT(*)                AS path_count,
    MIN(ap.nesting_depth)   AS shortest_depth
FROM   dbo.vw_user_access_paths ap
GROUP BY
    ap.ad_user_id, ap.sam_account_name, ap.user_display_name, ap.is_enabled,
    ap.share_id, ap.share_name, ap.folder_path,
    ap.classification_code, ap.classification_name, ap.sensitivity_rank;
GO

/* ------------------------------------------------------------------------------------------
   8.4 ทิศทางกลับ — โฟลเดอร์นี้ใครเข้าได้บ้าง
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_share_effective_users
AS
SELECT
    s.share_id,
    s.share_name,
    s.folder_path,
    c.name_th                                       AS classification_name,
    c.sensitivity_rank,
    d.name                                          AS owner_department,
    COUNT(DISTINCT ea.ad_user_id)                   AS total_users,
    SUM(CASE WHEN ea.effective_privilege_rank >= 20 THEN 1 ELSE 0 END) AS read_write_users,
    SUM(CASE WHEN ea.effective_privilege_rank <  20 THEN 1 ELSE 0 END) AS read_only_users,
    SUM(CASE WHEN ea.is_enabled = 0 THEN 1 ELSE 0 END)                 AS disabled_users
FROM        dbo.file_shares s
JOIN        dbo.folder_classification_levels c ON c.classification_id = s.classification_id
JOIN        dbo.departments d                  ON d.department_id     = s.owner_department_id
LEFT  JOIN  dbo.vw_user_effective_access ea    ON ea.share_id         = s.share_id
WHERE       s.is_deleted = 0
GROUP BY    s.share_id, s.share_name, s.folder_path, c.name_th, c.sensitivity_rank, d.name;
GO

/* ------------------------------------------------------------------------------------------
   8.5 สิทธิ์ Internet ของผู้ใช้
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_user_internet_policy
AS
SELECT
    u.ad_user_id,
    u.sam_account_name,
    u.display_name          AS user_display_name,
    u.is_enabled,
    pol.policy_id,
    pol.policy_code,
    pol.policy_name,
    proxy.name              AS enforced_by_device,
    granting.sam_account_name AS granting_group_name,
    e.depth                 AS nesting_depth,
    e.name_path             AS access_path
FROM        dbo.internet_policy_groups pg
JOIN        dbo.internet_policies      pol      ON pol.policy_id      = pg.policy_id AND pol.is_deleted = 0
JOIN        dbo.ad_groups              granting ON granting.ad_group_id = pg.ad_group_id
JOIN        dbo.vw_ad_group_expanded   e        ON e.root_group_id    = pg.ad_group_id
JOIN        dbo.ad_group_members       m        ON m.ad_group_id      = e.nested_group_id
                                               AND m.member_user_id IS NOT NULL
JOIN        dbo.ad_users               u        ON u.ad_user_id       = m.member_user_id
LEFT  JOIN  dbo.assets                 proxy    ON proxy.asset_id     = pol.proxy_asset_id
WHERE       pg.is_deleted = 0
  AND       u.is_present_in_ad = 1;
GO

/* ------------------------------------------------------------------------------------------
   8.6 ค่าการใช้พื้นที่ล่าสุดของแต่ละโฟลเดอร์

   ใช้ OUTER APPLY หยิบแถวล่าสุดแทนการเก็บค่าซ้ำไว้ในตารางหลัก
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_file_share_current_usage
AS
SELECT
    s.share_id,
    latest.measured_at,
    latest.quota_bytes,
    latest.used_bytes,
    latest.usage_percent,
    latest.quota_type,
    latest.file_count,
    latest.folder_count,
    CASE WHEN latest.measured_at IS NULL           THEN N'ยังไม่เคยวัด'
         WHEN latest.quota_bytes IS NULL           THEN N'ยังไม่ได้ตั้ง Quota'
         WHEN latest.usage_percent >= 100          THEN N'เต็มแล้ว'
         WHEN latest.usage_percent >= 90           THEN N'ใกล้เต็ม'
         WHEN latest.usage_percent >= 75           THEN N'ควรเฝ้าระวัง'
         ELSE N'ปกติ' END                          AS usage_status,
    prev.used_bytes                                AS previous_used_bytes,
    latest.used_bytes - prev.used_bytes            AS growth_bytes,
    DATEDIFF(DAY, prev.measured_at, latest.measured_at) AS growth_period_days
FROM        dbo.file_shares s
OUTER APPLY (SELECT TOP (1) *
             FROM   dbo.file_share_usage_snapshots x
             WHERE  x.share_id = s.share_id
             ORDER  BY x.measured_at DESC) latest
OUTER APPLY (SELECT TOP (1) *
             FROM   dbo.file_share_usage_snapshots y
             WHERE  y.share_id = s.share_id
               AND  y.measured_at < latest.measured_at
             ORDER  BY y.measured_at DESC) prev
WHERE       s.is_deleted = 0;
GO

/* ------------------------------------------------------------------------------------------
   8.7 รายการโฟลเดอร์สำหรับหน้าจอหลัก
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_file_share_list
AS
SELECT
    s.share_id,
    s.share_name,
    s.folder_path,
    s.business_purpose,
    a.asset_id,
    a.asset_tag,
    a.name                      AS server_name,
    c.classification_id,
    c.code                      AS classification_code,
    c.name_th                   AS classification_name,
    c.sensitivity_rank,
    c.color_token               AS classification_color,
    c.requires_view_audit,
    d.department_id,
    d.name                      AS owner_department,
    owner_u.full_name           AS owner_user_name,
    u.measured_at               AS usage_measured_at,
    u.quota_bytes,
    u.used_bytes,
    u.usage_percent,
    u.usage_status,
    perm.rw_group_count,
    perm.ro_group_count,
    perm.total_group_count,
    perm.orphan_group_count,
    s.last_reviewed_at,
    CASE WHEN s.last_reviewed_at IS NULL THEN NULL
         ELSE DATEDIFF(DAY, s.last_reviewed_at, CAST(SYSDATETIMEOFFSET() AS DATE)) END AS days_since_review,
    s.created_at,
    s.updated_at,
    s.updated_by
FROM        dbo.file_shares s
JOIN        dbo.assets a                        ON a.asset_id          = s.asset_id
JOIN        dbo.folder_classification_levels c  ON c.classification_id = s.classification_id
JOIN        dbo.departments d                   ON d.department_id     = s.owner_department_id
LEFT  JOIN  dbo.users owner_u                   ON owner_u.user_id     = s.owner_user_id
LEFT  JOIN  dbo.vw_file_share_current_usage u   ON u.share_id          = s.share_id
OUTER APPLY (
    SELECT
        SUM(CASE WHEN al.can_write = 1 THEN 1 ELSE 0 END)          AS rw_group_count,
        SUM(CASE WHEN al.can_write = 0 THEN 1 ELSE 0 END)          AS ro_group_count,
        COUNT(*)                                                    AS total_group_count,
        SUM(CASE WHEN p.ad_group_id IS NULL
                   OR g.is_present_in_ad = 0 THEN 1 ELSE 0 END)     AS orphan_group_count
    FROM   dbo.file_share_permissions p
    JOIN   dbo.access_levels al ON al.access_level_id = p.access_level_id
    LEFT   JOIN dbo.ad_groups g ON g.ad_group_id      = p.ad_group_id
    WHERE  p.share_id = s.share_id AND p.is_deleted = 0
) perm
WHERE       s.is_deleted = 0;
GO

/* ------------------------------------------------------------------------------------------
   8.8 สรุปรายแผนก และรายชั้นความลับ (สำหรับ Dashboard)
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_department_folder_summary
AS
SELECT
    d.department_id,
    d.name                                  AS department_name,
    COUNT(s.share_id)                       AS folder_count,
    COUNT(DISTINCT s.asset_id)              AS server_count,
    SUM(ISNULL(u.used_bytes, 0))            AS total_used_bytes,
    SUM(ISNULL(u.quota_bytes, 0))           AS total_quota_bytes,
    SUM(CASE WHEN c.sensitivity_rank <= 3 THEN 1 ELSE 0 END) AS confidential_or_above,
    SUM(CASE WHEN u.usage_percent >= 90   THEN 1 ELSE 0 END) AS near_full_count,
    MIN(s.last_reviewed_at)                 AS oldest_review_date
FROM        dbo.departments d
LEFT  JOIN  dbo.file_shares s                   ON s.owner_department_id = d.department_id AND s.is_deleted = 0
LEFT  JOIN  dbo.folder_classification_levels c  ON c.classification_id   = s.classification_id
LEFT  JOIN  dbo.vw_file_share_current_usage u   ON u.share_id            = s.share_id
GROUP BY    d.department_id, d.name;
GO

CREATE VIEW dbo.vw_classification_summary
AS
SELECT
    c.classification_id,
    c.code                          AS classification_code,
    c.name_th                       AS classification_name,
    c.sensitivity_rank,
    c.color_token,
    COUNT(s.share_id)               AS folder_count,
    COUNT(DISTINCT s.owner_department_id) AS department_count,
    SUM(ISNULL(u.used_bytes, 0))    AS total_used_bytes
FROM        dbo.folder_classification_levels c
LEFT  JOIN  dbo.file_shares s                  ON s.classification_id = c.classification_id AND s.is_deleted = 0
LEFT  JOIN  dbo.vw_file_share_current_usage u  ON u.share_id          = s.share_id
WHERE       c.is_active = 1
GROUP BY    c.classification_id, c.code, c.name_th, c.sensitivity_rank, c.color_token;
GO

/* ------------------------------------------------------------------------------------------
   8.9 สถานะความสดของข้อมูล

   ทุกหน้าจอที่แสดงข้อมูลจาก AD หรือ FSRM ต้องอ่านมุมมองนี้เพื่อแสดงป้าย "ข้อมูล ณ วันเวลา"
   ถ้า Sync ล้มเหลวแล้วไม่มีใครรู้ หน้าจอจะแสดงข้อมูลเก่าเหมือนข้อมูลใหม่
   แล้วมีคนตัดสินใจเรื่องสิทธิ์จากข้อมูลนั้น
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_sync_health
AS
SELECT
    j.job_id,
    j.job_code,
    j.job_name,
    j.job_type,
    j.cron_expression,
    j.is_enabled,
    j.stale_after_hours,
    last_ok.started_at      AS last_success_at,
    last_any.started_at     AS last_attempt_at,
    last_any.run_status     AS last_run_status,
    last_any.error_message  AS last_error_message,
    last_any.records_created,
    last_any.records_updated,
    last_any.records_unchanged,
    last_any.records_vanished,
    last_any.duration_seconds,
    DATEDIFF(HOUR, last_ok.started_at, SYSDATETIMEOFFSET()) AS hours_since_success,
    CASE WHEN j.is_enabled = 0                               THEN N'ปิดใช้งาน'
         WHEN last_ok.started_at IS NULL                     THEN N'ยังไม่เคยสำเร็จ'
         WHEN DATEDIFF(HOUR, last_ok.started_at, SYSDATETIMEOFFSET()) > j.stale_after_hours * 2 THEN N'ข้อมูลเก่ามาก'
         WHEN DATEDIFF(HOUR, last_ok.started_at, SYSDATETIMEOFFSET()) > j.stale_after_hours     THEN N'ข้อมูลเริ่มเก่า'
         ELSE N'ปกติ' END                                     AS freshness_status,
    fail.consecutive_failures
FROM        dbo.sync_jobs j
OUTER APPLY (SELECT TOP (1) * FROM dbo.sync_job_runs r
             WHERE r.job_id = j.job_id AND r.run_status = 'SUCCESS'
             ORDER BY r.started_at DESC) last_ok
OUTER APPLY (SELECT TOP (1) * FROM dbo.sync_job_runs r
             WHERE r.job_id = j.job_id
             ORDER BY r.started_at DESC) last_any
OUTER APPLY (SELECT COUNT(*) AS consecutive_failures
             FROM   dbo.sync_job_runs r
             WHERE  r.job_id = j.job_id
               AND  r.run_status IN ('FAILED','TIMEOUT')
               AND  r.started_at > ISNULL(last_ok.started_at, '1900-01-01')) fail;
GO

/* ------------------------------------------------------------------------------------------
   8.10 รายการความผิดปกติ — ตรวจได้โดยไม่ต้องแตะ File Server เลย
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_permission_issues
AS
/* 1. กลุ่มที่ผูกไว้หายจาก AD แล้ว */
SELECT  'ORPHAN_GROUP'      AS issue_code,
        'HIGH'              AS severity,
        s.share_id, s.share_name, s.folder_path, c.sensitivity_rank,
        p.ad_group_name_raw AS subject,
        N'กลุ่มที่ผูกไว้หายไปจาก Active Directory แล้ว — สิทธิ์ที่บันทึกไว้ไม่มีผลจริง' AS issue_detail
FROM    dbo.file_share_permissions p
JOIN    dbo.file_shares s                      ON s.share_id = p.share_id AND s.is_deleted = 0
JOIN    dbo.folder_classification_levels c     ON c.classification_id = s.classification_id
LEFT    JOIN dbo.ad_groups g                   ON g.ad_group_id = p.ad_group_id
WHERE   p.is_deleted = 0
  AND  (p.ad_group_id IS NULL OR g.is_present_in_ad = 0)

UNION ALL

/* 2. กลุ่มว่างเปล่าแต่ผูกกับโฟลเดอร์ชั้นความลับสูง */
SELECT  'EMPTY_GROUP_ON_SENSITIVE', 'HIGH',
        s.share_id, s.share_name, s.folder_path, c.sensitivity_rank,
        g.sam_account_name,
        N'กลุ่มนี้ไม่มีสมาชิกเลย แต่ยังผูกกับโฟลเดอร์ชั้นความลับสูง — เป็นกลุ่มร้างที่รอคนเผลอใส่สมาชิก'
FROM    dbo.file_share_permissions p
JOIN    dbo.file_shares s                  ON s.share_id = p.share_id AND s.is_deleted = 0
JOIN    dbo.folder_classification_levels c ON c.classification_id = s.classification_id
JOIN    dbo.ad_groups g                    ON g.ad_group_id = p.ad_group_id AND g.is_present_in_ad = 1
WHERE   p.is_deleted = 0
  AND   c.sensitivity_rank <= 3
  AND   NOT EXISTS (SELECT 1 FROM dbo.vw_ad_group_expanded e
                    JOIN dbo.ad_group_members m ON m.ad_group_id = e.nested_group_id
                    WHERE e.root_group_id = g.ad_group_id AND m.member_user_id IS NOT NULL)

UNION ALL

/* 3. บัญชีที่ถูกปิดใช้งานแล้วแต่ยังมีสิทธิ์ */
SELECT  'DISABLED_USER_HAS_ACCESS', 'HIGH',
        ea.share_id, ea.share_name, ea.folder_path, ea.sensitivity_rank,
        ea.sam_account_name,
        N'บัญชีนี้ถูกปิดใช้งานใน AD แล้ว แต่ยังอยู่ในกลุ่มที่มีสิทธิ์เข้าโฟลเดอร์'
FROM    dbo.vw_user_effective_access ea
WHERE   ea.is_enabled = 0

UNION ALL

/* 4. โฟลเดอร์ลับที่ไม่ได้ทบทวนสิทธิ์เกิน 1 ปี */
SELECT  'REVIEW_OVERDUE', 'MEDIUM',
        s.share_id, s.share_name, s.folder_path, c.sensitivity_rank,
        CAST(ISNULL(CONVERT(NVARCHAR(10), s.last_reviewed_at, 23), N'ไม่เคย') AS NVARCHAR(256)),
        N'โฟลเดอร์ชั้นความลับสูงที่ไม่ได้ทบทวนสิทธิ์มานานเกิน 12 เดือน'
FROM    dbo.file_shares s
JOIN    dbo.folder_classification_levels c ON c.classification_id = s.classification_id
WHERE   s.is_deleted = 0
  AND   c.sensitivity_rank <= 3
  AND  (s.last_reviewed_at IS NULL OR s.last_reviewed_at < DATEADD(MONTH, -12, CAST(SYSDATETIMEOFFSET() AS DATE)))

UNION ALL

/* 5. โฟลเดอร์ใกล้เต็ม */
SELECT  'QUOTA_NEAR_FULL', 'MEDIUM',
        s.share_id, s.share_name, s.folder_path, c.sensitivity_rank,
        CAST(CAST(u.usage_percent AS NVARCHAR(20)) + N'%' AS NVARCHAR(256)),
        N'ใช้พื้นที่เกิน 90% ของ Quota ที่กำหนดไว้'
FROM    dbo.file_shares s
JOIN    dbo.folder_classification_levels c ON c.classification_id = s.classification_id
JOIN    dbo.vw_file_share_current_usage u  ON u.share_id = s.share_id
WHERE   s.is_deleted = 0 AND u.usage_percent >= 90

UNION ALL

/* 6. โฟลเดอร์ที่ไม่มีสิทธิ์ผูกไว้เลย */
SELECT  'NO_PERMISSION_DEFINED', 'MEDIUM',
        s.share_id, s.share_name, s.folder_path, c.sensitivity_rank,
        CAST(N'-' AS NVARCHAR(256)),
        N'ลงทะเบียนโฟลเดอร์ไว้แต่ยังไม่ได้บันทึกว่ากลุ่มใดมีสิทธิ์เข้าถึง'
FROM    dbo.file_shares s
JOIN    dbo.folder_classification_levels c ON c.classification_id = s.classification_id
WHERE   s.is_deleted = 0
  AND   NOT EXISTS (SELECT 1 FROM dbo.file_share_permissions p
                    WHERE p.share_id = s.share_id AND p.is_deleted = 0);
GO

PRINT N'    [8/10] มุมมองข้อมูล เสร็จสิ้น';
GO


/* ==========================================================================================
   ส่วนที่ 9 : เปิดระบบบันทึกประวัติ (System-Versioned Temporal Tables)
   ------------------------------------------------------------------------------------------
   ⚠️ คำเตือนที่สำคัญที่สุดของโมดูลนี้

   Temporal Tables บันทึกว่า "เปลี่ยนเมื่อไร" และ "ค่าเดิมคืออะไร" แต่ไม่บันทึกว่า "ใครเปลี่ยน"
   ความสามารถที่ขอไว้ — ดูย้อนหลังได้ว่าใครเพิ่ม ลบ หรือแก้ไขสิทธิ์ — ขึ้นอยู่กับ
   การที่ชั้น API เขียนค่า updated_by ทุกครั้งที่บันทึก ถ้าพลาดแม้แต่จุดเดียว
   ประวัติจะมีเวลาแต่ไม่มีชื่อคน และจะรู้ตัวก็ต่อเมื่อผู้ตรวจสอบถามหา

   ต้องบังคับที่ Middleware ไม่ใช่ฝากความหวังไว้กับวินัยของผู้เขียนโค้ดแต่ละคน
   (ตัวอย่าง Prisma $extends และ EF Core SaveChangesInterceptor อยู่ในไฟล์ 12 ส่วนที่ 8)

   ⚠️ คำเตือนข้อที่สอง — งาน Sync ต้องเทียบค่าก่อนเขียน

   SQL Server เขียนประวัติทุกครั้งที่มีคำสั่ง UPDATE โดนแถวนั้น แม้ค่าใหม่จะเท่าเดิมทุกช่อง
   ถ้า Sync เขียนทับทุกแถวทุกวัน ผู้ใช้ 5,000 คนจะสร้างประวัติขยะปีละเกือบ 2 ล้านแถว
   และประวัติที่มีค่าจริงจะจมหายไปในนั้น

   รูปแบบที่ต้องใช้ (EXCEPT จัดการค่า NULL ได้ถูกต้อง ต่างจากการเทียบด้วย <>)

       MERGE dbo.ad_users AS tgt
       USING @incoming   AS src ON tgt.object_guid = src.object_guid
       WHEN MATCHED AND EXISTS (
               SELECT src.display_name, src.email, src.is_enabled
               EXCEPT
               SELECT tgt.display_name, tgt.email, tgt.is_enabled )
           THEN UPDATE SET ...
       WHEN NOT MATCHED BY TARGET THEN INSERT ...;

   ========================================================================================== */

/* ตรวจสอบก่อนว่าไม่มีตารางใดเปิด System-Versioning ค้างอยู่ */
IF EXISTS (SELECT 1 FROM sys.tables
           WHERE name IN ('file_shares','file_share_permissions','ad_users','ad_groups',
                          'ad_group_members','internet_policies','internet_policy_groups')
             AND temporal_type <> 0)
    THROW 51098, 'พบตารางที่เปิด System-Versioning ไว้แล้ว — กรุณาตรวจสอบว่าไฟล์นี้ถูกรันซ้ำหรือไม่', 1;
GO

DECLARE @t SYSNAME, @sql NVARCHAR(MAX);

DECLARE temporal_cur CURSOR LOCAL FAST_FORWARD FOR
    SELECT v.table_name FROM (VALUES
        ('folder_classification_levels'),
        ('access_levels'),
        ('classification_role_visibility'),
        ('web_categories'),
        ('ad_users'),
        ('ad_groups'),
        ('ad_group_members'),
        ('file_shares'),
        ('file_share_permissions'),
        ('internet_policies'),
        ('internet_policy_groups'),
        ('internet_policy_categories'),
        ('sync_ou_scopes'),
        ('sync_jobs')
        /* ไม่ใส่ collector_agents โดยเจตนา
           ตารางนี้มีช่อง last_heartbeat_at ที่ถูกเขียนทับทุก 5 นาที
           ถ้าเปิดระบบบันทึกประวัติจะได้ประวัติวันละเกือบ 300 แถวต่อ Agent
           ซึ่งเป็นปัญหาเดียวกับที่อธิบายไว้ในคำเตือนด้านบน
           การเปลี่ยนแปลงการตั้งค่าของ Agent ถูกบันทึกไว้ใน audit_logs อยู่แล้ว */
    ) AS v(table_name);

OPEN temporal_cur;
FETCH NEXT FROM temporal_cur INTO @t;

WHILE @@FETCH_STATUS = 0
BEGIN
    /* ย้อน valid_from กลับ 2 วินาทีจาก SYSUTCDATETIME() โดยเจตนา เหมือนที่แก้ไว้ในไฟล์ 12
       ไม่งั้นเจอ Msg 13542 "start of period set to a value in the future" เพราะ Loop นี้รัน
       ALTER TABLE ติดกันหลายสิบตาราง (พบจากการรันจริง ไม่ใช่จากเอกสาร) */
    SET @sql = N'
        ALTER TABLE dbo.' + QUOTENAME(@t) + N' ADD
            valid_from DATETIME2(3) GENERATED ALWAYS AS ROW START HIDDEN NOT NULL
                CONSTRAINT ' + QUOTENAME('DF_' + @t + '_validfrom') + N' DEFAULT (DATEADD(SECOND, -2, SYSUTCDATETIME())),
            valid_to   DATETIME2(3) GENERATED ALWAYS AS ROW END   HIDDEN NOT NULL
                CONSTRAINT ' + QUOTENAME('DF_' + @t + '_validto')   + N' DEFAULT (CONVERT(DATETIME2(3), ''9999-12-31 23:59:59.999'')),
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to);';
    EXEC sp_executesql @sql;

    SET @sql = N'
        ALTER TABLE dbo.' + QUOTENAME(@t) + N' SET (SYSTEM_VERSIONING = ON (
            HISTORY_TABLE = dbo.' + QUOTENAME(@t + '_history') + N',
            DATA_CONSISTENCY_CHECK = ON ));';
    EXEC sp_executesql @sql;

    PRINT N'        เปิดระบบบันทึกประวัติให้ dbo.' + @t;
    FETCH NEXT FROM temporal_cur INTO @t;
END

CLOSE temporal_cur;
DEALLOCATE temporal_cur;
GO

/* ------------------------------------------------------------------------------------------
   นโยบายการเก็บประวัติ

   SQL Server รองรับการตัดประวัติแบบ "ตามเวลา" เท่านั้น ไม่มีแบบ "ตามจำนวน version"
   การจำกัดให้เหลือ 3 version จริง ๆ ในฐานข้อมูลจะต้องปิด System-Versioning ชั่วคราว
   ซึ่งเสี่ยงต่อการสูญเสียประวัติ และเปิดช่องให้ลบร่องรอยได้ด้วยการแก้ข้อมูลซ้ำ 3 ครั้ง

   จึงเลือกแนวทาง
       ฐานข้อมูล  เก็บ 2 ปี แล้วให้ SQL Server ตัดเองอัตโนมัติ
       หน้าจอ     แสดง 3 version ล่าสุด พร้อมปุ่มดูทั้งหมด (ดูมุมมองในส่วนที่ 10)

   ⚠️ ต้องเปิดที่ระดับฐานข้อมูลด้วย ไม่งั้นงานตัดข้อมูลจะไม่ทำงานเลยและตารางจะโตเรื่อย ๆ
   ------------------------------------------------------------------------------------------ */

-- EXEC(<string>) (Execute String รูปแบบไม่มี sp_executesql) รับเฉพาะการต่อ String
-- Literal/ตัวแปรเท่านั้น ใส่ Function Call อย่าง QUOTENAME() ตรงๆ ในวงเล็บไม่ได้
-- (Msg 102 Incorrect syntax — พบจากการรันจริง) ต้องประกอบเป็นตัวแปรก่อนเหมือนจุดอื่นในไฟล์นี้
DECLARE @db SYSNAME = DB_NAME();
DECLARE @dbsql NVARCHAR(MAX) = N'ALTER DATABASE ' + QUOTENAME(@db) + N' SET TEMPORAL_HISTORY_RETENTION ON;';
EXEC sp_executesql @dbsql;
GO

DECLARE @t2 SYSNAME, @sql2 NVARCHAR(MAX);

DECLARE retention_cur CURSOR LOCAL FAST_FORWARD FOR
    SELECT v.table_name FROM (VALUES
        ('ad_users'), ('ad_groups'), ('ad_group_members'),
        ('file_shares'), ('file_share_permissions'),
        ('internet_policies'), ('internet_policy_groups')
    ) AS v(table_name);

OPEN retention_cur;
FETCH NEXT FROM retention_cur INTO @t2;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql2 = N'
        ALTER TABLE dbo.' + QUOTENAME(@t2) + N' SET (SYSTEM_VERSIONING = ON (
            HISTORY_TABLE = dbo.' + QUOTENAME(@t2 + '_history') + N',
            HISTORY_RETENTION_PERIOD = 2 YEARS ));';
    EXEC sp_executesql @sql2;
    FETCH NEXT FROM retention_cur INTO @t2;
END

CLOSE retention_cur;
DEALLOCATE retention_cur;
GO

PRINT N'    [9/10] เปิดระบบบันทึกประวัติ เสร็จสิ้น';
GO


/* ==========================================================================================
   ส่วนที่ 10 : มุมมองประวัติการเปลี่ยนแปลงสิทธิ์
   ------------------------------------------------------------------------------------------
   ส่วนนี้ต้องอยู่หลังการเปิด System-Versioning เพราะใช้ประโยค FOR SYSTEM_TIME
   ซึ่งใช้ได้เฉพาะกับตารางที่เปิดระบบบันทึกประวัติแล้วเท่านั้น
   ========================================================================================== */

/* ------------------------------------------------------------------------------------------
   10.1 ประวัติการเปลี่ยนแปลงสิทธิ์ทั้งหมด พร้อมชื่อผู้แก้ไข

   การอ่านค่า
       valid_from  คือเวลาที่แถวเข้าสู่สถานะนั้น
       updated_by  คือคนที่ทำให้แถวเข้าสู่สถานะนั้น
   อ่านรวมกันได้ว่า "เมื่อ valid_from คุณ updated_by ตั้งค่าเป็น ..."

   version_no นับจากใหม่ไปเก่า  1 = สถานะปัจจุบัน
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_permission_change_history
AS
WITH versions AS (
    SELECT
        p.permission_id,
        p.share_id,
        p.ad_group_id,
        p.ad_group_name_raw,
        p.access_level_id,
        p.granted_reason,
        p.is_deleted,
        p.created_by,
        p.updated_by,
        p.valid_from,
        p.valid_to,
        ROW_NUMBER() OVER (PARTITION BY p.permission_id ORDER BY p.valid_from DESC) AS version_no,
        ROW_NUMBER() OVER (PARTITION BY p.permission_id ORDER BY p.valid_from ASC)  AS version_seq,
        LAG(p.access_level_id) OVER (PARTITION BY p.permission_id ORDER BY p.valid_from) AS prev_access_level_id,
        LAG(p.is_deleted)      OVER (PARTITION BY p.permission_id ORDER BY p.valid_from) AS prev_is_deleted,
        LAG(p.ad_group_id)     OVER (PARTITION BY p.permission_id ORDER BY p.valid_from) AS prev_ad_group_id
    FROM dbo.file_share_permissions FOR SYSTEM_TIME ALL AS p
)
SELECT
    v.permission_id,
    v.version_no,
    v.version_seq,
    s.share_id,
    s.share_name,
    s.folder_path,
    c.name_th                   AS classification_name,
    c.sensitivity_rank,
    v.ad_group_name_raw         AS ad_group_name,
    al.code                     AS access_level_code,
    al.name_th                  AS access_level_name,
    prev_al.name_th             AS previous_access_level_name,
    v.is_deleted,
    v.granted_reason,
    /* ประเภทการเปลี่ยนแปลง */
    CASE WHEN v.version_seq = 1                                   THEN 'GRANT'
         WHEN v.prev_is_deleted = 0 AND v.is_deleted = 1           THEN 'REVOKE'
         WHEN v.prev_is_deleted = 1 AND v.is_deleted = 0           THEN 'RESTORE'
         WHEN v.prev_access_level_id <> v.access_level_id          THEN 'CHANGE_LEVEL'
         WHEN ISNULL(v.prev_ad_group_id, -1) <> ISNULL(v.ad_group_id, -1) THEN 'CHANGE_GROUP'
         ELSE 'UPDATE' END      AS change_action,
    CASE WHEN v.version_seq = 1                                   THEN N'เพิ่มสิทธิ์'
         WHEN v.prev_is_deleted = 0 AND v.is_deleted = 1           THEN N'ลบสิทธิ์'
         WHEN v.prev_is_deleted = 1 AND v.is_deleted = 0           THEN N'กู้คืนสิทธิ์'
         WHEN v.prev_access_level_id <> v.access_level_id          THEN N'เปลี่ยนระดับสิทธิ์'
         WHEN ISNULL(v.prev_ad_group_id, -1) <> ISNULL(v.ad_group_id, -1) THEN N'เปลี่ยนกลุ่ม'
         ELSE N'แก้ไขข้อมูล' END AS change_action_th,
    /* ใครเป็นคนทำ — สำหรับ version แรกใช้ created_by */
    COALESCE(v.updated_by, v.created_by)        AS changed_by_user_id,
    changer.username                            AS changed_by_username,
    changer.full_name                           AS changed_by_name,
    v.valid_from                                AS changed_at_utc,
    v.valid_to                                  AS superseded_at_utc,
    CASE WHEN v.version_no = 1 THEN 1 ELSE 0 END AS is_current
FROM        versions v
JOIN        dbo.file_shares s                  ON s.share_id          = v.share_id
JOIN        dbo.folder_classification_levels c ON c.classification_id = s.classification_id
JOIN        dbo.access_levels al               ON al.access_level_id  = v.access_level_id
LEFT  JOIN  dbo.access_levels prev_al          ON prev_al.access_level_id = v.prev_access_level_id
LEFT  JOIN  dbo.users changer                  ON changer.user_id     = COALESCE(v.updated_by, v.created_by);
GO

/* ------------------------------------------------------------------------------------------
   10.2 ประวัติ 3 version ล่าสุด — ใช้เป็นค่าตั้งต้นของหน้าจอ

   หน้าจอแสดงมุมมองนี้ก่อน แล้วมีปุ่ม "ดูทั้งหมด" ที่เปลี่ยนไปอ่าน
   vw_permission_change_history ซึ่งไม่จำกัดจำนวน
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_permission_recent_versions
AS
SELECT *
FROM   dbo.vw_permission_change_history
WHERE  version_no <= 3;
GO

/* ------------------------------------------------------------------------------------------
   10.3 ไทม์ไลน์การเปลี่ยนสิทธิ์รายโฟลเดอร์

   ต่างจาก 10.1 ตรงที่รวมการเปลี่ยนแปลงของทุกสิทธิ์ในโฟลเดอร์เดียวกันมาเรียงตามเวลา
   ตอบคำถาม "โฟลเดอร์นี้ถูกแก้สิทธิ์ 3 ครั้งล่าสุดโดยใคร เมื่อไร"
   ซึ่งเป็นคำถามที่ผู้ตรวจสอบถามจริง ต่างจากการดูประวัติของสิทธิ์รายการเดียว
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_share_permission_timeline
AS
SELECT
    h.share_id,
    h.share_name,
    h.folder_path,
    h.classification_name,
    h.sensitivity_rank,
    h.permission_id,
    h.ad_group_name,
    h.change_action,
    h.change_action_th,
    h.access_level_name,
    h.previous_access_level_name,
    h.changed_by_user_id,
    h.changed_by_username,
    h.changed_by_name,
    h.changed_at_utc,
    ROW_NUMBER() OVER (PARTITION BY h.share_id ORDER BY h.changed_at_utc DESC) AS change_seq
FROM   dbo.vw_permission_change_history h;
GO

/* ------------------------------------------------------------------------------------------
   10.4 ประวัติการเปลี่ยนแปลงข้อมูลโฟลเดอร์
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_file_share_change_history
AS
WITH versions AS (
    SELECT
        s.share_id, s.share_name, s.folder_path,
        s.classification_id, s.owner_department_id, s.owner_user_id,
        s.business_purpose, s.is_deleted,
        s.created_by, s.updated_by, s.valid_from, s.valid_to,
        ROW_NUMBER() OVER (PARTITION BY s.share_id ORDER BY s.valid_from DESC) AS version_no,
        ROW_NUMBER() OVER (PARTITION BY s.share_id ORDER BY s.valid_from ASC)  AS version_seq,
        LAG(s.classification_id)   OVER (PARTITION BY s.share_id ORDER BY s.valid_from) AS prev_classification_id,
        LAG(s.owner_department_id) OVER (PARTITION BY s.share_id ORDER BY s.valid_from) AS prev_department_id
    FROM dbo.file_shares FOR SYSTEM_TIME ALL AS s
)
SELECT
    v.share_id, v.version_no, v.version_seq,
    v.share_name, v.folder_path,
    c.name_th           AS classification_name,
    prev_c.name_th      AS previous_classification_name,
    d.name              AS owner_department,
    prev_d.name         AS previous_owner_department,
    v.business_purpose,
    v.is_deleted,
    CASE WHEN v.version_seq = 1                                       THEN N'สร้างใหม่'
         WHEN v.is_deleted = 1                                        THEN N'ลบ'
         WHEN v.prev_classification_id <> v.classification_id         THEN N'เปลี่ยนชั้นความลับ'
         WHEN v.prev_department_id     <> v.owner_department_id       THEN N'เปลี่ยนแผนกเจ้าของ'
         ELSE N'แก้ไขข้อมูล' END AS change_action_th,
    COALESCE(v.updated_by, v.created_by) AS changed_by_user_id,
    changer.username                     AS changed_by_username,
    changer.full_name                    AS changed_by_name,
    v.valid_from                         AS changed_at_utc,
    v.valid_to                           AS superseded_at_utc
FROM        versions v
JOIN        dbo.folder_classification_levels c      ON c.classification_id      = v.classification_id
LEFT  JOIN  dbo.folder_classification_levels prev_c ON prev_c.classification_id = v.prev_classification_id
JOIN        dbo.departments d                       ON d.department_id          = v.owner_department_id
LEFT  JOIN  dbo.departments prev_d                  ON prev_d.department_id     = v.prev_department_id
LEFT  JOIN  dbo.users changer                       ON changer.user_id          = COALESCE(v.updated_by, v.created_by);
GO

/* ------------------------------------------------------------------------------------------
   10.5 ตรวจจับการแก้ไขที่ไม่ผ่านระบบ

   Temporal Tables ทำงานที่ระดับฐานข้อมูล เลี่ยงไม่ได้ แม้จะเขียน SQL เข้าไปตรง ๆ
   ส่วน audit_logs ถูกเขียนโดยชั้นแอปพลิเคชัน จึงข้ามได้ถ้ามีคนแก้ฐานข้อมูลโดยตรง

   เมื่อพบว่ามีการเปลี่ยนแปลงใน Temporal แต่ไม่มีบันทึกคู่กันใน audit_logs
   แปลว่ามีคนแก้ฐานข้อมูลโดยไม่ผ่านระบบ ซึ่งต้องตรวจสอบทันที
   ------------------------------------------------------------------------------------------ */
CREATE VIEW dbo.vw_untracked_permission_changes
AS
SELECT
    h.permission_id,
    h.share_id,
    h.share_name,
    h.folder_path,
    h.classification_name,
    h.sensitivity_rank,
    h.ad_group_name,
    h.change_action,
    h.change_action_th,
    h.changed_at_utc,
    h.changed_by_user_id,
    h.changed_by_name,
    N'พบการเปลี่ยนแปลงในประวัติของฐานข้อมูล แต่ไม่มีบันทึกคู่กันใน audit_logs — อาจมีการแก้ไขฐานข้อมูลโดยไม่ผ่านระบบ' AS issue_detail
FROM   dbo.vw_permission_change_history h
WHERE  h.version_seq > 1
  AND  NOT EXISTS (
        SELECT 1
        FROM   dbo.audit_logs a
        WHERE  a.entity_type = 'file_share_permissions'
          AND  a.entity_id   = h.permission_id
          AND  CAST(a.occurred_at AT TIME ZONE 'UTC' AS DATETIME2(3))
                    BETWEEN DATEADD(SECOND, -10, h.changed_at_utc)
                        AND DATEADD(SECOND,  10, h.changed_at_utc) );
GO

PRINT N'    [10/10] มุมมองประวัติการเปลี่ยนแปลง เสร็จสิ้น';
GO


/* ==========================================================================================
   ส่วนที่ 11 : สิทธิ์การเข้าถึงระดับฐานข้อมูล
   ========================================================================================== */

IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'app_user' AND type IN ('S','U','G'))
BEGIN
    GRANT SELECT, INSERT, UPDATE ON dbo.file_shares                  TO app_user;
    GRANT SELECT, INSERT, UPDATE ON dbo.file_share_permissions       TO app_user;
    GRANT SELECT, INSERT         ON dbo.file_share_usage_snapshots   TO app_user;
    GRANT SELECT, INSERT, UPDATE ON dbo.ad_users                     TO app_user;
    GRANT SELECT, INSERT, UPDATE ON dbo.ad_groups                    TO app_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.ad_group_members     TO app_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.ad_object_sync_state TO app_user;
    GRANT SELECT, INSERT, UPDATE ON dbo.internet_policies            TO app_user;
    GRANT SELECT, INSERT, UPDATE ON dbo.internet_policy_groups       TO app_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.internet_policy_categories TO app_user;
    GRANT SELECT, INSERT, UPDATE ON dbo.sync_jobs                    TO app_user;
    GRANT SELECT, INSERT, UPDATE ON dbo.sync_job_runs                TO app_user;
    GRANT SELECT, INSERT, UPDATE ON dbo.sync_ou_scopes               TO app_user;
    GRANT SELECT, INSERT, UPDATE ON dbo.collector_agents             TO app_user;
    GRANT SELECT ON dbo.folder_classification_levels   TO app_user;
    GRANT SELECT ON dbo.access_levels                  TO app_user;
    GRANT SELECT ON dbo.web_categories                 TO app_user;
    GRANT SELECT ON dbo.classification_role_visibility TO app_user;

    PRINT N'    ให้สิทธิ์ app_user เรียบร้อย';
END
ELSE
BEGIN
    PRINT N'    ⚠️ ไม่พบผู้ใช้ app_user — ข้ามขั้นตอนการให้สิทธิ์ กรุณาให้สิทธิ์เองภายหลัง';
END
GO


/* ==========================================================================================
   สรุปผลการติดตั้ง
   ========================================================================================== */

PRINT N'';
PRINT N'=========================================================';
PRINT N'  ติดตั้ง Module v1.5 : Permission Control เรียบร้อย';
PRINT N'=========================================================';
GO

SELECT N'ตารางใหม่'            AS [รายการ], COUNT(*) AS [จำนวน]
FROM   sys.tables
WHERE  name IN ('folder_classification_levels','access_levels','classification_role_visibility',
                'web_categories','ad_users','ad_groups','ad_group_members','ad_object_sync_state',
                'file_shares','file_share_permissions','file_share_usage_snapshots',
                'internet_policies','internet_policy_groups','internet_policy_categories',
                'collector_agents','sync_ou_scopes','sync_jobs','sync_job_runs')
UNION ALL
SELECT N'ตารางที่เปิดบันทึกประวัติ', COUNT(*) FROM sys.tables WHERE temporal_type = 2
UNION ALL
SELECT N'มุมมองใหม่', COUNT(*)
FROM   sys.views
WHERE  name LIKE 'vw_%'
  AND  name IN ('vw_ad_group_expanded','vw_user_access_paths','vw_user_effective_access',
                'vw_share_effective_users','vw_user_internet_policy','vw_file_share_current_usage',
                'vw_file_share_list','vw_department_folder_summary','vw_classification_summary',
                'vw_sync_health','vw_permission_issues','vw_permission_change_history',
                'vw_permission_recent_versions','vw_share_permission_timeline',
                'vw_file_share_change_history','vw_untracked_permission_changes');
GO

/* ------------------------------------------------------------------------------------------
   สิ่งที่ต้องทำต่อหลังรันสคริปต์นี้

   1. เพิ่มขอบเขต OU ที่ต้องการ Sync ลงในตาราง sync_ou_scopes
   2. สร้าง Collector Agent และบันทึก SHA-256 ของ API Key ลงใน collector_agents
   3. ตรวจสอบตาราง classification_role_visibility ว่าตรงกับนโยบายขององค์กรหรือไม่
   4. ปรับเวลาใน sync_jobs ให้ตรงกับช่วงที่ระบบว่าง
   5. ⚠️ บังคับ updated_by ที่ชั้น Middleware ก่อนเปิดใช้งานจริง
          ถ้าข้อนี้ไม่เสร็จ ประวัติจะบอกได้แค่ว่าเปลี่ยนเมื่อไร แต่บอกไม่ได้ว่าใครเปลี่ยน
          ซึ่งทำให้ความสามารถหลักของโมดูลนี้ใช้งานไม่ได้จริง
   ------------------------------------------------------------------------------------------ */
