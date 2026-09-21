# IS-Inventory — แผนดำเนินการจากนี้จนถึง Go-Live

> เอกสารนี้เป็น Master Plan ต่อจาก `HANDOFF.md` §11 เดิม (ซึ่งครอบคลุมแค่ v1.0–v1.4)
> ขยายให้ครบทั้ง v1.5 Permission Control และ Administration Settings ที่เพิ่งออกแบบเสร็จ
> อัปเดตล่าสุด: 2569-09-21 — Sprint 5 ปิดครบ: Dashboard + Reports + Export Excel · Sprint 7 ปิดครบ: Permission Control v1.5 (File Share/Internet Policy/Classification Visibility)

---

## 0. ภาพรวมสถานะปัจจุบัน

| หัวข้อ | สถานะ |
|---|---|
| Requirement (PRD) | ✅ เสร็จ — 67 FR · 15 NFR |
| Database Design | ✅ เสร็จ **และทดสอบรันจริงผ่านแล้ว** — 66 ตาราง · 45 Temporal · 45 View · 10 Trigger บน SQL Server 2022 จริง (ล่าสุด 20 ก.ย. 2569 รวม VLAN Secondary Subnet + Application Module) |
| UI/UX Design | ✅ เสร็จ — User Flow · Wireframe 9 หน้า · Design System · หน้าตั้งค่า 25 หน้า |
| Tech Stack | ✅ ตัดสินใจแล้ว — ASP.NET Core (.NET 8) + EF Core + Next.js |
| **โค้ดจริง** | 🟢 **Sprint 0–5, 7 เสร็จครบ** — Login/RBAC/จัดการผู้ใช้/Master Data/Location Tree Picker/Asset CRUD ครบ 8/8 หมวด (รวม Software License เข้ารหัส)/Audit Log UI/Attachment (Asset+Contract)/Application บน Server/Cluster/Storage Volume/Rack/VLAN-IPAM/CMDB Relationship/Contracts (เครื่องเดียว-หลายเครื่อง)/Dashboard+Reports+Export Excel/Permission Control (File Share+Internet Policy+Classification Visibility) ใช้งานได้จริง (§1.4–§1.16) · วันที่แสดงผลเป็น `dd/mm/yyyy` ทั้งโปรเจกต์ (§1.12) |

**สรุป 1 บรรทัด:** Design เสร็จหมดแล้ว ฐานข้อมูลทดสอบผ่านแล้ว Backend/Frontend เชื่อมต่อกันจริง
Login + RBAC + จัดการผู้ใช้ + Layout ใช้งานได้ (Sprint 1) บันทึก/ค้นหา Master Data ได้จริง (Sprint 2)
Asset CRUD ครบทั้ง 8 หมวด ดู Audit Log แนบ/ดาวน์โหลดไฟล์ จัดการ Application บน Server, Cluster/Storage
Volume, Rack พร้อมผังกราฟิก, Location, VLAN/IPAM, Software License พร้อม Seat Counting, CMDB
Relationship, Contracts ทั้งเครื่องเดียว/หลายเครื่อง, Dashboard พร้อมกราฟและรายงานสำเร็จรูป Export Excel
ได้ และทะเบียน File Share/Internet Policy พร้อมตารางการมองเห็นตามชั้นความลับก็จัดการผ่าน UI ได้จริงครบแล้ว
**(Sprint 3–5, 7 ปิดครบทุกรายการ — §1.6–§1.16)** — คอขวดตอนนี้เหลือแค่ **ข้อมูลจริงที่ยังไม่ได้รับ** (§1.2)
และ **Windows Server ทดสอบ AD/FSRM** (§1.1) สำหรับ Sprint 8 — Sprint 6 (Import/Notification) ยังไม่ได้ทำ
ตามลำดับที่ผู้ใช้ขอให้ข้ามไปก่อน ไม่ใช่การตัดสินใจสถาปัตยกรรมหรือความเสี่ยงจาก Schema/Stack ที่ไม่เคย
พิสูจน์แล้วอีกต่อไป

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
| `IsInventoryDbContext` + Entity 111 ตัว | ✅ Scaffold จาก DB จริงที่ทดสอบแล้ว (ไม่ได้เขียนมือ) — 45 Temporal ผ่าน `IsTemporal()` อัตโนมัติ ไม่สร้าง Entity ซ้ำ, 45 View เป็น Keyless Entity |
| `GET /health/db` | ✅ ยืนยันแล้ว: `canConnect: true, tableCount: 111` |
| `frontend/` — Next.js 16 + Tailwind v4 + Design Token ครบ | ✅ Build ผ่าน · ทดสอบด้วย Screenshot จริง |
| Font self-hosted (`@fontsource-variable/*`) | ✅ ตาม NFR-15 — ไม่พึ่ง Google Fonts CDN ตอน Runtime |
| หน้าแรกดึงข้อมูลจริงจาก Backend | ✅ แสดง "Connected — 111 tables found" |

**บั๊ก/ข้อติดขัดที่เจอและแก้ระหว่าง Setup:**

| # | ปัญหา | แก้ |
|:---:|---|---|
| 1 | `builds.dotnet.microsoft.com` และ `ui.shadcn.com` ถูก Proxy ของ Sandbox บล็อก | ติดตั้ง .NET SDK ผ่าน `apt install dotnet-sdk-8.0` แทน · สร้าง shadcn/ui Component (Button) มือ ตาม Pattern เดียวกัน (`cva` + `cn()`) เพราะดึง Registry ไม่ได้ |
| 2 | GitHub Raw ของ Repo ภายนอก (rsms/inter, JetBrains/JetBrainsMono) ถูกจำกัดสิทธิ์ตาม Session | ใช้ `@fontsource-variable/inter` และ `@fontsource-variable/jetbrains-mono` จาก npm แทน — Bundle ไฟล์ Font ในตัว Package |
| 3 | Entity `FileShare` (จาก `dbo.file_shares`) ชนกับ `System.IO.FileShare` ใน Implicit Global Using ของ .NET 8 | Alias `using FileShare = IsInventory.Infrastructure.Entities.FileShare;` ใน `IsInventoryDbContext.cs` |
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

### 1.12 🟡 Sprint 3 (บางส่วน) — Location Tree Picker + วันที่ dd/mm/yyyy ทั้งโปรเจกต์ (21 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.13 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| `LocationsController` ใหม่ (DTO ไม่ใช่ `LookupsControllerBase` เพราะเป็น Self-Referencing Tree) | ✅ ทดสอบกับ SQL Server จริง |
| `GET /api/locations/tree` + CRUD, Policy `Admin` สำหรับเขียน | ✅ |
| กัน Cycle (ย้าย Location ไปอยู่ใต้ลูกหลานตัวเอง) ด้วย `IsDescendantAsync` ฝั่ง C# — DB Constraint กันได้แค่ Parent=ตัวเองชั้นเดียว | ✅ |
| หน้าใหม่ **Administration → Locations** (`/admin/locations`) — Tree แบบ Indent, Modal Add/Edit, ปุ่ม "+" เพิ่ม Sub-Location ต่อแถว | ✅ |
| **บล็อกจาก §1.11 แก้แล้ว** — ทดสอบสร้าง Location ผ่าน UI แล้วไปสร้าง Rack ใหม่ทันทีสำเร็จ ไม่ต้องพึ่ง SQL อีกต่อไป | ✅ ยืนยันด้วย Playwright |
| วันที่ dd/mm/yyyy ทั้งโปรเจกต์ — `frontend/src/lib/format.ts` (`formatDate`/`formatDateTime`) แทน `toLocaleString()`/Field ดิบทุกจุด (Audit Logs, Attachments, Admin Users, Cluster Members) | ✅ ยกเว้น Native `<input type="date">` ที่ Browser คุมการแสดงผลเอง (ต้อง ISO Value ตาม HTML5 Spec) |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** curl ครบ (Unique Code 409, Invalid Type 400, Self-Parent 400,
Cycle Guard 400, ลบตอนมีลูก/มี Rack อ้างอิง 409 ทั้งคู่) — Playwright ผ่าน UI จริงครบ รวมสร้าง Rack ใหม่
ทั้งกระบวนการผ่านหน้าเว็บโดยไม่พึ่ง SQL — ตรวจ Audit Logs/Admin Users เห็นวันที่ `dd/mm/yyyy HH:mm` ถูกต้อง

### 1.13 ✅ Sprint 3 (ปิดครบ) — VLAN + IPAM Module v1.1.1 (21 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.14 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| `VlansController` — CRUD `dbo.vlans` + IP Ranges (sub-resource) + Devices (sub-resource) + Validation Issues | ✅ ทดสอบกับ SQL Server จริง |
| **กติกาเครือข่าย ~20 CHECK Constraint มีอยู่ใน Database อยู่แล้ว** — Controller แปล Error 547 เป็นข้อความอ่านง่ายตาม Constraint Name | ✅ |
| หน้าใหม่ `/vlans` (List พร้อม % Utilization), `/vlans/new`, `/vlans/{id}` พร้อม IP Ranges Panel, Devices Panel, Validation Issues Warning Banner | ✅ |
| Site UI — ใช้ Dropdown จาก `dbo.vlan_sites` (Lookup คงที่ 2 แถวอยู่แล้ว) ในฟอร์ม VLAN ตรงตามขอบเขตที่กำหนดไว้ | ✅ |
| **บั๊กที่พบและแก้:** EF Core แปล Query ไม่ได้เมื่อ `.Where()`/`.First()` ต่อจาก Query ที่ Project เป็น DTO Record ที่มี Conditional Navigation Property — แก้โดยกรองที่ระดับ Entity ก่อน Project เสมอ | ✅ แก้แล้วและยืนยันด้วยการทดสอบจริง |

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** curl ครบ (Duplicate Subnet 409, Host Address แทน Network Address
400, Gateway นอก Subnet 400, VLAN Number ผิดช่วง 400, DHCP Consistency 400, Range Start>End 400,
Duplicate Device Role 409, Delete ตอนยังมี Range/Device ค้าง 409) — Playwright ผ่าน UI จริงครบทุกจุด
รวมสร้าง VLAN ใหม่, เพิ่ม/แก้ไข IP Range เห็น Error จาก Constraint ตรงๆ, เพิ่ม Device เห็น Duplicate ถูก
บล็อก, Warning Banner แสดง Validation Issues ถูกต้อง

**🎉 Sprint 3 ปิดครบทุกรายการแล้ว** — เหลือ Software License (`SFT` Category) เลื่อนไป Sprint 4 ตามแผนเดิม

### 1.14 ✅ Sprint 4 (ปิดครบ) — Software License + Seat Counting + CMDB Relationship + Contracts (21 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.15 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| Software License (`SFT`) เข้าร่วม `AssetsController` เป็นหมวดที่ 8 · `license_key_encrypted` เข้ารหัส AES-256-GCM ฝั่ง Server ผ่าน `ILicenseKeyProtector` (Write-Only, ไม่เคยส่งคีย์จริงกลับ) | ✅ ทดสอบกับ SQL Server จริง |
| `SoftwareInstallationsController` — ติดตั้ง/ถอด Software บน Asset ใดก็ได้ + Seat Usage จาก `vw_software_seat_usage` (Seat มาจาก `contract_assets.seat_count` ตาม v1.4 ไม่ใช่คอลัมน์เดิมใน `software_details`) | ✅ |
| `AssetRelationshipsController` — CMDB Relationship สองทิศทางจาก `vw_asset_relationships_expanded` | ✅ |
| `ContractsController` + `contract_assets` Sub-resource — สัญญาเครื่องเดียว/หลายเครื่อง พร้อมโซ่การต่อสัญญา (`previous_contract_id`, Trigger Auto-supersede) | ✅ |
| Attachment บนสัญญา — ขยาย `AttachmentsController` ให้ผูกกับ Contract ได้ด้วย (คอลัมน์รองรับแล้วตั้งแต่ v1.4) | ✅ |
| หน้าใหม่ `/software` (Seat Usage ทุกใบอนุญาต — ปิด Nav Link ที่ตายมาตั้งแต่ Sprint 1), `/contracts` (List/New/Edit + Covered Assets Panel) · Panel ใหม่บนหน้า Asset — Installations & Seat Usage (เฉพาะ `SFT`), Relationships (ทุกหมวด) | ✅ |

**พบและแก้ระหว่างทดสอบ:** EF Core แปล Query ไม่ได้ซ้ำรูปแบบเดิมที่เจอใน VLAN (§1.13) — คราวนี้ที่
`GET /api/contracts/{id}/assets` เพราะ `.OrderByDescending()` ต่อจาก Query ที่ Project เป็น DTO แล้ว
แก้ด้วยการย้ายการเรียงลำดับไปที่ระดับ Entity ก่อน `.Select()` เสมอ — ยืนยันแล้วว่าเป็นกฎทั่วไปของโปรเจกต์นี้
ที่ต้องระวังทุกครั้งที่ Query ถูก Project เป็น DTO Record

**ทดสอบยืนยันกับ SQL Server จริงแล้ว:** curl ครบ (ติดตั้ง Software ซ้ำ 409, ผูก Asset ซ้ำในสัญญาเดียวกัน
409, วันที่สัญญาผิดลำดับ 400, ต่อสัญญาก่อนวันเริ่มของสัญญาเดิม 400 จาก Trigger, ลบสัญญาที่ยังมี Asset ผูก
409) — Playwright ผ่าน UI จริงครบ: สร้าง Software License พร้อม License Key, ติดตั้งบน Asset อื่นเห็น
Seat Usage อัปเดต, CMDB Relationship เห็นสองทิศทาง, สร้างสัญญาใหม่ผูก Asset พร้อม Seat Count แล้ว Seat
Usage สะท้อนถูกต้อง, อัปโหลดไฟล์แนบบนสัญญาสำเร็จ

**🎉 Sprint 4 ปิดครบทุกรายการแล้ว** — Sprint Plan เดิม (§2) เหลือ Sprint 5–10

### 1.15 ✅ Sprint 5 (ปิดครบ) — Dashboard · Reports · Export Excel (21 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.16 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| `DashboardController` — การ์ด Action Required/Overview, Breakdown ตามหมวด/สถานะ, Expiring Soon, Recent Activity (Scope ตาม RBAC) | ✅ ทดสอบกับ SQL Server จริง |
| `ReportsController` — 4 รายงานสำเร็จรูป (Expiring Coverage, License Compliance, Assets by Status, Asset Value/TCO) พร้อม Export `.xlsx` ทุกรายงาน (`ExcelExporter` ใช้ `ClosedXML`) | ✅ |
| หน้าแรก (`/`) เขียนใหม่ตาม Wireframe §2 — Action Cards คลิกไปหน้าที่กรองไว้แล้ว, กราฟแท่ง/Donut มือ (ไม่พึ่ง Chart Library) | ✅ |
| หน้าใหม่ `/reports` — 4 Tab พร้อมปุ่ม Export to Excel ดาวน์โหลดไฟล์จริง | ✅ |

**พบระหว่างเขียนโค้ด (สำคัญ):** `assets.coverage_end_date` ที่แผนเดิมอ้างถึงถูก DROP ไปแล้วตั้งแต่ v1.4
Migration ตอนย้าย Coverage ไปที่ `contract_assets` — ใช้ `vw_expiring_assets`/`vw_asset_tco` แทนซึ่งสร้างไว้
รองรับจุดประสงค์นี้อยู่แล้ว ไม่ต้องเขียน Query ใหม่

**🎉 Sprint 5 ปิดครบทุกรายการแล้ว**

### 1.16 ✅ Sprint 7 (ปิดครบ) — Permission Control v1.5 (21 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.17 — สรุปสั้น (ทำก่อน Sprint 6 ตามลำดับที่ผู้ใช้ขอ):

| ส่วน | สถานะ |
|---|---|
| `FileSharesController` — CRUD `file_shares` + `file_share_permissions`, กรอง Visibility ตามชั้นความลับที่ชั้น API, บันทึก `VIEW_SENSITIVE` Audit ตอนเปิดดูชั้น 1–3 | ✅ ทดสอบกับ SQL Server จริง |
| Permission History — `GET /api/file-shares/{id}/history` (Default 3 version ล่าสุด + View All) จาก `vw_share_permission_timeline` | ✅ |
| `InternetPoliciesController` — CRUD + AD Group Binding + Web Category Rule เสริม | ✅ |
| `ClassificationVisibilityController` (Admin) — Matrix 7 ชั้น × 4 บทบาท | ✅ |
| หน้าใหม่ `/file-shares`, `/internet-policies`, `/admin/classification-visibility` | ✅ |

**พบและแก้ 2 ช่องว่างสำคัญระหว่างเขียนโค้ด:**
1. `server_role_assignments` (บทบาท FILE ที่ Trigger บังคับ) ไม่เคยมี Controller เขียนถึงมาก่อน —
   `FileSharesController` แทรกแถวนี้ให้อัตโนมัติตอนบันทึกโฟลเดอร์แรกของ Server นั้น (ต้อง `SaveChanges`
   แยกก่อนเสมอ เพราะ EF Core ไม่รับประกันลำดับ Insert ข้าม Entity ที่ไม่มีความสัมพันธ์กัน)
2. Internet Policy ผูก Proxy Asset ไม่ได้จริงเพราะ `asset_type_id` ยังไม่มีช่องกรอกในเว็บเลย (Asset Type
   Tree Picker เป็นช่องว่างเดิมจาก Sprint 2) — ไม่เปิดช่องนี้ในฟอร์มรอบนี้ตามที่ข้อเสนอ v1.5 ออกแบบไว้ว่า
   เป็นช่องเสริม ใช้แค่ชื่อ + AD Group Binding ก็ทำงานได้ครบ

**คงเหลือ (ตั้งใจเลื่อนไป Sprint 8):** Collector Agent/AD-FSRM Sync งานจริง, Asset Type Tree Picker
(ตอนนี้บล็อก Proxy Asset Binding ของ Internet Policy ด้วย)

**🎉 Sprint 7 ปิดครบทุกรายการแล้ว** — Sprint Plan เดิม (§2) เหลือ Sprint 6, 8–10

---

### 1.17 🟡 นอก Sprint Plan — Server Domain v1.7: Server Inventory (Hardware) · Server List (21 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.18 — สรุปสั้น (ผู้ใช้สั่งแยก Server/Storage ออกจากหน้า Assets
ทั่วไปเป็น 2 หน้าใหม่ นอกลำดับ Sprint Plan เดิม):

| ส่วน | สถานะ |
|---|---|
| Schema `16-module-v1.7-server-domain.sql` — Lookup ใหม่ 3 ตัว, `server_details` ปรับ Temporal (ตัด 7 คอลัมน์เก่า เพิ่ม 9 ใหม่), Hardware Child Table ใหม่ 3 ตัว (CPU/Memory/Local Disk), Storage Multi-consumer Junction | ✅ ทดสอบกับ SQL Server จริง |
| `ServerInventoryController` — CRUD Hardware (SRV Physical + STG ร่วมหน้าเดียว, Multi-entry CPU/Memory/Disk) | ✅ |
| `ServerListController` — Virtual (Asset ใหม่ผูก Cluster) / Physical (Activate Asset เดิม) | ✅ |
| `OsCatalogController` — OS Type/Version Quick-add | ✅ |
| ล็อก `AssetsController` ไม่ให้ Create/Update/Delete SRV/STG อีกต่อไป | ✅ |
| หน้าใหม่ `/server-inventory`, `/server-list` + Nav กลุ่ม "Server" (ย้าย Clusters เข้ามารวม) | ✅ Build/Typecheck/Lint ผ่าน |

**การตัดสินใจสำคัญ:** ไม่ฟื้นคอลัมน์ `server_type` ที่เคยถูกลบทิ้งใน v1.3a (ซ้ำซ้อนกับ `asset_types.is_virtual`
ตามที่ Comment เดิมระบุ) แต่สร้าง **Asset Type Picker** ขึ้นมาใช้แทน — ปิดช่องว่าง "Asset Type Tree Picker"
ที่ค้างมาตั้งแต่ Sprint 2 (§1.16 เคยบันทึกไว้ว่าบล็อก Internet Policy Proxy Binding ด้วย)

**บั๊กที่พบและแก้ระหว่างเขียนโค้ด:** EF Core ChangeTracker รั่วหลัง `DbUpdateException` ทำให้ Exception เดิม
โผล่มา Throw ซ้ำใน `SaveChangesAsync` ครั้งถัดไปที่ไม่เกี่ยวข้องกัน (แก้โดยเปลี่ยน IP Upsert ไปใช้ Raw SQL) —
รายละเอียดเต็มที่ HANDOFF §4.18

**อัปเดต 21 ก.ย. 2569 (รอบถัดมา):** ทดสอบผ่าน Browser จริงด้วย Playwright สำเร็จแล้ว (มีรหัสผ่านทดสอบจาก
§1.18) — **พบบั๊กจริง 1 จุด**: `ServerInventoryForm`'s ช่อง Asset Type ส่งค่าเป็น Category ID ตัวเลขแทน
Code `"SRV"/"STG"` ทำให้ CPU/Memory/Storage ไม่เคยโผล่ขึ้นมาเลย (Backend curl-test ข้ามจุดนี้เพราะยิง
Category ID ตรงๆ) แก้แล้วด้วย `EnumSelectField` รายละเอียดเต็มที่ HANDOFF §4.18

**🎉 ปิดครบทุกรายการแล้ว**

---

### 1.18 🟡 นอก Sprint Plan — รหัสผ่านเริ่มต้นตอนติดตั้ง + บังคับเปลี่ยนรหัสผ่าน (21 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.19 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| `IsInventory.Api.exe seed-admin` โหมด CLI ใหม่ — Hash รหัสผ่านเริ่มต้นด้วย Argon2id จริง (ตัวเดียวกับ Login ใช้ตรวจ) จาก Environment Variable ไม่ใช่ argv | ✅ |
| JWT Claim `must_change_password` ใหม่ + Middleware บล็อก API อื่นทั้งหมดด้วย 403 จนกว่าจะเปลี่ยนรหัสผ่าน | ✅ |
| `AuthController.ChangePassword` คืน Token ใหม่ทันที (ไม่ต้องรอ Token เดิมหมดอายุ) | ✅ |
| Frontend `ChangePasswordForm` + Gate ใน `(app)/layout.tsx` บล็อกทุก Route จนกว่าจะเปลี่ยนรหัสผ่าน | ✅ |
| `install-backend.ps1` ถาม Interactive ตอนท้าย Script ตั้งรหัสผ่านเริ่มต้น (SecureString, ยืนยันซ้ำ) | ✅ |

**ช่องว่างที่พบก่อนแก้:** บัญชี `admin` ที่ Seed จาก `02-schema-sqlserver.sql` มี `password_hash` เป็นค่า
Placeholder ที่ไม่ใช่ Hash จริงมาตั้งแต่ต้น (Comment ในไฟล์บอกว่าต้องแทนที่ตอนติดตั้งจริง) แต่ไม่เคยมี Script
ไหนทำขั้นตอนนี้จริง — Login ด้วยบัญชีเริ่มต้นไม่ได้เลยจนกว่าจะมีคนไปแก้ Hash ในฐานข้อมูลเอง (เป็นปัญหาเดียวกับ
ที่เจอตอนพยายามหารหัสผ่านทดสอบใน §1.17)

**ทดสอบยืนยันกับ SQL Server จริงแล้ว + ผ่าน Browser จริงด้วย Playwright ครบ**: `seed-admin`, Login →
403 ระหว่างถูกล็อก → `/api/auth/me` ยังใช้ได้ → เปลี่ยนรหัสผ่านสำเร็จ → Token ใหม่ปลดล็อกทันที, พิมพ์ URL
ตรงไปหน้าอื่นระหว่างถูกล็อกยังโดนหน้าบังคับสกัดอยู่

**🎉 ปิดครบทุกรายการแล้ว**

---

### 1.19 🟡 นอก Sprint Plan — Self-protection + สิทธิ์ต่อเมนูรายคน Phase 1 (21 ก.ย. 2569)

รายละเอียดเต็มอยู่ที่ `docs/HANDOFF.md` §4.20 — สรุปสั้น:

| ส่วน | สถานะ |
|---|---|
| Self-protection: Admin แก้ Role/Disable ตัวเองไม่ได้, ต้องเหลือ Admin Active อย่างน้อย 1 คนเสมอ | ✅ |
| Database: `menus`/`role_menu_permissions`/`user_menu_permissions` (Role เป็นค่าเริ่มต้น + Override รายคน) | ✅ |
| Backend: `IPermissionService` + `RequiresPermissionAttribute` แทนที่ `[Authorize(Policy=...)]` เดิมทั้งระบบ (~20 Controller) | ✅ |
| Backend: `GET/PUT/DELETE api/users/{id}/permissions[/{menuKey}]` ให้ Admin ตั้ง Override รายเมนู | ✅ |
| Frontend: `nav.ts`/`AuthContext` กรองเมนูด้วยสิทธิ์จริงจาก `/api/auth/me` แทน Role ตรงๆ | ✅ |
| **ค้าง (Phase 2):** ซ่อนปุ่ม Add/Edit/Delete ในแต่ละหน้าตามสิทธิ์จริง (ตอนนี้ Backend เช็คจริง แต่ UI ยัง Hardcode ตาม Role) + หน้า Admin จัดการสิทธิ์แบบตาราง | ⬜ |

**บั๊กที่พบระหว่างทดสอบและแก้แล้ว:** `RequiresPermissionAttribute` เดิม Implement เป็น Action Filter
(`IAsyncActionFilter`) ซึ่งรันหลัง Model Validation ของ `[ApiController]` — ทำให้ User ที่ไม่มีสิทธิ์ยิง
Body ไม่ครบยังเห็น `400` (บอก Field ที่ขาด) แทนที่จะโดน `403` ตั้งแต่แรก แก้โดยเปลี่ยนเป็น Authorization
Filter (`IAsyncAuthorizationFilter`) ให้รันเร็วกว่า Model Binding เหมือน `[Authorize]` เดิม

**ทดสอบยืนยันกับ SQL Server จริงแล้ว (API เท่านั้น ยังไม่ผ่าน Playwright):** Role Default ตรงกับ Policy
เดิม 100%, VIEWER โดนบล็อกจริงตอนยิง Endpoint ที่ไม่มีสิทธิ์ (`403`), Admin ตั้ง Override ให้สิทธิ์เพิ่ม
ทันที (ทดสอบยิง `api/lookups/vendors` ผ่านจริงหลัง Override), ล้าง Override แล้วสิทธิ์กลับตาม Role ทันที,
Admin แก้สิทธิ์ตัวเองโดนบล็อก (`409`) — ลบ/ปิดข้อมูลทดสอบออกหมดแล้ว

---

## 2. Sprint Plan (Sprint 0–10, รวม ~49 วันทำงาน)

> เรียงตามลำดับ Dependency จริง ไม่ใช่ลำดับความสำคัญ — บาง Sprint ทำคู่ขนานได้ถ้ามีมากกว่า 1 คน (ดู §3)

| Sprint | ขอบเขต | Deliverable | วัน |
|:---:|---|---|:---:|
| **0** | ~~รัน SQL 8 ไฟล์ · Setup .NET Solution + Next.js Project~~ ✅ เสร็จแล้ว (ดู §1.3) — เหลือ Seed Data ชุดจริง + Deploy Pipeline | Repo พร้อมพัฒนา · Backend↔DB↔Frontend ต่อกันจริงแล้ว | 1 |
| **1** | ~~Auth (Argon2id+JWT ตาม Schema เดิม แทน ASP.NET Core Identity โดยตรง) · RBAC 4 บทบาท · จัดการผู้ใช้ · Layout + Dark Mode + กันจอขาววาบ~~ ✅ เสร็จแล้ว (ดู §1.4) | Login และควบคุมสิทธิ์ได้ | 4 |
| **2** | ~~Master Data CRUD (11/12 หน้า — เหลือ `device_models` รอผังต้นไม้ `asset_type`) · Asset CRUD (Server/Network) · ค้นหา-กรอง~~ ✅ เสร็จแล้ว (ดู §1.5) | บันทึก/ค้นหาทรัพย์สินหลักได้ · หน้าตั้งค่าพื้นฐานครบ | 5 |
| **3** | ~~Asset ประเภทที่เหลือ 5 หมวด (Computer/Storage/Power & Cooling/Peripheral/Mobile & IoT-OT)~~ ✅ เสร็จแล้ว (ดู §1.6) · ~~Audit Log UI~~ ✅ เสร็จแล้ว (ดู §1.7) · ~~Attachment~~ ✅ เสร็จแล้ว (ดู §1.8) · ~~Application บน Server (v1.6)~~ ✅ เสร็จแล้ว (ดู §1.9) · ~~Storage/Cluster~~ ✅ เสร็จแล้ว (ดู §1.10) · ~~Rack (พร้อมผังกราฟิก)~~ ✅ เสร็จแล้ว (ดู §1.11) · ~~Location Tree Picker~~ ✅ เสร็จแล้ว (ดู §1.12) · ~~VLAN + Site UI (v1.1.1)~~ ✅ เสร็จแล้ว (ดู §1.13) — **ปิด Sprint 3 ครบทุกรายการ** เหลือ Software License เลื่อนไป Sprint 4 | ครบทุกประเภททรัพย์สินพร้อมร่องรอยตรวจสอบ | 7 |
| **4** | ~~Software License · Seat Counting · CMDB Relationship · Contracts (เครื่องเดียว/หลายเครื่อง)~~ ✅ เสร็จแล้ว (ดู §1.14) | บริหาร License และความสัมพันธ์ได้ | 4 |
| **5** | ~~Dashboard · Reports · Export Excel~~ ✅ เสร็จแล้ว (ดู §1.15) | เห็นภาพรวมและออกรายงานได้ | 3 |
| **6** | Excel Import + Validation · Notification (Email + In-app) · Settings หน้า SMTP/เกณฑ์แจ้งเตือน | นำเข้าข้อมูลเดิมและแจ้งเตือนอัตโนมัติได้ | 3 |
| **7** | ~~**Permission Control (v1.5)** — File Share Permission CRUD · Internet Policy CRUD · ตารางการมองเห็นตามชั้นความลับ (Authorization Policy) · ประวัติสิทธิ์ 3 version~~ ✅ เสร็จแล้ว (ดู §1.16 — ทำก่อน Sprint 6 ตามที่ผู้ใช้ขอ) | ดูสิทธิ์ File Share/Internet และประวัติการเปลี่ยนแปลงได้ | 6 |
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
