# HANDOFF — สรุปสถานะโปรเจกต์เพื่อส่งต่อ
## KKND — IT Inventory Management System

| หัวข้อ | รายละเอียด |
|---|---|
| **Repository** | `sudket04/KKND` |
| **Branch ที่ใช้พัฒนา** | `claude/zealous-hamilton-hn3ggp` (ห้าม push ไป branch อื่น) |
| **อัปเดตล่าสุด** | 2569-09-20 · commit `PENDING` (จะแก้เป็น Hash จริงหลัง Push) |
| **สถานะโดยรวม** | ✅ Phase 1–3 เสร็จ · 🟡 **Phase 4 (Development) — Sprint 0 + Sprint 1 + Sprint 2 เสร็จ** |
| **โค้ดโปรแกรม** | 🟡 **Login/RBAC + Master Data CRUD 11 หน้า + Asset CRUD (Server/Network) พร้อม Pagination/Search ทำงานจริง** (ดู §4.5, §4.6) — ทดสอบ End-to-End กับ SQL Server จริงแล้ว — Asset หมวดอื่นและ VLAN/Contract ยังไม่เริ่ม (Sprint 3+) |

---

## 1. วิธีทำงานร่วมกับผู้ใช้ (สำคัญ — อ่านก่อนเริ่ม)

| กติกา | รายละเอียด |
|---|---|
| **ภาษา** | ตอบเป็น **ภาษาไทย** ใช้ศัพท์เทคนิคภาษาอังกฤษตามปกติ |
| **ถามก่อนทำ** | ผู้ใช้เคยสั่งชัดเจนว่า **"ถามรายละเอียดให้ครบก่อนค่อยดำเนินการ"** — ห้ามลงมือโดยไม่ยืนยันก่อน |
| **รูปแบบคำถาม** | ใช้ `AskUserQuestion` ครั้งละไม่เกิน 4 ข้อ พร้อมติดป้าย (แนะนำ) ที่ตัวเลือกที่เสนอ |
| **เมื่อพบข้อขัดแย้ง** | ชี้ให้เห็นตรงๆ พร้อมเหตุผล แล้วเสนอทางแก้ — ผู้ใช้ตอบรับข้อเสนอเชิงเทคนิคเสมอเมื่อมีเหตุผลรองรับ |
| **ทุกครั้งที่ส่งงาน** | เขียนไฟล์ → commit → push → `SendUserFile` → สรุปในแชตแบบกระชับ |
| **ผู้ใช้ชอบ** | ตารางเปรียบเทียบ · Mermaid diagram · ASCII wireframe · การระบุเหตุผลกำกับทุกการตัดสินใจ |

---

## 2. ภาพรวมโปรเจกต์

ระบบบริหารทรัพย์สิน IT แบบรวมศูนย์สำหรับใช้ภายในองค์กร ติดตั้งแบบ On-Premise

| หัวข้อ | ค่า |
|---|---|
| ขนาดข้อมูล | **> 2,000 รายการ** (ออกแบบรองรับ 10,000) |
| ผู้ใช้ | ~20 บัญชี · ใช้พร้อมกัน 10–15 · ออกแบบรองรับ 50 |
| ข้อมูลเดิม | Excel / Google Sheets → ต้อง Import |
| ฐานข้อมูล | **Microsoft SQL Server** (2019+) On-Premise |
| ภาษาหน้าเว็บ | **English ทั้งหมด** |
| ธีม | รองรับทั้ง Light และ Dark Mode |
| อุปกรณ์ | Desktop-first + มือถือดูข้อมูลได้ |

**Role 4 ระดับ (RBAC, Global Scope ไม่มี Row-Level Security):**
`ADMIN` · `IT_STAFF` · `AUDITOR` · `VIEWER`

**Authentication:** Local Username/Password + Argon2id (ไม่มี SSO ใน MVP แต่เตรียม `external_id` ไว้แล้ว)

---

## 3. สถานะแต่ละ Phase

| Phase | สถานะ | เอกสาร |
|:---:|---|---|
| **1. Requirement** | ✅ เสร็จ | `docs/PRD.md` |
| **2. UI/UX Design** | ✅ เสร็จ | `docs/design/01` `02` `03` |
| **3. Database** | ✅ เสร็จ (v1.0 → v1.6) — ทดสอบรันจริงบน SQL Server แล้ว | `docs/database/01`–`15` |
| **4. Development** | 🟡 Sprint 0 + Sprint 1 + Sprint 2 เสร็จ | `docs/ROADMAP.md` §1.3–§1.5 |

---

## 4. รายการไฟล์ทั้งหมด (13,349 บรรทัด)

### 4.1 Requirement
| ไฟล์ | บรรทัด | เนื้อหา |
|---|---:|---|
| `docs/PRD.md` | 494 | 60+ Functional Requirements · 15 NFR · Permission Matrix · Roadmap Sprint 0-6 |
| `docs/ROADMAP.md` | 125 | Pre-Flight Checklist · Sprint 0–10 เต็มรูปแบบ · งานคู่ขนาน · Go-Live Checklist |

### 4.2 UI/UX Design
| ไฟล์ | บรรทัด | เนื้อหา |
|---|---:|---|
| `docs/design/01-user-flow.md` | 383 | IA · User Flow 8 เส้นทาง · UI State 5 สถานะ · กฎการยืนยัน |
| `docs/design/02-wireframes.md` | 855 | Wireframe 9 หน้า + เวอร์ชันมือถือ + สถานะพิเศษ |
| `docs/design/03-design-system.md` | 561 | Design Token · Component Spec 8 ตัว · ผลตรวจ WCAG AA |
| `docs/design/04-settings-screens.md` | 515 | หน้าตั้งค่า 8 กลุ่ม 25 หน้า · รูปแบบร่วม · กฎการลบข้อมูลหลัก |

### 4.3 Database — เอกสารออกแบบ
| ไฟล์ | บรรทัด | เนื้อหา |
|---|---:|---|
| `01-database-design.md` | 783 | ER Diagram 7 โดเมน · Index Strategy · คำตอบ Open Questions |
| `03-data-dictionary.md` | 270 | ความหมายเชิงธุรกิจรายคอลัมน์ |
| `05-vlan-module-design.md` | 390 | ตรรกะคำนวณ IP · Wireframe หน้า VLAN |
| `07-module-v1.2-design.md` | 454 | Server Roles · Storage/Cluster · DHCP Control |
| `08-taxonomy-proposal.md` | 528 | ผังประเภท 110 Subtype · Cascading 4 ชุด |
| `09-master-asset-contract-history.md` | 432 | Master Asset · MA History · Temporal Tables |
| `13-permission-control-proposal.md` | 439 | สิทธิ์ File Server / Internet · Collector · ข้อจำกัดที่ต้องยอมรับ |

### 4.4 Database — SQL (⚠️ รันตามลำดับเลขไฟล์)
| ลำดับ | ไฟล์ | บรรทัด | เนื้อหา |
|:---:|---|---:|---|
| 1 | `02-schema-sqlserver.sql` | 1,055 | v1.0 — 25 ตารางหลัก · 5 View · 3 SP · Trigger Append-Only |
| 2 | `04-vlan-module.sql` | 803 | v1.1 — VLAN/IPAM · Zone · IP Validation · Site (สาขา) · Secondary Subnet/Untagged |
| 3 | `06-module-v1.2.sql` | 750 | v1.2 — Server Roles · Cluster · Storage Volume · DHCP Control |
| 4 | `10-module-v1.3a-taxonomy.sql` | 863 | v1.3a — asset_types · device_models |
| 5 | `11-module-v1.3b-details-rack-ipam.sql` | 713 | v1.3b — ตารางขยาย 4 หมวด · Rack · IPAM |
| 6 | `12-module-v1.4-contracts-temporal.sql` | 746 | v1.4 — Master Asset · Contracts · Temporal |
| 7 | `14-module-v1.5-permission-control.sql` | 1,695 | v1.5 — สิทธิ์ File Server / Internet · AD Sync · ประวัติสิทธิ์ |
| 8 | `15-module-v1.6-server-applications.sql` | 110 | v1.6 — Application บน Server · เชื่อม Port/Link/ผู้รับผิดชอบ/แผนก/สาขา |

> ✅ **ทดสอบรันจริงแล้ว** (20 ก.ย. 2569) บน SQL Server 2022 (Docker) ตามลำดับไฟล์ครบทั้ง 8 ไฟล์
> ไม่มี Error เหลือ — เจอและแก้บั๊ก 6 จุดที่ Static Review จับไม่ได้ ดูรายละเอียดที่ §4.4.1
> และปรับโครงสร้าง VLAN + เพิ่มโมดูล Application ตามข้อมูลจริงที่ผู้ใช้ให้มา ดู §4.4.2

### 4.4.1 บั๊ก 6 จุดที่พบจากการรันจริง (แก้แล้วทั้งหมด)

| # | ไฟล์ | ปัญหา | อาการ | วิธีแก้ |
|:---:|---|---|---|---|
| 1 | ทั้ง 7 ไฟล์ | ไม่มี `SET QUOTED_IDENTIFIER ON` ต้นไฟล์ | `CREATE TABLE`/`INDEX` ที่มี Computed Column ล้มเหลว (SSMS ตั้งให้อัตโนมัติ แต่ sqlcmd/CI ไม่ตั้ง) | เพิ่ม `SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON;` ต้นไฟล์ทั้ง 7 ไฟล์ |
| 2 | `04-vlan-module.sql` | `fn_ipv4_to_bigint` ใช้ `PARSENAME()` ซึ่ง SQL Server จัดเป็น Non-Deterministic | `PERSISTED` Computed Column 3 คอลัมน์สร้างไม่ได้ (Msg 4936) | เขียนใหม่ด้วย `CHARINDEX`/`SUBSTRING` (Deterministic) |
| 3 | `04-vlan-module.sql` | `vw_vlan_summary` มี `SUM(CASE WHEN EXISTS(...))` — Subquery อยู่ในอาร์กิวเมนต์ของ Aggregate โดยตรง | Msg 130 "Cannot perform an aggregate function..." | คำนวณ Flag ใน Derived Table ชั้นในก่อน แล้วค่อย `SUM` ที่ชั้นนอก |
| 4 | `12-module-v1.4...sql` | `DROP INDEX IX_assets_list_covering` อยู่ **หลัง** `ALTER TABLE DROP COLUMN` ทั้งที่ Index นี้ก็ `INCLUDE coverage_end_date` | Msg 4922 Column ถูกอ้างถึงโดย Object อื่น | ย้าย `DROP INDEX` มาไว้ก่อน `DROP COLUMN` |
| 5 | `12-` และ `14-...sql` | `DEFAULT SYSUTCDATETIME()` ตรงๆ ใน Loop ที่ ALTER หลายสิบตารางติดกัน | Msg 13542 "start of period set to a value in the future" (สุ่มตามจังหวะ) | ใช้ `DATEADD(SECOND, -2, SYSUTCDATETIME())` กันชนเวลา |
| 6 | `14-...sql` | ก. ชื่อ Constraint `DF_ip_created`/`FK_ip_created_by` ชนกับ `ip_addresses` (ไฟล์ 11) และ `DF_ca_created` ชนกับ `contract_assets` (ไฟล์ 12) — SQL Server บังคับชื่อ Constraint ไม่ซ้ำทั้งฐานข้อมูล<br>ข. Unique Index บน `NVARCHAR(1000)` ยาวเกิน Limit 1700 byte<br>ค. `EXEC(N'...' + QUOTENAME(@db) + ...)` — รูปแบบ Execute String ไม่รับ Function Call ตรงๆ ในวงเล็บ | Msg 2714 / Warning Key ยาวเกิน / Msg 102 | ก. เปลี่ยน Prefix เป็น `intpol`/`cagt`<br>ข. Unique บน `HASHBYTES('SHA2_256', ...)` แทน (Deterministic เช่นกัน)<br>ค. ประกอบ String ใส่ตัวแปรก่อน ค่อย `EXEC sp_executesql` |

**Object ที่ยืนยันแล้วว่าตรงกับที่ออกแบบไว้ (นับจาก DB จริงหลังรันครบ 8 ไฟล์):**
66 ตาราง · 45 ตารางประวัติ (Temporal) · 45 ตารางประวัติเงา (History) · 45 View · 10 Trigger · 5 Function · 3 SP
(ตัวเลข Temporal แก้จาก 46 เป็น 45 ตามที่นับได้จริง — ค่าก่อนหน้าเป็นการประมาณจากเอกสารก่อนทดสอบ)

### 4.4.2 ปรับโครงสร้าง VLAN + เพิ่มโมดูล Application (20 ก.ย. 2569)

ผู้ใช้ให้ข้อมูล VLAN จริงจากหน้างาน (Excel) มาตรวจสอบว่าออกแบบครอบคลุมหรือไม่ พบช่องว่าง
3 จุด และมีคำขอโมดูลใหม่ 1 จุด — แก้ไขและทดสอบกับข้อมูลจริงแล้วทั้งหมด:

| # | สิ่งที่พบ/ขอ | สิ่งที่แก้ | ตัดสินใจแบบ |
|:---:|---|---|---|
| 1 | **VLAN เดียวมีได้หลาย Subnet** — ข้อมูลจริงแสดง VLAN 4 ปรากฏ 5 ครั้งบนอุปกรณ์เดียวกัน (mcp-1) คนละ Subnet โดยมี 1 Primary + 4 Secondary (Secondary IP บน Core Switch จริง) | ยกเลิก `UNIQUE(vlan_number)` เดิม เพิ่มคอลัมน์ `network_level` (PRIMARY/SECONDARY) — 1 แถว = 1 VLAN+Subnet ตรงกับที่ Excel เก็บจริง | เลือก**แบบ Flat** (ไม่แยกตาราง VLAN/Subnet) เพราะ Excel ต้นทางก็เก็บแบบนี้อยู่แล้ว ลดความเสี่ยงจากการรื้อ Schema ที่ทดสอบผ่านแล้ว |
| 2 | **Untagged VLAN** — Firewall บางจุดตั้งค่าแบบไม่ติด Tag 802.1Q | เพิ่ม `is_untagged BIT` + `vlan_number` เปลี่ยนเป็น `NULL` ได้ พร้อม CHECK บังคับ 2 ค่านี้สอดคล้องกันเสมอ | — |
| 3 | **Static/DHCP หลายช่วง** — อาจมี Static 2 ช่วง หรือ DHCP 2 Scope ในซับเน็ตเดียว | **ไม่ต้องแก้อะไร** — `vlan_ip_ranges` รองรับหลายแถวต่อ VLAN อยู่แล้วตั้งแต่ออกแบบครั้งแรก ทดสอบกับข้อมูลจริง (DHCP 2 Scope รวม 306 IP) ผ่าน | ยืนยันของเดิมเพียงพอ |
| 4 | **DHCP Server ที่ยังไม่มีใน Asset** (เช่น "EIEISVR") | เพิ่ม `dhcp_server_name_raw` เป็นช่องกรอกชื่อสำรอง แยกจาก `dhcp_server_asset_id` (FK) — พบระหว่างทดสอบกับข้อมูลจริง ไม่ใช่ในคำขอเดิม | รูปแบบเดียวกับ `ad_group_name_raw` ในไฟล์ 14 |
| 5 | **หน้าจัดเก็บ Application บน Server** (Server/Type/App Name/Port/Link/ผู้รับผิดชอบ/แผนก) | ไฟล์ใหม่ `15-module-v1.6-server-applications.sql` — ตาราง `server_applications` + View `vw_server_applications` | ใช้ `dbo.server_roles` ซ้ำเป็น "ประเภท Server" เสริม ไม่สร้าง Lookup ใหม่ซ้อน |
| — | **ขอบเขต Site (1st/2nd Site)** — ผู้ใช้ขอให้ "ทุกหน้า" มี Site ให้เลือก | ยืนยันกับผู้ใช้แล้วว่าจำกัดเฉพาะ VLAN + โมดูลใหม่ (`server_applications`) เท่านั้น — ตาราง 65 ตารางเดิมยังใช้ `dbo.locations` ตามปกติ ไม่แตะ | ป้องกันงานลามไปทั้งระบบโดยไม่จำเป็น |

**ทดสอบยืนยันกับข้อมูลจริงแล้ว:** Insert สถานการณ์ VLAN 4 (1 Primary + 4 Secondary), Untagged
(ThinServer), VLAN 152 (DHCP 2 Scope รวม 306 IP), และตรวจว่า Index กันซ้ำ (`UX_vlans_primary_per_device`)
ปฏิเสธการเพิ่ม Primary ซ้ำสำหรับ VLAN+อุปกรณ์เดียวกันได้ถูกต้อง — พบและแก้ Bug เพิ่ม 1 จุด:
View ตรวจสอบ (`vw_vlan_validation_issues` ข้อ 8) เดิมจับคู่ Primary/Secondary ด้วย `vlan_number`
ทำให้เตือนผิดพลาดกรณี Secondary มีเลข VLAN แต่ Primary เป็น Untagged (พบจริงในข้อมูลตัวอย่าง
"ThinServer") แก้เป็นจับคู่ด้วยชื่อ VLAN (`name`) แทน

---

### 4.5 Backend/Frontend — Sprint 1: Auth + RBAC + Layout (20 ก.ย. 2569)

ทำต่อจาก Sprint 0 Scaffolding — Login ใช้งานได้จริง มี RBAC 4 บทบาท จัดการผู้ใช้ได้
และมี Layout หลัก (Sidebar/Topbar/Dark Mode) ตาม `docs/design/01-user-flow.md` §1–2

**⚠️ ปรับจากแผนเดิมใน ROADMAP:** แผนเขียนว่า "ASP.NET Core Identity" แต่ Schema ที่ออกแบบไว้แล้ว
(`02-schema-sqlserver.sql`) เป็นตาราง `users`/`roles`/`refresh_tokens` **ของเราเอง** ไม่ใช่รูปแบบ
`AspNetUsers`/`AspNetRoles` ของ Identity — จึงเขียน Auth Service เองแทนการเรียก `AddIdentity<>()`
(หลักการเดียวกัน: Argon2id + JWT + Refresh Token Rotation ตามที่ออกแบบไว้ใน §10) เพื่อไม่ต้องรื้อ
Schema ที่ทดสอบผ่านแล้ว

| ส่วน | รายละเอียด |
|---|---|
| **Argon2id Password Hasher** | `backend/src/KKND.Infrastructure/Security/Argon2PasswordHasher.cs` — เข้ารหัส/ตรวจสอบด้วยรูปแบบ PHC string มาตรฐาน (`$argon2id$v=19$m=,t=,p=$salt$hash`) พารามิเตอร์ m=64MiB, t=3, p=2 |
| **JWT + Refresh Token** | Access Token อายุ 15 นาที (Claim: user id/username/role) + Refresh Token 7 วัน เก็บ SHA-256 Hash ใน `refresh_tokens`, หมุนเวียน (Rotate) ทุกครั้งที่ Refresh, ส่งผ่าน HttpOnly+Secure+SameSite=Strict Cookie |
| **Login Flow ตาม §2.1** | ข้อความ Error ไม่บอกว่าผิดที่ Username หรือ Password (กัน User Enumeration) · ล็อกบัญชี 15 นาทีหลังผิดครบ 5 ครั้ง (FR-AU-03/04) · บันทึก Audit Log ทุก Outcome (`LOGIN`/`LOGIN_FAILED`/`USER_LOCKED`/`LOGOUT`) |
| **RBAC 4 บทบาท** | Policy `Admin`/`ItStaffOrAbove`/`AuditorOrAbove`/`AnyRole` ผ่าน `[Authorize(Policy=...)]` — ตรวจที่ Server ทุก Endpoint ตาม NFR-06 |
| **User Management (FR-AU-05/08/09)** | `UsersController` — สร้าง/แก้ไข Role/Deactivate (ไม่ลบจริง) · Admin Reset รหัสผ่านผู้ใช้อื่น · ผู้ใช้เปลี่ยนรหัสผ่านตนเองผ่าน `PUT /api/auth/password` · บังคับนโยบายรหัสผ่านขั้นต่ำ 8 ตัวอักษร มีทั้งตัวอักษรและตัวเลข (FR-AU-06) |
| **Frontend: Login + Auth Context** | `frontend/src/lib/auth/auth-context.tsx` — Access Token เก็บใน Memory เท่านั้น (ไม่ใช้ localStorage กัน XSS) · ตอนเปิดหน้าเว็บลองยิง `/api/auth/refresh` เงียบๆ ก่อน เพื่อกู้ Session จาก Cookie เดิม |
| **Frontend: Layout หลัก** | `frontend/src/components/layout/` — Sidebar ยุบ/ขยายได้ + เมนูกรองตาม Role (ตารางใน §1.2 ของ User Flow) · Topbar (Search/Notification/Theme Toggle/User Menu) · หน้า Login แยก Route Group `(app)` ป้องกัน (Redirect ไป `/login` ถ้ายังไม่ Login) |
| **Admin > Users หน้าจัดการผู้ใช้** | `frontend/src/app/(app)/admin/users/page.tsx` — ตารางผู้ใช้ + ฟอร์มสร้างผู้ใช้ใหม่ + ปุ่ม Deactivate/Reactivate เรียก API จริง |

**ทดสอบยืนยันกับ Backend + SQL Server จริงแล้ว (ไม่ใช่แค่ Build ผ่าน):**
Login ผิดรหัส/ผิด Username ได้ข้อความเดียวกัน (401) · Login ถูกต้องได้ Access Token + Cookie ·
`GET /api/auth/me` ยืนยัน Role จาก Token · `POST /api/auth/refresh` หมุน Token สำเร็จ ·
ผิดรหัสครบ 5 ครั้งล็อกบัญชี 15 นาที (HTTP 423) แม้ครั้งถัดไปจะกรอกถูกก็ยังถูกบล็อกจนกว่าจะหมดเวลา ·
`POST /api/auth/logout` เพิกถอน Refresh Token จริง (Refresh หลัง Logout ได้ 401) ·
Audit Log บันทึกครบทุก Outcome · ทดสอบ UI ด้วย Playwright ครบ 6 ขั้นตอน (Redirect ไป Login →
Error ข้อความ → Login สำเร็จเห็น Dashboard → สลับ Dark Mode → เข้าเมนู Admin > Users →
Logout กลับไปหน้า Login)

---

### 4.6 Backend/Frontend — Sprint 2: Master Data CRUD + Asset CRUD (20 ก.ย. 2569)

**Master Data (12 หน้ารูปแบบร่วม ตาม `docs/design/04-settings-screens.md` §4) — ทำ 11 จาก 12**

| ส่วน | รายละเอียด |
|---|---|
| Backend | `LookupsControllerBase<TEntity,TDto>` ตัวเดียว ครอบคลุม List/Create/Update/Toggle-Active/Usage/Delete — Controller จริง 11 ตัว (แผนก, หมวดหมู่ทรัพย์สิน, ผู้ผลิต, ผู้ขาย, สถานะทรัพย์สิน, บทบาท Server, ประเภทความสัมพันธ์, โซนเครือข่าย, ชั้นความลับ, ระดับสิทธิ์, หมวดหมู่เว็บไซต์) เหลือแค่ Config + DTO ไม่ใช่ Logic ซ้ำ |
| กฎการลบ (§5 ของเอกสารออกแบบ) | ลบไม่ได้ถ้ายังมีการอ้างอิง — คืนจำนวนที่อ้างอิงกลับไปให้ UI แสดงและเสนอ "ปิดใช้งานแทน" ยืนยันแล้วว่า DB ปฏิเสธการลบข้อมูลที่มี Audit Log อ้างถึงจริง (Constraint ทำงานถูกต้องตามที่ออกแบบ) |
| **`device_models` ไม่ได้ทำรอบนี้** | ต้องมี UI เลือก `asset_type` แบบผังต้นไม้ก่อน (ยังไม่สร้าง) — ใส่ไว้ในหน้าที่ค้าง |
| Frontend | Component เดียว (`LookupPage` + `LookupFormDialog`) Config-driven — แต่ละหน้าเหลือแค่ Wrapper ~10 บรรทัด ตามเจตนาเอกสารออกแบบ ("เขียนส่วนประกอบเดียว 400 บรรทัด แทน 12 หน้า") |

**Asset CRUD — Server + Network Device**

| ส่วน | รายละเอียด |
|---|---|
| `sp_generate_asset_tag` / `sp_soft_delete_asset` | เรียกใช้ Stored Procedure เดิมที่มีอยู่แล้วตรงๆ (ผ่าน ADO.NET Output Parameter และ `ExecuteSqlInterpolatedAsync`) แทนการเขียน Logic ซ้ำใน C# — ได้ Concurrency Safety (`UPDLOCK`/`HOLDLOCK`) และการคืน Seat Software ตอนลบ (FR-AS-10) มาฟรี |
| Class Table Inheritance | `assets` + `server_details`/`network_details` ตามการตัดสินใจ #1 — Query เดียวด้วย EF Core Select Projection คำนวณ LEFT JOIN อัตโนมัติ ไม่ต้อง `Include()` ทุกจุด |
| Server-side Pagination + Search | `GET /api/assets?search=&category=&statusId=&departmentId=&page=&pageSize=` ค้นข้าม Asset Tag/ชื่อ/Serial/Hostname (FR-SE-01) — **ยังไม่รวม IP/VLAN** (รอ Sprint 3) |
| `PickersController` ใหม่ | Endpoint `/api/pickers/*` แยกจาก Lookups CRUD — คืนแค่ id+label ให้ทุก Role ใช้เติม Dropdown ในฟอร์ม (Lookups CRUD เป็น Admin-only แต่ทุกคนต้องสร้าง Asset ได้) |
| **`asset_type_id`/`model_id` ไม่ได้ใส่ในฟอร์มรอบนี้** | เหตุผลเดียวกับ `device_models` — รอผังต้นไม้ `asset_type` |
| **Parent Host / Uplink Asset** | ใส่เป็นช่องกรอก Asset ID ตรงๆ ก่อน (ยังไม่มี Autocomplete ค้นหา Asset) — ใช้งานได้จริงแต่ UX ยังพื้นฐาน |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** Master Data ทดสอบ List/Create/ปฏิเสธรหัสซ้ำ (409)/Usage Count/Deactivate/Delete
ผ่าน API ตรงๆ ครบทุก Endpoint บนตาราง `departments` แล้วขยายผลไปหน้าอื่นด้วย Component เดียวกัน
ทดสอบผ่าน UI จริงกับ `vendors`/`asset-statuses` ด้วย Playwright — Asset CRUD ทดสอบสร้าง Server
(ได้ Tag `SRV-2026-0001` อัตโนมัติ) และ Network Device (`NET-2026-0001`) ผ่าน API แล้วทดสอบ
List/Search/Filter/Update/Soft Delete ครบ จากนั้นทดสอบซ้ำผ่าน UI จริงด้วย Playwright
(สร้าง → ค้นหา → แก้ไข → เห็นผลในตาราง) และลบข้อมูลทดสอบออกจากฐานข้อมูลหลังทดสอบเสร็จ

---

## 5. โครงสร้างฐานข้อมูลปัจจุบัน

**66 ตาราง · 45 ตารางประวัติ (Temporal) · 45 View · 5 Function · 3 SP · 10 Trigger** (ยืนยันจากการรันจริง)

### 5.1 หมวดทรัพย์สิน 8 หมวด (Prefix ของ Asset Tag)

| Prefix | หมวด | ตารางขยาย |
|---|---|---|
| `SRV` | Server | `server_details` |
| `NET` | Network Device | `network_details` |
| `SFT` | Software License | `software_details` |
| `PC` | Computer | `computer_details` |
| `STG` | Storage | `storage_details` |
| `PWR` | Power & Cooling | `power_details` |
| `PER` | Peripheral | `peripheral_details` |
| `IOT` | Mobile & IoT/OT | `mobile_iot_details` |

**Asset Tag:** `[PREFIX]-[YYYY]-[NNNN]` สร้างโดย `sp_generate_asset_tag` (ใช้ `UPDLOCK`) · **ไม่นำรหัสกลับมาใช้ซ้ำ**

### 5.2 ผังประเภท 3 ชั้น
`asset_categories` (8) → `asset_types` level 1 (44 Type) → `asset_types` level 2 (110 Subtype)

ธงความสามารถใน `asset_types` ที่ขับเคลื่อนการกรอง Dropdown:
`is_virtual` · `is_rackable` + `default_u_height` · `requires_ip` · `can_host_vm` ·
`is_layer3` · `can_be_gateway` + `gateway_role_code` · `can_provide_dhcp` + `dhcp_source_code`

### 5.3 กลุ่มตารางหลัก

| กลุ่ม | ตาราง |
|---|---|
| Identity | `roles` `users` `refresh_tokens` |
| Master Data | `locations` `departments` `vendors` `manufacturers` `asset_categories` `asset_statuses` `relationship_types` `asset_types` `device_models` `server_roles` `network_zones` |
| Core Asset | `assets` + ตารางขยาย 8 ตาราง · `asset_tag_sequences` |
| ความสัมพันธ์ | `software_installations` `asset_relationships` `server_role_assignments` |
| Infrastructure | `clusters` `cluster_members` `storage_volumes` `racks` `rack_mounts` |
| Network/IPAM | `vlans` `vlan_sites` `vlan_ip_ranges` `vlan_devices` `ip_addresses` `tally` |
| Application | `server_applications` (v1.6 — ใช้ `vlan_sites` ร่วมกับ VLAN) |
| สัญญา | `contracts` `contract_assets` |
| Support | `attachments` `notifications` `notification_history` `import_batches` |
| Compliance | `audit_logs` `audit_logs_archive` `system_settings` |

---

## 6. ⭐ การตัดสินใจเชิงสถาปัตยกรรม (ห้ามรื้อโดยไม่ถามผู้ใช้)

| # | การตัดสินใจ | เหตุผล |
|:---:|---|---|
| 1 | **Class Table Inheritance** — `assets` แกนกลาง + ตารางขยาย 1:1 | เพิ่มหมวดใหม่ได้โดยไม่รื้อ Schema · ค้นข้ามหมวดได้ด้วย Query เดียว |
| 2 | **Software License เป็นทรัพย์สินหมวดหนึ่ง** ไม่แยกตาราง | ใช้กลไกแจ้งเตือน ค้นหา และสัญญา ร่วมกับฮาร์ดแวร์ทั้งหมด |
| 3 | **Audit Log แบบ Append-Only 3 ชั้น** | Trigger `INSTEAD OF` + `DENY` ระดับ DB + ไม่มี API |
| 4 | **Temporal Tables 31 ตาราง** | ดึงสภาพข้อมูลทั้งแถว ณ เวลาใดก็ได้ด้วย `FOR SYSTEM_TIME AS OF` |
| 5 | **สัญญาเป็นเส้นเวลา** (`previous_contract_id`) | เก็บประวัติการต่อ MA · อัตราขึ้นราคา · Coverage Gap |
| 6 | **Seat อยู่ใน `contract_assets` ไม่ใช่ `software_details`** | ต่ออายุแล้วจำนวน Seat ของงวดเก่าไม่หาย |
| 7 | **IPAM แยกตาราง `ip_addresses`** | รองรับหลาย IP ต่อเครื่อง · จอง IP ล่วงหน้า · Dropdown เลือก IP ว่าง |
| 8 | **เก็บเฉพาะ IP ที่ถูกจอง/ใช้** ไม่สร้างแถว AVAILABLE ล่วงหน้า | Subnet ใหญ่จะทำให้ตารางบวม · ใช้ `fn_available_ips` คำนวณสด |
| 9 | **Seat นับสด ไม่เก็บค่าซ้ำ** | ความถูกต้องสำคัญกว่าประสิทธิภาพที่ไม่มีใครรู้สึก |
| 10 | **ไม่ใช้ `ON DELETE CASCADE` เลย** | บังคับ FR-MD-02 ห้ามลบข้อมูลที่ถูกอ้างอิง |
| 11 | **Soft Delete ทุกตารางหลัก** | ทุก Query ของผู้ใช้ต้องกรอง `is_deleted = 0` |
| 12 | **`DATETIMEOFFSET` ทุก Timestamp** | เก็บ Time Zone — จำเป็นต่อการเป็นหลักฐาน |
| 13 | **`NVARCHAR` ทุกฟิลด์ข้อความที่ผู้ใช้กรอก** | ช่อง Notes อาจมีภาษาไทยแม้ UI เป็นอังกฤษ |
| 14 | **ห้าม `FLOAT` กับข้อมูลการเงิน** | ใช้ `DECIMAL(18,2)` เท่านั้น |
| 15 | **ค่าที่วัดได้ต้องมีวันที่วัดกำกับ** | `used_gb`+`last_measured_at` · `page_counter`+`counter_read_date` · `load_percent`+`load_measured_at` |
| 16 | **แยกวันที่ในวงจรชีวิต 6 ค่า** | อายุการใช้งานนับจาก `service_start_date` ไม่ใช่ `purchase_date` |

---

## 7. ⚠️ สิ่งที่ต้องทำใน Phase 4 ห้ามลืม

| # | เรื่อง | รายละเอียด |
|:---:|---|---|
| 1 | **บังคับ `updated_by` ที่ Middleware** | 🔴 **จุดตายของ Temporal Tables** — บันทึก "เมื่อไร" แต่ไม่บันทึก "ใคร" ต้องเติมอัตโนมัติผ่าน EF Core `SaveChangesInterceptor` (โค้ดตัวอย่างอยู่ในไฟล์ 12 ส่วนที่ 8) |
| 2 | **รันคำสั่งตรวจส่วน 7.1 ก่อนเปิด Temporal** | ระบบมี 7 คอลัมน์คำนวณ · วิธีแก้หากติดขัดอยู่ในไฟล์ 12 |
| 3 | **Self-host ฟอนต์** | Inter + JetBrains Mono ผ่าน `next/font/local` — เซิร์ฟเวอร์ On-Premise อาจไม่มีทางออกอินเทอร์เน็ต |
| 4 | **สคริปต์กันจอขาววาบ** | ใส่ใน `<head>` ก่อน React โหลด (โค้ดอยู่ใน Design System §10.3) |
| 5 | **กรองข้อมูลลับก่อนเขียน Audit Log** | `password_hash` · `license_key_encrypted` · `smtp.password` ห้ามหลุดเข้า `before_json`/`after_json` |
| 6 | **Server-side Pagination ตั้งแต่ Sprint แรก** | ห้ามดึงทั้งตารางมา render ฝั่ง Client |
| 7 | **ตรวจสิทธิ์ที่ Server ทุก Endpoint** | การซ่อนปุ่มฝั่ง Client ไม่ใช่การรักษาความปลอดภัย |
| 8 | **หน้าเว็บใช้คำว่า "DHCP Pool Size" ไม่ใช่ "Available"** | ระบบไม่ทราบจำนวน Lease จริง เพราะไม่ได้เชื่อม DHCP Server |

---

## 8. ❓ สิ่งที่ยังค้าง — ต้องถามผู้ใช้ก่อนเริ่ม Phase 4

### 8.1 🟡 ข้อมูลที่ยังไม่ได้รับ

| ประเด็น | หมายเหตุ |
|---|---|
| รูปแบบ `fixed_asset_no` | ผู้ใช้ตอบแค่ว่า "กรอกเอง" ยังไม่ทราบรูปแบบ |
| จำนวนตู้ Rack จริง | ใช้รูปแบบชื่อ `RACK-A2` ตามที่ตกลง |
| ค่า SMTP ขององค์กร | ต้องใช้ตอนตั้งค่าระบบแจ้งเตือน |
| โครงสร้างสถานที่จริง | Site / Building / Floor / Room / Rack |
| ชื่อ OU จริงที่จะ Sync | ผู้ใช้ตกลงว่าให้กรอกผ่านหน้าตั้งค่า (`sync_ou_scopes`) ไม่ต้องใส่ล่วงหน้า |

### 8.2 🔵 งานที่ยังไม่ได้เริ่ม (v1.5)

**Collector Agent** เป็นโปรแกรมแยกที่ต้องเขียนเพิ่ม ไม่ใช่ส่วนหนึ่งของเว็บ

| หน้าที่ | วิธี |
|---|---|
| ดึงผู้ใช้และกลุ่มจาก AD | LDAP query ตาม OU ใน `sync_ou_scopes` + คลี่กลุ่มซ้อนด้วย OID `1.2.840.113556.1.4.1941` |
| ดึง Quota / Usage | `Get-FsrmQuota` ผ่าน WinRM ไปยัง File Server แต่ละเครื่อง |
| ส่งข้อมูลเข้าระบบ | HTTPS POST พร้อม API Key (ระบบเก็บเฉพาะ SHA-256) |

ต้องรันบน Windows ในวง Domain ด้วย Service Account ที่มีสิทธิ์ **อ่านอย่างเดียว**
ห้ามเป็น Domain Admin

---

## 9. ประวัติการตัดสินใจของผู้ใช้ (กันการถามซ้ำ)

### 🔒 ตัดสินใจปิดแล้ว — Backend & Deployment

| ประเด็น | ที่ตกลง |
|---|---|
| Backend | **ASP.NET Core Web API (.NET 8 LTS) + EF Core** — เหตุผลเต็มดูหัวข้อ 10.1 |
| Collector Agent | **.NET Console App** ภาษาเดียวกับ Backend |
| Internet | **เฉพาะช่วงติดตั้งระบบเท่านั้น** — Production ห้ามพึ่ง Internet เด็ดขาด (NFR-15) แผน Deploy ดูหัวข้อ 10.2 |
| Deploy | Self-Contained Deployment บน Windows Server + IIS ไม่ใช้ Docker (เว้นแต่มี Internal Registry) |

### ✅ ตกลงว่าทำ
Asset Tracking · License/Warranty Alert · CMDB · Audit & Compliance · Dashboard + กราฟ ·
ค้นหาขั้นสูง · แนบไฟล์ · Import/Export Excel · Email (SMTP) + In-app Notification ·
นับ Seat · Light+Dark Mode · Temporal Tables · Contracts รองรับทั้งเครื่องเดียวและหลายเครื่อง ·
Model Catalog + Auto-fill · Rack Elevation (U + ความสูง + หน้า/หลัง) · IPAM เต็มรูปแบบ ·
Cascading Dropdown ครบ 4 ชุด · ผังประเภท 8 หมวด 44 Type 110 Subtype

### ❌ ตัดออกชัดเจน (ห้ามเสนอซ้ำ)
| รายการ | เหตุผล |
|---|---|
| Auto-Discovery (SNMP/WMI) | เลื่อนไป Phase 2 |
| External API Integration | เลื่อนไป Phase 2 |
| QR Code / Barcode | เลื่อนไป Phase 2 |
| Approval Workflow | ใช้ Audit Log แทน |
| Row-Level Security | ทุกคนเห็นข้อมูลทั้งหมด |
| SSO (AD / Entra ID) | ใช้ Local Auth ก่อน |
| ระบบยืม-คืน | ไม่อยู่ใน MVP |
| Dynamic Custom Fields | กำหนดฟิลด์ครบตั้งแต่แรก |
| `asset_components` | ผู้ใช้ปฏิเสธ |
| `maintenance_records` | ผู้ใช้ปฏิเสธ |
| ค่าเสื่อมราคา / Book Value | ผู้ใช้ปฏิเสธ |
| Pre-seed รุ่นอุปกรณ์ | ใส่เฉพาะยี่ห้อ 54 รายการ |

### 📌 เพิ่มเติมใน v1.5 (Permission Control)

| ประเด็น | ที่ตกลง |
|---|---|
| สิทธิ์ AD Group ต่อโฟลเดอร์ | **กรอกมือ** ไม่สแกน NTFS ACL |
| นโยบาย Internet | **กรอกมือ** ไม่ต่อ API ของ Proxy |
| ข้อมูลจาก AD | ดึงเฉพาะ **ผู้ใช้และกลุ่ม** มาเทียบเท่านั้น |
| Quota / Usage | ดึงอัตโนมัติจาก **FSRM** ผ่าน Collector |
| ขอบเขตการเขียน | **Read-Only** ห้ามเขียนกลับไปที่ AD หรือ File Server |
| ชั้นความลับ | ช่องเดียว 7 ค่า พร้อมลำดับ 1–7 |
| ประวัติสิทธิ์ | แสดง **3 version ล่าสุด** บนหน้าจอ · เก็บในฐานข้อมูล 2 ปี |
| ขอบเขต AD | เฉพาะ OU ที่กำหนดใน `sync_ou_scopes` |
| เวลา Sync | AD 02:00 · FSRM 03:00 |

> ⚠️ **หมายเหตุที่ดูขัดกับรายการตัดออกด้านบน** — v1.5 มีการจำกัดการมองเห็นตามชั้นความลับ
> ซึ่ง **ไม่ใช่ Row-Level Security ของ SQL Server** ที่ตัดออกไป แต่เป็นการบังคับที่ชั้น API
> โดยอ่านจากตาราง `classification_role_visibility` ฐานข้อมูลยังไม่มี RLS ตามเดิม

### ❌ ตัดออกใน v1.5 (ห้ามเสนอซ้ำ)
| รายการ | เหตุผล |
|---|---|
| สแกน NTFS ACL (`Get-Acl`) | ผู้ใช้เลือกกรอกมือ — ตัดงานที่ยากที่สุดออก |
| Proxy / Firewall API Connector | ผู้ใช้เลือกกรอกมือ |
| เขียนสิทธิ์กลับไปที่ AD หรือ NTFS | Read-Only เท่านั้น |
| ช่วงเวลาที่ใช้ Internet ได้ | ผู้ใช้ไม่เลือก |
| ตัดประวัติเหลือ 3 version จริงในฐานข้อมูล | เสี่ยงต่อการลบร่องรอย และ SQL Server ทำไม่ได้โดยตรง |

---

## 10. Tech Stack (Backend ตัดสินใจแล้ว)

| ชั้น | เทคโนโลยี |
|---|---|
| Frontend | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui · Inter + JetBrains Mono (Self-hosted Font ไฟล์ — ดู 10.2) · Lucide Icons |
| Table/State | TanStack Table + TanStack Query |
| Chart | Recharts |
| **Backend** | **ASP.NET Core Web API (.NET 8 LTS)** |
| **ORM** | **EF Core** — รองรับ Temporal Tables (System-Versioned) แบบ Native ผ่าน `.TemporalAsOf()` |
| Database | Microsoft SQL Server (On-Premise) |
| Auth | ASP.NET Core Identity + Cookie/JWT · Argon2id |
| Scheduled Job | `IHostedService` / Quartz.NET (ในโปรเซสเดียวกับ API) |
| Collector Agent | .NET Console App แยก — ใช้ `System.DirectoryServices` (LDAP/AD) + `Microsoft.PowerShell.SDK` (WinRM/FSRM) — ภาษาเดียวกับ Backend |
| Excel | ClosedXML · Email: MailKit |
| Deploy | ASP.NET Core **Self-Contained Deployment** บน Windows Server + IIS (ดู 10.2) |

### 10.1 เหตุผลตัดสินใจ (ปิดคำถามที่ค้างมา 5 ครั้ง)

1. **Temporal Tables** — EF Core รองรับ Native ตั้งแต่ v6 ส่วน Prisma ไม่รองรับเลย ต้องเขียน Raw SQL ทุกจุดที่แตะ 45 ตารางประวัติ
2. **Collector Agent (v1.5)** ต้องคุย LDAP + WinRM/FSRM — .NET มี Library ในตัวเป็น First-Party ไม่ต้องพึ่ง 3rd-party ของ Node.js ที่เสี่ยงเลิก Maintain และเขียนเป็นภาษาเดียวกับ Backend ได้เลย
3. **องค์กรเป็น Windows/AD ล้วน** (File Server, FSRM, AD, Proxy) — ทีม IT ที่ดูแลต่อคุ้นเคยกับ IIS/Windows Service มากกว่า
4. **NFR-15 (Internet เฉพาะตอนติดตั้ง)** — .NET รองรับ Self-Contained Deployment โดยตรง เหมาะกับสถานการณ์นี้เป็นพิเศษ (ดู 10.2)

### 10.2 แผน Deploy ภายใต้ NFR-15 (Internet เฉพาะตอนติดตั้ง)

Server เชื่อม Internet ได้เฉพาะช่วงติดตั้งครั้งแรกเท่านั้น หลังจากนั้นถือเป็น Offline ถาวร
จึงต้องดำเนินการทุกอย่างที่ต้องใช้ Internet **ในหน้าต่างการติดตั้งครั้งเดียว**:

| ขั้นตอน | รายละเอียด |
|---|---|
| 1. Restore Dependency | `dotnet restore` (NuGet) + `npm install` บน Server โดยตรง ขณะยังต่อ Internet อยู่ |
| 2. Build/Publish | `dotnet publish -c Release --self-contained -r win-x64` (รวม .NET Runtime ในตัว) + `next build` โหมด `output: 'standalone'` |
| 3. Font | ใช้ `next/font` แบบ Self-host (ดาวน์โหลดมาฝังตอน Build) แทนการอ้าง Google Fonts CDN ตรง ๆ — กัน Runtime พึ่ง Internet |
| 4. Lock เวอร์ชัน | Commit `packages.lock.json` (NuGet) และ `package-lock.json` (npm) เพื่อไม่ให้ Restore ครั้งถัดไปดึงเวอร์ชันใหม่จาก Internet โดยไม่ตั้งใจ |
| 5. ปิด Internet | ตัดการเชื่อมต่อ Internet ของ Server ถาวรหลัง Publish สำเร็จและทดสอบระบบผ่านแล้ว |

> ⚠️ Windows Update / NuGet Auto-Restore ต้องปิดบน Production Server เพื่อไม่ให้ระบบพยายามออก Internet เองภายหลัง

**Design Token หลัก:** Primary Indigo `#4F46E5` (Light) / `#6366F1` (Dark) · Neutral Slate ·
ฟอนต์ฐาน **14px** (ไม่ใช่ 16px เพราะเป็น UI ที่ข้อมูลหนาแน่น) · Spacing ฐาน 4px

---

## 11. แผนงานจนถึง Go-Live

> ย้ายรายละเอียดเต็มไปที่ **`docs/ROADMAP.md`** แล้ว (Sprint 0–10 รวม v1.5 Permission Control
> และ Administration Settings 25 หน้า ที่ Roadmap เดิมยังไม่ครอบคลุม)
>
> สรุปย่อ: Phase 0 (Pre-Flight — ต้องมี SQL Server + Windows AD/FSRM ทดสอบก่อนเริ่ม) →
> Sprint 0–6 (Core Asset System ตาม v1.0–v1.4) → Sprint 7–9 (Permission Control v1.5 +
> Collector Agent + Settings ที่เหลือ) → Sprint 10 (Test + Deploy + Go-Live)
> รวม ~48 วันทำงานคนเดียว หรือ ~30–34 วันถ้าทำคู่ขนานได้ 2 คน

---

## 12. Git

```
Branch : claude/zealous-hamilton-hn3ggp
Commits: 10 (ล่าสุด 1b4377e)
สถานะ  : สะอาด · push ครบแล้ว
```

**รูปแบบ Commit Message:** Conventional Commits (`docs:` · `feat(database):`)
บอดี้เป็นภาษาไทย ปิดท้ายด้วย `Co-Authored-By` และ `Claude-Session` ตามที่ระบบกำหนด

---

*เอกสารนี้ใช้สำหรับส่งต่อบริบทเมื่อ Context ถูกบีบอัด — อ่านไฟล์นี้ก่อนเริ่มงานต่อ*
