/* ============================================================================
   IS-Inventory — IT Inventory Management System
   Module v1.9 : User Site + Team — สองฟิลด์บังคับใหม่บนบัญชีผู้ใช้

   Requires: 02 ต้องรันสำเร็จก่อน (ต้องมี dbo.users)

   สรุปสิ่งที่เพิ่ม
   ----------------
   1. dbo.user_sites — Lookup คงที่ 2 รายการ (1st Site / 2nd Site) แยกต่างหากจาก
      dbo.vlan_sites เดิมโดยตั้งใจ — vlan_sites ผูกกับ Network/VLAN Infrastructure
      (ชื่อจริงของสถานที่ ขยายได้) ส่วนตัวนี้เป็น Field เฉพาะของบัญชีผู้ใช้ ไม่เกี่ยวกัน
   2. dbo.user_teams — Lookup คงที่ 3 รายการ (Admin Team / Support Team / Develop Team)
   3. dbo.users เพิ่มคอลัมน์ site_id, team_id — NOT NULL (บังคับเลือกเสมอ) — Backfill
      บัญชีเดิมทุกบัญชีเป็นค่า Default (1st Site + Admin Team) ก่อนเปลี่ยนเป็น NOT NULL

   หมายเหตุ Temporal Table (ทดสอบจริงกับ SQL Server แล้วจึงเขียนตามลำดับนี้)
   ---------------------------------------------------------------------------
   dbo.users เป็น System-Versioned Temporal Table จึงต้อง:
   a) ปิด SYSTEM_VERSIONING ก่อนแก้โครงสร้าง (เหมือน server_details ใน v1.7)
   b) SQL Server กำหนดว่า **Nullability ของคอลัมน์ต้องตรงกันทั้งตารางหลักและตาราง
      ประวัติ** ก่อนเปิด Versioning กลับได้ — จึงต้อง Backfill + ALTER COLUMN NOT NULL
      บน users_history ด้วย ไม่ใช่แค่ตารางหลักเหมือนกรณีอื่นที่ผ่านมา (ที่คอลัมน์ใหม่
      ยังเป็น NULL ได้ทั้งคู่เลยไม่ชนปัญหานี้)
   c) ต้อง DROP INDEX ก่อน ALTER COLUMN แล้ว CREATE INDEX ใหม่ทีหลัง — SQL Server ไม่ให้
      เปลี่ยน Nullability ของคอลัมน์ที่มี Index อยู่ตรงๆ
   ========================================================================== */

CREATE TABLE dbo.user_sites (
    site_id     TINYINT        NOT NULL,
    code        VARCHAR(20)    NOT NULL,
    name        NVARCHAR(50)   NOT NULL,
    sort_order  INT            NOT NULL CONSTRAINT DF_user_sites_sort DEFAULT (0),
    CONSTRAINT PK_user_sites PRIMARY KEY CLUSTERED (site_id),
    CONSTRAINT UX_user_sites_code UNIQUE (code)
);
GO

CREATE TABLE dbo.user_teams (
    team_id     TINYINT        NOT NULL,
    code        VARCHAR(20)    NOT NULL,
    name        NVARCHAR(50)   NOT NULL,
    sort_order  INT            NOT NULL CONSTRAINT DF_user_teams_sort DEFAULT (0),
    CONSTRAINT PK_user_teams PRIMARY KEY CLUSTERED (team_id),
    CONSTRAINT UX_user_teams_code UNIQUE (code)
);
GO

INSERT INTO dbo.user_sites (site_id, code, name, sort_order) VALUES
    (1, 'SITE_1', N'1st Site', 1),
    (2, 'SITE_2', N'2nd Site', 2);
GO

INSERT INTO dbo.user_teams (team_id, code, name, sort_order) VALUES
    (1, 'ADMIN_TEAM',   N'Admin Team',   1),
    (2, 'SUPPORT_TEAM', N'Support Team', 2),
    (3, 'DEVELOP_TEAM', N'Develop Team', 3);
GO

/* -- ปิด System Versioning ชั่วคราวเพื่อแก้โครงสร้าง dbo.users -- */
ALTER TABLE dbo.users SET (SYSTEM_VERSIONING = OFF);
GO

ALTER TABLE dbo.users ADD site_id TINYINT NULL;
ALTER TABLE dbo.users ADD team_id TINYINT NULL;
GO
ALTER TABLE dbo.users_history ADD site_id TINYINT NULL;
ALTER TABLE dbo.users_history ADD team_id TINYINT NULL;
GO

-- Backfill ทั้งตารางหลักและตารางประวัติเป็นค่า Default (1st Site + Admin Team) — ต้องทำทั้งคู่
-- เพราะ SQL Server บังคับให้ Nullability ตรงกันก่อนเปิด Versioning กลับได้ (ดูหมายเหตุด้านบน)
UPDATE dbo.users SET site_id = 1 WHERE site_id IS NULL;
UPDATE dbo.users SET team_id = 1 WHERE team_id IS NULL;
UPDATE dbo.users_history SET site_id = 1 WHERE site_id IS NULL;
UPDATE dbo.users_history SET team_id = 1 WHERE team_id IS NULL;
GO

ALTER TABLE dbo.users ALTER COLUMN site_id TINYINT NOT NULL;
ALTER TABLE dbo.users ALTER COLUMN team_id TINYINT NOT NULL;
GO
ALTER TABLE dbo.users_history ALTER COLUMN site_id TINYINT NOT NULL;
ALTER TABLE dbo.users_history ALTER COLUMN team_id TINYINT NOT NULL;
GO

ALTER TABLE dbo.users ADD CONSTRAINT FK_users_site FOREIGN KEY (site_id) REFERENCES dbo.user_sites(site_id);
ALTER TABLE dbo.users ADD CONSTRAINT FK_users_team FOREIGN KEY (team_id) REFERENCES dbo.user_teams(team_id);
GO

CREATE INDEX IX_users_site ON dbo.users(site_id);
CREATE INDEX IX_users_team ON dbo.users(team_id);
GO

/* -- เปิด System Versioning กลับ -- */
ALTER TABLE dbo.users SET (SYSTEM_VERSIONING = ON
    (HISTORY_TABLE = dbo.users_history, DATA_CONSISTENCY_CHECK = ON));
GO
