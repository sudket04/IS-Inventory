# HANDOFF — สรุปสถานะโปรเจกต์เพื่อส่งต่อ
## IS-Inventory — IT Inventory Management System

| หัวข้อ | รายละเอียด |
|---|---|
| **Repository** | `sudket04/is-inventory` |
| **Branch ที่ใช้พัฒนา** | `claude/zealous-hamilton-hn3ggp` (ห้าม push ไป branch อื่น) |
| **อัปเดตล่าสุด** | 2569-09-21 · commit (ดูท้ายสุดของ `git log`) |
| **สถานะโดยรวม** | ✅ Phase 1–3 เสร็จ · 🟢 **Phase 4 (Development) — Sprint 0–5, 7 เสร็จครบ + Server Domain v1.7 + รหัสผ่านเริ่มต้น/บังคับเปลี่ยน + สิทธิ์ต่อเมนูรายคน Phase 1 (นอก Sprint Plan)** (Asset CRUD ครบ 8/8 หมวด รวม Software License + Audit Log UI + Attachment (Asset/Contract) + Application บน Server + Storage/Cluster + Rack + Location Tree Picker + VLAN/IPAM + CMDB Relationship + Contracts + Dashboard/Reports/Export Excel + Permission Control v1.5 + Server Inventory (Hardware)/Server List + รหัสผ่านเริ่มต้นตอนติดตั้ง/บังคับเปลี่ยน + Self-protection/สิทธิ์ต่อเมนูรายคน Backend Enforcement) — Sprint Plan เดิมเหลือ Sprint 6, 8–10 · **ค้าง Phase 2 ของสิทธิ์ต่อเมนู** (ซ่อนปุ่มตามสิทธิ์ + หน้า Admin จัดการสิทธิ์แบบตาราง §4.20) |
| **โค้ดโปรแกรม** | 🟢 **Login/RBAC (พร้อมรหัสผ่านเริ่มต้นตอนติดตั้ง + บังคับเปลี่ยนรหัสผ่านจริง + สิทธิ์ต่อเมนูรายคน Phase 1 ทั้ง Frontend+Backend) + Master Data CRUD 11 หน้า + Location Tree Picker + Asset CRUD ครบ 8 หมวด (รวม Software License เข้ารหัส) + Audit Log UI + Attachment + Application บน Server List + Cluster/Storage Volume + Rack พร้อมผังกราฟิก + VLAN/IPAM (v1.1.1) + CMDB Relationship + Contracts (เครื่องเดียว/หลายเครื่อง, โซ่การต่อสัญญา) + Dashboard/Reports/Export Excel + File Share/Internet Policy Permission Control + Server Inventory (Hardware)/Server List (Virtual+Physical) ทำงานจริง — วันที่แสดงผลเป็น dd/mm/yyyy ทั้งโปรเจกต์** (ดู §4.5–§4.20) — ทดสอบ End-to-End กับ SQL Server จริงแล้วทุกโมดูล **รวม Playwright Browser จริง** (Server Domain v1.7 + รหัสผ่านเริ่มต้น/บังคับเปลี่ยน ดู §4.18–§4.19 — สิทธิ์ต่อเมนูรายคน §4.20 ทดสอบผ่าน API เท่านั้น ยังไม่ผ่าน Playwright) — **Sprint 5, 7 ปิดครบทุกรายการ** |

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
| **Argon2id Password Hasher** | `backend/src/IsInventory.Infrastructure/Security/Argon2PasswordHasher.cs` — เข้ารหัส/ตรวจสอบด้วยรูปแบบ PHC string มาตรฐาน (`$argon2id$v=19$m=,t=,p=$salt$hash`) พารามิเตอร์ m=64MiB, t=3, p=2 |
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
| Backend — Controller ใหม่ | `LocationsController.cs` (`backend/src/IsInventory.Api/Controllers/Locations/`) — ไม่ใช้ `LookupsControllerBase` เหมือน 11 หน้า Master Data เดิม เพราะ `dbo.locations` เป็น Self-Referencing Tree (`parent_location_id`) และมี Navigation Property ย้อนกลับหาตัวเอง (`InverseParentLocation`) ที่จะทำให้ Serialize เป็น JSON วนลูปถ้าคืน Entity ตรงๆ — ใช้ DTO (`LocationTreeNode`/`LocationDetail`/`LocationRequest`) แบบเดียวกับ Racks/Clusters แทน |
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

### 4.15 Backend/Frontend — Sprint 4 (ปิดครบ): Software License + Seat Counting + CMDB Relationship + Contracts (21 ก.ย. 2569)

**ขอบเขตรอบนี้:** Sprint 4 ทั้ง 4 รายการตามแผนเดิม (§2 ตาราง Sprint Plan) — Software License (`SFT`
Category ที่ Sprint 3 ตั้งใจข้ามไว้), Seat Counting, CMDB Relationship (`dbo.asset_relationships` +
`dbo.relationship_types`), และ Contracts ทั้งเครื่องเดียว/หลายเครื่อง (`dbo.contracts` +
`dbo.contract_assets`, v1.4 module) — Entity ทั้งหมด Scaffold ไว้แล้วตั้งแต่ Sprint 0 เหลือแค่
Controller/UI เหมือนโมดูลก่อนหน้า

| ส่วน | รายละเอียด |
|---|---|
| **การเข้ารหัส License Key** | `ILicenseKeyProtector`/`AesGcmLicenseKeyProtector` (AES-256-GCM, Key 32 Byte จาก `Licensing:EncryptionKeyBase64` — User Secrets ตอน Dev, Environment Variable ตอน Production ตามแบบเดียวกับ `Jwt:Secret`) เก็บ `nonce(12) + ciphertext + tag(16)` ต่อกันใน `VARBINARY(1024)` เดียว |
| Backend — SFT เข้าร่วม `AssetsController` | เพิ่ม `SoftwareDetailsDto` — **`LicenseKey` เป็น Write-Only** ส่งเข้าตอน Create/Update เท่านั้น เข้ารหัสฝั่ง Server ทันที ไม่เคยส่งค่าที่ถอดรหัสแล้วกลับมาเลย ฝั่ง Read คืนแค่ `HasLicenseKey: bool` — Update ที่ส่งค่าว่าง/ไม่ส่งมา จะไม่ทับคีย์เดิม |
| Backend — `SoftwareInstallationsController` (ใหม่) | Sub-resource ของ Asset: ติดตั้ง/ถอด Software บน Target Asset ใดก็ได้ (`dbo.software_installations`) — "ถอด" ตั้ง `removed_date` แทนการลบแถวจริง (Pattern เดียวกับ Cluster Member Leave/Rejoin) กันชนกับ Unique Index `UX_swinst_active` ที่กรองเฉพาะแถว Active |
| Backend — Seat Usage | `GET /api/assets/{id}/seat-usage` และ `GET /api/software-licenses/seat-usage` (รวมทุกใบอนุญาต) อ่านจาก `vw_software_seat_usage` — **Seat มาจาก `contract_assets.seat_count` ของสัญญาปัจจุบัน ไม่ใช่คอลัมน์ใน `software_details` อีกต่อไป** (ย้ายไปตั้งแต่ v1.4 Migration) |
| Backend — `AssetRelationshipsController` (ใหม่) | CMDB-style Relationship สองทิศทาง (`Hosted On`/`Hosts`, `Depends On`/`Required By` ฯลฯ) อ่านจาก `vw_asset_relationships_expanded` ที่ Union ทั้งขาเข้า-ขาออกไว้แล้ว ทำให้ Relationship เห็นทั้งสองฝั่งอัตโนมัติโดยไม่ต้องสร้างแถวซ้ำ |
| Backend — `ContractsController` (ใหม่) + `contract_assets` Sub-resource | CRUD สัญญา + ผูกกับ Asset ได้ทั้งเครื่องเดียวและหลายเครื่อง (แถวใน `contract_assets` ต่อ Asset หนึ่งแถว) รองรับโซ่การต่อสัญญา (`previous_contract_id`) — Trigger `trg_contracts_supersede` ในฐานข้อมูลปิดสถานะสัญญาฉบับเดิมเป็น `SUPERSEDED` อัตโนมัติเมื่อสร้างสัญญาที่ต่อจากมัน และห้ามสัญญาใหม่เริ่มก่อนสัญญาที่ตนต่อมา (ข้อความจาก `THROW 51040` ส่งตรงถึง UI) |
| Backend — Attachment บนสัญญา | ขยาย `AttachmentsController` ให้รับทั้ง Asset และ Contract เป็นเจ้าของไฟล์ (คอลัมน์ `attachments.contract_id` มีอยู่แล้วตั้งแต่ v1.4) — เพิ่ม `GET/POST /api/contracts/{id}/attachments` ใช้ Validation/Storage Logic ชุดเดียวกับของ Asset |
| Frontend — Software License | `AssetForm` เพิ่ม Section "Software License Details" (License Key เป็นช่องกรอกที่โชว์ Placeholder "มีคีย์เก็บไว้แล้ว" เมื่อแก้ไข ไม่เคยแสดงคีย์จริง) + `InstallationsPanel` (แสดง Seat Usage Badge พร้อมเตือน Over-deployed และ Panel รายชื่อเครื่องที่ติดตั้ง) บนหน้า Edit Asset เฉพาะ Category `SFT` |
| Frontend — หน้าใหม่ `/software` | List รวม Seat Usage ทุกใบอนุญาต (ใช้ Nav Item "Software" เดิมที่เป็นลิงก์ตายมาตั้งแต่ Sprint 1 — ปิดช่องว่างนี้ไปในตัว) |
| Frontend — `RelationshipsPanel` | ติดตั้งบนหน้า Edit Asset **ทุก Category** (ไม่ใช่แค่ SFT) แสดงทิศทาง (`→`/`←`) และลิงก์ไปยัง Asset ที่เกี่ยวข้อง |
| Frontend — หน้าใหม่ `/contracts` | เมนู "Contracts" ใหม่ → List (Badge สถานะ, จำนวน Asset ที่ครอบคลุม), `/contracts/new`, `/contracts/{id}` (ฟอร์ม + `ContractAssetsPanel` ผูก/ถอด Asset พร้อม Seat Count/Coverage Date/Allocated Cost + Attachments Panel ที่ใช้ร่วมกับของ Asset) |
| **ปรับ Component ที่ใช้ร่วม** | `AttachmentsPanel` เปลี่ยน Prop จาก `assetId: number` เป็น `owner: {assetId} \| {contractId}` (Pattern เดียวกับ `StorageVolumesPanel` ที่มีอยู่แล้วสำหรับ Asset/Cluster) — จุดเรียกใช้เดิมบนหน้า Asset ปรับตาม ไม่กระทบพฤติกรรมเดิม |
| **บั๊กที่พบและแก้ระหว่างทดสอบ** | EF Core แปล Query ไม่ได้ซ้ำอีกครั้ง (เจอครั้งแรกใน VLAN §4.14) — คราวนี้ที่ `GET /api/contracts/{id}/assets` เพราะ `.OrderByDescending()` ต่อจาก Query ที่ Project เป็น DTO Record แล้ว แก้ด้วยการย้าย `.OrderByDescending()` ไปเรียงที่ระดับ Entity ก่อน Select เสมอ (Pattern เดิมที่ควรจำไว้เป็นกฎทั่วไปของโปรเจกต์นี้) |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** curl ครบทุกเส้นทาง (License Key เข้ารหัสแล้วไม่เคยส่งกลับ, ติดตั้ง
Software ซ้ำเจอ 409, Seat Usage คำนวณ Over-deployed ถูกต้องเมื่อยังไม่มีสัญญา (`0` Seat), ผูก Asset
ซ้ำในสัญญาเดียวกันเจอ 409, วันที่สัญญาสิ้นสุดก่อนเริ่มเจอ 400, ต่อสัญญาก่อนวันเริ่มของสัญญาเดิมเจอ 400
จาก Trigger, ต่อสัญญาถูกต้องแล้วสัญญาเดิมเปลี่ยนเป็น `SUPERSEDED` อัตโนมัติ, ลบสัญญาที่ยังมี Asset ผูกอยู่
เจอ 409) — ทดสอบผ่าน UI จริงด้วย Playwright ครบทุกจุดเช่นกัน: สร้าง Software License ผ่านฟอร์มพร้อม
License Key, เปิดหน้าแก้ไขเห็น Placeholder "มีคีย์เก็บไว้แล้ว" (ไม่ใช่คีย์จริง), ติดตั้งบน Asset อื่นแล้ว
เห็น Seat Usage อัปเดต, เพิ่ม CMDB Relationship เห็นทั้งสองทิศทางบนหน้า Asset ทั้งคู่, สร้างสัญญาใหม่ผ่าน
`/contracts/new`, ผูก Asset พร้อม Seat Count แล้วกลับไปดูที่หน้า Asset เห็น Seat Usage สะท้อนค่าจากสัญญา
ถูกต้อง (1/10), อัปโหลดไฟล์แนบบนสัญญาสำเร็จ, ข้อความ Error จาก Constraint/Trigger ขึ้นตรงบนฟอร์มถูกต้อง

**🎉 Sprint 4 ปิดครบทุกรายการแล้ว** — Sprint Plan เดิม (§2) เหลือ Sprint 5–10

---

### 4.16 Backend/Frontend — Sprint 5 (ปิดครบ): Dashboard · Reports · Export Excel (21 ก.ย. 2569)

**ขอบเขตรอบนี้:** ผู้ใช้สั่ง "ทำ 5, 7 ให้เสร็จก่อนแล้วจะทดลองใช้งาน" — Sprint 5 ทั้ง 3 รายการตามแผนเดิม
(FR-DB-01..06): การ์ดสรุป, กราฟ, การ์ดแจ้งเตือนใกล้หมดอายุ/License เกินสิทธิ์, รายงานสำเร็จรูป 4 ชุด,
Export ทุกรายงานเป็น Excel

| ส่วน | รายละเอียด |
|---|---|
| **พบระหว่างค้นข้อมูล (สำคัญ ต้องจำไว้)** | `assets.coverage_end_date` ที่ออกแบบไว้ตอนแรกถูก **DROP ไปแล้วตั้งแต่ Migration v1.4** เมื่อย้าย Coverage ไปอยู่ที่ `contract_assets` — วันหมดอายุที่ถูกต้องต้องอ่านจาก View ที่สร้างไว้แล้วเพื่อจุดประสงค์นี้โดยเฉพาะคือ `vw_expiring_assets` (และ `vw_asset_tco` สำหรับมูลค่า) ไม่ใช่คอลัมน์บน Entity `Asset` ตรงๆ |
| Backend — `DashboardController` (ใหม่) | `GET /api/dashboard/summary` รวมทุกอย่างในเรียกเดียว: การ์ด Action Required (Expired/Expiring≤30d จาก `vw_expiring_assets.Severity`, License Over-deployed จาก `vw_software_seat_usage`, Under Repair จาก Status Code), การ์ด Overview (Total/In Use/In Stock/Total Value/New This Month), Breakdown ตามหมวด/สถานะ (ใช้ `asset_categories.icon_name`/`asset_statuses.color_token` ที่มีอยู่แล้วในฐานข้อมูลตรงๆ ไม่ Hardcode สี), Expiring Soon Top 10, Recent Activity (Scope ตาม RBAC เดียวกับ Audit Log — IT_STAFF เห็นแค่ของตัวเอง, VIEWER ไม่เห็นเลย) |
| Backend — `ReportsController` (ใหม่) | 4 รายงานสำเร็จรูปตาม FR-DB-05: Expiring Coverage (`vw_expiring_assets`), License Compliance (`vw_software_seat_usage`), Assets by Status (Category × Status Pivot), Asset Value/TCO (`vw_asset_tco`) — แต่ละรายงานมี `/export` แยกคืนไฟล์ `.xlsx` จริง |
| **`ExcelExporter`** (ใหม่ — Shared) | ติดตั้ง Library `ClosedXML` (MIT License) — Helper กลางตัวเดียว `Build(sheetName, headers, rows)` ที่ทุก Controller Export ใช้ร่วมกัน จัดรูปแบบวันที่เป็น `dd/mm/yyyy` ในไฟล์ Excel เองด้วย (ไม่ใช่แค่หน้าเว็บ) |
| Backend — `AssetsController` เพิ่ม Filter `status` (Code) | เดิมมีแค่ `statusId` — เพิ่ม `?status=CODE` แบบเดียวกับ `?category=CODE` ที่มีอยู่แล้ว เพื่อให้การ์ด Dashboard ลิงก์ไปหน้า Asset List แบบกรองไว้ให้ได้ (เช่น "Under Repair" → `/assets?status=UNDER_REPAIR`) |
| Frontend — หน้าแรก (`/`) เขียนใหม่ทั้งหมด | แทนที่ Placeholder เดิม ("Dashboard widgets ship in Sprint 5") ด้วย Widget จริงตาม Wireframe §2 ของ `02-wireframes.md`: การ์ด Action Required 4 ใบ (คลิกไปหน้า Asset/Reports ที่กรองไว้แล้ว), ตาราง Expiring Soon, การ์ด Overview 4 ใบ, กราฟแท่งแนวนอน Category (CSS Bar ไม่ใช้ Chart Library เพิ่ม), Donut Chart Status (SVG `stroke-dasharray` มือ), Recent Activity |
| Frontend — หน้าใหม่ `/reports` | 4 Tab ตาม Report ข้างต้น แต่ละ Tab มีตารางผลลัพธ์ + ปุ่ม "Export to Excel" (ดาวน์โหลดไฟล์จริงผ่าน `downloadFile()` Helper ใหม่ใน `lib/api.ts`) |
| **Component ที่แยกออกมาใช้ร่วม** | ดึง `StatusBadge`/`colorTokenHex` ออกจากหน้า `/assets` (เดิม Local ในไฟล์เดียว) ไปเป็น `components/status-badge.tsx` เพราะตอนนี้มีคนใช้ 3 จุด (Assets List, Dashboard Donut, Reports Assets-by-Status) |
| **Icon เพิ่มใน `NavIcon`** | เติม `laptop`/`hard-drive`/`printer`/`zap`/`smartphone` (ใช้กับ Category Bar บน Dashboard) และ `folder`/`globe`/`shield-check` (เตรียมไว้สำหรับ Sprint 7) |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** curl ครบทุก Endpoint รวม Export (`GET .../export` คืน
`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` และไฟล์เปิดได้จริง
ตรวจด้วย `file` command เห็น "Microsoft Excel 2007+") — ทดสอบผ่าน UI จริงด้วย Playwright ครบ: Dashboard
โหลด Widget ทั้งหมด, คลิกการ์ด "In Use" ไปหน้า `/assets?status=IN_USE` ถูกต้อง, สลับ 4 Tab บน `/reports`
ครบ, กดปุ่ม Export ได้ไฟล์ `.xlsx` จริงผ่าน Browser Download

**🎉 Sprint 5 ปิดครบทุกรายการแล้ว**

---

### 4.17 Backend/Frontend — Sprint 7 (ปิดครบ): Permission Control v1.5 — File Share · Internet Policy · Classification Visibility (21 ก.ย. 2569)

**ขอบเขตรอบนี้:** ผู้ใช้สั่งข้าม Sprint 6 (Import/Notification) ไปทำ Sprint 7 ก่อนตามลำดับที่ขอ — ครบ 4
รายการตาม Sprint Plan เดิม: File Share Permission CRUD, Internet Policy CRUD, ตารางการมองเห็นตามชั้น
ความลับ, ประวัติสิทธิ์ 3 version — Schema `14-module-v1.5-permission-control.sql` (13 ตาราง + 15 View +
3 Trigger) Scaffold เป็น Entity ไว้ครบแล้วตั้งแต่ Phase 0 เหมือนโมดูลก่อนหน้า ไม่ต้องเขียน Migration ใหม่
เลย — **ขอบเขตนี้ไม่รวม Collector Agent/AD Sync จริง (Sprint 8)** ตามที่ Sprint Plan แยกไว้ชัดเจน

| ส่วน | รายละเอียด |
|---|---|
| **ช่องว่างที่พบและวิธีรับมือ #1 — FILE Server Role ไม่เคยถูกกำหนดที่ไหนเลย** | `trg_file_shares_validate` (THROW 51050) บังคับว่า Asset ต้องมีแถว `server_role_assignments` บทบาท `FILE` ก่อนถึงจะลงทะเบียนโฟลเดอร์ได้ — แต่ตาราง `server_role_assignments` (v1.2) ไม่เคยมี Controller ไหนเขียนถึงเลยตั้งแต่ต้นโปรเจกต์ (ต่างจาก `server_applications` ของ v1.6 คนละตารางกัน) แก้ด้วยการให้ `FileSharesController.EnsureFileServerRoleAsync` แทรกแถว Role นี้ให้อัตโนมัติตอนบันทึกโฟลเดอร์แรกบน Server นั้น (ถ้ายังไม่มี) แทนที่จะสร้างหน้าจอ "Server Roles" แยกต่างหากที่ไม่ได้อยู่ใน Sprint นี้ — **ต้อง `SaveChangesAsync` แยกก่อนสร้าง `FileShare`เสมอ** เพราะ EF Core ไม่รับประกันลำดับ Insert ระหว่าง Entity ที่ไม่มีความสัมพันธ์กันในการ `SaveChanges` ครั้งเดียว และ Trigger ทำงานทันทีหลัง `INSERT` |
| **ช่องว่างที่พบและวิธีรับมือ #2 — Internet Policy ผูก Proxy Asset ไม่ได้จริงในตอนนี้** | `trg_internet_policies_validate` (THROW 51051) ต้องการให้ `proxy_asset_id` ชี้ไปที่ Asset ที่มี `asset_type` เป็น `NET_PROXY`/`NET_FIREWALL`/`NET_UTM`/`NET_WAF` — แต่ **`assets.asset_type_id` ยังไม่มีช่องกรอกในหน้าเว็บเลยสักจุด** (Asset Type Tree Picker เป็นช่องว่างที่รู้ตัวมาตั้งแต่ Sprint 2 §1.5) ทางแก้ที่ใช้: ไม่เปิดช่องเลือก Proxy Asset ในฟอร์มรอบนี้เลย (`proxyAssetId` ฝั่ง Backend ยังรองรับแต่ไม่มีจุดเขียนจาก Frontend) ตรงตามที่ข้อเสนอ v1.5 §1 ข้อ 3 ออกแบบไว้แล้วว่าเป็น "ช่องเสริม" — นโยบาย Internet ใช้งานได้ครบโดยไม่ต้องมีช่องนี้ (ชื่อ + AD Group Binding ก็เพียงพอ) รอ Asset Type Tree Picker มาเปิดใช้ทีหลัง |
| Backend — `FileSharesController` (ใหม่) | CRUD `dbo.file_shares` + Sub-resource `permissions` (`dbo.file_share_permissions`) — Visibility บังคับที่ชั้น API (ไม่ใช้ SQL Row-Level Security ตามที่เคยตัดสินใจไว้ตั้งแต่ต้นโปรเจกต์): อ่าน `dbo.classification_role_visibility` ตาม Role ของผู้เรียกทุกครั้ง โฟลเดอร์ที่ Role มองไม่เห็นจะถูกกรองออกจาก List/Get ทั้งหมด (ไม่โชว์แม้แต่ชื่อ ตรงตามข้อเสนอ §9) — เปิดดูโฟลเดอร์ชั้น 1–3 (`requires_view_audit = 1`) บันทึก Audit Log Action `VIEW_SENSITIVE` อัตโนมัติ |
| Backend — Permission History | `GET /api/file-shares/{id}/history?all=` อ่านจาก `vw_share_permission_timeline` (ไทม์ไลน์รวมทุกสิทธิ์ของโฟลเดอร์นั้น) ค่าเริ่มต้นจำกัด 3 รายการล่าสุดตาม Sprint Plan ("ประวัติสิทธิ์ 3 version") มีปุ่ม "View All" ขยับไปเอาแบบไม่จำกัดจาก View เดียวกัน |
| Backend — `InternetPoliciesController` (ใหม่) | CRUD `dbo.internet_policies` + Sub-resource `groups` (AD Group Binding) และ `categories` (Web Category Rule เสริม ไม่บังคับกรอก) — ไม่ผูก Classification จึงไม่ต้องกรอง Visibility เหมือน File Share |
| Backend — `ClassificationVisibilityController` (ใหม่ — Admin Only) | `GET/PUT /api/admin/classification-visibility` อ่าน/แก้ Matrix 7 ชั้น × 4 บทบาท (Seed ไว้แล้วเต็มทุกช่องตั้งแต่ Migration เป็น `CROSS JOIN` จึงเป็นแค่การ Update ไม่มีการ Insert ใหม่) — บังคับกฎที่ API: ปิด `canView` แล้ว `canEdit`/`canExport` ต้องปิดตามเสมอ |
| Backend — `PickersController` เพิ่ม 5 Endpoint | `file-servers` (Asset หมวด SRV), `classification-levels`, `access-levels`, `ad-groups` (ว่างจนกว่า Sprint 8 จะ Sync), `web-categories` |
| Frontend — หน้าใหม่ `/file-shares`, `/file-shares/new`, `/file-shares/{id}` | List + Form + `FileSharePermissionsPanel` (Grant/Revoke AD Group พร้อม Badge เตือน "Orphan Group" เมื่อ `ad_group_id` เป็น NULL หรือกลุ่มหายจาก AD) + Panel ประวัติสิทธิ์ 3 version พร้อมปุ่ม View All |
| Frontend — หน้าใหม่ `/internet-policies`, `/internet-policies/new`, `/internet-policies/{id}` | List + Form + `InternetPolicyBindingsPanel` (AD Group + Web Category Rule) |
| Frontend — หน้าใหม่ `/admin/classification-visibility` (Admin Only) | Matrix 7×4 พร้อม Checkbox View/Edit/Export ต่อช่อง บันทึกทันทีเมื่อกด (ไม่มีปุ่ม Save รวม) |
| Frontend — Nav | เพิ่ม "File Shares"/"Internet Policies" เป็นเมนูหลัก (ทุก Role ตาม Visibility ที่กรองในชั้น API อยู่แล้ว) และ "Classification Visibility" ใต้ Administration |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** curl ครบทุกเส้นทาง (ลงทะเบียนโฟลเดอร์สำเร็จพร้อม Auto-assign FILE
Role, บันทึกโฟลเดอร์ซ้ำ Path เดิมเจอ 409, Path ไม่ขึ้นต้นด้วย `\\` เจอ 400 ข้อความจาก `CK_fs_path`, Grant/
Revoke AD Group Permission, ประวัติสิทธิ์ 3 version ถูกต้อง, สร้าง Internet Policy + Bind AD Group + Web
Category Rule, สร้าง Default Policy ซ้ำสองอันเจอ 409, แก้ Matrix Classification Visibility สำเร็จ) —
ทดสอบผ่าน UI จริงด้วย Playwright ครบ: หน้า List/Detail ของทั้งสองโมดูล, Grant Permission ผ่านฟอร์มเห็นผล
ทันที, Matrix Visibility render ตรงกับค่าเริ่มต้นที่ Migration Seed ไว้ (ADMIN เห็น/แก้ได้ทุกชั้น, AUDITOR
เห็น/Export ได้ทุกชั้นแต่แก้ไม่ได้, IT_STAFF เห็น/แก้ได้ตั้งแต่ชั้น 3 ลงมา, VIEWER เห็นได้ตั้งแต่ชั้น 4)

**คงเหลือ (ตั้งใจเลื่อนไป Sprint 8 ตามแผนเดิม):** Collector Agent จริง, AD/FSRM Sync งานจริง (`ad_groups`/
`ad_users`/`file_share_usage_snapshots` ยังว่างจนกว่าจะ Sync) — และ **Asset Type Tree Picker** (ช่องว่าง
เดิมจาก Sprint 2 ที่ตอนนี้บล็อกฟีเจอร์เพิ่มเติม 2 จุด: Proxy Asset Binding ของ Internet Policy และหน้า
"Server Roles" แบบเต็มรูปแบบที่ไม่ต้องพึ่ง Auto-assign)

**🎉 Sprint 7 ปิดครบทุกรายการแล้ว**

---

### 4.18 Backend/Frontend — Server Domain v1.7: Server Inventory (Hardware) · Server List (Workload/OS) (21 ก.ย. 2569)

**ขอบเขตรอบนี้:** งานนอก Sprint Plan เดิม — ผู้ใช้สั่งแยก Server/Storage ออกจากหน้า Assets ทั่วไปทั้งหมด
เป็น 2 หน้าใหม่: **Server Inventory (Hardware)** ลงทะเบียนตัวเครื่อง Physical Server + Storage พร้อม
CPU/Memory/Local Disk แบบ Multi-Entry, และ **Server List** มุมมอง Workload/OS ของ Server ทั้ง Virtual
(Asset ใหม่ผูก Cluster) และ Physical (Activate Asset เดิมจาก Server Inventory ด้วยข้อมูล Workload) —
Clusters ย้ายไปอยู่กลุ่มเมนู "Server" เดียวกัน ไม่มีการเปลี่ยนแปลงตัวโมดูล

| ส่วน | รายละเอียด |
|---|---|
| **การตัดสินใจสถาปัตยกรรมสำคัญ — ไม่สร้างคอลัมน์ `hosting_type`/`server_type` ใหม่** | ค้นพบว่า `server_details.server_type` (PHYSICAL/VIRTUAL) เคยถูก**ลบทิ้งไปแล้วโดยตั้งใจ**ใน Migration `10-module-v1.3a-taxonomy.sql` ด้วยเหตุผลที่ Comment ไว้ชัดว่า "server_type ซ้ำซ้อนกับ asset_types.is_virtual จึงลบทิ้งเพื่อไม่ให้ข้อมูลขัดแย้งกัน" — จึงเลือกสร้าง **Asset Type Picker** (Category→Type→Subtype อ่านจาก `vw_asset_type_tree` + Flag `is_virtual`/`can_host_vm`) แทนการฟื้นคอลัมน์เดิม ปิดช่องว่าง "Asset Type Tree Picker" ที่รู้ตัวมาตั้งแต่ Sprint 2 (เคยบล็อก Internet Policy Proxy Binding ใน §4.17 ด้วย) |
| Database — `16-module-v1.7-server-domain.sql` | `os_types`/`os_versions` (Seed), `server_statuses` (Seed ACTIVE/MAINTENANCE/STANDBY/POC/DECOMMISSIONED), `network_zones` +แถว Untrust, `server_details` ALTER แบบ Temporal (`SET SYSTEM_VERSIONING = OFF` → ปรับคอลัมน์ทั้ง Main+History ให้ตรงกัน → เปิดกลับ) ตัดคอลัมน์เดิม 7 ตัว (รวม `cpu_model`/`ram_gb`/`parent_host_asset_id`) เพิ่ม 9 ตัวใหม่ (Cluster/SystemGroup/FQDN/ServerZone/Environment/Criticality/ServerStatus/OsType/OsVersion), ตารางใหม่ไม่ Temporal 4 ตัวตามแบบ `server_applications`: `server_cpus`/`server_memory_modules`/`server_local_disks`/`storage_volume_consumers` (Junction ให้ Storage ผูกได้หลาย Server พร้อมกัน — เพิ่มเติมจาก `storage_volumes` เดิม ไม่แตะของเดิมที่ทดสอบแล้ว), View `vw_server_hardware_summary` |
| Backend — `ServerInventoryController` (`api/server-inventory`) | CRUD SRV(Physical เท่านั้น, กรอง `!IsVirtual`)+STG ร่วมหน้าเดียว — Validate AssetType ต้องตรง Category+`is_virtual`, `ReplaceHardwareChildren` (ลบทั้งหมดแล้วเขียนใหม่ทุกครั้งสำหรับ CPU/Memory/Disk), Warranty Until เป็นค่าคำนวณ Read-only จาก `vw_expiring_assets` (ไม่ใช่คอลัมน์เก็บค่า ตรงตามแนวทาง v1.4) |
| Backend — `ServerListController` (`api/server-list`) | List เฉพาะแถวที่ "Activate" แล้ว (`ServerDetail.ServerStatusId != null`) — Create แยก 2 เส้นทางตาม `IsVirtual`: Virtual สร้าง Asset ใหม่ (AssetType จาก Code `SRV_VM_STD`) ต้องมี Cluster; Physical แนบเข้ากับ Asset Hardware เดิม เจอ 409 ถ้า Activate ซ้ำ — Delete: Virtual = Soft-delete ทั้ง Asset, Physical = "Detach" (ล้างเฉพาะฟิลด์ Workload) |
| Backend — `OsCatalogController` | `api/os-types`/`api/os-versions` (GET List, POST Quick-add `ItStaffOrAbove`) — จุดเดียวที่ยกเว้นให้ Quick-add จากฟอร์มได้ตรง (ปกติ Lookup ทั้งหมดแก้ที่ Admin > Master Data เท่านั้น) ตามที่ผู้ใช้ขอชัดเจน |
| Backend — ล็อก Assets ทั่วไปไม่ให้แก้ SRV/STG | `AssetsController` เพิ่ม `ManagedElsewhereCategoryCodes = ["SRV","STG"]` คืน `400 {error:"managed_elsewhere"}` ที่ Create/Update/Delete — ยังคง List/View ได้ (Browse ข้ามหมวดยังใช้ได้) ตามที่ผู้ใช้ยืนยัน "หน้า Assets ทั่วไป สามารถดูที่เป็น Hardware เท่านั้นพอ" |
| **บั๊กที่พบและแก้ #1 — EF Core ChangeTracker รั่วหลัง `DbUpdateException`** | บันทึก IP ทั้ง Primary+Management พร้อมกันเจอ 500 ที่ `CK_ip_inuse_asset` แม้ Insert เดี่ยวๆ ผ่าน SQL ตรงสำเร็จ — สาเหตุคือ Entity ที่ Save ไม่ผ่านยังค้างอยู่ใน ChangeTracker แล้วโผล่มา Throw ซ้ำตอน `SaveChangesAsync` ครั้งถัดไปที่ไม่เกี่ยวข้องกันเลย (Audit Log) แก้โดยเขียน `UpsertIpAsync` ใหม่ทั้งหมดด้วย `ExecuteSqlInterpolatedAsync` (Raw SQL) แทน EF Entity Tracking |
| **บั๊กที่พบและแก้ #2 — ค่าติดลบ (เช่น RAM) เด้ง 500 ดิบ** | `TryGetFriendlyMessage` เดิมห่อแค่ `SaveChangesAsync` ตัวแรก (บันทึก Asset หลัก) — Constraint `CK_smem_capacity` ที่แท้จริงมาแตกตอน `SaveChangesAsync` ตัวที่สอง (`ReplaceHardwareChildren`) ซึ่งยังไม่ได้ห่อ แก้โดยห่อทั้งสองจุดใน `ServerInventoryController` |
| Frontend — Component ใหม่ | `hardware-rows-editor.tsx` (`CpuEditor`/`MemoryEditor`/`DiskEditor` รูปแบบ `[n] ... [ลบ]` / `+ Add` / `รวม: ...` ตามที่ผู้ใช้กำหนดเป๊ะ, RAM/Storage เลือกจาก Dropdown ขนาดจริงเท่านั้น กันค่าที่เป็นไปไม่ได้เช่น "3 GB"), `os-catalog-fields.tsx` (OS Type/Version Cascading + ปุ่ม "+" Quick-add inline) |
| Frontend — หน้าใหม่ `/server-inventory`, `/server-list` (List/New/`[id]`) | Server Inventory: Category→AssetType→ส่วน Hardware/Storage ตามเงื่อนไข; Server List: เลือก Hosting Type ตอนสร้างใหม่เท่านั้น (แก้ทีหลังไม่ได้), Physical แสดง CPU/Memory/Storage/Criticality แบบ Read-only "(แก้ที่ Server Inventory)", `server-applications-panel.tsx` ย้ายมาแปะที่นี่แทนหน้า Asset ทั่วไป |
| Frontend — Nav | ยุบ "Clusters" เดิมเป็นกลุ่มใหม่ "Server" (ไอคอน `server`) มีลูก 3 อัน: Server Inventory / Clusters / Server List |
| Frontend — ปรับ `EnumSelectField` ให้รับ `{value,label}[]` ได้ (เดิมรับแค่ `string[]`) | Criticality/Hosting Type ต้องการ Label สวยกว่า Code ดิบ (เช่น "Tier 1 (High)") — Backward-compatible กับทุกจุดเดิมที่ใช้ `string[]` |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว (Backend):** curl ครบทุก Endpoint — Asset Type Picker, สร้าง Hardware
พร้อม CPU/Memory/Disk หลายรายการ, ล็อกหน้า Assets ทั่วไปไม่ให้แก้ SRV/STG, List Available Hardware, Flow
Physical Attach เข้า Server List (รวมจุดที่เจอบั๊ก IP), สร้าง Virtual Server ผูก Cluster+Hardware ของ
ตัวเอง, ปฏิเสธค่าติดลบ, สร้าง Storage Hardware, Quick-add OS Type/Version — ลบข้อมูลทดสอบออกหมดแล้ว

**Frontend:** `npx tsc --noEmit`, `npx eslint`, และ `npm run build` (Next.js 16 Turbopack) ผ่านสะอาดทั้ง
16 ไฟล์ใหม่/แก้ไข — ตอน Sprint นี้ปิดครั้งแรก **ยังไม่ได้ทดสอบผ่าน Browser จริงด้วย Playwright** เพราะ
Auto-mode Safety Classifier บล็อกการรีเซ็ต/อ่านรหัสผ่านบัญชี Admin ในฐานข้อมูลทดสอบ — **ภายหลังได้ทดสอบ
ผ่าน Browser จริงแล้วใน §4.19** (พร้อมกับ Sprint รหัสผ่านเริ่มต้น ที่ทำให้มีรหัสผ่านทดสอบใช้ได้) และ
**พบ+แก้บั๊กจริง 1 จุด**: `ServerInventoryForm`'s ช่อง "Asset Type" (Server/Storage) ใช้ `SelectField`
ที่ส่งค่าเป็น Category ID ตัวเลข (เช่น `"1"`) แทนที่จะเป็น Code (`"SRV"/"STG"`) ทำให้เงื่อนไข
`category === "SRV"` ไม่ตรงเลยสักครั้ง — Asset Type (Server/Storage Type) Dropdown จึงว่างเปล่าตลอด และ
ส่วน CPU/Memory/Storage ไม่เคยโผล่ขึ้นมาให้กรอกจริงเลยตั้งแต่แรก (Backend curl-test ข้ามจุดนี้ไปเพราะยิง
Category ID ตรงๆ ไม่ผ่านฟอร์ม) แก้โดยเปลี่ยนไปใช้ `EnumSelectField` พร้อม Options คงที่ `{value:"SRV"}`/
`{value:"STG"}` แทน — ยืนยันตัวอย่างนี้ว่า **Browser E2E จำเป็นจริง ข้าม curl-only ไม่ได้** สำหรับหน้าฟอร์ม
ที่มี Conditional Rendering ซับซ้อน

**คงเหลือ:** Recycle Bin (ผู้ใช้ตั้งใจเลื่อนไปทำทีหลัง ไม่ใช่รอบนี้)

---

### 4.19 Backend/Frontend — รหัสผ่านเริ่มต้นตอนติดตั้ง + บังคับเปลี่ยนรหัสผ่าน (21 ก.ย. 2569)

**ขอบเขตรอบนี้:** ผู้ใช้ถาม "สร้างรหัสเริ่มต้นในการใช้งานระบบครั้งแรก และบังคับเปลี่ยนรหัสผ่านได้ไหม" —
ตรวจพบว่าระบบออกแบบเผื่อฟีเจอร์นี้ไว้ตั้งแต่ Schema เดิม (คอลัมน์ `must_change_password`, Field
`mustChangePassword` ถึง Frontend แล้ว) แต่มี **2 ช่องว่างจริงที่ทำให้ใช้งานไม่ได้จริง**:
1. บัญชี `admin` ที่ Seed มาจาก `02-schema-sqlserver.sql` มี `password_hash` เป็นค่า Placeholder
   (`$argon2id$REPLACE_ON_INSTALL`) ที่ไม่ใช่ Hash จริง — Comment ในไฟล์บอกว่า "ต้องแทนที่ด้วย Argon2id
   hash ที่สร้างจากสคริปต์ติดตั้งจริง" แต่ `install-backend.ps1` ไม่เคยทำขั้นตอนนี้เลย (ผู้เขียนเจอปัญหานี้
   เองตอนพยายามหารหัสผ่านทดสอบสำหรับ Playwright ใน §4.18)
2. `must_change_password` เป็นแค่ Flag ที่ส่งไปแสดงผลในหน้า Admin > Users เฉยๆ ไม่มีการบังคับจริงทั้งฝั่ง
   Frontend (ไม่มีหน้า Redirect) และ Backend (API endpoint อื่นเรียกได้ปกติแม้ Flag เป็น true)

| ส่วน | รายละเอียด |
|---|---|
| **การตัดสินใจสถาปัตยกรรม — `seed-admin` เป็นโหมดพิเศษของ `IsInventory.Api.exe` เอง ไม่ใช่ Script แยก** | เลือกวิธีนี้แทนการคำนวณ Argon2id Hash ด้วย PowerShell เอง เพื่อรับประกันว่า Hash ที่เขียนลง DB ตรงกับโค้ดตัวเดียวกับที่ `AuthController.Login` ใช้ตรวจสอบเป๊ะ (ไม่มีความเสี่ยง Hash ไม่ตรง Format) — `Program.cs` เช็ค `args[0] == "seed-admin"` ตั้งแต่ก่อน Build DI Container เต็มรูปแบบ อ่านรหัสผ่านจาก Environment Variable `ISINVENTORY_SEED_ADMIN_PASSWORD` (ไม่ใช่ argv) กันไม่ให้หลุดไปอยู่ใน Shell History/Process List แล้ว Hash ด้วย `IPasswordHasher` (Argon2id) ตัวจริงเขียนลง DB ตรงๆ, ตั้ง `must_change_password = 1` เสมอ |
| Backend — Enforcement 2 ชั้น | (1) **JWT Claim ใหม่** `must_change_password` ฝังเข้า Access Token ตอน Login/Refresh/Reissue (`JwtTokenService`/`AuthService`) (2) **Global Middleware ใน `Program.cs`** เช็ค Claim นี้ทุก Request ที่ผ่าน `[Authorize]` แล้วตอบ `403 {error:"password_change_required"}` ทันทีถ้าเป็น `true` และ Path ไม่ได้ขึ้นต้นด้วย `/api/auth` — กันไม่ให้ข้ามหน้า Frontend ไปเรียก API ตรงๆ ได้ |
| Backend — `AuthController.ChangePassword` เปลี่ยน Response | เดิมคืน `204 No Content` เปลี่ยนเป็นคืน `LoginResponse` เดียวกับ Login/Refresh (เรียก `IAuthService.ReissueForUserAsync` ที่เพิ่มใหม่) เพื่อให้ Frontend ได้ Token ใหม่ที่ `must_change_password=false` ทันที ไม่ต้องรอ Access Token เดิม (อายุ 15 นาที) หมดอายุก่อนถึงจะปลดล็อกได้ |
| Frontend — `ChangePasswordForm` (ใหม่) | Component ใช้ร่วมกันได้ทั้งโหมดบังคับ (`forced`) และโหมดสมัครใจในอนาคต — Validate Policy เดียวกับ Backend ฝั่ง Client ก่อนส่ง (8+ ตัวอักษร มีทั้งตัวอักษร+ตัวเลข, ยืนยันรหัสผ่านตรงกัน, ห้ามซ้ำรหัสเดิม) |
| Frontend — Gate ใน `(app)/layout.tsx` | ถ้า `user.mustChangePassword` เป็น `true` render แค่ `ChangePasswordForm` แทน Sidebar/Topbar/children **ทุก Route** ใต้ `(app)` กันไม่ให้พิมพ์ URL ตรงๆ ข้ามหน้าบังคับได้ (ทดสอบแล้วว่า Navigate ตรงไป `/server-inventory` ระหว่างถูกล็อกยังโดนหน้าบังคับสกัดอยู่) — คนละชั้นกับ Backend Middleware ข้างต้น |
| Deploy — `install-backend.ps1` เพิ่มขั้นตอนท้าย Script | ถามแบบ Interactive ว่าจะตั้งรหัสผ่าน admin เริ่มต้นตอนนี้หรือไม่ (`y` เฉพาะติดตั้งครั้งแรก กัน Re-run ทับรหัสผ่านที่ใช้งานจริงอยู่) รับรหัสผ่านแบบ `-AsSecureString` (ไม่ Echo หน้าจอ) พิมพ์ยืนยันซ้ำ เช็ค Policy ฝั่ง Script ก่อนส่งผ่าน Env Var ไปให้ `IsInventory.Api.exe seed-admin` แล้วลบ Env Var ทิ้งทันทีหลังจบ |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** `seed-admin` CLI (เขียน Hash จริงลง DB สำเร็จ), Login ด้วยรหัสผ่าน
ที่ Seed ได้ mustChangePassword=true, เรียก Endpoint อื่น (`/api/pickers/...`) ระหว่างล็อกโดน 403
`password_change_required`, `/api/auth/me` ยังเรียกได้ปกติ (อยู่ใน Allowlist), `PUT /api/auth/password`
สำเร็จคืน Token ใหม่ mustChangePassword=false ทันที, เรียก Endpoint เดิมด้วย Token ใหม่ผ่านทันทีไม่ต้องรอ
Token หมดอายุ, Re-login ด้วยรหัสผ่านใหม่ยืนยัน State ถูกบันทึกจริง — **ทดสอบผ่าน UI จริงด้วย Playwright
ครบ**: หน้าบังคับเปลี่ยนรหัสผ่านโผล่ทันทีหลัง Login, พิมพ์ URL ตรงไปหน้าอื่นระหว่างถูกล็อกยังโดนหน้าบังคับ
สกัดอยู่, กรอกฟอร์มสำเร็จแล้วปลดล็อกเข้า Sidebar/Dashboard ได้ทันที (ระหว่างทดสอบรอบนี้ยังจับได้บั๊กจริงใน
`ServerInventoryForm` ตามที่บันทึกไว้ใน §4.18 ด้วย)

**🎉 ปิดครบทุกรายการแล้ว**

---

### 4.20 Backend/Frontend — Self-protection กันแก้สิทธิ์ตัวเอง + สิทธิ์ต่อเมนูรายคน Phase 1 (21 ก.ย. 2569)

**ขอบเขตรอบนี้:** ผู้ใช้ถามว่ามีกฎ "IT Admin ห้ามแก้สิทธิ์/เปลี่ยน Role/Disable ตัวเอง, ต้องมี Active Admin
อย่างน้อย 1 คน, Delete/Restore/Merge = Admin เท่านั้น" หรือยัง (ยังไม่มีสักข้อ) แล้วสั่งดำเนินการ พร้อมขอให้
ออกแบบระบบให้ Admin กำหนดได้ว่าแต่ละ User เห็น/ใช้เมนูไหนได้บ้าง (View/Add/Edit/Delete) — เลือกแนวทาง
**Role เป็นค่าเริ่มต้น + Override รายคน** และ**แบ่ง 2 เฟส** ตามที่ผู้ใช้ยืนยัน (Phase 1: Schema + Backend
Enforcement + กรองเมนูจริง — รอบนี้; Phase 2: ซ่อนปุ่ม Add/Edit/Delete ในแต่ละหน้า + หน้า Admin จัดการสิทธิ์
แบบตาราง — ยังไม่ทำ)

| ส่วน | รายละเอียด |
|---|---|
| Self-protection — `UsersController.Update` | Admin แก้ Role/Disable ตัวเอง → `409 self_role_change`/`self_disable`; ลด Role ออกจาก ADMIN หรือ Disable ผู้ใช้ ADMIN ที่ Active คนสุดท้าย (แม้ทำโดย Admin คนอื่น) → `409 last_admin` |
| Database — `17-module-user-menu-permissions.sql` | ตารางใหม่ 3 ตัว (ไม่ Temporal): `menus` (Registry 19 เมนู ตรงกับ `nav.ts`), `role_menu_permissions` (ค่าเริ่มต้นต่อ Role×เมนู Seed ให้ตรงกับ Policy เดิมทุกตัวเป๊ะ — พฤติกรรม Default ไม่เปลี่ยน), `user_menu_permissions` (Override รายคนแบบ Sparse, `NULL` = สืบทอดจาก Role) |
| **การตัดสินใจสถาปัตยกรรม — ผูกกับ "เมนู" ไม่ใช่ Controller/Route** | กันสิทธิ์หลุดเวลา Route เปลี่ยนภายใน — `PickersController` ทั้งตัวและ `LocationsController` GET (Tree/Detail) **ไม่ผูกกับระบบนี้เลย** ยังเป็น AnyRole เหมือนเดิม เพราะเป็นข้อมูลอ้างอิงข้ามหน้า (Location Picker ในฟอร์มอื่น) ไม่ใช่ "เมนู" ที่เข้าตรงๆ — เฉพาะ Create/Edit/Delete ของ Locations ผูกกับสิทธิ์ `admin_locations` |
| Backend — `IPermissionService`/`PermissionService` | Effective Permission = User Override ?? Role Default ต่อ (User, เมนู, Action) |
| Backend — `RequiresPermissionAttribute` | แทนที่ `[Authorize(Policy="AnyRole"/"ItStaffOrAbove"/"AuditorOrAbove"/"Admin")]` เดิมทั้งหมดใน ~20 Controller ด้วย `[RequiresPermission(menuKey, Action)]` — Implement เป็น `IAsyncAuthorizationFilter` (ไม่ใช่ `IAsyncActionFilter`) **จำเป็นต้องเป็นชั้น Authorization** เพราะ `[ApiController]` ตรวจ Model Validation ในชั้น Action Filter ด้วย ถ้าใช้ Action Filter สิทธิ์จะเช็คช้ากว่า Validation ทำให้ผู้ใช้ที่ไม่มีสิทธิ์เห็น Error 400 (บอก Field ที่ขาด) แทนที่จะโดน 403 ตั้งแต่แรก (**บั๊กที่พบระหว่างทดสอบและแก้แล้ว**) — รองรับ OR-เมนู (`RequiresPermission(Action, "assets", "contracts")`) สำหรับ Sub-resource ที่มีเจ้าของได้มากกว่า 1 เมนู เช่น Attachment |
| Backend — `AuthController` | `LoginResponse`/`Refresh`/`ChangePassword`/`GET /api/auth/me` ส่ง `permissions` (Map เมนู→{view,create,edit,delete}) กลับไปด้วยเสมอ |
| Backend — `UsersController` เพิ่ม 3 Endpoint | `GET/PUT/DELETE api/users/{id}/permissions[/{menuKey}]` — Admin ตั้ง/ล้าง Override รายเมนูได้ (กันแก้สิทธิ์ตัวเองด้วยกฎเดียวกับข้อบน) — ยังไม่มีหน้า UI ให้กด (Phase 2) ใช้ทดสอบผ่าน API ตรงๆ ก่อน |
| Frontend — `nav.ts` | `NavItem.roles` (Array ของ Role) → `NavItem.menuKey` (String เดียว ตรงกับ `dbo.menus.menu_key`) — `visibleNavItems()` กรองด้วยสิทธิ์จริงจาก `/api/auth/me` แทน Role ตรงๆ, กลุ่มเมนู (Server/Administration) โชว์ก็ต่อเมื่อมีลูกที่เห็นได้อย่างน้อย 1 |
| Frontend — `AuthContext` | เพิ่ม `permissions: PermissionsMap` เก็บคู่กับ `user`, `applySession` รับ Permissions เพิ่มด้วย |
| **สิ่งที่ยังไม่ทำ (Phase 2)** | ปุ่ม Add/Edit/Delete ในแต่ละหน้า (12 จุดที่ยัง Hardcode `roleCode === "ADMIN" \|\| "IT_STAFF"`) ยังไม่เปลี่ยนไปใช้ Permission จริง — ปลอดภัยเพราะ Backend เช็คจริงอยู่แล้ว (กดปุ่มได้แต่ยิง API แล้วโดน 403 ถ้าไม่มีสิทธิ์จริง) แค่ UI ยังไม่ซ่อนปุ่มที่กดไม่ได้ตาม Override; หน้า Admin จัดการสิทธิ์แบบตารางก็ยังไม่มี |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** Role Default ตรงกับ Policy เดิม 100% (Spot-check `assets`/
`admin_users`/`reports`/`dashboard`/`import`/`admin_locations` ทั้ง 4 Role), VIEWER ยิง `POST /api/assets`
โดนบล็อกจริง (`403 forbidden` — หลังแก้บั๊ก Action Filter แล้ว), Admin ตั้ง Override ให้ VIEWER มีสิทธิ์
`admin_master_data` Create ได้ทันที (Login ใหม่เห็นสิทธิ์เปลี่ยน, ยิง `POST /api/lookups/vendors` ผ่านจริง),
ล้าง Override แล้วสิทธิ์กลับไปตาม Role เดิมทันที (ยิงซ้ำโดนบล็อกอีกครั้ง), Admin แก้สิทธิ์ตัวเองโดนบล็อก
(`409 self_permission_change`) — ลบ/ปิดข้อมูลทดสอบออกหมดแล้ว (Deactivate User ทดสอบ 2 บัญชีตาม FR-AU-09
ไม่ลบจริง) — **Backend** `dotnet build` ผ่านสะอาด, **Frontend** `npx tsc --noEmit`/`npm run build`
(Next.js 16 Turbopack) ผ่านสะอาด — ยังไม่ได้ทดสอบผ่าน Browser จริงด้วย Playwright รอบนี้ (Phase 1 เน้น
Backend Enforcement เป็นหลัก จะทดสอบ UI เต็มรูปแบบพร้อม Phase 2)

**หมายเหตุ (ถามจากผู้ใช้ก่อน Phase 2):** ตอนนี้มี Audit Log เฉพาะฝั่ง "สำเร็จ" (Admin ตั้ง/ล้าง Override
บันทึกเป็น `SETTING_CHANGE`) — ฝั่ง "ถูกบล็อก" ยังไม่มี Audit เลยทั้ง Self-protection 409 (พยายามแก้สิทธิ์/
Role/Disable ตัวเอง) และ `RequiresPermissionAttribute` 403 (ยิง Endpoint ที่ไม่มีสิทธิ์) — ยังไม่ได้แก้
รอคำสั่งผู้ใช้

---

### 4.21 Backend/Frontend — User: Site + Team (บังคับเลือกตอนสร้าง) (21 ก.ย. 2569)

**ขอบเขตรอบนี้:** ผู้ใช้ขอเพิ่ม 2 ฟิลด์บังคับบนบัญชีผู้ใช้ — **Site** (เลือกจาก "1st Site"/"2nd Site")
และ **Team** (เลือกจาก "Admin Team"/"Support Team"/"Develop Team") ถามยืนยัน 2 จุดก่อนทำ: (1) แยกเป็น
Lookup ใหม่ต่างหาก ไม่ใช้ร่วมกับ `vlan_sites` เดิม (2) Backfill บัญชีเดิมเป็นค่า Default (1st Site +
Admin Team) ตอน Migrate

| ส่วน | รายละเอียด |
|---|---|
| Database — `18-module-user-site-team.sql` | ตารางใหม่ 2 ตัว (`user_sites` Seed 2 แถว, `user_teams` Seed 3 แถว) + `dbo.users` เพิ่มคอลัมน์ `site_id`/`team_id` NOT NULL พร้อม FK — Backfill บัญชีเดิมเป็น Default ก่อนบังคับ NOT NULL |
| **บั๊กที่พบระหว่างทำ Migration และแก้แล้ว** | `dbo.users` เป็น Temporal Table (System-Versioned) — พบว่า SQL Server บังคับให้ **Nullability ของคอลัมน์ต้องตรงกันทั้งตารางหลักและตารางประวัติ (`users_history`)** ก่อนเปิด System Versioning กลับได้ (ต่างจากกรณี v1.7 ที่คอลัมน์ใหม่ยังเป็น NULL ได้ทั้งคู่เลยไม่เจอปัญหานี้) ต้อง Backfill + `ALTER COLUMN NOT NULL` บน `users_history` ด้วย และต้อง `DROP INDEX` ก่อน `ALTER COLUMN` แล้วค่อยสร้างใหม่ (SQL Server ไม่ให้เปลี่ยน Nullability ตรงๆ ถ้ามี Index อยู่) |
| Backend — `PickersController` เพิ่ม 2 Endpoint | `api/pickers/user-sites`, `api/pickers/user-teams` (Read-only ให้ทุก Role ใช้เป็น Dropdown เหมือน Pattern เดิม) |
| Backend — `UsersController` | `CreateUserRequest`/`UpdateUserRequest` เพิ่ม `SiteId`/`TeamId` (บังคับ, Validate ว่ามีอยู่จริงก่อนบันทึก ไม่งั้น `400 invalid_site`/`invalid_team`) — `UserListItem` ส่ง `siteName`/`teamName` กลับไปแสดงผลด้วย |
| Frontend — หน้า Admin > Users | ฟอร์มสร้าง User เพิ่ม Dropdown Site + Team (บังคับเลือกทั้งคู่) ตารางแสดงคอลัมน์ Site/Team เพิ่ม |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** Picker คืนค่าตรงตามที่กำหนด (2 Site, 3 Team), สร้าง User ไม่ใส่
Site/Team โดนบล็อก (`400 invalid_site`), ใส่ Site/Team ที่ไม่มีจริงโดนบล็อก (`400`), สร้างสำเร็จด้วยค่า
ถูกต้องแสดงชื่อ Site/Team กลับมาถูกต้อง, แก้ไข User (Deactivate) ผ่าน Site/Team เดิมได้ปกติ, บัญชีเดิมที่
เคย Migrate มา (`admin` และบัญชีทดสอบเก่า) ได้ค่า Default "1st Site"/"Admin Team" ถูกต้องครบ — **Backend**
`dotnet build` ผ่านสะอาด, **Frontend** `npx tsc --noEmit`/`npm run build` ผ่านสะอาด — ลบ/ปิดข้อมูลทดสอบ
ออกหมดแล้ว

---

## 5. โครงสร้างฐานข้อมูลปัจจุบัน

**66 ตาราง · 45 ตารางประวัติ (Temporal) · 45 View · 5 Function · 3 SP · 10 Trigger** (ยืนยันจากการรันจริงก่อน
v1.7) — **+ v1.7 (Server Domain, §4.18):** ตารางใหม่ 7 ตัว (`os_types` `os_versions` `server_statuses`
`server_cpus` `server_memory_modules` `server_local_disks` `storage_volume_consumers` — ไม่มีตัวไหน
Temporal) + View ใหม่ 1 ตัว (`vw_server_hardware_summary`) — **+ สิทธิ์ต่อเมนูรายคน (§4.20):** ตารางใหม่อีก
3 ตัว (`menus` `role_menu_permissions` `user_menu_permissions` — ไม่มีตัวไหน Temporal) — **+ User Site/Team
(§4.21):** ตารางใหม่อีก 2 ตัว (`user_sites` `user_teams` — ไม่มีตัวไหน Temporal) รวมเป็น
**78 ตาราง · 46 View**

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
| **Server Domain (v1.7 — §4.18)** | `os_types` `os_versions` `server_statuses` `server_cpus` `server_memory_modules` `server_local_disks` `storage_volume_consumers` |
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
