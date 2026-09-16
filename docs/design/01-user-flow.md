# Phase 2.1 — User Flow & Information Architecture
## KKND — IT Inventory Management System

| หัวข้อ | รายละเอียด |
|---|---|
| **เอกสาร** | User Flow & Information Architecture |
| **เวอร์ชัน** | 1.0 (Draft — รออนุมัติ) |
| **อ้างอิง** | `docs/PRD.md` v1.0 |
| **วันที่** | 2026-09-16 |

---

## 1. Information Architecture (โครงสร้างการนำทาง)

### 1.1 หลักการออกแบบการนำทาง

ระบบใช้ **Persistent Sidebar Navigation** (แถบเมนูด้านซ้ายที่อยู่ถาวร) ด้วยเหตุผล 3 ประการ:

1. ระบบมีเมนูหลัก 8 กลุ่ม ซึ่งเกินขีดจำกัดที่ Top Navigation จะรองรับได้อย่างสบายตา
2. ผู้ใช้หลักคือทีม IT ที่ใช้งานบน Desktop เป็นเวลานาน การมีเมนูอยู่ถาวรช่วยลดจำนวนคลิก
3. รองรับการยุบเป็นไอคอน (Collapsed Mode) เมื่อต้องการพื้นที่แสดงตารางกว้างขึ้น

### 1.2 โครงสร้างเมนูตามสิทธิ์ (Role-Based Navigation)

เมนูที่ผู้ใช้ไม่มีสิทธิ์เข้าถึงจะ **ไม่ถูกแสดง** (ไม่ใช่แสดงแล้วกดไม่ได้) เพื่อลดความสับสน
แต่ฝั่ง Server ยังคงตรวจสอบสิทธิ์ทุก Endpoint เสมอ ตาม NFR-06

| เมนู | ไอคอน | 🔴 Admin | 🟠 IT Staff | 🔵 Auditor | 🟢 Viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ▦ | ✅ | ✅ | ✅ | ✅ |
| Assets | 🖥 | ✅ | ✅ | ✅ | ✅ |
| Software | 💿 | ✅ | ✅ | ✅ | ✅ |
| Reports | 📊 | ✅ | ✅ | ✅ | ❌ |
| Import | ⬆ | ✅ | ✅ | ❌ | ❌ |
| Audit Logs | 🔍 | ✅ | ⚠️ เฉพาะของตนเอง | ✅ | ❌ |
| Administration | ⚙ | ✅ | ❌ | ❌ | ❌ |
| — Users | | ✅ | ❌ | ❌ | ❌ |
| — Master Data | | ✅ | ❌ | ❌ | ❌ |
| — Settings | | ✅ | ❌ | ❌ | ❌ |

### 1.3 องค์ประกอบที่อยู่ทุกหน้า (Global Elements)

```
┌──────────────────────────────────────────────────────────────────┐
│  TOP BAR                                                          │
│  [☰] KKND    [🔍 Global Search........]   [🔔 3] [☀/🌙] [👤 ▾]  │
├──────────┬───────────────────────────────────────────────────────┤
│ SIDEBAR  │  CONTENT AREA                                          │
│          │  ┌─ Breadcrumb ─────────────────────────────────────┐ │
│ ▦ Dash   │  │  Assets  ›  SRV-2026-001                          │ │
│ 🖥 Assets │  └───────────────────────────────────────────────────┘ │
│ 💿 Soft   │  ┌─ Page Header ────────────────────────────────────┐ │
│ 📊 Report │  │  Page Title                    [Primary Action]   │ │
│ ⬆ Import │  └───────────────────────────────────────────────────┘ │
│ 🔍 Audit  │                                                        │
│ ⚙ Admin  │  ┌─ Page Content ───────────────────────────────────┐ │
│          │  │                                                    │ │
│ ────────  │  │                                                    │ │
│ [«]      │  └───────────────────────────────────────────────────┘ │
└──────────┴───────────────────────────────────────────────────────┘
```

| องค์ประกอบ | หน้าที่ |
|---|---|
| **Global Search** | ค้นหาข้ามทุกประเภททรัพย์สินจาก Asset Tag, Serial, Hostname, IP (FR-SE-01) |
| **🔔 Notification Bell** | แสดงจำนวนแจ้งเตือนที่ยังไม่อ่าน คลิกแล้วเห็นรายการ 5 อันดับล่าสุด (FR-NT-04) |
| **☀/🌙 Theme Toggle** | สลับ Light/Dark Mode และจดจำค่าไว้ (NFR-08) |
| **👤 User Menu** | ชื่อผู้ใช้, Role Badge, Profile, Change Password, Logout |
| **Breadcrumb** | แสดงตำแหน่งปัจจุบันและกลับสู่ระดับบนได้ |

---

## 2. User Flow หลัก

### 2.1 Flow: การเข้าสู่ระบบ (Authentication)

```mermaid
flowchart TD
    Start([ผู้ใช้เปิดเว็บ]) --> CheckSession{มี Session<br/>ที่ยังไม่หมดอายุ?}
    CheckSession -->|มี| Dashboard[หน้า Dashboard]
    CheckSession -->|ไม่มี| LoginPage[หน้า Login]

    LoginPage --> Submit[กรอก Username + Password]
    Submit --> CheckLock{บัญชีถูกล็อก<br/>อยู่หรือไม่?}
    CheckLock -->|ถูกล็อก| LockMsg["🔒 แจ้ง: บัญชีถูกล็อกชั่วคราว<br/>กรุณาติดต่อผู้ดูแลระบบ"]
    LockMsg --> LoginPage

    CheckLock -->|ปกติ| Verify{ตรวจสอบรหัสผ่าน<br/>Argon2id}
    Verify -->|ถูกต้อง| CheckActive{บัญชียัง<br/>Active?}
    Verify -->|ผิด| CountFail[เพิ่มตัวนับความผิดพลาด<br/>+ บันทึก Audit Log]
    CountFail --> CheckCount{ผิดครบ<br/>5 ครั้ง?}
    CheckCount -->|ยังไม่ครบ| ErrMsg["⚠️ แจ้ง: ข้อมูลไม่ถูกต้อง<br/>(ไม่ระบุว่าผิดที่ช่องใด)"]
    ErrMsg --> LoginPage
    CheckCount -->|ครบแล้ว| LockAcc[ล็อกบัญชี 15 นาที]
    LockAcc --> LockMsg

    CheckActive -->|ถูกระงับสิทธิ์| DenyMsg["🚫 แจ้ง: บัญชีถูกระงับการใช้งาน"]
    DenyMsg --> LoginPage
    CheckActive -->|Active| CreateSession[สร้าง Session<br/>+ บันทึก Audit Log]
    CreateSession --> LoadMenu[โหลดเมนูตาม Role]
    LoadMenu --> Dashboard

    Dashboard -.->|ไม่ใช้งานนาน| Expire[Session หมดอายุ]
    Expire --> LoginPage
```

> **หลักความปลอดภัย:** ข้อความแจ้งข้อผิดพลาดต้อง**ไม่บอกว่าผิดที่ Username หรือ Password**
> เพื่อป้องกันการคาดเดาว่ามีบัญชีนั้นอยู่จริงหรือไม่ (User Enumeration)

---

### 2.2 Flow: วงจรชีวิตทรัพย์สิน (Asset Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> InStock: บันทึกทรัพย์สินใหม่<br/>(จัดซื้อเข้าคลัง)

    InStock --> InUse: นำไปติดตั้ง/มอบหมาย
    InUse --> UnderRepair: อุปกรณ์ขัดข้อง
    UnderRepair --> InUse: ซ่อมเสร็จ นำกลับใช้งาน
    UnderRepair --> Retired: ซ่อมไม่ได้/ไม่คุ้มซ่อม
    InUse --> InStock: ถอนออกจากงาน เก็บเข้าคลัง
    InUse --> Retired: ปลดระวางตามอายุการใช้งาน
    InStock --> Retired: ปลดระวางโดยไม่เคยใช้
    Retired --> Disposed: ตัดจำหน่าย/ทำลาย

    Disposed --> [*]

    note right of Retired
        ⚠️ ระบบตรวจสอบก่อน (FR-CM-03):
        หากยังมีอุปกรณ์อื่นพึ่งพาอยู่
        จะเตือนและแสดงรายการนั้น
    end note

    note right of Disposed
        ข้อมูลไม่ถูกลบออกจากฐานข้อมูล
        ยังค้นหาย้อนหลังได้เสมอ
    end note
```

---

### 2.3 Flow: เพิ่มทรัพย์สินใหม่ (Create Asset)

```mermaid
flowchart TD
    Start([IT Staff กด + New Asset]) --> SelectCat[เลือกประเภททรัพย์สิน<br/>Server / Network / Computer /<br/>Storage / Peripheral]
    SelectCat --> Form[แสดงฟอร์ม]

    Form --> Common[ส่วนที่ 1: General Information<br/>Asset Tag, Name, Manufacturer, Model,<br/>Serial No., Status, Location, Owner]
    Common --> Specific[ส่วนที่ 2: Technical Specification<br/>⚡ ฟิลด์เปลี่ยนตามประเภทที่เลือก]
    Specific --> Purchase[ส่วนที่ 3: Purchase & Warranty<br/>Vendor, PO No., วันที่ซื้อ, ราคา,<br/>วันหมดประกัน]
    Purchase --> Attach[ส่วนที่ 4: Attachments<br/>แนบ PO / ใบกำกับภาษี / รูปถ่าย]

    Attach --> Save[กด Save]
    Save --> ValTag{Asset Tag<br/>ซ้ำหรือไม่?}
    ValTag -->|ซ้ำ| ErrTag["❌ ไฮไลต์ช่อง Asset Tag สีแดง<br/>+ ข้อความใต้ช่อง"]
    ErrTag --> Common

    ValTag -->|ไม่ซ้ำ| ValSerial{Serial No.<br/>ซ้ำหรือไม่?}
    ValSerial -->|ซ้ำ| ErrSerial["❌ แจ้งเตือน + แสดงลิงก์<br/>ไปยังรายการที่มี Serial ซ้ำ"]
    ErrSerial --> Common

    ValSerial -->|ไม่ซ้ำ| ValReq{กรอกฟิลด์<br/>บังคับครบ?}
    ValReq -->|ไม่ครบ| ErrReq["❌ เลื่อนหน้าจอไปยังฟิลด์แรกที่ผิด<br/>+ สรุปจำนวนข้อผิดพลาดด้านบน"]
    ErrReq --> Common

    ValReq -->|ครบ| Commit[บันทึกลงฐานข้อมูล<br/>+ เขียน Audit Log]
    Commit --> Toast["✅ Toast: Asset created successfully"]
    Toast --> Detail[ไปยังหน้า Asset Detail]
    Detail --> Next{ต้องการ<br/>ทำอะไรต่อ?}
    Next -->|เพิ่มอีก| SelectCat
    Next -->|ผูกความสัมพันธ์| Relate[แท็บ Relationships]
    Next -->|ติดตั้ง Software| Install[แท็บ Software]
    Next -->|จบ| End([กลับหน้า Asset List])
```

> **หลักการ UX:** ฟอร์มแบ่งเป็น 4 ส่วนในหน้าเดียว (ไม่ใช่ Wizard หลายขั้น) เพราะผู้ใช้หลัก
> คือ IT Staff ที่กรอกข้อมูลซ้ำๆ วันละหลายรายการ การเห็นทุกช่องพร้อมกันช่วยให้กรอกได้เร็วกว่า
> และแก้ไขย้อนกลับได้โดยไม่ต้องกดถอยหลายขั้น

---

### 2.4 Flow: ค้นหาและกรองข้อมูล (Search & Filter)

```mermaid
flowchart LR
    subgraph Entry["จุดเริ่มต้น 3 ทาง"]
        A1[Global Search<br/>บน Top Bar]
        A2[เมนู Assets]
        A3[คลิกการ์ดจาก<br/>Dashboard]
    end

    A1 --> Quick[ค้นทันทีจาก Asset Tag,<br/>Serial, Hostname, IP]
    A2 --> List[หน้า Asset List<br/>แสดงทั้งหมด]
    A3 --> Preset[หน้า Asset List<br/>พร้อมตัวกรองที่ตั้งไว้แล้ว]

    Quick --> Result
    List --> Filter[แผงตัวกรอง<br/>Category, Status, Location,<br/>Vendor, Owner, ช่วงวันหมดอายุ]
    Preset --> Filter
    Filter --> Result[ตารางผลลัพธ์<br/>Server-side Pagination]

    Result --> Chips["แสดง Filter Chips ที่ใช้อยู่<br/>พร้อมปุ่ม ✕ ถอดทีละอัน<br/>และ Clear All"]
    Chips --> Action{ทำอะไรต่อ?}
    Action -->|ดูรายละเอียด| Detail[Asset Detail]
    Action -->|ส่งออก| Export["Export Excel<br/>⚡ ส่งออกตามเงื่อนไขที่กรองไว้<br/>ไม่ใช่ทั้งหมด"]
    Action -->|แก้หลายรายการ| Bulk[เลือก Checkbox<br/>→ Bulk Update Status]
```

> **ข้อกำหนดด้านประสิทธิภาพ:** ทุกการกรองและเรียงลำดับทำที่ฝั่ง Server (NFR-01)
> พร้อมหน่วงเวลาการพิมพ์ (Debounce) ประมาณ 300 ms เพื่อไม่ให้ยิง Request ทุกตัวอักษร

---

### 2.5 Flow: นำเข้าข้อมูลจาก Excel (Import)

Flow นี้สำคัญที่สุดในช่วงเริ่มใช้งานระบบ เพราะต้องย้ายข้อมูลเดิม 2,000+ รายการจาก Excel

```mermaid
flowchart TD
    Start([IT Staff เข้าเมนู Import]) --> Step1[ขั้นที่ 1: เลือกประเภททรัพย์สิน<br/>+ ดาวน์โหลด Template]
    Step1 --> Fill[ผู้ใช้กรอกข้อมูลในไฟล์ Template]
    Fill --> Step2[ขั้นที่ 2: อัปโหลดไฟล์<br/>ลากวาง หรือเลือกไฟล์]

    Step2 --> Parse{อ่านไฟล์สำเร็จ?}
    Parse -->|ไม่สำเร็จ| ErrFile["❌ ไฟล์เสียหาย หรือ<br/>คอลัมน์ไม่ตรง Template"]
    ErrFile --> Step2

    Parse -->|สำเร็จ| Validate[ตรวจสอบข้อมูลทุกแถว<br/>ชนิดข้อมูล, ฟิลด์บังคับ,<br/>ค่าซ้ำ, การอ้างอิง Master Data]
    Validate --> Step3[ขั้นที่ 3: หน้า Preview]

    Step3 --> Summary["สรุปผล:<br/>✅ ผ่าน 1,847 แถว<br/>⚠️ เตือน 32 แถว<br/>❌ ผิดพลาด 121 แถว"]
    Summary --> Table["ตารางแสดงทุกแถว<br/>🔴 แถวผิดพลาด = พื้นหลังแดง<br/>🟡 แถวเตือน = พื้นหลังเหลือง<br/>ชี้ที่ช่องเพื่อดูสาเหตุ"]

    Table --> Decide{ผู้ใช้ตัดสินใจ}
    Decide -->|ดาวน์โหลดรายการผิด| DownErr[ไฟล์ Excel เฉพาะแถวที่ผิด<br/>พร้อมคอลัมน์ระบุสาเหตุ]
    DownErr --> Fill
    Decide -->|ยกเลิก| Cancel([ยกเลิกทั้งหมด<br/>ไม่บันทึกอะไรเลย])
    Decide -->|นำเข้าเฉพาะแถวที่ผ่าน| Confirm[กล่องยืนยัน:<br/>จะนำเข้า 1,879 รายการ ใช่หรือไม่?]

    Confirm --> Trans[เริ่ม Transaction<br/>+ แสดงแถบความคืบหน้า]
    Trans --> Result{บันทึกสำเร็จ?}
    Result -->|สำเร็จ| Done["✅ นำเข้าสำเร็จ 1,879 รายการ<br/>+ เขียน Audit Log 1 รายการ<br/>อ้างอิงถึงชุดการนำเข้านี้"]
    Result -->|ล้มเหลว| Rollback["❌ ย้อนกลับทั้งหมด (Rollback)<br/>ไม่มีข้อมูลค้างในระบบ"]
    Rollback --> Step3
    Done --> ViewList([ไปยังหน้า Asset List<br/>กรองเฉพาะรายการที่เพิ่งนำเข้า])
```

> **หลักการสำคัญ:** ผู้ใช้ต้องเห็นผลการตรวจสอบ**ก่อน**ตัดสินใจบันทึกเสมอ (FR-IM-03)
> และการบันทึกเป็น Transaction เดียว — ไม่มีสถานะ "บันทึกไปครึ่งหนึ่ง" (FR-IM-04)

---

### 2.6 Flow: จัดสรรสิทธิ์ Software License (Seat Allocation)

```mermaid
flowchart TD
    Start([เข้าหน้า Software Detail]) --> Show["แสดงแถบสถานะ Seat<br/>▓▓▓▓▓▓▓░░░ 47 / 60 ใช้ไปแล้ว<br/>คงเหลือ 13"]
    Show --> Add[กด + Assign to Asset]
    Add --> Search[ค้นหาอุปกรณ์ปลายทาง<br/>พิมพ์ Asset Tag หรือ Hostname]
    Search --> Pick[เลือกอุปกรณ์]

    Pick --> CheckDup{อุปกรณ์นี้ติดตั้ง<br/>Software นี้อยู่แล้ว?}
    CheckDup -->|ใช่| ErrDup["❌ แจ้ง: อุปกรณ์นี้มีการติดตั้งอยู่แล้ว<br/>(FR-SW-05)"]
    ErrDup --> Search

    CheckDup -->|ไม่| CheckSeat{Seat คงเหลือ<br/>เพียงพอ?}
    CheckSeat -->|เพียงพอ| Save[บันทึกการติดตั้ง<br/>+ Audit Log]
    CheckSeat -->|ไม่พอ| Warn["⚠️ คำเตือน Over-deployment:<br/>การติดตั้งนี้จะทำให้ใช้เกินสิทธิ์ที่ซื้อไว้<br/>ยืนยันหรือไม่?"]
    Warn -->|ยกเลิก| Search
    Warn -->|ยืนยัน| SaveOver[บันทึก + ตั้งธง Over-deployed<br/>+ แจ้งเตือน Admin]

    Save --> Recalc[คำนวณ Seat ใหม่ทันที]
    SaveOver --> Recalc
    Recalc --> Show
```

> **หมายเหตุเชิงธุรกิจ:** ระบบ**ไม่บล็อก**การติดตั้งเกินสิทธิ์ แต่บันทึกและแจ้งเตือน
> เพราะในทางปฏิบัติ IT อาจจำเป็นต้องติดตั้งก่อนแล้วจึงจัดซื้อ License เพิ่มตามหลัง
> สิ่งที่ระบบต้องทำคือ**ทำให้มองเห็นได้** ไม่ใช่ขัดขวางการทำงาน

---

### 2.7 Flow: แจ้งเตือนวันหมดอายุ (Expiry Notification)

```mermaid
flowchart TD
    subgraph Auto["🤖 ระบบอัตโนมัติ (Worker Process)"]
        Cron([Scheduled Job<br/>ทำงานทุกวัน 08:00 น.]) --> Scan[สแกนทรัพย์สินและ License<br/>ที่ใกล้หมดอายุ]
        Scan --> Match{ตรงเกณฑ์<br/>90/60/30/7 วัน?}
        Match -->|ไม่ตรง| Skip([ข้าม])
        Match -->|ตรง| CheckSent{เคยส่งแจ้งเตือน<br/>รอบนี้แล้ว?}
        CheckSent -->|เคยส่ง| Skip
        CheckSent -->|ยังไม่ส่ง| Create[สร้าง In-app Notification]
        Create --> Email[ส่ง Email ผ่าน SMTP<br/>ถึง Admin + ผู้ดูแลทรัพย์สิน]
        Email --> Log[บันทึกลง notification_history<br/>ป้องกันส่งซ้ำ]
    end

    subgraph Manual["👤 ฝั่งผู้ใช้"]
        Log --> Bell["🔔 กระดิ่งขึ้นตัวเลขแจ้งเตือน"]
        Log --> Inbox["📧 อีเมลเข้ากล่องจดหมาย"]
        Bell --> Click[คลิกรายการแจ้งเตือน]
        Inbox --> Click
        Click --> Detail[เปิดหน้า Asset Detail<br/>ของรายการนั้น]
        Detail --> Act{ดำเนินการ}
        Act -->|ต่อสัญญาแล้ว| Update[แก้ไขวันหมดอายุใหม่<br/>→ ระบบหยุดแจ้งเตือนอัตโนมัติ]
        Act -->|ไม่ต่อแล้ว| Retire[เปลี่ยนสถานะเป็น Retired]
        Act -->|ยังไม่ตัดสินใจ| Read[ทำเครื่องหมายว่าอ่านแล้ว<br/>→ ยังเตือนในรอบถัดไป]
    end
```

---

### 2.8 Flow: การตรวจสอบย้อนหลัง (Audit Review)

```mermaid
flowchart LR
    Start([Auditor เข้าเมนู Audit Logs]) --> Filter["ตัวกรอง:<br/>ช่วงวันที่ · ผู้ใช้ ·<br/>ประเภทการกระทำ · ตาราง"]
    Filter --> List[ตารางบันทึก<br/>เรียงจากใหม่ไปเก่า]
    List --> Row[คลิกแถวที่สนใจ]
    Row --> Diff["หน้าต่างเปรียบเทียบ<br/>┌─ Before ─┬─ After ─┐<br/>│ In Stock │ In Use  │<br/>│ (ว่าง)   │ Rack A2 │<br/>└──────────┴─────────┘<br/>🟢 เพิ่ม 🔴 ลบ 🟡 แก้ไข"]
    Diff --> Trace[ลิงก์ไปยังรายการทรัพย์สิน<br/>เพื่อดูสถานะปัจจุบัน]
    List --> Export[Export Excel<br/>ส่งให้ผู้ตรวจสอบภายนอก]
```

> **ข้อจำกัดโดยการออกแบบ:** หน้านี้**ไม่มีปุ่ม Edit หรือ Delete ใดๆ** ทั้งสิ้น
> ทั้งในหน้าเว็บและใน API — เพื่อรับประกันความน่าเชื่อถือของหลักฐาน (FR-AD-03)

---

## 3. Flow ตามบทบาทผู้ใช้ (Role-Based Journey)

| Role | เส้นทางการใช้งานหลักในแต่ละวัน |
|---|---|
| 🔴 **Admin** | Login → ตรวจ Dashboard → ดูรายการใกล้หมดอายุ → จัดการผู้ใช้ใหม่ → ตรวจ Audit Log |
| 🟠 **IT Staff** | Login → รับแจ้งงาน → ค้นหาอุปกรณ์ → แก้ไขสถานะ/ผู้ถือครอง → แนบเอกสาร → บันทึก |
| 🔵 **Auditor** | Login → เข้า Reports → ดู License Compliance → เข้า Audit Logs → กรองตามช่วงเวลา → Export |
| 🟢 **Viewer** | Login → ค้นหาอุปกรณ์ที่สนใจ → ดูรายละเอียดและวันหมดประกัน |

---

## 4. หลักการจัดการสถานะหน้าจอ (UI State Principles)

ทุกหน้าที่ดึงข้อมูลต้องออกแบบครบ **5 สถานะ** ไม่ใช่เฉพาะสถานะปกติ

| สถานะ | แนวทางออกแบบ |
|---|---|
| **Loading** | ใช้ Skeleton ที่มีรูปร่างใกล้เคียงเนื้อหาจริง ไม่ใช้วงกลมหมุนกลางจอ เพื่อลดความรู้สึกว่าช้า |
| **Empty (ยังไม่มีข้อมูลเลย)** | อธิบายว่าหน้านี้ใช้ทำอะไร + ปุ่มการกระทำหลัก เช่น "No assets yet — Add your first asset or Import from Excel" |
| **No Result (กรองแล้วไม่พบ)** | ต่างจาก Empty — ต้องบอกว่าไม่พบผลลัพธ์ตามเงื่อนไข + ปุ่ม Clear Filters |
| **Error** | อธิบายด้วยภาษาที่ผู้ใช้เข้าใจ + ปุ่มลองใหม่ + รหัสอ้างอิงสำหรับแจ้งผู้ดูแลระบบ |
| **Success** | Toast มุมขวาบน หายเองใน 4 วินาที · การกระทำที่ย้อนกลับไม่ได้ต้องมีกล่องยืนยันก่อน |

### 4.1 กฎการยืนยันก่อนดำเนินการ (Confirmation Rules)

| การกระทำ | รูปแบบการยืนยัน |
|---|---|
| แก้ไขข้อมูลทั่วไป | ไม่ต้องยืนยัน — บันทึกแล้วแสดง Toast |
| ลบทรัพย์สิน (Soft Delete) | กล่องยืนยันธรรมดา ระบุชื่อรายการที่จะลบ |
| เปลี่ยนสถานะเป็น Disposed | กล่องยืนยัน + แสดงรายการอุปกรณ์ที่พึ่งพาอยู่ (ถ้ามี) |
| Bulk Update หลายรายการ | กล่องยืนยัน + ระบุจำนวนรายการที่จะถูกกระทบ |
| ลบผู้ใช้ / Master Data | กล่องยืนยัน + **ต้องพิมพ์ชื่อรายการเพื่อยืนยัน** |
| Import ข้อมูลจำนวนมาก | หน้า Preview เต็มหน้าจอ + กล่องยืนยันขั้นสุดท้าย |

---

## 5. สรุปหน้าจอที่ต้องออกแบบ Wireframe

| # | หน้าจอ | ความสำคัญ | สถานะ |
|---|---|:---:|:---:|
| 1 | Login | 🔴 สูง | รอออกแบบ |
| 2 | Dashboard | 🔴 สูง | รอออกแบบ |
| 3 | Asset List (ตาราง + ตัวกรอง) | 🔴 สูง | รอออกแบบ |
| 4 | Asset Detail (หลายแท็บ) | 🔴 สูง | รอออกแบบ |
| 5 | Asset Form (เพิ่ม/แก้ไข) | 🔴 สูง | รอออกแบบ |
| 6 | Software Detail (Seat Allocation) | 🟡 กลาง | รอออกแบบ |
| 7 | Import Wizard (3 ขั้น) | 🟡 กลาง | รอออกแบบ |
| 8 | Audit Logs | 🟡 กลาง | รอออกแบบ |
| 9 | Admin — Users & Master Data | 🟢 ต่ำ | รอออกแบบ |

---

*เอกสารนี้เป็นผลลัพธ์ของ Phase 2.1 — ขั้นถัดไปคือ Phase 2.2 Wireframe และ Phase 2.3 Design System*
