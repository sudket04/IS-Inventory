/* ============================================================================
   IS-Inventory — IT Inventory Management System
   Module v1.8 : Per-menu, per-user permissions — Role เป็นค่าเริ่มต้น +
                 Override รายบุคคล

   Requires: 02, 04 ต้องรันสำเร็จก่อน (ต้องมี dbo.roles และ dbo.users)

   สรุปสิ่งที่เพิ่ม
   ----------------
   1. dbo.menus — Registry ของเมนู/โมดูลที่ตรวจสิทธิ์ได้ (ผูกกับ "เมนู" ไม่ใช่
      Controller/Route ตรงๆ กันสิทธิ์หลุดเวลาเปลี่ยน URL ภายใน)
   2. dbo.role_menu_permissions — ค่าเริ่มต้นต่อ Role x เมนู (View/Create/Edit/
      Delete) Seed ให้ตรงกับ Policy ที่ Hardcode อยู่ในโค้ดตอนนี้ทุกตัว ไม่มี
      พฤติกรรมเปลี่ยนสำหรับผู้ใช้ที่ยังไม่ถูก Override
   3. dbo.user_menu_permissions — Override รายคนแบบ Sparse: NULL แปลว่า "ใช้
      ค่า Role" ส่วนที่มีค่า (0/1) แปลว่า Admin ตั้ง Override ไว้เฉพาะจุดนั้น
      ไม่ต้องมีครบทุกเมนูทุกคน

   สิ่งที่ไม่เปลี่ยน
   -----------------
   - Endpoint ที่เป็น "ข้อมูลอ้างอิงข้ามหน้า" (PickersController ทั้งตัว, และ
     GET ของ LocationsController ที่ใช้เป็น Location Picker ในฟอร์มอื่นๆ) ไม่
     ผูกกับระบบนี้ ยังคงเป็น AnyRole เหมือนเดิม เพราะไม่ใช่ "เมนู" ที่ผู้ใช้เข้า
     ตรงๆ แต่เป็นข้อมูลพื้นฐานที่ทุกหน้าฟอร์มต้องใช้ร่วมกัน
   ========================================================================== */

CREATE TABLE dbo.menus (
    menu_id     INT IDENTITY(1,1) NOT NULL,
    menu_key    VARCHAR(50)   NOT NULL,
    name        NVARCHAR(100) NOT NULL,
    sort_order  INT NOT NULL CONSTRAINT DF_menus_sort DEFAULT (0),
    CONSTRAINT PK_menus PRIMARY KEY CLUSTERED (menu_id),
    CONSTRAINT UX_menus_key UNIQUE (menu_key)
);
GO

CREATE TABLE dbo.role_menu_permissions (
    role_id     INT NOT NULL,
    menu_id     INT NOT NULL,
    can_view    BIT NOT NULL CONSTRAINT DF_rmp_view   DEFAULT (0),
    can_create  BIT NOT NULL CONSTRAINT DF_rmp_create DEFAULT (0),
    can_edit    BIT NOT NULL CONSTRAINT DF_rmp_edit   DEFAULT (0),
    can_delete  BIT NOT NULL CONSTRAINT DF_rmp_delete DEFAULT (0),
    CONSTRAINT PK_role_menu_permissions PRIMARY KEY CLUSTERED (role_id, menu_id),
    CONSTRAINT FK_rmp_role FOREIGN KEY (role_id) REFERENCES dbo.roles(role_id),
    CONSTRAINT FK_rmp_menu FOREIGN KEY (menu_id) REFERENCES dbo.menus(menu_id)
);
GO

CREATE TABLE dbo.user_menu_permissions (
    user_id     INT NOT NULL,
    menu_id     INT NOT NULL,
    can_view    BIT NULL,   -- NULL = สืบทอดจาก role_menu_permissions
    can_create  BIT NULL,
    can_edit    BIT NULL,
    can_delete  BIT NULL,
    updated_at  DATETIMEOFFSET NOT NULL CONSTRAINT DF_ump_updated_at DEFAULT (SYSDATETIMEOFFSET()),
    updated_by  INT NULL,
    CONSTRAINT PK_user_menu_permissions PRIMARY KEY CLUSTERED (user_id, menu_id),
    CONSTRAINT FK_ump_user       FOREIGN KEY (user_id)    REFERENCES dbo.users(user_id),
    CONSTRAINT FK_ump_menu       FOREIGN KEY (menu_id)    REFERENCES dbo.menus(menu_id),
    CONSTRAINT FK_ump_updated_by FOREIGN KEY (updated_by) REFERENCES dbo.users(user_id)
);
GO

/* ข้อมูลตั้งต้น — รายการเมนู (ตรงกับ frontend/src/lib/nav.ts) */
INSERT INTO dbo.menus (menu_key, name, sort_order) VALUES
    ('dashboard',                        N'Dashboard',                         1),
    ('assets',                           N'Assets',                            2),
    ('server_inventory',                 N'Server Inventory',                  3),
    ('clusters',                         N'Clusters',                          4),
    ('server_list',                      N'Server List',                       5),
    ('racks',                            N'Racks',                             6),
    ('vlans',                            N'VLANs',                             7),
    ('software',                         N'Software',                          8),
    ('contracts',                        N'Contracts',                         9),
    ('reports',                          N'Reports',                          10),
    ('import',                           N'Import',                           11),
    ('file_shares',                      N'File Shares',                      12),
    ('internet_policies',                N'Internet Policies',                13),
    ('audit_logs',                       N'Audit Logs',                       14),
    ('admin_users',                      N'Admin: Users',                     15),
    ('admin_locations',                  N'Admin: Locations',                 16),
    ('admin_master_data',                N'Admin: Master Data',               17),
    ('admin_classification_visibility',  N'Admin: Classification Visibility', 18),
    ('admin_settings',                   N'Admin: Settings',                  19);
GO

/* ข้อมูลตั้งต้น — สิทธิ์เริ่มต้นต่อ Role x เมนู
   กลุ่ม A: หน้า CRUD ทั่วไป          — View ทั้ง 4 Role, Create/Edit/Delete เฉพาะ ADMIN/IT_STAFF
   กลุ่ม B: หน้า Read-only มี Auditor  — View เฉพาะ ADMIN/IT_STAFF/AUDITOR ไม่มี Create/Edit/Delete
   กลุ่ม C: Dashboard                 — View ทั้ง 4 Role ไม่มี Create/Edit/Delete
   กลุ่ม D: หน้า Admin ล้วน            — View/Create/Edit/Delete เฉพาะ ADMIN
   กลุ่ม E: Import (ยังไม่มีหน้าจริง)  — View/Create เฉพาะ ADMIN/IT_STAFF ไม่มี Edit/Delete   */
INSERT INTO dbo.role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete)
SELECT
    r.role_id,
    m.menu_id,
    CASE grp.pattern
        WHEN 'D' THEN CASE WHEN r.code = 'ADMIN' THEN 1 ELSE 0 END
        WHEN 'B' THEN CASE WHEN r.code IN ('ADMIN','IT_STAFF','AUDITOR') THEN 1 ELSE 0 END
        WHEN 'E' THEN CASE WHEN r.code IN ('ADMIN','IT_STAFF') THEN 1 ELSE 0 END
        ELSE 1 -- A, C: ทุก Role มองเห็นได้
    END AS can_view,
    CASE grp.pattern
        WHEN 'A' THEN CASE WHEN r.code IN ('ADMIN','IT_STAFF') THEN 1 ELSE 0 END
        WHEN 'D' THEN CASE WHEN r.code = 'ADMIN' THEN 1 ELSE 0 END
        WHEN 'E' THEN CASE WHEN r.code IN ('ADMIN','IT_STAFF') THEN 1 ELSE 0 END
        ELSE 0 -- B, C: ไม่มี Create
    END AS can_create,
    CASE grp.pattern
        WHEN 'A' THEN CASE WHEN r.code IN ('ADMIN','IT_STAFF') THEN 1 ELSE 0 END
        WHEN 'D' THEN CASE WHEN r.code = 'ADMIN' THEN 1 ELSE 0 END
        ELSE 0 -- B, C, E: ไม่มี Edit
    END AS can_edit,
    CASE grp.pattern
        WHEN 'A' THEN CASE WHEN r.code IN ('ADMIN','IT_STAFF') THEN 1 ELSE 0 END
        WHEN 'D' THEN CASE WHEN r.code = 'ADMIN' THEN 1 ELSE 0 END
        ELSE 0 -- B, C, E: ไม่มี Delete
    END AS can_delete
FROM dbo.roles r
CROSS JOIN dbo.menus m
CROSS APPLY (
    SELECT CASE m.menu_key
        WHEN 'admin_users'                     THEN 'D'
        WHEN 'admin_locations'                 THEN 'D'
        WHEN 'admin_master_data'               THEN 'D'
        WHEN 'admin_classification_visibility' THEN 'D'
        WHEN 'admin_settings'                  THEN 'D'
        WHEN 'reports'                         THEN 'B'
        WHEN 'audit_logs'                      THEN 'B'
        WHEN 'dashboard'                       THEN 'C'
        WHEN 'import'                          THEN 'E'
        ELSE 'A'
    END AS pattern
) grp;
GO
