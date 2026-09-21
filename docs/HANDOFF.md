# HANDOFF — สรุปสถานะโปรเจกต์เพื่อส่งต่อ
## KKND — IT Inventory Management System

| หัวข้อ | รายละเอียด |
|---|---|
| **Repository** | `sudket04/KKND` |
| **Branch ที่ใช้พัฒนา** | `claude/zealous-hamilton-hn3ggp` (ห้าม push ไป branch อื่น) |
| **อัปเดตล่าสุด** | 2569-09-21 · commit `f421159` |
| **สถานะโดยรวม** | ✅ Phase 1–3 เสร็จ · 🟢 **Phase 4 (Development) — Sprint 0 + Sprint 1 + Sprint 2 + Sprint 3 เสร็จครบทั้งหมด** (Asset CRUD ครบ 7/8 หมวด + Audit Log UI + Attachment + Application บน Server + Storage/Cluster + Rack + Location Tree Picker + VLAN/IPAM) — เหลือ Software License ที่เลื่อนไป Sprint 4 ตามแผนเดิม |
| **โค้ดโปรแกรม** | 🟢 **Login/RBAC + Master Data CRUD 11 หน้า + Location Tree Picker + Asset CRUD ครบ 7 หมวด + Audit Log UI + Attachment + Application บน Server + Cluster/Storage Volume + Rack พร้อมผังกราฟิก + VLAN/IPAM (v1.1.1) ทำงานจริง — วันที่แสดงผลเป็น dd/mm/yyyy ทั้งโปรเจกต์** (ดู §4.5–§4.14) — ทดสอบ End-to-End กับ SQL Server จริงแล้วทุกโมดูล — **Sprint 3 ปิดครบทุกรายการ** เหลือ Software License รอ Sprint 4 |

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
| **4. Development** | 🟢 Sprint 0 + Sprint 1 + Sprint 2 + Sprint 3 เสร็จครบ | `docs/ROADMAP.md` §1.3–§1.12 |

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

### 4.7 Backend/Frontend — Sprint 3 (บางส่วน): Asset CRUD ขยายครบ 7/8 หมวด (20 ก.ย. 2569)

**ขอบเขตรอบนี้:** เพิ่ม Computer, Storage, Power & Cooling, Peripheral, Mobile & IoT/OT
เข้าไปในกลไก Asset CRUD เดิมของ Sprint 2 — **Software License (`SFT`) ยังไม่ทำ** เพราะ Sprint Plan
เดิมแยกไว้เป็น Sprint 4 (ต้องมี Seat Counting) และต้องตัดสินใจก่อนว่าจะเข้ารหัส `license_key_encrypted`
อย่างไร ไม่ใช่แค่ Extension Table รูปแบบเดียวกับหมวดอื่น จึงตั้งใจข้ามไปก่อนแทนที่จะทำครึ่งๆ กลางๆ

| ส่วน | รายละเอียด |
|---|---|
| Backend — DTO | เพิ่ม `ComputerDetailsDto` / `StorageDetailsDto` / `PowerDetailsDto` / `PeripheralDetailsDto` / `MobileIotDetailsDto` ใน `AssetDtos.cs` — คงรูปแบบเดิมจาก Sprint 2 (Nested DTO ต่อหมวด ไม่ใช่ Flat DTO รวม) เพื่อไม่ต้องรื้อโค้ด Server/Network ที่ทดสอบผ่านแล้ว |
| Backend — Controller | `AssetsController` ขยาย `switch` ตาม `category.Code` ครบ 7 หมวด ทั้ง Create/Update/ToDetail แยกฟังก์ชัน `Apply(entity, dto)` ต่อหมวดเพื่อลดโค้ดซ้ำระหว่าง Create กับ Update |
| Search | `GET /api/assets?search=` ขยายให้ค้น Hostname ของ Computer/Storage/Mobile IoT ด้วย (Power/Peripheral ไม่มี Hostname ในตาราง) |
| **พบ CHECK Constraint ที่ไม่รู้มาก่อนตอนออกแบบฟอร์ม** | `power_details.CK_pwr_measured` (มี `current_load_percent` ต้องมี `load_measured_at`), `mobile_iot_details.CK_iot_protocol`/`CK_iot_storage` (ค่าต้องอยู่ใน Enum ที่กำหนด) — พบตอนทดสอบจริงผ่าน curl (500 error) ไม่ใช่ Bug แต่เป็นวินัยข้อมูลที่ออกแบบไว้ตั้งแต่ Schema (decision #15) |
| Frontend — Enum Field ใหม่ | เพิ่ม `EnumSelectField` ใน `form-fields.tsx` — Dropdown ปิดตายตัวสำหรับคอลัมน์ที่มี DB CHECK Constraint เป็น Enum (Connection Type, Print Technology, Panel Type, Mount Type, Max Paper Size, Device Protocol, Storage Type) กันไม่ให้ผู้ใช้กรอกค่าที่ฐานข้อมูลจะปฏิเสธ |
| Frontend — Asset Form | `AssetForm` ขยายรองรับ 7 หมวด — เพิ่ม State/Section ต่อหมวด, Category Dropdown ตอนสร้างเปิดครบ 7 ตัวเลือก |
| **ข้อจำกัดที่รู้ตัว** | Error จาก CHECK Constraint อื่นที่ยังไม่ครอบ (เช่น `CK_iot_imei` ความยาว IMEI) จะขึ้นเป็น Error กลางๆ "Could not save the asset." ไม่ใช่ข้อความเจาะจง เพราะยังไม่ได้ทำ Server-side Validation สะท้อนทุก Constraint กลับเป็นข้อความที่อ่านง่าย |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** สร้างทรัพย์สินจริงครบทั้ง 5 หมวดใหม่ผ่าน API
(`PC-2026-0001`, `STG-2026-0001`, `PWR-2026-0003`, `PER-2026-0002`, `IOT-2026-0003`) ทดสอบ Update/List
แบบผสมหมวด/Search ตาม Hostname/Delete (ยืนยัน Audit Log บันทึก CREATE/UPDATE/DELETE ครบ) แล้วทดสอบ
ซ้ำผ่าน UI จริงด้วย Playwright — สร้าง Peripheral ผ่านฟอร์มจริง (ใช้ Enum Dropdown ที่เพิ่มใหม่)
และเปิดฟอร์มแก้ไข Computer ที่มีข้อมูลอยู่แล้วเพื่อยืนยันว่าค่าที่บันทึกไว้โหลดกลับมาแสดงถูกต้อง
ลบข้อมูลทดสอบออกหลังทดสอบเสร็จเช่นเดิม

**ยังไม่ทำใน Sprint 3 (ตอนนั้น):** Software License CRUD (รอ Sprint 4), Attachment, Audit Log UI (มี Backend
Audit Log อยู่แล้วแต่ยังไม่มีหน้าดู — **ทำแล้วใน §4.8**), Storage/Cluster, Rack พร้อมผังกราฟิก, VLAN + Site, Application
บน Server (v1.6), Asset Type/Location Tree Picker (บล็อก `device_models`, `asset_type_id`/`model_id`,
Autocomplete เลือก Parent Host/Uplink Asset), Self Change Password UI

---

### 4.8 Backend/Frontend — Sprint 3 (บางส่วน): Audit Log UI (21 ก.ย. 2569)

**ขอบเขตรอบนี้:** เมนู "Audit Logs" ในแถบด้านซ้ายมีอยู่แล้วตั้งแต่ Sprint 1 แต่ไม่มีหน้าจอ
(จะ 404) — และ Backend เขียน Audit Log ลงตาราง `dbo.audit_logs` มาตั้งแต่ Sprint 1/2 แล้ว (ทุก
CREATE/UPDATE/DELETE ของ Asset, User, Password Change, และ Login/Login Failed ผ่าน `AuthService.WriteAuditAsync`)
แต่ไม่เคยมีใครอ่านออกมาดูได้เลยนอกจาก query SQL ตรง จึงเป็นงานที่ทำได้ทันทีโดยไม่ต้องรอ Sprint 4
และปิดช่องว่างที่ชัดเจนที่สุดใน Sprint 3 ที่เหลือ

| ส่วน | รายละเอียด |
|---|---|
| Backend — Controller ใหม่ | `AuditLogsController.cs` (`GET /api/audit-logs` list แบบ Pagination + Filter, `GET /api/audit-logs/{id}` ดูรายละเอียด) — Read-only ทั้งคู่ เพราะตาราง `audit_logs` เป็น Append-only ตาม decision #3 |
| Policy | `[Authorize(Policy = "AuditorOrAbove")]` — ตรงกับ Role ที่กำหนดไว้ใน `nav.ts` (`ADMIN`, `IT_STAFF`, `AUDITOR`) พอดี ใช้ Policy เดิมที่มีอยู่แล้วใน `Program.cs` ไม่ต้องเพิ่มใหม่ |
| Filter ที่รองรับ | `entityType`, `action`, `userId`, `search` (ค้น Username/Entity Label), `dateFrom`/`dateTo` — เรียงจากใหม่ไปเก่าเสมอ |
| **พบระหว่างทดสอบ** | Action จริงมีมากกว่าที่เอกสาร Sprint ก่อนหน้าระบุไว้ — `AuthService.cs` เขียน `LOGIN` และ `LOGIN_FAILED` เองอีกที่หนึ่ง (แยกจาก `AuthController.cs`) ไม่ได้ถูกจับตอน grep ครั้งแรก แก้โดยเพิ่มทั้งสอง Action เข้า Dropdown Filter ของหน้าเว็บ |
| Frontend — หน้าใหม่ | `/audit-logs` — ตาราง + Filter (Search/Action/Entity Type/ช่วงวันที่) + Pagination รูปแบบเดียวกับหน้า Assets, คลิกแถวเพื่อขยายดู Before/After JSON (Pretty-print ถ้า Parse ได้) |
| **ข้อจำกัดที่รู้ตัว** | คอลัมน์ `before_json`/`after_json`/`changed_fields` ในตาราง `audit_logs` ยังไม่เคยถูกเขียนค่าจริงจาก Controller ไหนเลย (ตรวจสอบแล้วว่า `AssetsController`/`UsersController` ใส่แค่ `EntityId`/`EntityLabel`) — หน้า Audit Log Detail จึงแสดง "—" เสมอในตอนนี้ ยังไม่ได้ทำ Diff Tracking จริง เป็นงานที่ต้องทำเพิ่มถ้าต้องการเห็นค่าก่อน/หลังจริงๆ (ไม่ใช่ Bug ของหน้านี้ แต่เป็นข้อมูลที่ Backend Sprint ก่อนหน้ายังไม่เคยส่งมาให้) |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** curl ทดสอบ `GET /api/audit-logs` ทั้งไม่มี Filter, Filter
`action=LOGIN_FAILED`, `search=admin`, `entityType=asset`, และ `GET /api/audit-logs/{id}` — ทดสอบซ้ำผ่าน UI
จริงด้วย Playwright: เข้าเมนู Audit Logs จาก Sidebar (ยืนยันว่าลิงก์เดิมที่เคยตายใช้งานได้แล้ว),
Filter ตาม Action, ค้นหาด้วย Search Box ของหน้า (ระวัง Selector ชนกับ Search Box บน Topbar เพราะเป็น
`input[type=search]` เหมือนกัน — แก้ Test Script ด้วย Placeholder เจาะจง ไม่ใช่ Bug ของหน้าเว็บ), และขยายแถวดู
Before/After Panel — ผลลัพธ์ตรงกับ curl ทุกกรณี

**ยังไม่ทำ:** Diff Tracking จริง (Before/After JSON), Export Audit Log เป็นไฟล์, การแจ้งเตือน Anomaly

---

### 4.9 Backend/Frontend — Sprint 3 (บางส่วน): Attachment + แก้ RBAC Audit Log (21 ก.ย. 2569)

**พบบั๊กก่อนเริ่มงานใหม่:** ระหว่างอ่านทวน Permission Matrix (`docs/PRD.md` §5.2) พบว่าแถว "ดู Audit Log
ทั้งระบบ" ระบุไว้ว่า **IT Staff ควรเห็นเฉพาะรายการที่ตนเองแก้ไข** แต่ `AuditLogsController` ที่สร้างใน §4.8
ใช้ Policy `AuditorOrAbove` เฉยๆ ไม่ได้กรองตาม User เลย ทำให้ IT Staff เห็น Audit Log ของทุกคนได้ —
เป็นช่องโหว่ข้อมูลจริง แก้โดยเพิ่มเงื่อนไข Server-side บังคับ `WHERE user_id = <current user>` เมื่อ Role
เป็น IT_STAFF (ไม่สนใจว่า Client จะส่ง `userId` Query Param มาพยายามข้ามเงื่อนไขหรือไม่ เพราะ Query Param
เป็น Input จากฝั่ง Client ไว้ใจไม่ได้) ทั้งที่ `GET /api/audit-logs` และ `GET /api/audit-logs/{id}` — ทดสอบแล้วว่า
IT Staff ส่ง `?userId=1` (ID ของ admin) ก็ยังเห็นแค่รายการของตัวเอง (หรือ 0 รายการถ้าไม่ตรง) — เพิ่มข้อความ
Subtitle ในหน้า `/audit-logs` ให้ต่างกันตาม Role ด้วย

**งานหลักรอบนี้ — Attachment (FR-AT-01 ถึง FR-AT-05):**

| ส่วน | รายละเอียด |
|---|---|
| Backend — Controller ใหม่ | `AttachmentsController.cs` — `GET/POST /api/assets/{assetId}/attachments` (List/Upload), `GET /api/attachments/{id}/download`, `DELETE /api/attachments/{id}` |
| Policy | List/Download = `AnyRole` (PRD: ทุก Role ดูไฟล์แนบได้) · Upload/Delete = `ItStaffOrAbove` (PRD: เฉพาะ Admin/IT Staff) |
| FR-AT-02 จำกัดชนิด+ขนาดไฟล์ | Whitelist `.pdf .jpg .jpeg .png .xlsx .docx` เท่านั้น ขนาดสูงสุด 10 MB (ตรงกับ `CK_attachments_size` ในฐานข้อมูลที่กำหนดไว้ตั้งแต่ตอนออกแบบ Schema — Q4 ใน PRD §ท้ายเอกสารจึงถือว่าตอบไปแล้วในทางปฏิบัติ ไม่ใช่คำถามค้างจริง) |
| FR-AT-03 ตรวจ Magic Number | อ่าน Byte แรกของไฟล์เทียบ Signature จริง (PDF `%PDF`, JPEG `FFD8FF`, PNG Signature 8 Byte) — ไม่เชื่อนามสกุลไฟล์หรือ Content-Type ที่ Browser ส่งมาเลย สำหรับ XLSX/DOCX (เป็น ZIP ข้างใน) ตรวจ Signature ZIP (`PK..`) แล้วเปิดด้วย `System.IO.Compression.ZipArchive` เช็คว่ามี Entry `xl/workbook.xml` (XLSX) หรือ `word/document.xml` (DOCX) จริง กัน ZIP ธรรมดาสวมชื่อ .xlsx |
| FR-AT-04 เก็บนอก Web Root | API นี้ไม่มี `wwwroot`/`UseStaticFiles()` เลยตั้งแต่ต้น (ดู `Program.cs`) ไฟล์เก็บใต้ `App_Data/attachments/{assetId}/{GUID}.{ext}` (Path จริงไม่เปิดเผยให้ Client เห็น) เข้าถึงได้ทางเดียวคือผ่าน Endpoint ที่ตรวจสิทธิ์ก่อนเสมอ — เพิ่ม `App_Data/` เข้า `.gitignore` |
| FR-AT-05 แสดงผู้อัปโหลด+วันที่ | `AttachmentListItem` Join กับ `users.full_name` |
| Soft Delete | ลบไฟล์แนบ = ตั้ง `is_deleted = 1` เท่านั้น ไฟล์จริงบนดิสก์ยังอยู่ (Decision #11 Soft Delete ทุกที่) |
| Audit Log | Upload/Delete เขียน Audit Log `entityType = "attachment"` ทุกครั้ง |
| Frontend | Component ใหม่ `AttachmentsPanel` แปะไว้ใต้ `AssetForm` ในหน้า Edit Asset — Upload Form (เฉพาะ Admin/IT Staff เห็น), รายการไฟล์ + ปุ่ม Download/Delete |
| **พบบั๊กระหว่างเขียน Frontend** | `apiFetch` เดิม Set `Content-Type: application/json` ให้ทุก Request ที่มี Body รวมถึง `FormData` ด้วย ซึ่งทำให้ Browser ไม่ได้ใส่ Multipart Boundary เอง — Upload ไฟล์จะพังทันที แก้โดยเพิ่มเงื่อนไขข้าม `FormData` ใน `frontend/src/lib/api.ts` (แก้ก่อนเขียน UI Component เสร็จ ไม่กระทบ Fetch อื่นที่เป็น JSON) |
| Download ผ่าน Browser | ปุ่ม Download ต้องแนบ Bearer Token (ไม่ได้ใช้ Cookie Auth) จึงทำ `<a href>` ตรงไม่ได้ — ใช้ `apiFetch` ดึงเป็น Blob แล้วสร้าง Object URL ชั่วคราวเพื่อ Trigger การดาวน์โหลด |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** curl ทดสอบครบทุกเคส — Upload PDF/PNG/XLSX ที่ถูกต้อง (201),
ไฟล์ปลอม (เนื้อหาไม่ตรงนามสกุล .pdf/.xlsx) ถูกปฏิเสธ (400), นามสกุลที่ไม่อนุญาต (.exe) ถูกปฏิเสธ (400),
ไฟล์เกิน 10 MB ถูกปฏิเสธ (400), Download แล้วเทียบ Byte กับไฟล์ต้นฉบับตรงกัน, ลบไฟล์แล้ว Download ซ้ำได้ 404,
สร้าง User ทดสอบ Role VIEWER ยืนยันว่า List/Download ทำได้แต่ Upload/Delete โดน 403, สร้าง User ทดสอบ Role
IT_STAFF ยืนยันว่าเห็น Audit Log แค่ของตัวเอง — ทดสอบซ้ำผ่าน UI จริงด้วย Playwright: เปิดหน้า Edit Asset
เห็น Attachment Panel, Upload ไฟล์ผ่านฟอร์มจริงสำเร็จ, Upload ไฟล์ผิดชนิดเห็น Error Message บนหน้าเว็บ —
ลบข้อมูลทดสอบ (Attachment/Asset/User ปิดใช้งาน) หลังทดสอบเสร็จเช่นเดิม

**ยังไม่ทำ:** Attachment บน Contract (ตาราง `attachments.contract_id` รองรับแล้วแต่ยังไม่มี Contract CRUD
เพราะ Contract เป็นงาน Sprint 4), ตั้งค่าขนาดไฟล์สูงสุด/พื้นที่จัดเก็บผ่านหน้า Settings แบบ Runtime (ตอนนี้
Hardcode 10 MB + Whitelist ในโค้ด ไม่ใช่ค่าที่ Admin ปรับได้จาก UI)

---

### 4.10 Backend/Frontend — Sprint 3 (บางส่วน): Application บน Server (v1.6) (21 ก.ย. 2569)

**ขอบเขตรอบนี้:** โมดูล `dbo.server_applications` (`docs/database/15-module-v1.6-server-applications.sql`)
— ทะเบียน Application ที่รันอยู่บน Server แต่ละเครื่อง (Server/ประเภท/ชื่อ App/Port/Link/ผู้รับผิดชอบ/
แผนก/สาขา) ตามที่ผู้ใช้ขอไว้ตอนออกแบบ Schema (§4.4.2 ข้อ 5) — EF Entity (`ServerApplication`,
`VwServerApplication`) มีอยู่แล้วตั้งแต่ก่อนหน้านี้ เหลือแค่ Controller/UI

| ส่วน | รายละเอียด |
|---|---|
| Backend — Controller ใหม่ | `ServerApplicationsController.cs` — `GET/POST /api/assets/{assetId}/applications`, `PUT/DELETE /api/applications/{id}` |
| Policy | List = `AnyRole` · Create/Update/Delete = `ItStaffOrAbove` (ตาม Permission Matrix กลุ่มเดียวกับ Asset/Attachment) |
| ผูกกับ Server เท่านั้น | Create ตรวจว่า `asset.Category.Code == "SRV"` ก่อนเสมอ — สร้าง Application บน Asset หมวดอื่นจะได้ 400 |
| UNIQUE (asset_id, application_name) | จับ `DbUpdateException` แปลงเป็น 409 พร้อมข้อความเจาะจง แทนที่จะโยน SQL Error ดิบออกไป (Pattern เดียวกับ `LookupsControllerBase.IsUniqueViolation`) |
| **ไม่ใช่ Soft Delete** | ตาราง `server_applications` ไม่มีคอลัมน์ `is_deleted` เลยตั้งแต่ตอนออกแบบ Schema (ต่างจากตารางอื่นเกือบทั้งหมด) — Delete ในนี้จึงเป็น Hard Delete จริง ตรงตามที่ Schema ออกแบบไว้ ไม่ใช่การมองข้าม Decision #11 |
| Picker ใหม่ | เพิ่ม `GET /api/pickers/server-roles` (ใช้ `dbo.server_roles` ซ้ำเป็น "Server Type" ตามที่ Schema ตั้งใจ) และ `GET /api/pickers/vlan-sites` (คงที่ 2 รายการ: สาขาที่ 1/2 — ไม่มีหน้า CRUD เพราะ Site เป็น Lookup ปิดตายตัว ไม่ใช่ Master Data ที่ผู้ใช้แก้ไขได้) |
| Frontend | Component ใหม่ `ServerApplicationsPanel` แปะใต้ `AssetForm` **เฉพาะเมื่อ `categoryCode === "SRV"`** เท่านั้น (Asset หมวดอื่นไม่เห็น Section นี้เลย) — ปุ่ม Add เปิด Modal Form (Server Type/Port/Link/In Charge/Department/Site/Active/Notes), รายการแสดงเป็น List พร้อมลิงก์เปิด Application จริงถ้ามี `linkUrl` |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** curl ทดสอบ Create/Update/Delete/List ครบ, ทดสอบ Unique
Constraint ซ้ำชื่อบนเครื่องเดียวกัน (409), ทดสอบสร้าง Application บน Asset หมวด Computer (400 ถูกต้อง),
ทดสอบ RBAC ด้วย User Role VIEWER (List/ดู 200, Create/Delete 403), ตรวจ Audit Log บันทึก
CREATE/UPDATE/DELETE ครบ — ทดสอบซ้ำผ่าน UI จริงด้วย Playwright: เห็น Panel บน Server Asset, เพิ่ม
Application ผ่านฟอร์มจริงสำเร็จ (ระหว่างทดสอบเจอ Unique Constraint ทำงานถูกต้องโดยบังเอิญเพราะรันซ้ำ
ชื่อเดิม ยืนยันว่า Error Message ในหน้าเว็บแสดงถูกต้อง), ยืนยันว่า Asset หมวด Computer **ไม่เห็น** Section
Applications เลย — ลบข้อมูลทดสอบหลังทดสอบเสร็จเช่นเดิม

**ยังไม่ทำ:** หน้า Browse Application แบบรวมทุก Server (ตอนนี้ดูได้ทีละเครื่องผ่านหน้า Edit Asset เท่านั้น
ตาม Scope ที่ตกลงไว้ว่า Site จำกัดเฉพาะโมดูลนี้กับ VLAN — ยังไม่มีหน้า Master Data สำหรับ Site เพราะเป็น
Lookup 2 ค่าคงที่ ไม่ใช่ข้อมูลที่ผู้ใช้ต้องจัดการเอง)

---

### 4.11 Backend/Frontend — Sprint 3 (บางส่วน): Storage/Cluster (21 ก.ย. 2569)

**ขอบเขตรอบนี้:** โมดูล v1.2 (`docs/database/06-module-v1.2.sql`) — `dbo.clusters` (VM/Storage/DB
Cluster), `dbo.cluster_members` (สมาชิก Cluster ผูกกับ Asset), `dbo.storage_volumes` (แทนที่ฟิลด์
`storage_config` แบบข้อความอิสระเดิมของ Server ด้วยตัวเลขจริง) — EF Entity มีอยู่แล้วตั้งแต่ก่อนหน้า
(รวม View `vw_cluster_overview`, `vw_asset_storage_summary`) เหลือแค่ Controller/UI เช่นเดียวกับ
Application บน Server (§4.10)

| ส่วน | รายละเอียด |
|---|---|
| Backend — Controller ใหม่ | `ClustersController.cs` (CRUD Cluster + Members), `StorageVolumesController.cs` (แยก Route ตามเจ้าของ: `/api/assets/{id}/storage-volumes` กับ `/api/clusters/{id}/storage-volumes` เพื่อให้แต่ละ Route สร้างได้แค่รูปแบบที่ Schema อนุญาตเท่านั้น — Asset-owned ต้อง `is_shared=0` เสมอ, Cluster-owned ต้อง `is_shared=1` เสมอ ตรงกับ `CK_vol_shared_cluster`) |
| Policy | List = `AnyRole` · Create/Update/Delete = `ItStaffOrAbove` (รูปแบบเดียวกับโมดูลอื่นใน Sprint 3) |
| Cluster ไม่มี `is_deleted` | เหมือน `server_applications` — Delete เป็น Hard Delete จริง แต่ถ้ายังมี Member หรือ Storage Volume อ้างอิงอยู่ (ไม่มี `ON DELETE CASCADE` ตาม Decision #10) จะโดน SQL Error 547 (Reference/CHECK Violation) ซึ่งจับแปลงเป็น 409 พร้อมข้อความ "ลบ Member/Volume ออกก่อน" แทนที่จะโยน Stack Trace ดิบ |
| Cluster Member — วงจรชีวิตที่ Schema ออกแบบไว้แล้ว | "ออกจาก Cluster" ไม่ใช่การลบแถว แต่ตั้ง `left_date = วันนี้` (คอลัมน์ `is_active` เป็น Computed Column คำนวณจาก `left_date IS NULL` อยู่แล้ว) — ประวัติการเป็นสมาชิกจึงยังอยู่ครบ กลับเข้า Cluster ใหม่ได้เพราะ Unique Index กันซ้ำเฉพาะสมาชิกที่ Active เท่านั้น (`UX_cluster_members_active ... WHERE left_date IS NULL`) — มีปุ่ม Hard Delete แยกไว้สำหรับกรณีกรอกผิดจริงๆ |
| Storage Volume — Computed Column | `free_gb`/`used_percent` เป็น Computed Column บน SQL Server (`PERSISTED`) — EF Core รู้จักผ่าน `HasComputedColumnSql` อยู่แล้วตั้งแต่ Scaffold จึงไม่ส่งค่าตอน INSERT/UPDATE ไม่ต้องเขียนโค้ดจัดการเพิ่ม |
| Frontend — หน้าใหม่ | เมนู "Clusters" ใหม่ในแถบซ้าย → `/clusters` (List จาก `vw_cluster_overview` พร้อม Badge "Degraded"), `/clusters/new`, `/clusters/{id}` (ฟอร์มแก้ไข + Panel Members + Panel Storage Volumes) |
| Frontend — Storage Volumes Panel (Reusable) | Component เดียวใช้ได้ทั้งบนหน้า Asset (Server/Storage เท่านั้น) และหน้า Cluster โดยรับ Prop `owner: {assetId} \| {clusterId}` แทนการเขียนซ้ำสองชุด |
| **พบระหว่างทดสอบ (แก้แล้ว)** | ส่ง `clusterType`/`memberRole` ที่ไม่อยู่ใน CHECK Constraint ผ่าน curl ตรงๆ (ข้าม Dropdown ของ UI) ทำให้ได้ 500 พร้อม Stack Trace ดิบ — เพิ่ม `catch (DbUpdateException) when (Error 547)` ในทุก Endpoint ที่เขียนค่า Enum แปลงเป็น 400 ข้อความอ่านง่าย เหมือนที่เคยแก้ให้ Assets/Audit Log ไปแล้วในสัปดาห์นี้ |
| Autocomplete Asset ID | ฟอร์ม "Add Member"/"Storage Volume Provider" ยังใช้ช่องกรอก Asset ID เป็นตัวเลขธรรมดา ไม่ใช่ Autocomplete ค้นหา — จงใจให้สอดคล้องกับ Parent Host/Uplink Asset ที่เป็นช่องว่างที่รู้อยู่แล้วตั้งแต่ Sprint 2 (ไม่ขยายขอบเขตสร้าง Component ใหม่กลางทาง) |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** curl ทดสอบ Cluster CRUD ครบ (Duplicate Code 409, Invalid Enum
400 หลังแก้), Member Join/Duplicate-Active 409/Invalid Role 400/Leave-then-Rejoin (ยืนยัน Unique Index
กรองแค่ Active), Storage Volume ทั้ง Asset-owned และ Cluster-shared (Used > Capacity ถูกปฏิเสธ 400,
Computed Column `free_gb`/`used_percent` คำนวณถูกต้องจาก DB), Delete Cluster ที่ยังมี Member/Volume
ถูกบล็อก 409, RBAC ด้วย VIEWER (List/ดู 200, Create/Add Member 403) — ทดสอบซ้ำผ่าน UI จริงด้วย
Playwright: หน้า List เห็น Badge Degraded และสรุป Shared Storage, หน้า Cluster Detail เห็นทั้ง Members
(รวมประวัติ Left/Rejoined) และ Storage Volumes, สร้าง Cluster ใหม่ผ่านฟอร์มจริงสำเร็จ, Storage Volumes
Panel ปรากฏถูกต้องบนหน้า Server Asset — ลบข้อมูลทดสอบหลังทดสอบเสร็จเช่นเดิม

**ยังไม่ทำ:** Rack พร้อมผังกราฟิก, VLAN + Site UI (Entity/Schema มีอยู่แล้วแต่ยังไม่มี Controller/หน้าเว็บ)

---

### 4.12 Backend/Frontend — Sprint 3 (บางส่วน): Rack พร้อมผังกราฟิก (21 ก.ย. 2569)

**ขอบเขตรอบนี้:** โมดูล v1.3b (`docs/database/11-module-v1.3b-details-rack-ipam.sql` §5) — `dbo.racks`
(ตู้ Rack จริง) และ `dbo.rack_mounts` (อุปกรณ์ที่ติดตั้งในตู้ พร้อมตำแหน่ง U) — EF Entity + View
(`vw_rack_elevation`, `vw_rack_utilization`) มีอยู่แล้วตั้งแต่ก่อนหน้า เหลือแค่ Controller/UI เช่นเดียวกับ
Application บน Server และ Storage/Cluster

| ส่วน | รายละเอียด |
|---|---|
| Backend — Controller ใหม่ | `RacksController.cs` — CRUD Rack + Mount/Update/Remove/Delete อุปกรณ์ในตู้ |
| **กติกาตำแหน่ง U ไม่ซ้อนทับ/ไม่เกินความสูงตู้ อยู่ใน Database Trigger อยู่แล้ว** | `trg_rack_mounts_validate` (สร้างไว้ตั้งแต่ตอนออกแบบ Schema) ยิง Custom Error 51030 (เกินความสูงตู้) / 51031 (ซ้อนทับอุปกรณ์อื่น) ผ่าน `THROW` — Controller แค่จับ `SqlException` ตาม Error Number แล้วส่ง Message ที่ Trigger เขียนไว้กลับไปตรงๆ (ข้อความอ่านง่ายอยู่แล้ว) ไม่ต้องเขียน Validation ซ้ำฝั่ง C# เลย |
| Mount Lifecycle | "ถอดอุปกรณ์ออกจากตู้" ไม่ลบแถว แต่ตั้ง `removed_date` (รูปแบบเดียวกับ Cluster Member "Leave") — ประวัติการติดตั้งยังอยู่ครบ, มี Hard Delete แยกไว้กรณีกรอกผิด |
| Rack ไม่มี `is_deleted` | เหมือน Cluster/Server Applications — Delete เป็น Hard Delete บล็อกด้วย FK 409 ถ้ายังมี `rack_mounts` residual แม้เป็นแถวที่ถูก "ถอดออก" (`removed_date` ไม่ใช่ NULL) แล้วก็ตาม เพราะแถวยังอ้างอิง `rack_id` อยู่ — **พบระหว่างทดสอบ**: ต้อง Hard Delete แถว `rack_mounts` ที่ถอดออกไปแล้วด้วย ไม่ใช่แค่แถวที่ยัง Active ถึงจะลบ Rack ได้ |
| Frontend — หน้าใหม่ | เมนู "Racks" ใหม่ → `/racks` (List จาก `vw_rack_utilization` พร้อมเตือน Over Weight/Over Power), `/racks/new`, `/racks/{id}` (ฟอร์มแก้ไข + **ผังกราฟิก Elevation**) |
| **ผังกราฟิก Elevation** | CSS Grid ธรรมดา (ไม่ใช้ Library วาดภาพ) — แถวละ 1U ตาม `total_u` ของตู้ ตำแหน่งอุปกรณ์คำนวณจาก `numbering_direction` (`BOTTOM_UP`/`TOP_DOWN`) เองฝั่ง Frontend เพื่อวาง U1 ให้อยู่ล่างสุดของภาพเมื่อเป็น `BOTTOM_UP` (ตรงกับตู้ Rack จริง) สีของแต่ละอุปกรณ์ใช้ `status_color` จาก View เดียวกับ Badge สถานะ Asset (Design System เดิม) คลิก Asset Tag เชื่อมไปหน้า Edit Asset ได้ทันที |
| **พบช่องว่างจริงระหว่างทดสอบ (ยังไม่แก้ในรอบนี้)** | Rack ต้องเลือก Location เสมอ (`location_id NOT NULL`) แต่ระบบยังไม่มีหน้าจัดการ Location เลย (Location Tree Picker เป็นช่องว่างที่รู้อยู่แล้วตั้งแต่ Sprint 2 — ดู §8) ทดสอบรอบนี้ต้อง Insert Location ผ่าน SQL ตรงๆ ก่อน — เป็นตัวบล็อกจริงสำหรับการใช้งาน Rack Module ในทางปฏิบัติ ไม่ใช่แค่ตัวอย่างทดสอบ ควรหยิบเป็นงานสำคัญของ Sprint ถัดไป |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** curl ทดสอบ Rack CRUD ครบ, Mount อุปกรณ์ในตำแหน่งที่ถูกต้อง,
ทดสอบ Trigger จริงทั้ง 2 กรณี (ซ้อนทับ → 400, เกินความสูงตู้ 42U → 400), Unique Index กันอุปกรณ์เดียวถูก
Mount 2 ที่พร้อมกัน (409), Remove แล้ว Mount ใหม่ที่อื่นได้ (History ไม่หาย), Delete Rack ที่ยังมี Mount
Residual ถูกบล็อก 409, RBAC ด้วย VIEWER (List/ดู 200, Mount/Create 403) — ทดสอบซ้ำผ่าน UI จริงด้วย
Playwright: หน้า List เห็นเปอร์เซ็นต์ใช้งาน U, ผังกราฟิกวาดตำแหน่งอุปกรณ์ถูกต้องตาม BOTTOM_UP (U ต่ำอยู่
ล่างภาพ), Mount อุปกรณ์ซ้อนทับผ่านฟอร์มจริงเห็น Error Message จาก Trigger ตรงๆ, Mount ในตำแหน่งว่างสำเร็จ
เห็นบล็อกใหม่ปรากฏถูกต้อง — ลบข้อมูลทดสอบหลังทดสอบเสร็จเช่นเดิม (คง Location ทดสอบ 1 แถวไว้เพราะยังไม่มี
ทางลบผ่าน UI และเป็นข้อมูลที่ไม่กระทบอะไร)

**ยังไม่ทำ:** VLAN + Site UI — Software License รอ Sprint 4 — **Location Tree Picker เป็นบล็อกจริงที่ควร
ทำก่อนงานอื่นใน Sprint 3 ที่เหลือ** เพราะทั้ง Rack และ Asset เองก็ต้องพึ่ง Location

### 4.13 Backend/Frontend — Sprint 3 (บางส่วน): Location Tree Picker + วันที่ dd/mm/yyyy ทั้งโปรเจกต์ (21 ก.ย. 2569)

**ขอบเขตรอบนี้:** แก้บล็อกจริงที่บันทึกไว้ใน §4.12 (ไม่มีทางสร้าง/แก้ `dbo.locations` ผ่าน UI เลย ทั้งที่
`racks.location_id` เป็น `NOT NULL`) และงานที่ผู้ใช้สั่งเพิ่ม: ปรับรูปแบบวันที่แสดงผลเป็น `dd/mm/yyyy`
ทั้งโปรเจกต์

| ส่วน | รายละเอียด |
|---|---|
| Backend — Controller ใหม่ | `LocationsController.cs` (`backend/src/KKND.Api/Controllers/Locations/`) — ไม่ใช้ `LookupsControllerBase` เหมือน 11 หน้า Master Data เดิม เพราะ `dbo.locations` เป็น Self-Referencing Tree (`parent_location_id`) และมี Navigation Property ย้อนกลับหาตัวเอง (`InverseParentLocation`) ที่จะทำให้ Serialize เป็น JSON วนลูปถ้าคืน Entity ตรงๆ — ใช้ DTO (`LocationTreeNode`/`LocationDetail`/`LocationRequest`) แบบเดียวกับ Racks/Clusters แทน |
| Endpoint | `GET /api/locations/tree` (สร้าง Tree จาก Flat Query ฝั่ง C# ด้วย Local Function แบบ Recursive), `GET/POST/PUT/DELETE /api/locations(/{id})` — Policy `Admin` สำหรับ Create/Update/Delete (เหมือน Master Data), `AnyRole` สำหรับอ่าน |
| Validation ฝั่ง Server ที่ DB Constraint ไม่ครอบคลุม | `CK_locations_not_self` กัน Parent = ตัวเอง "ชั้นเดียว" เท่านั้น — เพิ่ม `IsDescendantAsync()` ไล่ตรวจสายโซ่ Parent ฝั่ง C# กันกรณีย้าย Location ไปอยู่ใต้ลูกหลานของตัวเอง (สร้าง Cycle) ซึ่ง Database เองตรวจจับไม่ได้ |
| Delete Guard | ไม่มี `is_deleted` เหมือนเดิม (Hard Delete) — เช็ค "มีลูกอยู่ข้างใต้ไหม" ก่อนด้วย Query ตรงๆ ให้ข้อความอ่านง่าย ก่อนที่จะปล่อยให้ FK บล็อก แล้วดัก `SqlException` 547 (ยังมี Asset/Rack/Cluster อ้างอิงอยู่) เป็น 409 อีกชั้น |
| Frontend — หน้าใหม่ | เมนู **Administration → Locations** (`/admin/locations`) — แสดง Tree แบบ Indent ตามชั้น (Flatten ฝั่ง Frontend ด้วย Depth-First), ปุ่ม "+" ต่อแถวสำหรับเพิ่ม Sub-Location, Modal ฟอร์ม Add/Edit เดียวกับที่ใช้ทั่วโปรเจกต์ (Parent Location เป็น Dropdown ที่กรอง Location ตัวเองกับลูกหลานออกไม่ให้เลือกได้ ตรงกับ `IsDescendantAsync` ฝั่ง Backend) |
| **ผลคือ Rack Module ใช้งานได้จริงผ่าน UI แล้ว** | ทดสอบสร้าง Location ใหม่ผ่านหน้าเว็บ → ไปหน้า "+ New Rack" → Location ที่เพิ่งสร้างปรากฏใน Dropdown ทันที (ผ่าน `/api/pickers/locations` เดิมที่มีอยู่แล้ว ไม่ต้องแก้) → สร้าง Rack สำเร็จ ครบวงจรโดยไม่ต้องพึ่ง SQL ตรงๆ อีกต่อไป |
| วันที่ dd/mm/yyyy | เพิ่ม `frontend/src/lib/format.ts` (`formatDate`/`formatDateTime`) แทนที่ `new Date().toLocaleString()`/Field ดิบทุกจุดที่พบ: Audit Logs (`occurredAt`), Attachments Panel (`uploadedAt`), Admin Users (`lastLoginAt`), Cluster Members Panel (`joinedDate`/`leftDate`) — **ยกเว้น** Native `<input type="date">` ของฟอร์ม (Purchase/Received/Install Date ฯลฯ) ซึ่งบังคับเก็บ Value เป็น ISO `yyyy-mm-dd` ตาม HTML5 Spec และปล่อยให้ Browser จัดรูปแบบการแสดงผลเอง (แก้ไม่ได้ด้วย JS โดยไม่เปลี่ยนไป Custom Date-Picker Library) — Grep ทั้งโปรเจกต์แล้วไม่พบจุดแสดงวันที่ดิบอื่นที่ตกหล่น |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** curl ทดสอบ Locations CRUD ครบ (Create/Update/Delete, Unique Code
409, Invalid `location_type` 400, Self-Parent 400, ย้ายเข้าใต้ลูกหลานตัวเอง 400 Cycle Guard, ลบตอนยังมีลูก
409, ลบตอนยังมี Rack อ้างอิงอยู่ 409) — ทดสอบผ่าน UI จริงด้วย Playwright: หน้า Tree แสดง Indent ถูกต้อง,
เพิ่ม Sub-Location ผ่านปุ่ม "+" สำเร็จ, สร้างซ้ำ Code เดิมเห็น Error Message ที่หน้าเว็บ (ไม่ Crash),
สร้าง Rack ใหม่ทั้งหมดผ่าน UI จริง (ไม่พึ่ง SQL) โดยเลือก Location ที่เพิ่งสร้างจากหน้า Locations —
สำเร็จ; ตรวจ Audit Logs และ Admin Users เห็นวันที่รูปแบบ `dd/mm/yyyy HH:mm` (เช่น `21/09/2026 03:39`) ถูกต้อง

**ยังไม่ทำ:** VLAN + Site UI ยังเป็นงาน Sprint 3 ที่เหลือ — Software License รอ Sprint 4

### 4.14 Backend/Frontend — Sprint 3 (ปิดครบ): VLAN + IPAM Module (v1.1.1) (21 ก.ย. 2569)

**ขอบเขตรอบนี้:** งานชิ้นสุดท้ายของ Sprint 3 — โมดูล v1.1.1 (`docs/database/04-vlan-module.sql`) — `dbo.vlans`
(VLAN/Subnet, รองรับ Untagged และ Secondary Subnet หลายชุดต่อ VLAN), `dbo.vlan_ip_ranges` (Pool
Static/DHCP/Reserved/Excluded), `dbo.vlan_devices` (อุปกรณ์ที่ทำหน้าที่ Gateway/DHCP Server/Trunk/Access)
— EF Entity + View (`vw_vlan_summary`, `vw_vlan_ip_allocation`, `vw_vlan_validation_issues`) มีอยู่แล้ว
เหลือแค่ Controller/UI เช่นเดียวกับโมดูลก่อนหน้า

| ส่วน | รายละเอียด |
|---|---|
| Backend — Controller ใหม่ | `VlansController.cs` — CRUD VLAN + IP Ranges (sub-resource) + Devices (sub-resource) + Validation Issues (read-only) |
| **กติกาเครือข่ายเกือบทั้งหมด (~20 CHECK Constraint) มีอยู่ใน Database อยู่แล้ว** | IP Format ถูกต้อง, Network Address ต้องเป็น Base Address ของ Subnet (ไม่ใช่ Host Address), Gateway ต้องอยู่ใน Subnet ของตัวเอง, VLAN Number ช่วง 1–4094, Untagged ต้องไม่มีเลข VLAN, ความสัมพันธ์ฟิลด์ DHCP (STATIC_ONLY ต้องไม่มีข้อมูล DHCP ค้าง / DHCP_ONLY-MIXED ต้องระบุแหล่งที่มา) ฯลฯ — Controller เขียน Helper `TryGetCheckViolationMessage()` แปล Error 547 เป็นข้อความบอกกติกาที่พังตรงๆ ตาม Constraint Name ที่ SQL Server แจ้งมา ไม่ต้อง Validate ซ้ำฝั่ง C# |
| Frontend — หน้าใหม่ | เมนู "VLANs" ใหม่ → `/vlans` (List พร้อม % Pool Coverage/Static Utilization, Badge สี Zone), `/vlans/new`, `/vlans/{id}` (ฟอร์มแก้ไข + IP Ranges Panel + Devices Panel + **Validation Issues Warning Banner**) |
| Validation Issues Banner | อ่านจาก `vw_vlan_validation_issues` (Range ซ้อนทับ, Range อยู่นอก Subnet, Gateway/DHCP ยังไม่ผูก Asset ฯลฯ) แสดงเป็นแถบเตือนสีเหลือง/แดงบนหัวฟอร์ม Edit ไม่บล็อกการบันทึก เป็นแค่ตัวช่วยสังเกตความผิดปกติ |
| Picker ใหม่ | `/api/pickers/network-zones`, `/api/pickers/assets` (List Asset ทั้งหมดแบบ id+label ใช้เลือก Gateway/DHCP Server/Device — ยังเป็น Dropdown ธรรมดา ไม่ใช่ Autocomplete Search ตามช่องว่างที่รู้อยู่แล้วจาก Sprint 2) |
| **บั๊กที่พบและแก้ระหว่างทดสอบ** | EF Core แปล Query เป็น SQL ไม่ได้เมื่อทำ `.Where()`/`.First()` ต่อจาก Query ที่ Project เป็น DTO Record ที่มี Conditional Navigation Property (`r.DhcpServerAsset != null ? ... : null`) อยู่ข้างใน — เกิด `InvalidOperationException` ตอนเรียกจริง (ไม่ใช่ตอน Build) — แก้โดยกรองข้อมูลที่ระดับ Entity Query ก่อนเสมอ แล้วค่อย Project เป็น DTO ทีหลัง (ไม่กรองต่อจาก DTO ที่ Project แล้ว) |
| Site UI | Site (1st/2nd) เป็น Lookup คงที่ 2 แถวอยู่แล้ว (`dbo.vlan_sites`) ไม่ได้เพิ่ม CRUD แยก — ใช้ Dropdown เลือกผ่าน Picker เดิมที่มีอยู่แล้วในฟอร์ม VLAN ตรงตามที่ ROADMAP ระบุขอบเขตไว้ ("VLAN + Site UI") |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** curl ทดสอบครบ (Duplicate Subnet 409, Host Address แทน Network
Address 400, Gateway นอก Subnet 400, VLAN Number ผิดช่วง 400, DHCP Consistency 400, Range Start>End 400,
Duplicate Device Role 409, Delete VLAN ที่ยังมี Range/Device ค้าง 409) — ทดสอบผ่าน UI จริงด้วย Playwright
ครบทุกจุด: List แสดง % Utilization, สร้าง VLAN ใหม่ผ่านฟอร์มจริงสำเร็จ, เพิ่ม/แก้ไข IP Range ผ่าน Modal
เห็น Error จาก Constraint ตรงๆ, เพิ่ม Device แล้วเห็น Duplicate ถูกบล็อกด้วยข้อความอ่านง่าย, Warning Banner
แสดง Validation Issues ถูกต้อง

**Sprint 3 ปิดครบทุกรายการแล้ว** — เหลือ Software License (`SFT` Category) ที่เลื่อนไป Sprint 4 ตามแผนเดิม
(ต้องรอตัดสินใจเรื่อง Seat Counting และการเข้ารหัส `license_key_encrypted`)

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
