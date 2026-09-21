# KKND — แผนดำเนินการจากนี้จนถึง Go-Live

> เอกสารนี้เป็น Master Plan ต่อจาก `HANDOFF.md` §11 เดิม (ซึ่งครอบคลุมแค่ v1.0–v1.4)
> ขยายให้ครบทั้ง v1.5 Permission Control และ Administration Settings ที่เพิ่งออกแบบเสร็จ
> อัปเดตล่าสุด: 2569-09-20 — เพิ่ม VLAN Secondary Subnet/Untagged + Application Module (v1.6)

---

## 0. ภาพรวมสถานะปัจจุบัน

| หัวข้อ | สถานะ |
|---|---|
| Requirement (PRD) | ✅ เสร็จ — 67 FR · 15 NFR |
| Database Design | ✅ เสร็จ **และทดสอบรันจริงผ่านแล้ว** — 66 ตาราง · 45 Temporal · 45 View · 10 Trigger บน SQL Server 2022 จริง (ล่าสุด 20 ก.ย. 2569 รวม VLAN Secondary Subnet + Application Module) |
| UI/UX Design | ✅ เสร็จ — User Flow · Wireframe 9 หน้า · Design System · หน้าตั้งค่า 25 หน้า |
| Tech Stack | ✅ ตัดสินใจแล้ว — ASP.NET Core (.NET 8) + EF Core + Next.js |
| **โค้ดจริง** | 🟡 **Sprint 0 + Sprint 1 + Sprint 2 เสร็จ · Sprint 3 กำลังทำ** — Login/RBAC/จัดการผู้ใช้/Master Data/Asset CRUD ครบ 7/8 หมวด/Audit Log UI/Attachment/Application บน Server/Cluster/Storage Volume/Rack ใช้งานได้จริง (§1.4–§1.11) · Software License/VLAN Site UI ยังไม่เริ่ม (ส่วนที่เหลือของ Sprint 3 + Sprint 4) · **พบบล็อกจริง: ไม่มี Location Tree Picker ทำให้สร้าง Rack ใหม่ผ่านหน้าเว็บไม่ได้ (§1.11)** |

**สรุป 1 บรรทัด:** Design เสร็จหมดแล้ว ฐานข้อมูลทดสอบผ่านแล้ว Backend/Frontend เชื่อมต่อกันจริง
Login + RBAC + จัดการผู้ใช้ + Layout ใช้งานได้ (Sprint 1) บันทึก/ค้นหา Master Data ได้จริง (Sprint 2)
Asset CRUD ครบ 7 ใน 8 หมวด ดู Audit Log แนบ/ดาวน์โหลดไฟล์ จัดการ Application บน Server, Cluster/Storage
Volume และ Rack พร้อมผังกราฟิกได้จริงแล้ว (Sprint 3 บางส่วน §1.6–§1.11) — คอขวดตอนนี้เหลือแค่ **ข้อมูลจริง
ที่ยังไม่ได้รับ** (§1.2), **Windows Server ทดสอบ AD/FSRM** (§1.1), และ **Location Tree Picker ที่เพิ่งพบว่า
เป็นบล็อกจริง** (§1.11) — ไม่ใช่การตัดสินใจสถาปัตยกรรมหรือความเสี่ยงจาก Schema/Stack ที่ไม่เคยพิสูจน์แล้ว
อีกต่อไป

---

## 1. Phase 0 — Pre-Flight (ต้องทำก่อนเปิด Sprint 0)

งานกลุ่มนี้ **ไม่ใช่งานเขียนโค้ด** แต่เป็นเงื่อนไขที่ถ้าไม่มี Sprint 0 จะเริ่มไม่ได้จริง หรือเริ่มได้แต่ต้องรื้อทีหลัง

### 1.1 🔴 บล็อกทั้งโปรเจกต์ — ต้องมีก่อน Sprint 0

| # | รายการ | เหตุผลที่บล็อก |
|:---:|---|---|
| ~~1~~ | ~~SQL Server Instance สำหรับทดสอบ~~ | ✅ **เสร็จแล้ว (ล่าสุด 20 ก.ย. 2569)** — รันครบ 8 ไฟล์บน SQL Server 2022 (Docker) ผ่านสำเร็จ พบและแก้บั๊ก 6 จุดจากการรันจริง ดู `HANDOFF.md` §4.4.1 · ปรับ VLAN รองรับ Secondary Subnet + เพิ่ม Application Module ตามข้อมูลจริง ดู §4.4.2 |
| 1 | **Windows Server ทดสอบที่มี AD + FSRM** | Collector Agent ต้องมีสภาพแวดล้อมทดสอบ LDAP Query และ `Get-FsrmQuota` จริง จำลองด้วย Mock ไม่ได้ทั้งหมด |
| 2 | **Service Account สำหรับ Collector Agent** | ต้องเป็น Read-Only ใน AD (ไม่ใช่ Domain Admin) — ต้องขอสร้างล่วงหน้า เพราะปกติต้องผ่านขั้นตอนอนุมัติของทีม AD |

> **Sprint 0 เขียนโค้ดต่อยอดจาก Schema นี้ได้ทันที** — ไม่ต้องรอ SQL Server Instance แยกอีกต่อไป
> (ยังต้องมี Instance จริงของโปรเจกต์ตอน Deploy แต่ไม่ใช่เงื่อนไขบล็อกการเริ่มเขียนโค้ดอีกแล้ว)

### 1.2 🟡 ข้อมูลที่ต้องได้ก่อนเขียนหน้าที่เกี่ยวข้อง (ไม่บล็อกทั้งหมด แต่บล็อกเฉพาะ Sprint)

| รายการ | บล็อก Sprint ไหน | ถ้าไม่ได้รับ |
|---|---|---|
| รูปแบบ `fixed_asset_no` | Sprint 2 (Asset CRUD) | ใช้ Free-text ไปก่อน ปรับ Validation ทีหลังได้ |
| ค่า SMTP ขององค์กร | Sprint 6 (Notification) | เลื่อนเฉพาะการทดสอบส่งอีเมลจริง โค้ดเขียนคู่ขนานได้ |
| โครงสร้างสถานที่จริง (Building/Floor/Room/Rack) | Sprint 2 (Master Data) | ใส่โครงสร้างตัวอย่างไปก่อน แก้ผ่านหน้า Settings ได้ทีหลังโดยไม่กระทบโค้ด |
| ชื่อ OU จริงที่จะ Sync | Sprint 8 (AD Sync) | ไม่บล็อก — ออกแบบไว้แล้วว่ากรอกผ่านหน้าตั้งค่า `sync_ou_scopes` |

> ชื่อ OU **ไม่ใช่ตัวบล็อก** เพราะระบบออกแบบให้กรอกทีหลังผ่านหน้าจอได้อยู่แล้ว — ระบุไว้ตรงนี้เพื่อไม่ให้ใครไปรอมันโดยไม่จำเป็น

### 1.3 ✅ Project Scaffolding (20 ก.ย. 2569)

`backend/` (ASP.NET Core .NET 8 + EF Core) และ `frontend/` (Next.js 16) สร้างแล้ว
ทดสอบเชื่อมต่อ Backend↔Database↔Frontend ครบวงจรจริง ไม่ใช่แค่ Scaffold เปล่า

| ส่วน | สถานะ |
|---|---|
| `backend/` — Solution 3 โปรเจกต์ (Api/Domain/Infrastructure) | ✅ Build ผ่าน |
| `KkndDbContext` + Entity 111 ตัว | ✅ Scaffold จาก DB จริงที่ทดสอบแล้ว (ไม่ได้เขียนมือ) — 45 Temporal ผ่าน `IsTemporal()` อัตโนมัติ ไม่สร้าง Entity ซ้ำ, 45 View เป็น Keyless Entity |
| `GET /health/db` | ✅ ยืนยันแล้ว: `canConnect: true, tableCount: 111` |
| `frontend/` — Next.js 16 + Tailwind v4 + Design Token ครบ | ✅ Build ผ่าน · ทดสอบด้วย Screenshot จริง |
| Font self-hosted (`@fontsource-variable/*`) | ✅ ตาม NFR-15 — ไม่พึ่ง Google Fonts CDN ตอน Runtime |
| หน้าแรกดึงข้อมูลจริงจาก Backend | ✅ แสดง "Connected — 111 tables found" |

**บั๊ก/ข้อติดขัดที่เจอและแก้ระหว่าง Setup:**

| # | ปัญหา | แก้ |
|:---:|---|---|
| 1 | `builds.dotnet.microsoft.com` และ `ui.shadcn.com` ถูก Proxy ของ Sandbox บล็อก | ติดตั้ง .NET SDK ผ่าน `apt install dotnet-sdk-8.0` แทน · สร้าง shadcn/ui Component (Button) มือ ตาม Pattern เดียวกัน (`cva` + `cn()`) เพราะดึง Registry ไม่ได้ |
| 2 | GitHub Raw ของ Repo ภายนอก (rsms/inter, JetBrains/JetBrainsMono) ถูกจำกัดสิทธิ์ตาม Session | ใช้ `@fontsource-variable/inter` และ `@fontsource-variable/jetbrains-mono` จาก npm แทน — Bundle ไฟล์ Font ในตัว Package |
| 3 | Entity `FileShare` (จาก `dbo.file_shares`) ชนกับ `System.IO.FileShare` ใน Implicit Global Using ของ .NET 8 | Alias `using FileShare = KKND.Infrastructure.Entities.FileShare;` ใน `KkndDbContext.cs` |
| 4 | `tailwindcss-animate` เป็นปลั๊กอิน Tailwind v3 ใช้กับ v4 ไม่ได้ | เอาออก (ยังไม่มี Component ไหนต้องใช้) |
| 5 | React Strict Mode (Dev) ล้าง `class="dark"` ที่สคริปต์กันจอขาววาบตั้งไว้ทิ้งตอน Remount | เพิ่ม `suppressHydrationWarning` บน `<html>` ตาม Next.js 16 Docs |
| 6 | หน้าแรกเขียนข้อความเป็นภาษาไทยตอนแรก ขัดกับ NFR-10 | แก้เป็นภาษาอังกฤษทั้งหมด รวม `lang="en"` |

### 1.4 ✅ Sprint 1 — Auth + RBAC + Layout (20 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.5 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| Login (Argon2id + JWT + Refresh Token Rotation) | ✅ ทดสอบกับ SQL Server จริง |
| Lockout 5 ครั้ง/15 นาที + ข้อความไม่บอกว่าผิดช่องไหน (FR-AU-03/04) | ✅ ยืนยันด้วยการยิง Login ผิดจริง 5 ครั้ง |
| RBAC 4 บทบาท (Admin/IT Staff/Auditor/Viewer) ผ่าน Policy ที่ Server | ✅ |
| จัดการผู้ใช้ (สร้าง/แก้ Role/Deactivate/Reset รหัสผ่าน) | ✅ ทั้ง API และหน้า Admin > Users |
| Layout — Sidebar เมนูตาม Role + Topbar + Dark Mode | ✅ ทดสอบด้วย Playwright |

**ปรับจากแผนเดิม:** ใช้ Argon2id+JWT เขียนเองแทนการเรียก `AddIdentity<>()` ตรงๆ เพราะ Schema
`users`/`roles`/`refresh_tokens` ที่ออกแบบไว้ตั้งแต่ Phase 3 ไม่ใช่รูปแบบตารางของ ASP.NET Core
Identity — หลักการความปลอดภัย (Argon2id, RBAC, Refresh Token) ยังตรงตามที่ตกลงไว้ทุกข้อ

**คงเหลือจาก Sprint 1:** หน้าเปลี่ยนรหัสผ่านตนเอง (Self Change Password UI) มี API พร้อมแล้ว
(`PUT /api/auth/password`) แต่ยังไม่ได้ทำหน้าจอ — ยังไม่ได้ทำใน Sprint 2 ด้วย (ไม่ใช่งานของ Sprint
นี้) เลื่อนไปพร้อมหน้า Profile ที่ยังไม่ถึงคิว

### 1.5 ✅ Sprint 2 — Master Data CRUD + Asset CRUD (20 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.6 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| Master Data CRUD 11/12 หน้า (Config-driven Component เดียว ทั้ง Backend/Frontend) | ✅ ทดสอบกับ SQL Server จริง |
| กฎห้ามลบข้อมูลที่มีการอ้างอิง + เสนอปิดใช้งานแทน | ✅ ยืนยันด้วยข้อมูลจริง |
| Asset CRUD — Server/Network (ใช้ Stored Procedure เดิมสร้าง Asset Tag + Soft Delete) | ✅ ทดสอบผ่าน API และ UI จริง |
| Server-side Pagination + Search (Asset Tag/ชื่อ/Serial/Hostname) | ✅ |
| `PickersController` (Dropdown ให้ทุก Role ใช้ตอนสร้าง Asset) | ✅ |

**ปรับจากแผนเดิม:**
- `device_models` (1 ใน 12 หน้า Master Data) ยังไม่ทำ — ต้องมีผังต้นไม้ `asset_type` ก่อน ซึ่งเป็น
  1 ใน 13 หน้าที่ต้องออกแบบเฉพาะ (`04-settings-screens.md` §4.2) ยังไม่ถึงคิว
- ฟอร์ม Asset ยังไม่มีช่องเลือก `asset_type`/`model_id` ด้วยเหตุผลเดียวกัน — ใช้ `category`
  (Server/Network) กับช่อง `model` แบบพิมพ์เองไปก่อน
- ค้นหา Asset ยังไม่ครอบคลุม IP/VLAN (FR-SE-01 ระบุไว้ครบ) — รอ Sprint 3 ที่ทำ VLAN/IPAM UI
- ช่อง Parent Host/Uplink Asset เป็นช่องกรอก ID ตรงๆ ยังไม่มี Autocomplete ค้นหาชื่อ Asset

**คงเหลือจาก Sprint 2 (ไม่บล็อก Sprint 3):** `device_models`, Asset Type Tree Picker,
Location Tree Picker, Autocomplete เลือก Asset — ทั้งหมดนี้ทำพร้อมกันได้เมื่อสร้างหน้า
"ประเภทอุปกรณ์" (Asset Types ผังต้นไม้) ซึ่งเป็นหนึ่งใน 13 หน้าเฉพาะที่ยังไม่ได้ออกแบบ UI จริง

### 1.6 🟡 Sprint 3 (บางส่วน) — Asset CRUD ขยายครบ 7/8 หมวด (20 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.7 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| Asset CRUD ขยายจาก Server/Network เป็น 7 หมวด (+ Computer/Storage/Power & Cooling/Peripheral/Mobile & IoT-OT) | ✅ ทดสอบกับ SQL Server จริง |
| ค้นหาขยายให้ครอบ Hostname ของ Computer/Storage/Mobile IoT | ✅ |
| `EnumSelectField` — Dropdown ปิดตายตัวสำหรับคอลัมน์ที่มี DB CHECK Constraint เป็น Enum | ✅ กันข้อมูลผิดตั้งแต่ต้นทาง ไม่ต้องพึ่ง Error จากฐานข้อมูล |

**ปรับจากแผนเดิม:** Sprint Plan เดิมเขียนว่า Sprint 3 มี "Asset ประเภทที่เหลือ (8 หมวด)" ซึ่งคลาดเคลื่อน
(มีแค่ 8 หมวดทั้งหมด ทำไปแล้ว 2 ใน Sprint 2) — รอบนี้ทำ 5 หมวดที่เหลือที่มีโครงสร้างแบบเดียวกับ
Server/Network (Extension Table 1:1 ธรรมดา) และ **ตั้งใจข้าม Software License (`SFT`)** เพราะ Sprint
Plan เดิมเองแยกมันไว้ที่ Sprint 4 (ต้องมี Seat Counting) และมีคอลัมน์ `license_key_encrypted` ที่ต้อง
ตัดสินใจเรื่องการเข้ารหัสก่อน ไม่ใช่แค่ Extension Table รูปแบบเดียวกับหมวดอื่น

**พบระหว่างทดสอบจริง (ไม่ใช่ Bug แต่เป็นวินัยข้อมูลที่ออกแบบไว้แล้ว):** `power_details` มี Constraint
บังคับว่าถ้าบันทึก `current_load_percent` ต้องมี `load_measured_at` กำกับด้วย (decision #15) และ
`mobile_iot_details.device_protocol`/`storage_type` ต้องเป็นค่าใน Enum ที่กำหนดเท่านั้น — แก้ด้วยการ
เปลี่ยนช่องกรอกอิสระเป็น Dropdown ปิดตายตัวในฟอร์ม แทนที่จะปล่อยให้ผู้ใช้เจอ Error จากฐานข้อมูลตรงๆ

**คงเหลือใน Sprint 3 (ยังไม่ทำรอบนี้):** Attachment · Audit Log UI (มี Backend Audit Log ทำงานอยู่
แล้วตั้งแต่ Sprint 2 แต่ยังไม่มีหน้าดู — **ทำแล้วใน §1.7**) · Storage/Cluster · Rack พร้อมผังกราฟิก ·
VLAN + Site (รองรับ Secondary Subnet/Untagged) · Application บน Server (v1.6) — Software License
เลื่อนไป Sprint 4 ตามแผนเดิม

---

### 1.7 🟡 Sprint 3 (บางส่วน) — Audit Log UI (21 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.8 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| `GET /api/audit-logs` (List + Filter + Pagination) และ `GET /api/audit-logs/{id}` (Detail) | ✅ ทดสอบกับ SQL Server จริง |
| หน้า `/audit-logs` — เมนู Sidebar ที่เคยเป็นลิงก์ตายตั้งแต่ Sprint 1 ใช้งานได้แล้ว | ✅ |
| Filter: Search (Username/Entity Label) · Action · Entity Type · ช่วงวันที่ | ✅ |
| คลิกแถวขยายดู Before/After JSON | ✅ UI ทำงานถูกต้อง แต่ยังไม่มีข้อมูลจริงให้แสดง (ดูข้อจำกัดด้านล่าง) |

**พบระหว่างทดสอบ:** Action ที่มีจริงในตารางมากกว่าที่เอกสาร Sprint ก่อนหน้าเคยบันทึกไว้ — `AuthService.cs`
เขียน Audit Log เอง (Action `LOGIN`/`LOGIN_FAILED`) แยกจาก `AuthController.cs` ที่เขียนแค่
`PASSWORD_CHANGE` — grep ตอนออกแบบ Filter ครั้งแรกจับไม่ครบ แก้โดยเพิ่มทั้งสอง Action เข้า Dropdown

**ข้อจำกัดที่รู้ตัว (ไม่ใช่ Bug ของงานรอบนี้):** คอลัมน์ `before_json`/`after_json`/`changed_fields`
ไม่เคยถูกเขียนค่าจริงจาก Controller ไหนเลยตั้งแต่ Sprint ก่อนหน้า (มีแค่ `EntityId`/`EntityLabel`) —
หน้า Detail จึงแสดง "—" เสมอ ต้องเพิ่ม Diff Tracking ใน `AssetsController`/`UsersController` ทีหลังถ้า
ต้องการเห็นค่าก่อน/หลังจริง

---

### 1.8 🟡 Sprint 3 (บางส่วน) — Attachment + แก้ RBAC Audit Log (21 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.9 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| 🔴 **แก้บั๊ก:** Audit Log ของ IT Staff กรองเหลือเฉพาะรายการของตัวเอง ตาม PRD §5.2 (ก่อนหน้านี้เห็นทั้งระบบผิด Permission Matrix) | ✅ แก้แล้ว Server-side ทั้ง List/Detail |
| FR-AT-01 แนบไฟล์หลายไฟล์ต่อทรัพย์สิน | ✅ ทดสอบกับ SQL Server จริง |
| FR-AT-02 จำกัดชนิด+ขนาดไฟล์ (PDF/JPG/PNG/XLSX/DOCX · 10 MB) | ✅ ตรงกับ `CK_attachments_size` ที่มีอยู่แล้ว |
| FR-AT-03 ตรวจ Magic Number จริง ไม่เชื่อนามสกุล/Content-Type | ✅ รวมถึงเปิด ZIP ตรวจ Entry จริงสำหรับ XLSX/DOCX |
| FR-AT-04 เก็บไฟล์นอก Web Root เข้าถึงผ่าน API ที่ตรวจสิทธิ์ | ✅ ไม่มี `wwwroot`/Static File Serving ในโปรเจกต์นี้เลยตั้งแต่ต้น |
| FR-AT-05 แสดงผู้อัปโหลด+วันที่ | ✅ |
| Frontend — Attachments Panel บนหน้า Edit Asset | ✅ Upload/List/Download/Delete ตาม Role |

**พบบั๊กระหว่างเขียน Frontend:** `apiFetch` (ใช้ร่วมกันทั้งแอป) Set Header `Content-Type: application/json`
ให้ทุก Request ที่มี Body รวมถึง `FormData` ด้วย ซึ่งทำให้ Browser ไม่ได้ใส่ Multipart Boundary เอง — Upload
ไฟล์จะพังทันทีถ้าไม่แก้ ปรับให้ข้าม Header นี้เมื่อ Body เป็น `FormData`

**ยังไม่ทำ:** Attachment บน Contract (คอลัมน์รองรับแล้วแต่รอ Contract CRUD ใน Sprint 4), ตั้งค่าขนาดไฟล์/
Whitelist ผ่านหน้า Settings แบบ Runtime (ตอนนี้ Hardcode ในโค้ด)

---

### 1.9 🟡 Sprint 3 (บางส่วน) — Application บน Server / v1.6 (21 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.10 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| `ServerApplicationsController` — CRUD ตาราง `dbo.server_applications` | ✅ ทดสอบกับ SQL Server จริง |
| ผูกกับ Asset หมวด Server เท่านั้น (Category อื่นสร้างไม่ได้) | ✅ |
| Picker ใหม่ `server-roles` (ใช้ซ้ำเป็น Server Type) และ `vlan-sites` | ✅ |
| Panel บนหน้า Edit Asset แสดงเฉพาะ Server | ✅ |

**หมายเหตุขอบเขต:** โมดูลนี้ผูกกับ `dbo.vlan_sites` (สาขาที่ 1/2) ซึ่งเป็น Lookup คงที่ 2 แถวตามที่ตกลง
กับผู้ใช้ไว้แล้วตอนออกแบบ Schema (§4.4.2) — ไม่ต้องสร้างหน้า Site CRUD ต่างหาก และยังไม่ทำหน้ารวม Browse
Application ข้ามทุก Server (ดูได้ทีละเครื่องผ่านหน้า Edit Asset เท่านั้นในตอนนี้)

**พบระหว่างทดสอบ:** ตาราง `server_applications` ไม่มีคอลัมน์ `is_deleted` เลยตั้งแต่ตอนออกแบบ Schema
(ต่างจากตารางอื่นแทบทั้งหมดในระบบ) — Delete ในโมดูลนี้จึงเป็น Hard Delete จริง ตรงตาม Schema ที่ออกแบบไว้
ไม่ใช่การมองข้าม Decision #11 (Soft Delete ทุกที่)

---

### 1.10 🟡 Sprint 3 (บางส่วน) — Storage/Cluster (21 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.11 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| `ClustersController` — CRUD Cluster + Members (Join/Leave-Rejoin/Remove) | ✅ ทดสอบกับ SQL Server จริง |
| `StorageVolumesController` — แยก Route ตามเจ้าของ (Asset/Cluster) ให้ตรงกับ `CK_vol_shared_cluster` | ✅ |
| หน้าใหม่ `/clusters` (List + Badge Degraded), `/clusters/new`, `/clusters/{id}` | ✅ |
| Storage Volumes Panel แบบ Reusable บนทั้งหน้า Asset (Server/Storage) และหน้า Cluster | ✅ |

**พบและแก้ระหว่างทดสอบ:** ส่งค่า Enum ที่ไม่อยู่ใน CHECK Constraint ตรงๆ ผ่าน curl (ข้าม Dropdown ของ UI)
ทำให้ API คืน 500 พร้อม Stack Trace ดิบ — เพิ่มการจับ `DbUpdateException` (SQL Error 547) แปลงเป็น 400
ข้อความอ่านง่ายในทุก Endpoint ที่เขียนค่า Enum ของโมดูลนี้ (Cluster Type/Quorum Type/Member Role)

**หมายเหตุ Lifecycle ที่ Schema ออกแบบไว้แล้ว:** "ออกจาก Cluster" ไม่ลบแถว แต่ตั้ง `left_date` (มี
`is_active` เป็น Computed Column คำนวณจากคอลัมน์นี้อยู่แล้ว) จึงกลับเข้า Cluster เดิมซ้ำได้โดยไม่ชน Unique
Constraint (กรองเฉพาะสมาชิกที่ยัง Active) — ทดสอบยืนยันแล้วว่า Leave แล้ว Rejoin ทำงานถูกต้อง

**ยังไม่ทำ:** Rack พร้อมผังกราฟิก, VLAN + Site UI — Software License รอ Sprint 4

---

### 1.11 🟡 Sprint 3 (บางส่วน) — Rack พร้อมผังกราฟิก (21 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.12 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| `RacksController` — CRUD Rack + Mount/Remove/Delete อุปกรณ์ | ✅ ทดสอบกับ SQL Server จริง |
| Database Trigger ตรวจตำแหน่งซ้อนทับ/เกินความสูงตู้ (มีอยู่แล้วในสคีมา) | ✅ Controller จับ Error 51030/51031 แปลงเป็น 400 |
| หน้าใหม่ `/racks` (List พร้อมเตือน Over Weight/Power), `/racks/new`, `/racks/{id}` | ✅ |
| **ผังกราฟิก Elevation** — CSS Grid วาดตำแหน่งอุปกรณ์ตาม U จริง สีตาม Asset Status | ✅ ทดสอบ BOTTOM_UP ถูกต้อง |

**พบบล็อกจริงระหว่างทดสอบ (สำคัญ):** Rack ต้องเลือก Location เสมอ แต่ระบบยังไม่มีหน้าจัดการ Location
เลยสักหน้า (Location Tree Picker เป็นช่องว่างที่รู้อยู่แล้วตั้งแต่ Sprint 2) — ทดสอบรอบนี้ต้อง Insert
Location ผ่าน SQL ตรงๆ ก่อนถึงจะสร้าง Rack ผ่าน UI ได้ นี่ไม่ใช่แค่ข้อจำกัดของการทดสอบ แต่เป็นบล็อกจริง
ที่ทำให้ผู้ใช้จริงสร้าง Rack ผ่านหน้าเว็บไม่ได้เลยในตอนนี้ — **ควรหยิบ Location Tree Picker เป็นงานแรกของ
รอบถัดไป** ก่อนงาน VLAN + Site UI ที่เหลือ

**หมายเหตุ Hard Delete:** เหมือน Cluster/Server Applications — Rack ไม่มี `is_deleted` จึงลบแบบ Hard
Delete บล็อกด้วย FK ถ้ายังมีแถว `rack_mounts` residual แม้เป็นแถวที่ "ถอดออกแล้ว" (`removed_date` ไม่
NULL) ก็ตาม เพราะยังอ้างอิง `rack_id` อยู่ — ต้อง Hard Delete แถวประวัติด้วยถ้าต้องการลบ Rack จริงๆ

---

## 2. Sprint Plan (Sprint 0–10, รวม ~49 วันทำงาน)

> เรียงตามลำดับ Dependency จริง ไม่ใช่ลำดับความสำคัญ — บาง Sprint ทำคู่ขนานได้ถ้ามีมากกว่า 1 คน (ดู §3)

| Sprint | ขอบเขต | Deliverable | วัน |
|:---:|---|---|:---:|
| **0** | ~~รัน SQL 8 ไฟล์ · Setup .NET Solution + Next.js Project~~ ✅ เสร็จแล้ว (ดู §1.3) — เหลือ Seed Data ชุดจริง + Deploy Pipeline | Repo พร้อมพัฒนา · Backend↔DB↔Frontend ต่อกันจริงแล้ว | 1 |
| **1** | ~~Auth (Argon2id+JWT ตาม Schema เดิม แทน ASP.NET Core Identity โดยตรง) · RBAC 4 บทบาท · จัดการผู้ใช้ · Layout + Dark Mode + กันจอขาววาบ~~ ✅ เสร็จแล้ว (ดู §1.4) | Login และควบคุมสิทธิ์ได้ | 4 |
| **2** | ~~Master Data CRUD (11/12 หน้า — เหลือ `device_models` รอผังต้นไม้ `asset_type`) · Asset CRUD (Server/Network) · ค้นหา-กรอง~~ ✅ เสร็จแล้ว (ดู §1.5) | บันทึก/ค้นหาทรัพย์สินหลักได้ · หน้าตั้งค่าพื้นฐานครบ | 5 |
| **3** | ~~Asset ประเภทที่เหลือ 5 หมวด (Computer/Storage/Power & Cooling/Peripheral/Mobile & IoT-OT)~~ ✅ เสร็จแล้ว (ดู §1.6) · ~~Audit Log UI~~ ✅ เสร็จแล้ว (ดู §1.7) · ~~Attachment~~ ✅ เสร็จแล้ว (ดู §1.8) · ~~Application บน Server (v1.6)~~ ✅ เสร็จแล้ว (ดู §1.9) · ~~Storage/Cluster~~ ✅ เสร็จแล้ว (ดู §1.10) · ~~Rack (พร้อมผังกราฟิก)~~ ✅ เสร็จแล้ว (ดู §1.11) — เหลือ Software License (เลื่อนไป Sprint 4) · VLAN + Site UI (1st/2nd, รองรับ Secondary Subnet/Untagged) · **Location Tree Picker (บล็อกจริงที่พบระหว่างทดสอบ Rack — ควรทำก่อน)** | ครบทุกประเภททรัพย์สินพร้อมร่องรอยตรวจสอบ | 7 |
| **4** | Software License · Seat Counting · CMDB Relationship · Contracts (เครื่องเดียว/หลายเครื่อง) | บริหาร License และความสัมพันธ์ได้ | 4 |
| **5** | Dashboard · Reports · Export Excel | เห็นภาพรวมและออกรายงานได้ | 3 |
| **6** | Excel Import + Validation · Notification (Email + In-app) · Settings หน้า SMTP/เกณฑ์แจ้งเตือน | นำเข้าข้อมูลเดิมและแจ้งเตือนอัตโนมัติได้ | 3 |
| **7** | **Permission Control (v1.5)** — File Share Permission CRUD · Internet Policy CRUD · ตารางการมองเห็นตามชั้นความลับ (Authorization Policy) · ประวัติสิทธิ์ 3 version | ดูสิทธิ์ File Share/Internet และประวัติการเปลี่ยนแปลงได้ | 6 |
| **8** | **AD/FSRM Integration** — Collector Agent (.NET Console App แยก Solution) · Sync Job Scheduler · หน้า Collector Agent/OU Scope/Sync Job ในหน้าตั้งค่า · ทดสอบกับ AD+FSRM จริงจาก §1.1 | Sync ผู้ใช้/กลุ่ม/Quota อัตโนมัติได้จริง | 7 |
| **9** | หน้าตั้งค่าที่เหลือ (System, Retention, Audit) · หน้าแรก Settings (Status Panel) · ปิดช่องโหว่จาก Code Review | หน้าตั้งค่าครบ 25 หน้าตามที่ออกแบบ | 3 |
| **10** | Integration Test · Performance Test (2,000+ รายการ < 2 วิ) · Security Review · คู่มือผู้ใช้ · Deploy จริง (§4) | **ระบบพร้อมใช้งานจริง (Go-Live)** | 6 |

**รวม 49 วันทำงาน** (~9-10 สัปดาห์ ถ้า 1 คนทำเต็มเวลา ไม่รวม Phase 0)

---

## 3. ถ้ามีมากกว่า 1 คน — งานที่ทำคู่ขนานได้

| งาน A (คนที่ 1) | งาน B คู่ขนาน (คนที่ 2) | เหตุผล |
|---|---|---|
| Sprint 2–6 (Core Asset System) | เขียน Collector Agent (.NET Console) ล่วงหน้า | Collector Agent ไม่พึ่ง Web App เลย พึ่งแค่ Schema ของ v1.5 ที่นิ่งแล้ว |
| Sprint 7 (Permission Control UI) | Sprint 8 (Collector Agent ทดสอบกับ AD/FSRM จริง) | Backend Sync Job กับ Frontend Permission UI พึ่งกันแค่ API Contract ที่ Fix ได้ตั้งแต่ต้น Sprint |
| Sprint 9 (Settings หน้าที่เหลือ) | Sprint 10 เริ่ม Performance/Security Test บนส่วนที่เสร็จแล้ว | ไม่ต้องรอ 100% ของทุกหน้าก่อนเริ่มทดสอบ |

ถ้าทำคู่ขนานเต็มที่ ระยะเวลารวมลดจาก ~49 วัน เหลือประมาณ **31–34 วัน**

---

## 4. Phase สุดท้าย — Go-Live Checklist (ปิด Sprint 10)

อ้างอิง NFR-15 (Internet เฉพาะตอนติดตั้ง) — ลำดับนี้ **ทำครั้งเดียวตอน Internet ยังเปิดอยู่**

| # | ขั้นตอน | อ้างอิง |
|:---:|---|---|
| 1 | `dotnet restore` + `npm install` บน Production Server | NFR-15 |
| 2 | Commit `packages.lock.json` + `package-lock.json` | HANDOFF §10.2 |
| 3 | `dotnet publish --self-contained -r win-x64` + `next build` (standalone) | HANDOFF §10.2 |
| 4 | Self-host Font (Inter, JetBrains Mono) แทน Google Fonts CDN | HANDOFF §7 ข้อ 3 |
| 5 | รัน Migration Script จริงบน Production DB (ตามลำดับ 8 ไฟล์) | HANDOFF §4.4 |
| 6 | สร้าง Collector Agent แรก + สร้าง API Key (บันทึกครั้งเดียว) | 13-permission-control-proposal.md |
| 7 | กรอก `sync_ou_scopes` จริง + กดปุ่มทดสอบ OU ก่อนเปิดใช้งาน | 04-settings-screens.md §8 |
| 8 | ตั้งเวลา Sync Job (AD 02:00 · FSRM 03:00) | ตกลงไว้แล้ว |
| 9 | ทดสอบส่งอีเมลจริงผ่านหน้า SMTP | 04-settings-screens.md §4.2 |
| 10 | ตัดการเชื่อมต่อ Internet ของ Server ถาวร | NFR-15 |
| 11 | ปิด Windows Update / NuGet Auto-Restore อัตโนมัติ | HANDOFF §10.2 คำเตือน |
| 12 | Backup Job รายวันทำงานจริง (NFR-12) | PRD NFR-12 |

---

## 5. ความเสี่ยงที่ต้องจับตา

| ความเสี่ยง | ผลกระทบ | ทางรับมือ |
|---|---|---|
| ~~SQL Temporal Tables รันจริงแล้วมี Syntax Error~~ | — | ✅ **ปิดความเสี่ยงแล้ว** — ทดสอบรันจริงผ่านครบ 8 ไฟล์แล้ว (ล่าสุด 20 ก.ย. 2569) |
| Service Account ของ Collector Agent ขออนุมัติช้า | บล็อก Sprint 8 | ยื่นขอตั้งแต่ Phase 0 คู่ขนานกับ Sprint 0-7 |
| ไม่มี Windows Server ทดสอบจริงที่มี AD+FSRM | Sprint 8 ทำได้แค่ Mock ทดสอบไม่ครบ | ต้องยืนยันเรื่องนี้กับ IT Infra ก่อนเข้า Sprint 8 |
| `fixed_asset_no` เปลี่ยนรูปแบบหลัง Sprint 2 เสร็จแล้ว | ต้องแก้ Validation Layer | ออกแบบ Validation แยกเป็น Config ไม่ Hard-code ตั้งแต่แรก |

---

## 6. Milestone สรุป

```
Phase 0 ──▶ Sprint 0-1 ──▶ Sprint 2-6 ──▶ Sprint 7-9 ──▶ Sprint 10
เตรียมพร้อม   โครงระบบ      Core Asset      Permission      Go-Live
                            Management      Control v1.5
              (M1: Login    (M2: ใช้งาน     (M3: สิทธิ์      (M4: 🚀
               ใช้ได้)       Asset ครบ)      File Share      Production)
                                             ควบคุมได้)
```

**เอกสารที่ต้องอัปเดตหลังจบแต่ละ Sprint:** ทำเครื่องหมาย ✅ ใน `HANDOFF.md` §7 (Phase 4 ห้ามลืม) ทุกข้อที่ทำเสร็จ เพื่อไม่ให้ลืมซ้ำในรอบถัดไป
