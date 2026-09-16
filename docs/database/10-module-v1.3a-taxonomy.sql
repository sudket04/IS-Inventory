/* ============================================================================
   KKND — IT Inventory Management System
   Module v1.3a : Unified Taxonomy & Model Catalog

   Requires: 02 · 04 · 06 ต้องรันสำเร็จก่อน
   ลำดับการรัน v1.3–v1.4 :  10 → 11 → 12

   ขอบเขตของไฟล์นี้
   ----------------
   1. เพิ่มหมวดหลัก 2 หมวด : Power & Cooling (PWR) · Mobile & IoT/OT (IOT)
   2. สร้าง asset_types — ผังประเภท 2 ชั้นใต้หมวด (Type → Subtype)
      พร้อมธงความสามารถที่ใช้กรอง Dropdown
   3. ย้าย network_device_types เข้ามารวม แล้วยุบตารางเดิมทิ้ง
   4. สร้าง device_models — คลังรุ่นอุปกรณ์พร้อม Auto-fill
   5. ข้อมูลตั้งต้น : 44 Type · 110 Subtype · 48 ยี่ห้อ

   สิ่งที่เพิ่ม : 2 ตาราง · 4 View · 1 Trigger   สิ่งที่ลบ : 1 ตาราง
   ========================================================================== */


/* ============================================================================
   ส่วนที่ 1 — หมวดหลักเพิ่มเติม
   ========================================================================== */

-- เปลี่ยนชื่อหมวดเดิม STG จาก "Storage & Power" เป็น "Storage" อย่างเดียว
UPDATE dbo.asset_categories SET name = N'Storage', icon_name = 'hard-drive'
WHERE code = 'STG';
GO

INSERT INTO dbo.asset_categories (code, name, detail_table, icon_name, sort_order) VALUES
    ('PWR', N'Power & Cooling',  'power_details',      'zap',        6),
    ('IOT', N'Mobile & IoT/OT',  'mobile_iot_details', 'smartphone', 8);
GO

-- หมวดที่เคยใช้ JSON ล้วน ตอนนี้มีตารางขยายของตัวเองแล้ว
UPDATE dbo.asset_categories SET detail_table = 'storage_details'    WHERE code = 'STG';
UPDATE dbo.asset_categories SET detail_table = 'peripheral_details' WHERE code = 'PER';
UPDATE dbo.asset_categories SET sort_order = 7                      WHERE code = 'PER';
GO


/* ============================================================================
   ส่วนที่ 2 — ตาราง asset_types (ผังประเภท 2 ชั้นใต้หมวด)
   ========================================================================== */

CREATE TABLE dbo.asset_types (
    asset_type_id       INT            IDENTITY(1,1) NOT NULL,
    category_id         INT            NOT NULL,
    parent_type_id      INT            NULL,       -- NULL = ชั้น Type · มีค่า = ชั้น Subtype
    type_level          TINYINT        NOT NULL,   -- 1 = Type · 2 = Subtype
    code                VARCHAR(40)    NOT NULL,
    name                NVARCHAR(100)  NOT NULL,
    description         NVARCHAR(300)  NULL,

    /* ---------- ธงความสามารถ ใช้กรอง Dropdown และตรวจสอบข้อมูล ---------- */
    is_virtual          BIT            NOT NULL CONSTRAINT DF_at_virtual  DEFAULT (0),  -- VM / Virtual Appliance
    is_rackable         BIT            NOT NULL CONSTRAINT DF_at_rackable DEFAULT (0),  -- ติดตั้งในตู้ Rack ได้
    default_u_height    TINYINT        NULL,        -- ความสูงตั้งต้น ใช้เมื่อไม่ได้เลือกรุ่น
    requires_ip         BIT            NOT NULL CONSTRAINT DF_at_reqip    DEFAULT (0),  -- ต้องมี IP เสมอ
    can_host_vm         BIT            NOT NULL CONSTRAINT DF_at_hostvm   DEFAULT (0),  -- เป็น Host ของ VM ได้
    is_layer3           BIT            NOT NULL CONSTRAINT DF_at_l3       DEFAULT (0),
    can_be_gateway      BIT            NOT NULL CONSTRAINT DF_at_gw       DEFAULT (0),
    can_provide_dhcp    BIT            NOT NULL CONSTRAINT DF_at_dhcp     DEFAULT (0),
    gateway_role_code   VARCHAR(20)    NULL,
    dhcp_source_code    VARCHAR(20)    NULL,

    icon_name           VARCHAR(50)    NULL,
    sort_order          INT            NOT NULL CONSTRAINT DF_at_sort DEFAULT (0),
    is_active           BIT            NOT NULL CONSTRAINT DF_at_active DEFAULT (1),

    CONSTRAINT PK_asset_types PRIMARY KEY CLUSTERED (asset_type_id),
    CONSTRAINT UX_asset_types_code UNIQUE (code),
    CONSTRAINT FK_asset_types_category FOREIGN KEY (category_id)    REFERENCES dbo.asset_categories(category_id),
    CONSTRAINT FK_asset_types_parent   FOREIGN KEY (parent_type_id) REFERENCES dbo.asset_types(asset_type_id),
    CONSTRAINT CK_at_level  CHECK (type_level IN (1,2)),
    CONSTRAINT CK_at_parent CHECK ((type_level = 1 AND parent_type_id IS NULL)
                                OR (type_level = 2 AND parent_type_id IS NOT NULL)),
    CONSTRAINT CK_at_not_self CHECK (parent_type_id IS NULL OR parent_type_id <> asset_type_id),
    CONSTRAINT CK_at_gw_code   CHECK (gateway_role_code IS NULL OR gateway_role_code IN
        ('FIREWALL','CORE_SWITCH','L3_SWITCH','ROUTER','OTHER')),
    CONSTRAINT CK_at_dhcp_code CHECK (dhcp_source_code IS NULL OR dhcp_source_code IN
        ('FIREWALL','CORE_SWITCH','L3_SWITCH','ROUTER')),
    CONSTRAINT CK_at_gw_consistency   CHECK (can_be_gateway = 0   OR gateway_role_code IS NOT NULL),
    CONSTRAINT CK_at_dhcp_consistency CHECK (can_provide_dhcp = 0 OR dhcp_source_code  IS NOT NULL),
    CONSTRAINT CK_at_u_height CHECK (default_u_height IS NULL OR default_u_height BETWEEN 1 AND 60)
);
GO

CREATE INDEX IX_at_category ON dbo.asset_types(category_id, type_level) WHERE is_active = 1;
CREATE INDEX IX_at_parent   ON dbo.asset_types(parent_type_id)          WHERE is_active = 1;
GO


/* ============================================================================
   ส่วนที่ 3 — ข้อมูลตั้งต้น : ชั้น Type (44 รายการ)
   ========================================================================== */

INSERT INTO dbo.asset_types (category_id, parent_type_id, type_level, code, name, icon_name, sort_order)
SELECT c.category_id, NULL, 1, v.code, v.name, v.icon, v.ord
FROM (VALUES
 -- ===== SERVER =====
 ('SRV','SRV_RACK',        N'Rack Server',              'server',       1),
 ('SRV','SRV_BLADE',       N'Blade System',             'layers',       2),
 ('SRV','SRV_TOWER',       N'Tower Server',             'server',       3),
 ('SRV','SRV_VM',          N'Virtual Machine',          'box',          4),
 ('SRV','SRV_HCI',         N'HCI Node',                 'boxes',        5),
 ('SRV','SRV_APPLIANCE',   N'Appliance',                'package',      6),
 -- ===== NETWORK =====
 ('NET','NET_SWITCHROUTE', N'Switching & Routing',      'network',     11),
 ('NET','NET_SECURITY',    N'Network Security',         'shield',      12),
 ('NET','NET_WIRELESS',    N'Wireless',                 'wifi',        13),
 ('NET','NET_OPTIMIZE',    N'Traffic Optimization',     'scale',       14),
 ('NET','NET_VOICE',       N'Voice',                    'phone',       15),
 ('NET','NET_OOB',         N'Out-of-Band Management',   'terminal',    16),
 -- ===== SOFTWARE =====
 ('SFT','SFT_OS',          N'Operating System',         'disc',        21),
 ('SFT','SFT_DATABASE',    N'Database',                 'database',    22),
 ('SFT','SFT_SECURITY',    N'Security',                 'shield',      23),
 ('SFT','SFT_VIRT',        N'Virtualization',           'layers',      24),
 ('SFT','SFT_BACKUP',      N'Backup & DR',              'save',        25),
 ('SFT','SFT_PRODUCTIVITY',N'Productivity',             'file-text',   26),
 ('SFT','SFT_BUSINESS',    N'Business Application',     'building',    27),
 ('SFT','SFT_DEV',         N'Development',              'code',        28),
 ('SFT','SFT_ITMGMT',      N'IT Management',            'settings',    29),
 ('SFT','SFT_MIDDLEWARE',  N'Middleware',               'shuffle',     30),
 ('SFT','SFT_DESIGN',      N'Design & Engineering',     'pen-tool',    31),
 ('SFT','SFT_OTHER',       N'Other Software',           'circle',      39),
 -- ===== COMPUTER =====
 ('PC', 'PC_DESKTOP',      N'Desktop',                  'monitor',     41),
 ('PC', 'PC_NOTEBOOK',     N'Notebook',                 'laptop',      42),
 ('PC', 'PC_WORKSTATION',  N'Workstation',              'cpu',         43),
 ('PC', 'PC_THINCLIENT',   N'Thin Client',              'monitor-dot', 44),
 ('PC', 'PC_TERMINAL',     N'Terminal',                 'scan',        45),
 -- ===== STORAGE =====
 ('STG','STG_SAN',         N'SAN',                      'hard-drive',  51),
 ('STG','STG_NAS',         N'NAS',                      'hard-drive',  52),
 ('STG','STG_DAS',         N'DAS',                      'hard-drive',  53),
 ('STG','STG_TAPE',        N'Tape',                     'disc',        54),
 ('STG','STG_OBJECT',      N'Object Storage',           'boxes',       55),
 ('STG','STG_BACKUPAPP',   N'Backup Appliance',         'save',        56),
 ('STG','STG_FABRIC',      N'SAN Fabric',               'network',     57),
 -- ===== POWER & COOLING =====
 ('PWR','PWR_UPS',         N'UPS',                      'battery',     61),
 ('PWR','PWR_PDU',         N'PDU',                      'plug',        62),
 ('PWR','PWR_GENERATOR',   N'Generator',                'fuel',        63),
 ('PWR','PWR_BATTERY',     N'Battery',                  'battery',     64),
 ('PWR','PWR_COOLING',     N'Cooling',                  'snowflake',   65),
 ('PWR','PWR_PROTECTION',  N'Protection',               'shield',      66),
 -- ===== PERIPHERAL =====
 ('PER','PER_PRINTING',    N'Printing',                 'printer',     71),
 ('PER','PER_DISPLAY',     N'Display',                  'monitor',     72),
 ('PER','PER_INPUT',       N'Input',                    'keyboard',    73),
 ('PER','PER_AV',          N'Audio & Video',            'video',       74),
 ('PER','PER_ACCESSORY',   N'Accessory',                'plug',        75),
 -- ===== MOBILE & IoT/OT =====
 ('IOT','IOT_MOBILE',      N'Mobile Device',            'smartphone',  81),
 ('IOT','IOT_CAMERA',      N'IP Surveillance',          'camera',      82),
 ('IOT','IOT_ACCESS',      N'Access Control',           'key-round',   83),
 ('IOT','IOT_OT',          N'OT Device',                'factory',     84),
 ('IOT','IOT_SENSOR',      N'Environment Sensor',       'thermometer', 85)
) v(cat_code, code, name, icon, ord)
    INNER JOIN dbo.asset_categories c ON c.code = v.cat_code;
GO


/* ============================================================================
   ส่วนที่ 4 — ข้อมูลตั้งต้น : ชั้น Subtype (110 รายการ)
   ========================================================================== */

INSERT INTO dbo.asset_types (category_id, parent_type_id, type_level, code, name, sort_order)
SELECT p.category_id, p.asset_type_id, 2, v.code, v.name, v.ord
FROM (VALUES
 -- ===== SERVER =====
 ('SRV_RACK',        'SRV_RACK_1U',      N'1U Rack Server',            1),
 ('SRV_RACK',        'SRV_RACK_2U',      N'2U Rack Server',            2),
 ('SRV_RACK',        'SRV_RACK_4U',      N'4U+ Rack Server',           3),
 ('SRV_BLADE',       'SRV_BLADE_SRV',    N'Blade Server',              1),
 ('SRV_BLADE',       'SRV_BLADE_CHS',    N'Blade Chassis',             2),
 ('SRV_TOWER',       'SRV_TOWER_STD',    N'Tower Server',              1),
 ('SRV_VM',          'SRV_VM_STD',       N'Virtual Machine',           1),
 ('SRV_HCI',         'SRV_HCI_NODE',     N'Hyperconverged Node',       1),
 ('SRV_APPLIANCE',   'SRV_APP_HW',       N'Hardware Appliance',        1),
 ('SRV_APPLIANCE',   'SRV_APP_VIRT',     N'Virtual Appliance',         2),
 -- ===== NETWORK : Switching & Routing =====
 ('NET_SWITCHROUTE', 'NET_CORE_SW',      N'Core Switch',               1),
 ('NET_SWITCHROUTE', 'NET_DIST_SW',      N'Distribution Switch',       2),
 ('NET_SWITCHROUTE', 'NET_L3_SW',        N'Layer 3 Switch',            3),
 ('NET_SWITCHROUTE', 'NET_ACCESS_SW',    N'Access Switch',             4),
 ('NET_SWITCHROUTE', 'NET_ROUTER',       N'Router',                    5),
 ('NET_SWITCHROUTE', 'NET_MODEM',        N'Modem / ONU',               6),
 ('NET_SWITCHROUTE', 'NET_MEDIA_CONV',   N'Media Converter',           7),
 -- ===== NETWORK : Security =====
 ('NET_SECURITY',    'NET_FIREWALL',     N'Firewall',                  1),
 ('NET_SECURITY',    'NET_UTM',          N'UTM Appliance',             2),
 ('NET_SECURITY',    'NET_IPS',          N'IPS / IDS',                 3),
 ('NET_SECURITY',    'NET_WAF',          N'Web Application Firewall',  4),
 ('NET_SECURITY',    'NET_VPN_GW',       N'VPN Gateway',               5),
 ('NET_SECURITY',    'NET_NAC',          N'Network Access Control',    6),
 ('NET_SECURITY',    'NET_PROXY',        N'Proxy / Secure Web Gateway',7),
 ('NET_SECURITY',    'NET_EMAIL_SEC',    N'Email Security Gateway',    8),
 ('NET_SECURITY',    'NET_DDOS',         N'DDoS Mitigation',           9),
 -- ===== NETWORK : Wireless / Optimization / Voice / OOB =====
 ('NET_WIRELESS',    'NET_AP',           N'Wireless Access Point',     1),
 ('NET_WIRELESS',    'NET_WLC',          N'Wireless Controller',       2),
 ('NET_OPTIMIZE',    'NET_LB',           N'Load Balancer',             1),
 ('NET_OPTIMIZE',    'NET_SDWAN',        N'SD-WAN Edge',               2),
 ('NET_OPTIMIZE',    'NET_WANOPT',       N'WAN Optimizer',             3),
 ('NET_VOICE',       'NET_IPPBX',        N'IP-PBX',                    1),
 ('NET_VOICE',       'NET_VOICE_GW',     N'Voice Gateway',             2),
 ('NET_OOB',         'NET_KVM',          N'KVM Switch',                1),
 ('NET_OOB',         'NET_CONSOLE',      N'Console Server',            2),
 -- ===== SOFTWARE =====
 ('SFT_OS',          'SFT_OS_SERVER',    N'Server OS',                 1),
 ('SFT_OS',          'SFT_OS_CLIENT',    N'Client OS',                 2),
 ('SFT_OS',          'SFT_OS_HYPER',     N'Hypervisor OS',             3),
 ('SFT_OS',          'SFT_OS_NETWORK',   N'Network OS',                4),
 ('SFT_DATABASE',    'SFT_DB_RDBMS',     N'RDBMS',                     1),
 ('SFT_DATABASE',    'SFT_DB_NOSQL',     N'NoSQL',                     2),
 ('SFT_DATABASE',    'SFT_DB_DW',        N'Data Warehouse',            3),
 ('SFT_SECURITY',    'SFT_SEC_AV',       N'Antivirus / EDR',           1),
 ('SFT_SECURITY',    'SFT_SEC_SIEM',     N'SIEM',                      2),
 ('SFT_SECURITY',    'SFT_SEC_CRYPT',    N'Encryption',                3),
 ('SFT_SECURITY',    'SFT_SEC_PAM',      N'Privileged Access Mgmt',    4),
 ('SFT_SECURITY',    'SFT_SEC_EMAIL',    N'Email Security',            5),
 ('SFT_VIRT',        'SFT_VIRT_HYPER',   N'Hypervisor',                1),
 ('SFT_VIRT',        'SFT_VIRT_CONT',    N'Container Platform',        2),
 ('SFT_VIRT',        'SFT_VIRT_VDI',     N'VDI',                       3),
 ('SFT_BACKUP',      'SFT_BK_BACKUP',    N'Backup Software',           1),
 ('SFT_BACKUP',      'SFT_BK_REPL',      N'Replication',               2),
 ('SFT_BACKUP',      'SFT_BK_ARCHIVE',   N'Archiving',                 3),
 ('SFT_PRODUCTIVITY','SFT_PR_OFFICE',    N'Office Suite',              1),
 ('SFT_PRODUCTIVITY','SFT_PR_MAIL',      N'Email Client',              2),
 ('SFT_PRODUCTIVITY','SFT_PR_COLLAB',    N'Collaboration',             3),
 ('SFT_BUSINESS',    'SFT_BU_ERP',       N'ERP',                       1),
 ('SFT_BUSINESS',    'SFT_BU_CRM',       N'CRM',                       2),
 ('SFT_BUSINESS',    'SFT_BU_HRM',       N'HRM',                       3),
 ('SFT_BUSINESS',    'SFT_BU_ACCT',      N'Accounting',                4),
 ('SFT_BUSINESS',    'SFT_BU_DMS',       N'Document Management',       5),
 ('SFT_DEV',         'SFT_DV_IDE',       N'IDE',                       1),
 ('SFT_DEV',         'SFT_DV_VCS',       N'Version Control',           2),
 ('SFT_DEV',         'SFT_DV_CICD',      N'CI/CD',                     3),
 ('SFT_DEV',         'SFT_DV_TEST',      N'Testing',                   4),
 ('SFT_ITMGMT',      'SFT_IT_MON',       N'Monitoring',                1),
 ('SFT_ITMGMT',      'SFT_IT_ITSM',      N'ITSM',                      2),
 ('SFT_ITMGMT',      'SFT_IT_PATCH',     N'Patch Management',          3),
 ('SFT_ITMGMT',      'SFT_IT_ASSET',     N'Asset Management',          4),
 ('SFT_MIDDLEWARE',  'SFT_MW_APPSRV',    N'Application Server',        1),
 ('SFT_MIDDLEWARE',  'SFT_MW_MQ',        N'Message Queue',             2),
 ('SFT_MIDDLEWARE',  'SFT_MW_APIGW',     N'API Gateway',               3),
 ('SFT_DESIGN',      'SFT_DE_CAD',       N'CAD / CAM',                 1),
 ('SFT_DESIGN',      'SFT_DE_GRAPHIC',   N'Graphics',                  2),
 ('SFT_DESIGN',      'SFT_DE_GIS',       N'GIS',                       3),
 ('SFT_OTHER',       'SFT_OT_OTHER',     N'Other Software',            1),
 -- ===== COMPUTER =====
 ('PC_DESKTOP',      'PC_DT_STD',        N'Standard Desktop',          1),
 ('PC_DESKTOP',      'PC_DT_MINI',       N'Mini PC',                   2),
 ('PC_DESKTOP',      'PC_DT_AIO',        N'All-in-One',                3),
 ('PC_NOTEBOOK',     'PC_NB_STD',        N'Standard Notebook',         1),
 ('PC_NOTEBOOK',     'PC_NB_ULTRA',      N'Ultrabook',                 2),
 ('PC_NOTEBOOK',     'PC_NB_CONV',       N'2-in-1 Convertible',        3),
 ('PC_NOTEBOOK',     'PC_NB_RUGGED',     N'Rugged Notebook',           4),
 ('PC_WORKSTATION',  'PC_WS_DESKTOP',    N'Desktop Workstation',       1),
 ('PC_WORKSTATION',  'PC_WS_MOBILE',     N'Mobile Workstation',        2),
 ('PC_THINCLIENT',   'PC_TC_THIN',       N'Thin Client',               1),
 ('PC_THINCLIENT',   'PC_TC_ZERO',       N'Zero Client',               2),
 ('PC_TERMINAL',     'PC_TM_POS',        N'POS Terminal',              1),
 ('PC_TERMINAL',     'PC_TM_KIOSK',      N'Kiosk',                     2),
 -- ===== STORAGE =====
 ('STG_SAN',         'STG_SAN_AFA',      N'All-Flash Array',           1),
 ('STG_SAN',         'STG_SAN_HYBRID',   N'Hybrid Array',              2),
 ('STG_SAN',         'STG_SAN_DISK',     N'Disk Array',                3),
 ('STG_NAS',         'STG_NAS_ENT',      N'Enterprise NAS',            1),
 ('STG_NAS',         'STG_NAS_SMB',      N'SMB NAS',                   2),
 ('STG_DAS',         'STG_DAS_JBOD',     N'JBOD',                      1),
 ('STG_DAS',         'STG_DAS_ENCL',     N'External Enclosure',        2),
 ('STG_TAPE',        'STG_TP_DRIVE',     N'Tape Drive',                1),
 ('STG_TAPE',        'STG_TP_AUTO',      N'Tape Autoloader',           2),
 ('STG_TAPE',        'STG_TP_LIB',       N'Tape Library',              3),
 ('STG_OBJECT',      'STG_OBJ_APP',      N'Object Storage Appliance',  1),
 ('STG_BACKUPAPP',   'STG_BA_PBBA',      N'Purpose-Built Backup Appliance', 1),
 ('STG_BACKUPAPP',   'STG_BA_DEDUP',     N'Deduplication Appliance',   2),
 ('STG_FABRIC',      'STG_FB_FCSW',      N'Fibre Channel Switch',      1),
 ('STG_FABRIC',      'STG_FB_FCDIR',     N'FC Director',               2),
 -- ===== POWER & COOLING =====
 ('PWR_UPS',         'PWR_UPS_ONLINE',   N'Online Double-Conversion',  1),
 ('PWR_UPS',         'PWR_UPS_LINE',     N'Line-Interactive',          2),
 ('PWR_UPS',         'PWR_UPS_MODULAR',  N'Modular UPS',               3),
 ('PWR_PDU',         'PWR_PDU_BASIC',    N'Basic PDU',                 1),
 ('PWR_PDU',         'PWR_PDU_METERED',  N'Metered PDU',               2),
 ('PWR_PDU',         'PWR_PDU_SWITCHED', N'Switched PDU',              3),
 ('PWR_PDU',         'PWR_PDU_ATS',      N'Automatic Transfer Switch', 4),
 ('PWR_GENERATOR',   'PWR_GN_DIESEL',    N'Diesel Generator',          1),
 ('PWR_BATTERY',     'PWR_BT_CABINET',   N'Battery Cabinet',           1),
 ('PWR_BATTERY',     'PWR_BT_BANK',      N'Battery Bank',              2),
 ('PWR_COOLING',     'PWR_CL_CRAC',      N'Precision A/C (CRAC)',      1),
 ('PWR_COOLING',     'PWR_CL_INROW',     N'In-Row Cooling',            2),
 ('PWR_COOLING',     'PWR_CL_SPLIT',     N'Split A/C',                 3),
 ('PWR_PROTECTION',  'PWR_PT_SURGE',     N'Surge Protector',           1),
 ('PWR_PROTECTION',  'PWR_PT_ISO',       N'Isolation Transformer',     2),
 -- ===== PERIPHERAL =====
 ('PER_PRINTING',    'PER_PR_LASER',     N'Laser Printer',             1),
 ('PER_PRINTING',    'PER_PR_INKJET',    N'Inkjet Printer',            2),
 ('PER_PRINTING',    'PER_PR_MFP',       N'Multifunction Printer',     3),
 ('PER_PRINTING',    'PER_PR_LABEL',     N'Label Printer',             4),
 ('PER_PRINTING',    'PER_PR_DOT',       N'Dot Matrix Printer',        5),
 ('PER_PRINTING',    'PER_PR_PLOTTER',   N'Plotter',                   6),
 ('PER_PRINTING',    'PER_PR_3D',        N'3D Printer',                7),
 ('PER_DISPLAY',     'PER_DP_MONITOR',   N'Monitor',                   1),
 ('PER_DISPLAY',     'PER_DP_LFD',       N'Large Format Display',      2),
 ('PER_DISPLAY',     'PER_DP_PROJ',      N'Projector',                 3),
 ('PER_DISPLAY',     'PER_DP_WALL',      N'Video Wall',                4),
 ('PER_INPUT',       'PER_IN_KBM',       N'Keyboard / Mouse Set',      1),
 ('PER_INPUT',       'PER_IN_BARCODE',   N'Barcode Scanner',           2),
 ('PER_INPUT',       'PER_IN_SCANNER',   N'Document Scanner',          3),
 ('PER_INPUT',       'PER_IN_SIGNPAD',   N'Signature Pad',             4),
 ('PER_AV',          'PER_AV_WEBCAM',    N'Webcam',                    1),
 ('PER_AV',          'PER_AV_CONF',      N'Conference System',         2),
 ('PER_AV',          'PER_AV_AUDIO',     N'Speaker / Microphone',      3),
 ('PER_ACCESSORY',   'PER_AC_DOCK',      N'Docking Station',           1),
 ('PER_ACCESSORY',   'PER_AC_EXTDRV',    N'External Drive',            2),
 ('PER_ACCESSORY',   'PER_AC_CARDRD',    N'Card Reader',               3),
 -- ===== MOBILE & IoT/OT =====
 ('IOT_MOBILE',      'IOT_MB_PHONE',     N'Smartphone',                1),
 ('IOT_MOBILE',      'IOT_MB_TABLET',    N'Tablet',                    2),
 ('IOT_MOBILE',      'IOT_MB_HANDHELD',  N'Handheld Terminal',         3),
 ('IOT_CAMERA',      'IOT_CM_FIXED',     N'Fixed Camera',              1),
 ('IOT_CAMERA',      'IOT_CM_PTZ',       N'PTZ Camera',                2),
 ('IOT_CAMERA',      'IOT_CM_NVR',       N'NVR / DVR',                 3),
 ('IOT_ACCESS',      'IOT_AC_READER',    N'Card Reader',               1),
 ('IOT_ACCESS',      'IOT_AC_CTRL',      N'Door Controller',           2),
 ('IOT_ACCESS',      'IOT_AC_TIME',      N'Time Attendance',           3),
 ('IOT_OT',          'IOT_OT_PLC',       N'PLC',                       1),
 ('IOT_OT',          'IOT_OT_HMI',       N'HMI Panel',                 2),
 ('IOT_OT',          'IOT_OT_SCADA',     N'SCADA Terminal',            3),
 ('IOT_OT',          'IOT_OT_GATEWAY',   N'Industrial Gateway',        4),
 ('IOT_SENSOR',      'IOT_SN_TEMP',      N'Temperature / Humidity',    1),
 ('IOT_SENSOR',      'IOT_SN_LEAK',      N'Water Leak',                2),
 ('IOT_SENSOR',      'IOT_SN_SMOKE',     N'Smoke Detector',            3),
 ('IOT_SENSOR',      'IOT_SN_DOOR',      N'Door Contact',              4)
) v(parent_code, code, name, ord)
    INNER JOIN dbo.asset_types p ON p.code = v.parent_code;
GO


/* ============================================================================
   ส่วนที่ 5 — ตั้งค่าธงความสามารถ
   ========================================================================== */

/* -- 5.1 อุปกรณ์ที่ติดตั้งในตู้ Rack ได้ พร้อมความสูงตั้งต้น -- */
UPDATE dbo.asset_types SET is_rackable = 1, default_u_height = 1 WHERE code IN
 ('SRV_RACK_1U','NET_CORE_SW','NET_DIST_SW','NET_L3_SW','NET_ACCESS_SW','NET_ROUTER',
  'NET_FIREWALL','NET_UTM','NET_IPS','NET_WAF','NET_VPN_GW','NET_NAC','NET_PROXY',
  'NET_EMAIL_SEC','NET_DDOS','NET_WLC','NET_LB','NET_SDWAN','NET_WANOPT','NET_IPPBX',
  'NET_VOICE_GW','NET_KVM','NET_CONSOLE','STG_FB_FCSW','PWR_PDU_BASIC','PWR_PDU_METERED',
  'PWR_PDU_SWITCHED','PWR_PDU_ATS','IOT_CM_NVR','PER_AC_DOCK');
UPDATE dbo.asset_types SET is_rackable = 1, default_u_height = 2 WHERE code IN
 ('SRV_RACK_2U','SRV_HCI_NODE','STG_NAS_ENT','STG_NAS_SMB','STG_DAS_JBOD','STG_DAS_ENCL',
  'STG_TP_DRIVE','STG_TP_AUTO','STG_OBJ_APP','STG_BA_PBBA','STG_BA_DEDUP','PWR_UPS_ONLINE',
  'PWR_UPS_LINE','STG_SAN_AFA','STG_SAN_HYBRID','STG_SAN_DISK','SRV_APP_HW');
UPDATE dbo.asset_types SET is_rackable = 1, default_u_height = 4 WHERE code IN
 ('SRV_RACK_4U','SRV_BLADE_CHS','STG_FB_FCDIR','PWR_UPS_MODULAR','PWR_BT_CABINET','STG_TP_LIB');
GO

/* -- 5.2 เครื่องเสมือน -- */
UPDATE dbo.asset_types SET is_virtual = 1 WHERE code IN ('SRV_VM_STD','SRV_APP_VIRT');
GO

/* -- 5.3 อุปกรณ์ที่ต้องมี IP เสมอ -- */
UPDATE dbo.asset_types SET requires_ip = 1
WHERE category_id IN (SELECT category_id FROM dbo.asset_categories WHERE code IN ('SRV','NET'))
  AND type_level = 2;
UPDATE dbo.asset_types SET requires_ip = 1 WHERE code IN
 ('STG_SAN_AFA','STG_SAN_HYBRID','STG_SAN_DISK','STG_NAS_ENT','STG_NAS_SMB','STG_OBJ_APP',
  'STG_BA_PBBA','STG_BA_DEDUP','STG_FB_FCSW','STG_FB_FCDIR',
  'PWR_UPS_ONLINE','PWR_UPS_MODULAR','PWR_PDU_METERED','PWR_PDU_SWITCHED','PWR_CL_CRAC',
  'IOT_CM_FIXED','IOT_CM_PTZ','IOT_CM_NVR','IOT_AC_CTRL','IOT_OT_PLC','IOT_OT_HMI','IOT_OT_GATEWAY');
GO

/* -- 5.4 เครื่องที่เป็น Host ของ VM ได้ -- */
UPDATE dbo.asset_types SET can_host_vm = 1
WHERE code IN ('SRV_RACK_1U','SRV_RACK_2U','SRV_RACK_4U','SRV_BLADE_SRV','SRV_TOWER_STD','SRV_HCI_NODE');
GO

/* -- 5.5 ⭐ ความสามารถด้านเครือข่าย ใช้กรอง Dropdown Gateway และ DHCP -- */
UPDATE dbo.asset_types SET is_layer3=1, can_be_gateway=1, can_provide_dhcp=1,
       gateway_role_code='CORE_SWITCH', dhcp_source_code='CORE_SWITCH' WHERE code = 'NET_CORE_SW';
UPDATE dbo.asset_types SET is_layer3=1, can_be_gateway=1, can_provide_dhcp=1,
       gateway_role_code='L3_SWITCH', dhcp_source_code='L3_SWITCH'
WHERE code IN ('NET_DIST_SW','NET_L3_SW');
UPDATE dbo.asset_types SET is_layer3=1, can_be_gateway=1, can_provide_dhcp=1,
       gateway_role_code='ROUTER', dhcp_source_code='ROUTER'
WHERE code IN ('NET_ROUTER','NET_SDWAN');
UPDATE dbo.asset_types SET is_layer3=1, can_be_gateway=1, can_provide_dhcp=1,
       gateway_role_code='FIREWALL', dhcp_source_code='FIREWALL'
WHERE code IN ('NET_FIREWALL','NET_UTM');
UPDATE dbo.asset_types SET is_layer3=1, can_be_gateway=1, gateway_role_code='FIREWALL'
WHERE code = 'NET_VPN_GW';
UPDATE dbo.asset_types SET is_layer3=1, can_be_gateway=1, gateway_role_code='OTHER'
WHERE code = 'NET_LB';
UPDATE dbo.asset_types SET is_layer3=1, can_provide_dhcp=1, dhcp_source_code='L3_SWITCH'
WHERE code = 'NET_WLC';
GO


/* ============================================================================
   ส่วนที่ 6 — ผูก asset_types เข้ากับ assets และยุบ network_device_types
   ========================================================================== */

ALTER TABLE dbo.assets ADD asset_type_id INT NULL;
GO

-- ย้ายค่าเดิมจาก network_details (ไม่มีผลหากยังไม่มีข้อมูล)
UPDATE a
   SET asset_type_id = t.asset_type_id
FROM dbo.assets a
    INNER JOIN dbo.network_details     nd  ON nd.asset_id      = a.asset_id
    INNER JOIN dbo.network_device_types ndt ON ndt.device_type_id = nd.device_type_id
    INNER JOIN dbo.asset_types         t   ON t.code = CASE ndt.code
        WHEN 'CORE_SWITCH'         THEN 'NET_CORE_SW'
        WHEN 'DISTRIBUTION_SWITCH' THEN 'NET_DIST_SW'
        WHEN 'L3_SWITCH'           THEN 'NET_L3_SW'
        WHEN 'ACCESS_SWITCH'       THEN 'NET_ACCESS_SW'
        WHEN 'ROUTER'              THEN 'NET_ROUTER'
        WHEN 'MODEM'               THEN 'NET_MODEM'
        WHEN 'MEDIA_CONVERTER'     THEN 'NET_MEDIA_CONV'
        WHEN 'FIREWALL'            THEN 'NET_FIREWALL'
        WHEN 'UTM'                 THEN 'NET_UTM'
        WHEN 'IPS_IDS'             THEN 'NET_IPS'
        WHEN 'WAF'                 THEN 'NET_WAF'
        WHEN 'VPN_GATEWAY'         THEN 'NET_VPN_GW'
        WHEN 'NAC'                 THEN 'NET_NAC'
        WHEN 'PROXY_APPLIANCE'     THEN 'NET_PROXY'
        WHEN 'EMAIL_SECURITY_GW'   THEN 'NET_EMAIL_SEC'
        WHEN 'DDOS_MITIGATION'     THEN 'NET_DDOS'
        WHEN 'WIRELESS_AP'         THEN 'NET_AP'
        WHEN 'WIRELESS_CONTROLLER' THEN 'NET_WLC'
        WHEN 'LOAD_BALANCER'       THEN 'NET_LB'
        WHEN 'SD_WAN_EDGE'         THEN 'NET_SDWAN'
        WHEN 'WAN_OPTIMIZER'       THEN 'NET_WANOPT'
        WHEN 'IP_PBX'              THEN 'NET_IPPBX'
        WHEN 'VOICE_GATEWAY'       THEN 'NET_VOICE_GW'
        WHEN 'KVM_SWITCH'          THEN 'NET_KVM'
        WHEN 'CONSOLE_SERVER'      THEN 'NET_CONSOLE'
        ELSE 'NET_MEDIA_CONV' END;
GO

-- ย้ายค่าเดิมจาก server_details.server_type และ computer_details.computer_type
UPDATE a SET asset_type_id = t.asset_type_id
FROM dbo.assets a
    INNER JOIN dbo.server_details sd ON sd.asset_id = a.asset_id
    INNER JOIN dbo.asset_types    t  ON t.code = CASE sd.server_type
        WHEN 'VIRTUAL' THEN 'SRV_VM_STD' ELSE 'SRV_RACK_2U' END
WHERE a.asset_type_id IS NULL;

UPDATE a SET asset_type_id = t.asset_type_id
FROM dbo.assets a
    INNER JOIN dbo.computer_details cd ON cd.asset_id = a.asset_id
    INNER JOIN dbo.asset_types      t  ON t.code = CASE cd.computer_type
        WHEN 'DESKTOP'     THEN 'PC_DT_STD'
        WHEN 'NOTEBOOK'    THEN 'PC_NB_STD'
        WHEN 'WORKSTATION' THEN 'PC_WS_DESKTOP'
        WHEN 'TABLET'      THEN 'IOT_MB_TABLET'
        ELSE 'PC_TC_THIN' END
WHERE a.asset_type_id IS NULL;
GO

ALTER TABLE dbo.assets
    ADD CONSTRAINT FK_assets_type FOREIGN KEY (asset_type_id) REFERENCES dbo.asset_types(asset_type_id);
GO
CREATE INDEX IX_assets_type ON dbo.assets(asset_type_id) WHERE is_deleted = 0;
GO

/* ประเภทที่เลือกต้องอยู่ในหมวดเดียวกับที่ระบุไว้ (SQL Server ไม่รองรับ Subquery ใน CHECK) */
CREATE TRIGGER dbo.trg_assets_validate_type
ON dbo.assets
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i
            INNER JOIN dbo.asset_types t ON t.asset_type_id = i.asset_type_id
        WHERE i.asset_type_id IS NOT NULL AND t.category_id <> i.category_id
    )
        THROW 51020, 'The selected asset type does not belong to the selected category.', 1;
END;
GO

/* ยุบตารางประเภทอุปกรณ์เครือข่ายเดิม — ข้อมูลย้ายเข้า asset_types หมดแล้ว
   หมายเหตุ: Trigger ทั้ง 3 ตัวจาก v1.2 อ้างถึง View สองตัวนี้อยู่
   SQL Server ใช้ Deferred Name Resolution จึงยอมให้ลบ View ได้
   แต่ Trigger จะทำงานไม่ได้จนกว่าจะสร้าง View ขึ้นใหม่ในส่วนที่ 8.4 ของไฟล์นี้
   → ห้ามหยุดการรันสคริปต์กลางคัน                                              */
DROP VIEW IF EXISTS dbo.vw_dhcp_capable_devices;
DROP VIEW IF EXISTS dbo.vw_gateway_capable_devices;
GO
ALTER TABLE dbo.network_details DROP CONSTRAINT FK_network_device_type;
GO
DROP INDEX IX_network_device_type ON dbo.network_details;
GO
ALTER TABLE dbo.network_details DROP COLUMN device_type_id;
GO
DROP TABLE dbo.network_device_types;
GO

/* server_type ซ้ำซ้อนกับ asset_types.is_virtual จึงลบทิ้งเพื่อไม่ให้ข้อมูลขัดแย้งกัน */
DROP VIEW IF EXISTS dbo.vw_server_roles_summary;
GO
ALTER TABLE dbo.server_details DROP CONSTRAINT CK_server_type;
GO
ALTER TABLE dbo.server_details DROP COLUMN server_type;
GO
ALTER TABLE dbo.computer_details DROP CONSTRAINT CK_computer_type;
GO
ALTER TABLE dbo.computer_details DROP COLUMN computer_type;
GO


/* ============================================================================
   ส่วนที่ 7 — คลังรุ่นอุปกรณ์ (Model Catalog)
   ========================================================================== */

CREATE TABLE dbo.device_models (
    model_id            INT             IDENTITY(1,1) NOT NULL,
    manufacturer_id     INT             NOT NULL,
    asset_type_id       INT             NOT NULL,
    model_name          NVARCHAR(150)   NOT NULL,   -- PowerEdge R750
    model_number        NVARCHAR(100)   NULL,       -- R750-2U-8SFF
    description         NVARCHAR(400)   NULL,

    /* ---------- ค่าที่ใช้ Auto-fill ---------- */
    u_height            TINYINT         NULL,       -- ⭐ ใช้จองตำแหน่งใน Rack
    form_factor         VARCHAR(20)     NULL,       -- RACK / TOWER / BLADE / DESKTOP / HANDHELD
    power_draw_watt     INT             NULL,       -- ⭐ ใช้คำนวณโหลดไฟของตู้
    weight_kg           DECIMAL(7,2)    NULL,       -- ⭐ ใช้คำนวณน้ำหนักของตู้
    default_specs       NVARCHAR(MAX)   NULL,       -- JSON สเปกตั้งต้นเฉพาะทาง

    /* ---------- วงจรชีวิตของรุ่น ---------- */
    eol_date            DATE            NULL,       -- End of Life : ผู้ผลิตหยุดขาย
    eos_date            DATE            NULL,       -- End of Support : ผู้ผลิตหยุดสนับสนุน
    datasheet_url       NVARCHAR(400)   NULL,

    /* ---------- การตรวจสอบคุณภาพข้อมูล ---------- */
    is_verified         BIT             NOT NULL CONSTRAINT DF_dm_verified DEFAULT (0),
    verified_by         INT             NULL,
    verified_at         DATETIMEOFFSET(3) NULL,

    is_active           BIT             NOT NULL CONSTRAINT DF_dm_active DEFAULT (1),
    created_at          DATETIMEOFFSET(3) NOT NULL CONSTRAINT DF_dm_created DEFAULT (SYSDATETIMEOFFSET()),
    created_by          INT             NULL,
    updated_at          DATETIMEOFFSET(3) NULL,
    updated_by          INT             NULL,

    CONSTRAINT PK_device_models PRIMARY KEY CLUSTERED (model_id),
    CONSTRAINT UX_device_models UNIQUE (manufacturer_id, model_name),
    CONSTRAINT FK_dm_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES dbo.manufacturers(manufacturer_id),
    CONSTRAINT FK_dm_type         FOREIGN KEY (asset_type_id)   REFERENCES dbo.asset_types(asset_type_id),
    CONSTRAINT FK_dm_verified_by  FOREIGN KEY (verified_by)     REFERENCES dbo.users(user_id),
    CONSTRAINT FK_dm_created_by   FOREIGN KEY (created_by)      REFERENCES dbo.users(user_id),
    CONSTRAINT FK_dm_updated_by   FOREIGN KEY (updated_by)      REFERENCES dbo.users(user_id),
    CONSTRAINT CK_dm_form CHECK (form_factor IS NULL OR form_factor IN
        ('RACK','TOWER','BLADE','DESKTOP','HANDHELD','WALL_MOUNT','DIN_RAIL','OTHER')),
    CONSTRAINT CK_dm_u      CHECK (u_height IS NULL OR u_height BETWEEN 1 AND 60),
    CONSTRAINT CK_dm_power  CHECK (power_draw_watt IS NULL OR power_draw_watt > 0),
    CONSTRAINT CK_dm_weight CHECK (weight_kg IS NULL OR weight_kg > 0),
    CONSTRAINT CK_dm_eol    CHECK (eol_date IS NULL OR eos_date IS NULL OR eos_date >= eol_date),
    CONSTRAINT CK_dm_specs  CHECK (default_specs IS NULL OR ISJSON(default_specs) = 1),
    CONSTRAINT CK_dm_verify CHECK ((is_verified = 0) OR (verified_by IS NOT NULL AND verified_at IS NOT NULL))
);
GO

CREATE INDEX IX_dm_type         ON dbo.device_models(asset_type_id)   WHERE is_active = 1;
CREATE INDEX IX_dm_manufacturer ON dbo.device_models(manufacturer_id) WHERE is_active = 1;
CREATE INDEX IX_dm_unverified   ON dbo.device_models(created_at DESC) WHERE is_verified = 0 AND is_active = 1;
CREATE INDEX IX_dm_eos          ON dbo.device_models(eos_date)        WHERE eos_date IS NOT NULL;
GO

/* ผูก assets เข้ากับรุ่น */
ALTER TABLE dbo.assets ADD model_id INT NULL;
GO
ALTER TABLE dbo.assets
    ADD CONSTRAINT FK_assets_model FOREIGN KEY (model_id) REFERENCES dbo.device_models(model_id);
GO
CREATE INDEX IX_assets_model ON dbo.assets(model_id) WHERE is_deleted = 0;
GO


/* ============================================================================
   ส่วนที่ 8 — Views สำหรับ Cascading Dropdown
   ========================================================================== */

/* -- 8.1 ผังประเภทพร้อมเส้นทางเต็ม -- */
CREATE VIEW dbo.vw_asset_type_tree
AS
SELECT
    t.asset_type_id,
    t.category_id,
    c.code                  AS category_code,
    c.name                  AS category_name,
    t.parent_type_id,
    t.type_level,
    t.code,
    t.name,
    p.code                  AS parent_code,
    p.name                  AS parent_name,
    c.name + N' / ' + ISNULL(p.name + N' / ', N'') + t.name AS full_path,
    t.is_virtual, t.is_rackable, t.default_u_height, t.requires_ip, t.can_host_vm,
    t.is_layer3, t.can_be_gateway, t.can_provide_dhcp,
    t.gateway_role_code, t.dhcp_source_code,
    t.icon_name, t.sort_order, t.is_active
FROM dbo.asset_types t
    INNER JOIN dbo.asset_categories c ON c.category_id    = t.category_id
    LEFT  JOIN dbo.asset_types      p ON p.asset_type_id  = t.parent_type_id;
GO

/* -- 8.2 ยี่ห้อที่มีรุ่นอยู่จริงในแต่ละประเภท (ขั้นที่ 4 ของ Cascading) -- */
CREATE VIEW dbo.vw_cascade_manufacturers
AS
SELECT DISTINCT
    t.asset_type_id,
    t.category_id,
    m.manufacturer_id,
    m.name              AS manufacturer_name,
    cnt.model_count
FROM dbo.asset_types t
    INNER JOIN dbo.device_models dm ON dm.asset_type_id = t.asset_type_id AND dm.is_active = 1
    INNER JOIN dbo.manufacturers m  ON m.manufacturer_id = dm.manufacturer_id AND m.is_active = 1
    CROSS APPLY (
        SELECT COUNT(*) AS model_count
        FROM dbo.device_models d2
        WHERE d2.asset_type_id = t.asset_type_id
          AND d2.manufacturer_id = m.manufacturer_id
          AND d2.is_active = 1
    ) cnt;
GO

/* -- 8.3 รุ่นพร้อมข้อมูล Auto-fill (ขั้นที่ 5 ของ Cascading) -- */
CREATE VIEW dbo.vw_cascade_models
AS
SELECT
    dm.model_id,
    dm.manufacturer_id,
    m.name                  AS manufacturer_name,
    dm.asset_type_id,
    t.name                  AS type_name,
    dm.model_name,
    dm.model_number,
    dm.u_height,
    dm.form_factor,
    dm.power_draw_watt,
    dm.weight_kg,
    dm.default_specs,
    dm.eol_date,
    dm.eos_date,
    dm.is_verified,
    m.name + N' ' + dm.model_name AS display_label,
    CASE WHEN dm.eos_date IS NOT NULL
              AND dm.eos_date < CAST(SYSDATETIMEOFFSET() AS DATE)
         THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS is_past_eos
FROM dbo.device_models dm
    INNER JOIN dbo.manufacturers m ON m.manufacturer_id = dm.manufacturer_id
    INNER JOIN dbo.asset_types   t ON t.asset_type_id   = dm.asset_type_id
WHERE dm.is_active = 1;
GO

/* -- 8.4 สร้าง View กรอง Gateway และ DHCP ขึ้นใหม่ให้อ่านจาก asset_types -- */
CREATE VIEW dbo.vw_gateway_capable_devices
AS
SELECT
    a.asset_id, a.asset_tag, a.name AS asset_name,
    t.name                  AS device_type_name,
    pt.name                 AS device_class_name,
    t.gateway_role_code     AS gateway_device_role,
    t.is_layer3,
    nd.hostname             AS device_hostname,
    nd.mgmt_ip              AS device_ip,
    l.name                  AS location_name,
    s.code                  AS status_code,
    a.name + N' (' + a.asset_tag + N')' + ISNULL(N' · ' + nd.mgmt_ip, N'') AS display_label
FROM dbo.assets a
    INNER JOIN dbo.asset_types    t  ON t.asset_type_id = a.asset_type_id
    LEFT  JOIN dbo.asset_types    pt ON pt.asset_type_id = t.parent_type_id
    INNER JOIN dbo.network_details nd ON nd.asset_id     = a.asset_id
    INNER JOIN dbo.asset_statuses s  ON s.status_id      = a.status_id
    LEFT  JOIN dbo.locations      l  ON l.location_id    = a.location_id
WHERE a.is_deleted = 0 AND t.can_be_gateway = 1 AND t.is_active = 1 AND s.is_operational = 1;
GO

CREATE VIEW dbo.vw_dhcp_capable_devices
AS
-- (1) อุปกรณ์เครือข่ายที่จ่าย DHCP ได้
SELECT
    a.asset_id, a.asset_tag, a.name AS asset_name,
    'NETWORK'               AS device_kind,
    t.name                  AS device_type_name,
    pt.name                 AS device_class_name,
    t.dhcp_source_code      AS dhcp_source_type,
    nd.hostname             AS device_hostname,
    nd.mgmt_ip              AS device_ip,
    l.name                  AS location_name,
    s.code                  AS status_code,
    a.name + N' (' + a.asset_tag + N')' + ISNULL(N' · ' + nd.mgmt_ip, N'') AS display_label
FROM dbo.assets a
    INNER JOIN dbo.asset_types     t  ON t.asset_type_id  = a.asset_type_id
    LEFT  JOIN dbo.asset_types     pt ON pt.asset_type_id = t.parent_type_id
    INNER JOIN dbo.network_details nd ON nd.asset_id      = a.asset_id
    INNER JOIN dbo.asset_statuses  s  ON s.status_id      = a.status_id
    LEFT  JOIN dbo.locations       l  ON l.location_id    = a.location_id
WHERE a.is_deleted = 0 AND t.can_provide_dhcp = 1 AND t.is_active = 1 AND s.is_operational = 1

UNION ALL

-- (2) เซิร์ฟเวอร์ที่ได้รับบทบาท DHCP Server
SELECT
    a.asset_id, a.asset_tag, a.name,
    'SERVER', r.name, N'Server Role', 'DHCP_SERVER',
    sd.hostname, NULL, l.name, s.code,
    a.name + N' (' + a.asset_tag + N')' + ISNULL(N' · ' + sd.hostname, N'')
FROM dbo.assets a
    INNER JOIN dbo.server_details          sd  ON sd.asset_id      = a.asset_id
    INNER JOIN dbo.server_role_assignments sra ON sra.asset_id     = a.asset_id
    INNER JOIN dbo.server_roles            r   ON r.server_role_id = sra.server_role_id
    INNER JOIN dbo.asset_statuses          s   ON s.status_id      = a.status_id
    LEFT  JOIN dbo.locations               l   ON l.location_id    = a.location_id
WHERE a.is_deleted = 0 AND r.is_dhcp_provider = 1 AND r.is_active = 1 AND s.is_operational = 1;
GO

/* -- 8.5 สร้าง vw_server_roles_summary ขึ้นใหม่ (server_type ถูกลบไปแล้ว) -- */
CREATE VIEW dbo.vw_server_roles_summary
AS
SELECT
    a.asset_id, a.asset_tag,
    a.name              AS server_name,
    sd.hostname,
    t.name              AS server_type_name,
    t.is_virtual,
    pr.name             AS primary_role,
    pr.role_group       AS primary_role_group,
    agg.role_count, agg.role_list, agg.has_critical_service
FROM dbo.assets a
    INNER JOIN dbo.server_details sd ON sd.asset_id = a.asset_id
    LEFT  JOIN dbo.asset_types    t  ON t.asset_type_id = a.asset_type_id
    OUTER APPLY (
        SELECT TOP (1) r.name, r.role_group
        FROM dbo.server_role_assignments sra
            INNER JOIN dbo.server_roles r ON r.server_role_id = sra.server_role_id
        WHERE sra.asset_id = a.asset_id AND sra.is_primary = 1
    ) pr
    OUTER APPLY (
        SELECT COUNT(*) AS role_count,
               MAX(CAST(r.is_critical_service AS INT)) AS has_critical_service,
               STRING_AGG(r.name, N', ') WITHIN GROUP (ORDER BY r.sort_order) AS role_list
        FROM dbo.server_role_assignments sra
            INNER JOIN dbo.server_roles r ON r.server_role_id = sra.server_role_id
        WHERE sra.asset_id = a.asset_id
    ) agg
WHERE a.is_deleted = 0;
GO

/* -- 8.6 ⭐ รายการเซิร์ฟเวอร์กายภาพสำหรับเลือกเข้า Cluster (Brand → Model → S/N) -- */
CREATE VIEW dbo.vw_selectable_physical_servers
AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name                  AS asset_name,
    m.manufacturer_id,
    m.name                  AS manufacturer_name,
    dm.model_id,
    ISNULL(dm.model_name, a.model) AS model_name,
    a.serial_number,
    sd.hostname,
    t.name                  AS type_name,
    l.name                  AS location_name,
    s.code                  AS status_code,
    a.serial_number + N' · ' + a.asset_tag
        + ISNULL(N' · ' + sd.hostname, N'') AS display_label
FROM dbo.assets a
    INNER JOIN dbo.asset_types    t  ON t.asset_type_id = a.asset_type_id
    INNER JOIN dbo.server_details sd ON sd.asset_id     = a.asset_id
    INNER JOIN dbo.asset_statuses s  ON s.status_id     = a.status_id
    LEFT  JOIN dbo.manufacturers  m  ON m.manufacturer_id = a.manufacturer_id
    LEFT  JOIN dbo.device_models  dm ON dm.model_id       = a.model_id
    LEFT  JOIN dbo.locations      l  ON l.location_id     = a.location_id
WHERE a.is_deleted = 0
  AND t.is_virtual = 0          -- ⭐ เฉพาะเครื่องกายภาพเท่านั้น
  AND s.is_operational = 1;     -- ⭐ ไม่แสดงเครื่องที่ปลดระวางแล้ว
GO


/* ============================================================================
   ส่วนที่ 9 — ข้อมูลตั้งต้น : ยี่ห้อ (48 รายการ)
   ========================================================================== */

INSERT INTO dbo.manufacturers (name, support_url) VALUES
 (N'Dell Technologies',       N'https://www.dell.com/support'),
 (N'HPE',                     N'https://support.hpe.com'),
 (N'HP Inc.',                 N'https://support.hp.com'),
 (N'Lenovo',                  N'https://support.lenovo.com'),
 (N'IBM',                     N'https://www.ibm.com/support'),
 (N'Supermicro',              NULL),
 (N'Huawei',                  NULL),
 (N'Oracle',                  NULL),
 (N'Cisco',                   N'https://www.cisco.com/c/en/us/support'),
 (N'Juniper Networks',        NULL),
 (N'Aruba Networks',          NULL),
 (N'Ubiquiti',                NULL),
 (N'Ruckus',                  NULL),
 (N'TP-Link',                 NULL),
 (N'D-Link',                  NULL),
 (N'MikroTik',                NULL),
 (N'Fortinet',                N'https://support.fortinet.com'),
 (N'Palo Alto Networks',      NULL),
 (N'Check Point',             NULL),
 (N'Sophos',                  NULL),
 (N'SonicWall',               NULL),
 (N'F5 Networks',             NULL),
 (N'NetApp',                  NULL),
 (N'Pure Storage',            NULL),
 (N'Synology',                N'https://www.synology.com/support'),
 (N'QNAP',                    NULL),
 (N'Western Digital',         NULL),
 (N'Seagate',                 NULL),
 (N'Quantum',                 NULL),
 (N'APC by Schneider Electric', N'https://www.apc.com/support'),
 (N'Eaton',                   NULL),
 (N'CyberPower',              NULL),
 (N'Vertiv',                  NULL),
 (N'Schneider Electric',      NULL),
 (N'Microsoft',               NULL),
 (N'VMware',                  NULL),
 (N'Red Hat',                 NULL),
 (N'Veeam',                   NULL),
 (N'Canon',                   NULL),
 (N'Epson',                   NULL),
 (N'Brother',                 NULL),
 (N'Ricoh',                   NULL),
 (N'Fujifilm Business Innovation', NULL),
 (N'Samsung',                 NULL),
 (N'LG',                      NULL),
 (N'Hikvision',               NULL),
 (N'Dahua',                   NULL),
 (N'Zebra',                   NULL),
 (N'Honeywell',               NULL),
 (N'Siemens',                 NULL),
 (N'Mitsubishi Electric',     NULL),
 (N'Omron',                   NULL),
 (N'Apple',                   NULL),
 (N'Other',                   NULL);
GO


/* ============================================================================
   จบไฟล์ 10 — ขั้นถัดไป : 11-module-v1.3b-details-rack-ipam.sql
   ========================================================================== */
