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
| **โค้ดจริง** | ❌ **0 บรรทัด** — ยังไม่เริ่ม |

**สรุป 1 บรรทัด:** Design เสร็จหมดแล้ว และฐานข้อมูลผ่านการทดสอบรันจริงแล้ว — คอขวดตอนนี้เหลือแค่
**ข้อมูลจริงที่ยังไม่ได้รับ** (§1.2) กับ **Windows Server ทดสอบ AD/FSRM** (§1.1) ไม่ใช่การตัดสินใจ
สถาปัตยกรรมหรือความเสี่ยงจาก Schema ที่ไม่เคยพิสูจน์แล้วอีกต่อไป

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

---

## 2. Sprint Plan (Sprint 0–10, รวม ~51 วันทำงาน)

> เรียงตามลำดับ Dependency จริง ไม่ใช่ลำดับความสำคัญ — บาง Sprint ทำคู่ขนานได้ถ้ามีมากกว่า 1 คน (ดู §3)

| Sprint | ขอบเขต | Deliverable | วัน |
|:---:|---|---|:---:|
| **0** | ~~รัน SQL ทั้ง 8 ไฟล์จริงครั้งแรก~~ ✅ เสร็จแล้ว — เหลือแค่ Setup .NET Solution + Next.js Project · Seed Data | Repo พร้อมพัฒนา · DB รันได้จริงบน SQL Server | 3 |
| **1** | Auth (ASP.NET Core Identity) · RBAC 4 บทบาท · จัดการผู้ใช้ · Layout + Dark Mode + กันจอขาววาบ | Login และควบคุมสิทธิ์ได้ | 4 |
| **2** | Master Data CRUD (ใช้รูปแบบร่วม 12 หน้าจาก `04-settings-screens.md`) · Asset CRUD (Server/Network) · ค้นหา-กรอง | บันทึก/ค้นหาทรัพย์สินหลักได้ · หน้าตั้งค่าพื้นฐานครบ | 5 |
| **3** | Asset ประเภทที่เหลือ (8 หมวด) · Attachment · Audit Log · Storage/Cluster · Rack (พร้อมผังกราฟิก) · VLAN + Site (1st/2nd, รองรับ Secondary Subnet/Untagged) · Application บน Server (v1.6) | ครบทุกประเภททรัพย์สินพร้อมร่องรอยตรวจสอบ | 7 |
| **4** | Software License · Seat Counting · CMDB Relationship · Contracts (เครื่องเดียว/หลายเครื่อง) | บริหาร License และความสัมพันธ์ได้ | 4 |
| **5** | Dashboard · Reports · Export Excel | เห็นภาพรวมและออกรายงานได้ | 3 |
| **6** | Excel Import + Validation · Notification (Email + In-app) · Settings หน้า SMTP/เกณฑ์แจ้งเตือน | นำเข้าข้อมูลเดิมและแจ้งเตือนอัตโนมัติได้ | 3 |
| **7** | **Permission Control (v1.5)** — File Share Permission CRUD · Internet Policy CRUD · ตารางการมองเห็นตามชั้นความลับ (Authorization Policy) · ประวัติสิทธิ์ 3 version | ดูสิทธิ์ File Share/Internet และประวัติการเปลี่ยนแปลงได้ | 6 |
| **8** | **AD/FSRM Integration** — Collector Agent (.NET Console App แยก Solution) · Sync Job Scheduler · หน้า Collector Agent/OU Scope/Sync Job ในหน้าตั้งค่า · ทดสอบกับ AD+FSRM จริงจาก §1.1 | Sync ผู้ใช้/กลุ่ม/Quota อัตโนมัติได้จริง | 7 |
| **9** | หน้าตั้งค่าที่เหลือ (System, Retention, Audit) · หน้าแรก Settings (Status Panel) · ปิดช่องโหว่จาก Code Review | หน้าตั้งค่าครบ 25 หน้าตามที่ออกแบบ | 3 |
| **10** | Integration Test · Performance Test (2,000+ รายการ < 2 วิ) · Security Review · คู่มือผู้ใช้ · Deploy จริง (§4) | **ระบบพร้อมใช้งานจริง (Go-Live)** | 6 |

**รวม 51 วันทำงาน** (~10 สัปดาห์ ถ้า 1 คนทำเต็มเวลา ไม่รวม Phase 0)

---

## 3. ถ้ามีมากกว่า 1 คน — งานที่ทำคู่ขนานได้

| งาน A (คนที่ 1) | งาน B คู่ขนาน (คนที่ 2) | เหตุผล |
|---|---|---|
| Sprint 2–6 (Core Asset System) | เขียน Collector Agent (.NET Console) ล่วงหน้า | Collector Agent ไม่พึ่ง Web App เลย พึ่งแค่ Schema ของ v1.5 ที่นิ่งแล้ว |
| Sprint 7 (Permission Control UI) | Sprint 8 (Collector Agent ทดสอบกับ AD/FSRM จริง) | Backend Sync Job กับ Frontend Permission UI พึ่งกันแค่ API Contract ที่ Fix ได้ตั้งแต่ต้น Sprint |
| Sprint 9 (Settings หน้าที่เหลือ) | Sprint 10 เริ่ม Performance/Security Test บนส่วนที่เสร็จแล้ว | ไม่ต้องรอ 100% ของทุกหน้าก่อนเริ่มทดสอบ |

ถ้าทำคู่ขนานเต็มที่ ระยะเวลารวมลดจาก ~51 วัน เหลือประมาณ **32–36 วัน**

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
