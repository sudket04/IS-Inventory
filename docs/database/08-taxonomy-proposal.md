# ข้อเสนอโครงสร้าง — Taxonomy · Data Entry · Cascading Filter
## IS-Inventory — IT Inventory Management System · v1.3 (Proposal)

| หัวข้อ | รายละเอียด |
|---|---|
| **สถานะ** | 📋 **ข้อเสนอ — ยังไม่เขียน SQL รอการตรวจสอบและยืนยัน** |
| **ที่มา** | คำตอบจากการสัมภาษณ์ 2 รอบ รวม 8 ประเด็น |
| **สิ่งที่ต้องตรวจ** | โครงสร้างหมวด · ผังประเภท 3 ชั้น · **รายการฟิลด์ทุกหมวด** · Cascading 4 ชุด |

> ⚠️ **เหตุผลที่ต้องให้ตรวจก่อน:** คุณเลือก "ไม่ต้องมี Dynamic Custom Fields"
> ซึ่งแปลว่าฟิลด์ทุกตัวถูกกำหนดตายตัวในฐานข้อมูล — **การเพิ่มฟิลด์ภายหลังต้องทำ Migration
> และ Deploy ระบบใหม่** เอกสารนี้จึงเป็นจุดที่ต้องตรวจให้ละเอียดที่สุดในทั้งโปรเจกต์

---

## 1. สรุปการตัดสินใจที่ได้รับ

| # | ประเด็น | ค่าที่เลือก |
|:---:|---|---|
| 1 | โครงสร้าง Taxonomy | ✅ ตาราง `asset_types` เดียว **3 ชั้น** ใช้กับทุกหมวด |
| 2 | Cascading Dropdown | ✅ **ครบทั้ง 4 ชุด** |
| 3 | Model Catalog | ✅ ต้องการ **พร้อม Auto-fill สเปก** |
| 4 | Dynamic Custom Fields | ❌ ไม่ต้องการ — กำหนดฟิลด์ครบตั้งแต่แรก |
| 5 | หมวดหลัก | ✅ **แยก Storage ออกจาก Power** + **เพิ่มหมวด Mobile & IoT/OT** |
| 6 | ตำแหน่งใน Rack | ✅ **ตำแหน่ง U + ความสูง + หน้า/หลัง** |
| 7 | การเก็บ IP | ✅ **สร้างตาราง `ip_addresses` แยก (IPAM เต็มรูปแบบ)** |
| 8 | ผู้เพิ่มรุ่นใหม่ | ✅ IT Staff เพิ่มได้เอง ติดธง Unverified · Admin ตรวจทีหลัง |

---

## 2. หมวดหลัก (ชั้นที่ 1) — จาก 6 เป็น 8 หมวด

| # | หมวด | Prefix | เปลี่ยนแปลง |
|:---:|---|---|---|
| 1 | Server | `SRV` | คงเดิม |
| 2 | Network Device | `NET` | คงเดิม |
| 3 | Software License | `SFT` | คงเดิม |
| 4 | Computer | `PC` | คงเดิม |
| 5 | **Storage** | `STG` | ♻️ แยกออกมา (เดิมคือ Storage & Power) |
| 6 | **Power & Cooling** | `PWR` | 🆕 หมวดใหม่ |
| 7 | Peripheral | `PER` | คงเดิม |
| 8 | **Mobile & IoT/OT** | `IOT` | 🆕 หมวดใหม่ |

> ⚠️ **ผลกระทบที่ต้องทราบ:** หมวด `STG` เดิมเคยรวม UPS/PDU ไว้ด้วย
> หากมีข้อมูลเดิมที่เคยบันทึกไว้ ต้องย้ายรายการ UPS/PDU ไปหมวด `PWR`
> — แต่เนื่องจากยังไม่ได้ติดตั้งระบบ จึงยังไม่มีข้อมูลต้องย้ายจริง

---

## 3. ผังประเภทอุปกรณ์ 3 ชั้น (Taxonomy Tree)

**โครงสร้าง:** `Category (ชั้น 1)` → `Type (ชั้น 2)` → `Subtype (ชั้น 3)`
เก็บในตาราง `asset_types` เดียว ใช้ `parent_type_id` ชี้กลับหาตัวเอง

### 3.1 🖥 Server (SRV)

| Type | Subtype |
|---|---|
| **Rack Server** | 1U Rack · 2U Rack · 4U+ Rack |
| **Blade System** | Blade Server · Blade Chassis |
| **Tower Server** | Tower Server |
| **Virtual Machine** | Virtual Machine |
| **HCI Node** | Hyperconverged Node |
| **Appliance** | Hardware Appliance · Virtual Appliance |

> 💡 **หมายเหตุ:** ประเภทในชั้นนี้คือ **รูปทรงทางกายภาพ (Form Factor)**
> ส่วน **"ทำหน้าที่อะไร"** (File / DHCP / Database / Application) ใช้ `server_roles`
> แบบหลายต่อหลายที่ทำไปแล้วใน v1.2 — **แยกสองแกนออกจากกันโดยเจตนา**
> เพราะเซิร์ฟเวอร์ 2U หนึ่งเครื่องทำได้หลายหน้าที่พร้อมกัน

### 3.2 🌐 Network Device (NET)

| Type | Subtype |
|---|---|
| **Switching & Routing** | Core Switch · Distribution Switch · Layer 3 Switch · Access Switch · Router · Modem/ONU · Media Converter |
| **Network Security** | Firewall · UTM · IPS/IDS · WAF · VPN Gateway · NAC · Proxy/Secure Web GW · Email Security GW · DDoS Mitigation |
| **Wireless** | Wireless Access Point · Wireless Controller |
| **Traffic Optimization** | Load Balancer · SD-WAN Edge · WAN Optimizer |
| **Voice** | IP-PBX · Voice Gateway |
| **Out-of-Band Management** | KVM Switch · Console Server |

> ✅ 26 ประเภทที่ทำไว้ใน v1.2 **ย้ายเข้าโครงสร้างใหม่ได้พอดี** โดยเดิม `device_class`
> กลายเป็นชั้นที่ 2 และ `code` เดิมกลายเป็นชั้นที่ 3 — ไม่สูญเสียข้อมูลใดๆ

### 3.3 💿 Software License (SFT)

| Type | Subtype |
|---|---|
| **Operating System** | Server OS · Client OS · Hypervisor OS · Network OS |
| **Database** | RDBMS · NoSQL · Data Warehouse |
| **Security** | Antivirus/EDR · SIEM · Encryption · PAM · Email Security |
| **Virtualization** | Hypervisor · Container Platform · VDI |
| **Backup & DR** | Backup Software · Replication · Archiving |
| **Productivity** | Office Suite · Email Client · Collaboration |
| **Business Application** | ERP · CRM · HRM · Accounting · Document Management |
| **Development** | IDE · Version Control · CI/CD · Testing |
| **IT Management** | Monitoring · ITSM · Patch Management · Asset Management |
| **Middleware** | Application Server · Message Queue · API Gateway |
| **Design & Engineering** | CAD/CAM · Graphics · GIS |
| **Other** | Other Software |

> 🔴 **แก้ปัญหาที่พบในการวิเคราะห์:** เดิม Software แยกได้แค่ `license_type`
> (Perpetual / Subscription / OEM ...) ซึ่งเป็น**เงื่อนไขการซื้อ ไม่ใช่ประเภทของซอฟต์แวร์**
> ทำให้ตอบคำถาม "เรามี Database License กี่ตัว" ไม่ได้เลย

### 3.4 💻 Computer (PC)

| Type | Subtype |
|---|---|
| **Desktop** | Standard Desktop · Mini PC · All-in-One |
| **Notebook** | Standard Notebook · Ultrabook · 2-in-1 Convertible · Rugged Notebook |
| **Workstation** | Desktop Workstation · Mobile Workstation |
| **Thin Client** | Thin Client · Zero Client |
| **Terminal** | POS Terminal · Kiosk |

### 3.5 🗄 Storage (STG)

| Type | Subtype |
|---|---|
| **SAN** | All-Flash Array · Hybrid Array · Disk Array |
| **NAS** | Enterprise NAS · SMB NAS |
| **DAS** | JBOD · External Enclosure |
| **Tape** | Tape Drive · Tape Autoloader · Tape Library |
| **Object Storage** | Object Storage Appliance |
| **Backup Appliance** | Purpose-Built Backup Appliance · Deduplication Appliance |
| **SAN Fabric** | Fibre Channel Switch · FC Director |

### 3.6 ⚡ Power & Cooling (PWR)

| Type | Subtype |
|---|---|
| **UPS** | Online Double-Conversion · Line-Interactive · Modular UPS |
| **PDU** | Basic PDU · Metered PDU · Switched PDU · ATS |
| **Generator** | Diesel Generator |
| **Battery** | Battery Cabinet · Battery Bank |
| **Cooling** | Precision A/C (CRAC) · In-Row Cooling · Split A/C |
| **Protection** | Surge Protector · Isolation Transformer |

### 3.7 🖨 Peripheral (PER)

| Type | Subtype |
|---|---|
| **Printing** | Laser Printer · Inkjet Printer · MFP · Label Printer · Dot Matrix · Plotter · 3D Printer |
| **Display** | Monitor · Large Format Display · Projector · Video Wall |
| **Input** | Keyboard/Mouse Set · Barcode Scanner · Document Scanner · Signature Pad |
| **Audio & Video** | Webcam · Conference System · Speaker/Microphone |
| **Accessory** | Docking Station · External Drive · Card Reader |

### 3.8 📱 Mobile & IoT/OT (IOT)

| Type | Subtype |
|---|---|
| **Mobile Device** | Smartphone · Tablet · Handheld Terminal |
| **IP Surveillance** | Fixed Camera · PTZ Camera · NVR/DVR |
| **Access Control** | Card Reader · Door Controller · Time Attendance |
| **OT Device** | PLC · HMI Panel · SCADA Terminal · Industrial Gateway |
| **Environment Sensor** | Temperature/Humidity · Water Leak · Smoke Detector · Door Contact |

**รวมทั้งสิ้น: 8 หมวด · 44 Type · 110 Subtype**

---

## 4. ⭐ รายการฟิลด์ทุกหมวด (จุดที่ต้องตรวจละเอียดที่สุด)

เนื่องจากไม่มี Dynamic Custom Fields ผมจึงต้องออกแบบฟิลด์ให้ครบ
**ตารางเดิม 4 ตารางคงไว้ · เพิ่มตารางใหม่ 4 ตาราง**

### 4.1 ตารางที่มีอยู่แล้ว (ไม่เปลี่ยน)

| ตาราง | จำนวนฟิลด์ | สถานะ |
|---|:---:|---|
| `server_details` | 15 | ✅ ครบแล้ว (หัก storage ที่ย้ายไป `storage_volumes` และ IP ที่ย้ายไป IPAM) |
| `network_details` | 11 | ✅ ครบแล้ว |
| `computer_details` | 12 | ✅ ครบแล้ว |
| `software_details` | 11 | ✅ ครบแล้ว |

### 4.2 🆕 `storage_details` — สำหรับหมวด Storage

| ฟิลด์ | ชนิด | ความหมาย |
|---|---|---|
| `hostname` | NVARCHAR(100) | ชื่อเครื่องในเครือข่าย |
| `mgmt_url` | NVARCHAR(400) | URL หน้าจัดการ |
| `controller_count` | TINYINT | จำนวน Controller (HA = 2) |
| `disk_bay_total` | SMALLINT | จำนวนช่องใส่ดิสก์ทั้งหมด |
| `disk_bay_used` | SMALLINT | จำนวนช่องที่ใส่แล้ว |
| `raw_capacity_tb` | DECIMAL(12,2) | ความจุดิบรวม |
| `usable_capacity_tb` | DECIMAL(12,2) | ความจุใช้งานได้หลัง RAID |
| `cache_gb` | INT | ขนาด Cache |
| `supported_protocols` | NVARCHAR(200) | FC · iSCSI · NFS · SMB · S3 |
| `expansion_shelf_count` | TINYINT | จำนวนตู้ขยาย |
| `firmware_version` | NVARCHAR(100) | เวอร์ชัน Firmware |
| `has_dedup` · `has_compression` · `has_snapshot` · `has_replication` | BIT | ความสามารถที่เปิดใช้ |

### 4.3 🆕 `power_details` — สำหรับหมวด Power & Cooling

| ฟิลด์ | ชนิด | ความหมาย |
|---|---|---|
| `capacity_kva` | DECIMAL(8,2) | กำลังไฟฟ้าปรากฏ |
| `capacity_kw` | DECIMAL(8,2) | กำลังไฟฟ้าจริง |
| `input_phase` | TINYINT | 1 หรือ 3 เฟส |
| `input_voltage` · `output_voltage` | NVARCHAR(50) | แรงดันเข้า/ออก |
| `outlet_count` | SMALLINT | จำนวนเต้ารับ |
| `outlet_type` | NVARCHAR(100) | C13 · C19 · NEMA |
| `battery_count` | SMALLINT | จำนวนแบตเตอรี่ |
| `battery_install_date` | DATE | วันติดตั้งแบตเตอรี่ |
| `battery_replace_due` | DATE | ⭐ **วันครบกำหนดเปลี่ยนแบตเตอรี่** |
| `runtime_minutes_full_load` | SMALLINT | เวลาสำรองไฟที่โหลดเต็ม |
| `current_load_percent` | DECIMAL(5,1) | โหลดปัจจุบัน |
| `has_bypass` · `has_snmp_card` | BIT | ความสามารถ |
| `mgmt_ip` | (ย้ายไป IPAM) | — |
| `cooling_capacity_btu` | INT | สำหรับแอร์ (CRAC) |

> ⭐ **ฟิลด์ `battery_replace_due` เชื่อมเข้าระบบแจ้งเตือนเดิมทันที**
> ใช้กลไก `coverage_end_date` เดียวกับวันหมดประกันได้เลย โดยไม่ต้องเขียนโค้ดใหม่
> — **แบตเตอรี่ UPS หมดอายุคือสาเหตุอันดับต้นๆ ที่ระบบล่มตอนไฟดับ**

### 4.4 🆕 `peripheral_details` — สำหรับหมวด Peripheral

ฟิลด์แบ่งเป็น 3 กลุ่ม ฟอร์มจะแสดงเฉพาะกลุ่มที่ตรงกับประเภทที่เลือก

| กลุ่ม | ฟิลด์ |
|---|---|
| **ร่วมทุกประเภท** | `connection_type` (USB/Network/HDMI/Bluetooth/Wireless) · `mgmt_ip` (ย้ายไป IPAM) · `firmware_version` |
| **สำหรับงานพิมพ์** | `print_technology` (Laser/Inkjet/Thermal/Dot Matrix) · `is_color` · `max_paper_size` (A4/A3/A0) · `has_duplex` · `has_adf` · `page_counter_mono` · `page_counter_color` · `counter_read_date` · `toner_model` |
| **สำหรับจอภาพ** | `screen_size_inch` · `resolution` · `panel_type` (IPS/VA/TN/OLED) · `refresh_rate_hz` · `has_speaker` · `mount_type` |

> 💡 **เหตุผลที่รวมไว้ตารางเดียว:** กลุ่มเหล่านี้ไม่มีฟิลด์ทับซ้อนกันเลย และแต่ละกลุ่มมีไม่เกิน 9 ฟิลด์
> การแยกเป็น 3 ตารางจะทำให้ต้อง JOIN เพิ่มโดยไม่ได้ประโยชน์ —
> ฟอร์มใช้เทคนิค Progressive Disclosure ซ่อนกลุ่มที่ไม่เกี่ยวข้องอยู่แล้ว

### 4.5 🆕 `mobile_iot_details` — สำหรับหมวด Mobile & IoT/OT

| ฟิลด์ | ความหมาย |
|---|---|
| `imei` · `phone_number` · `sim_provider` | สำหรับมือถือและแท็บเล็ต |
| `os_name` · `os_version` | ระบบปฏิบัติการ |
| `is_mdm_enrolled` · `mdm_platform` | ลงทะเบียนกับระบบจัดการอุปกรณ์แล้วหรือยัง |
| `mac_address` | ที่อยู่ทางกายภาพ |
| `device_protocol` | Modbus · OPC-UA · BACnet · MQTT (สำหรับ OT) |
| `controller_model` · `firmware_version` | สำหรับ PLC และ HMI |
| `resolution` · `has_ptz` · `has_ir` · `storage_type` | สำหรับกล้อง IP |
| `assigned_to_name` · `assigned_date` | ผู้ถือครอง |

---

## 5. 🆕 Model Catalog (คลังรุ่นอุปกรณ์)

### 5.1 ตาราง `device_models`

| ฟิลด์ | ความหมาย |
|---|---|
| `manufacturer_id` 🔗 · `asset_type_id` 🔗 | ยี่ห้อและประเภทที่รุ่นนี้สังกัด |
| `model_name` · `model_number` | เช่น `PowerEdge R750` · `R750-2U-8SFF` |
| `u_height` | ⭐ ความสูงเป็น U — **ใช้จองตำแหน่งใน Rack อัตโนมัติ** |
| `form_factor` | Rack · Tower · Blade · Desktop · Handheld |
| `power_draw_watt` · `weight_kg` | ⭐ **ใช้คำนวณโหลดรวมของตู้ Rack** |
| `default_specs` | JSON เก็บสเปกตั้งต้นเฉพาะทาง เช่น `{"cpu_socket_count":2,"max_ram_gb":8192}` |
| `eol_date` · `eos_date` | 🆕 **วันสิ้นสุดการขาย / สิ้นสุดการสนับสนุน** |
| `datasheet_url` | ลิงก์เอกสารจากผู้ผลิต |
| `is_verified` | ธง Unverified สำหรับรุ่นที่ IT Staff เพิ่มเอง |
| `created_by` · `verified_by` · `verified_at` | ร่องรอยการตรวจสอบ |

### 5.2 พฤติกรรม Auto-fill

```
ผู้ใช้เลือก  Manufacturer: Dell  →  Model: PowerEdge R750
                        ↓
ระบบเติมให้อัตโนมัติ (แก้ทับได้)
  ✓ U Height           2U
  ✓ Form Factor        Rack
  ✓ Power Draw         750 W
  ✓ Weight             28.0 kg
  ✓ CPU Socket Count   2
  ✓ Max RAM            8192 GB
  ⓘ EOL 31 Dec 2027 · EOS 31 Dec 2030
```

| กติกา | รายละเอียด |
|---|---|
| ค่าที่เติมให้ | เป็น**ค่าตั้งต้น แก้ทับได้เสมอ** |
| หากผู้ใช้แก้ทับ | ระบบแสดงไอคอน ✏️ กำกับว่าค่านี้ต่างจากสเปกของรุ่น |
| รุ่นที่ยังไม่มีในคลัง | IT Staff กด `+ Add new model` ได้จากในฟอร์ม → ติดธง 🟡 `Unverified` |
| การตรวจสอบ | Admin มีหน้า "Unverified Models" สำหรับตรวจและยืนยันเป็นชุด |
| ประโยชน์เพิ่มเติม | 🆕 **แจ้งเตือน EOL/EOS ล่วงหน้า** — รู้ว่าอุปกรณ์รุ่นไหนกำลังจะหมดการสนับสนุนจากผู้ผลิต |

---

## 6. 🆕 Rack Elevation (ตำแหน่งในตู้)

### 6.1 ตาราง `racks`

| ฟิลด์ | ความหมาย |
|---|---|
| `location_id` 🔗 | ห้องที่ตู้ตั้งอยู่ |
| `code` · `name` | `RACK-A2` · `Rack A2 - Production` |
| `total_u` | จำนวน U ทั้งหมด (ปกติ 42U) |
| `width_mm` · `depth_mm` | ขนาดตู้ |
| `max_weight_kg` · `max_power_kw` | ⭐ **ขีดจำกัดที่ใช้เตือนก่อนติดตั้งเกิน** |
| `numbering_direction` | นับจากล่างขึ้นบน (มาตรฐาน) หรือบนลงล่าง |
| `has_front_door` · `has_rear_door` | มีประตูหรือไม่ |

### 6.2 ตาราง `rack_mounts`

| ฟิลด์ | ความหมาย |
|---|---|
| `rack_id` 🔗 · `asset_id` 🔗 | ตู้และอุปกรณ์ |
| `start_u` | ตำแหน่งเริ่มต้น (U ล่างสุดของอุปกรณ์) |
| `u_height` | ความสูง — เติมอัตโนมัติจาก Model Catalog |
| `mount_face` | `FRONT` · `REAR` · `BOTH` |
| `orientation` | `NORMAL` · `REVERSED` |

### 6.3 กติกาที่ระบบบังคับ

| # | กติกา | วิธีบังคับ |
|---|---|---|
| 1 | ⭐ **ตำแหน่ง U ห้ามซ้อนทับกัน** ในตู้และด้านเดียวกัน | Trigger ตรวจช่วง `start_u` ถึง `start_u + u_height - 1` |
| 2 | ตำแหน่งต้องไม่เกิน `total_u` ของตู้ | Trigger |
| 3 | อุปกรณ์ 1 ชิ้นอยู่ได้ตู้เดียว ณ เวลาหนึ่ง | Unique Index |
| 4 | เตือนเมื่อน้ำหนักรวมหรือกำลังไฟรวมเกินขีดจำกัดของตู้ | View `vw_rack_utilization` |

### 6.4 หน้าจอ Rack Elevation

```
┌─ RACK-A2 · Bangkok DC / Data Center 1 ──────────────────────────────────┐
│  42U · ใช้ไป 28U (66.7%) · น้ำหนัก 412/1000 kg · ไฟ 6.2/10.0 kW        │
│  ┌────── FRONT ──────┐  ┌────── REAR ───────┐                           │
│  │ 42 │ ░░░ ว่าง      │  │ 42 │ ░░░           │                          │
│  │ 41 │ ░░░ ว่าง      │  │ 41 │ ░░░           │                          │
│  │ 40 │ ▓ NET-..0042 │  │ 40 │ ░░░           │  Cisco C9300  1U         │
│  │ 39 │ ▓ NET-..0043 │  │ 39 │ ░░░           │  Cisco C9300  1U         │
│  │ 38 │ ░░░ ว่าง      │  │ 38 │ ░░░           │                          │
│  │ 37 │ ▓▓ SRV-..0031│  │ 37 │ ▓▓            │  Dell R750    2U         │
│  │ 36 │ ▓▓           │  │ 36 │ ▓▓            │                          │
│  │ .. │              │  │ .. │               │                          │
│  │  2 │ ▓▓ PWR-..001 │  │  2 │ ▓▓            │  APC SRT5KRMXLI 2U       │
│  │  1 │ ▓▓           │  │  1 │ ▓▓            │                          │
│  └───────────────────┘  └───────────────────┘                           │
│  ⚠️ ช่องว่างต่อเนื่องสูงสุด: 3U (ตำแหน่ง 38, 41-42)                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 7. 🆕 IPAM — ตาราง `ip_addresses`

### 7.1 เหตุผลที่ต้องเปลี่ยนโครงสร้าง

| ข้อจำกัดของโครงสร้างเดิม | ผลที่เกิด |
|---|---|
| IP อยู่ในตารางขยาย เครื่องละ 1–2 ช่อง | ❌ เซิร์ฟเวอร์ที่มี NIC Teaming + iSCSI + vMotion + Backup **เก็บ IP ได้ไม่ครบ** |
| ไม่มีสถานะของ IP | ❌ **จอง IP ล่วงหน้าไม่ได้** ก่อนติดตั้งเครื่องจริง |
| ไม่รู้ว่า IP ไหนว่าง | ❌ ทำ Dropdown "เลือก IP ที่ว่าง" ตามที่ต้องการไม่ได้ |
| ตรวจ IP ซ้ำไม่ได้ | ❌ IP ชนกันแล้วไม่มีใครรู้จนกว่าระบบจะล่ม |

### 7.2 โครงสร้างตาราง

| ฟิลด์ | ความหมาย |
|---|---|
| `ip_address` ⭐ | IP (บังคับรูปแบบด้วย `fn_is_valid_ipv4`) |
| `ip_numeric` | คอลัมน์คำนวณ ใช้เรียงและเทียบช่วง |
| `vlan_id` 🔗 · `range_id` 🔗 | VLAN และช่วงที่ IP นี้สังกัด |
| `asset_id` 🔗 | อุปกรณ์ที่ใช้ IP นี้ (`NULL` = ยังว่างหรือแค่จองไว้) |
| `interface_name` | `eth0` · `NIC1` · `vmk0` · `port3` |
| `ip_purpose` | `SERVICE` · `MANAGEMENT` · `CLUSTER` · `ISCSI` · `VMOTION` · `BACKUP` · `VIP` · `ILO` |
| `assignment_type` | `STATIC` · `DHCP_RESERVED` · `DHCP_DYNAMIC` |
| `status` ⭐ | `AVAILABLE` · `RESERVED` · `IN_USE` · `CONFLICT` · `QUARANTINE` |
| `is_primary` | เป็น IP หลักของเครื่องนี้หรือไม่ (ใช้แสดงในตารางรายการ) |
| `mac_address` · `hostname` · `dns_name` | ข้อมูลประกอบ |
| `assigned_date` · `released_date` | ประวัติการใช้งาน |

### 7.3 สิ่งที่ต้องย้าย

| จาก | ไป |
|---|---|
| `server_details.ip_address` · `mgmt_ip` | `ip_addresses` (purpose = `SERVICE` / `ILO`) |
| `network_details.mgmt_ip` | `ip_addresses` (purpose = `MANAGEMENT`) |
| `computer_details.ip_address` | `ip_addresses` (purpose = `SERVICE`) |

> ⚠️ **ขอการยืนยัน:** การย้ายนี้ทำให้ต้องลบฟิลด์ IP ออกจากตารางขยายทั้ง 3 ตาราง
> เพื่อไม่ให้มีข้อมูลสองแหล่งขัดแย้งกัน · หน้ารายการจะอ่าน IP หลักจาก View แทน
> — **ระบบยังแสดงผลเหมือนเดิมทุกประการ ผู้ใช้ไม่รู้สึกถึงความแตกต่าง**

---

## 8. Cascading Dropdown ทั้ง 4 ชุด

### 8.1 ชุดที่ 1 — ประเภทและรุ่นอุปกรณ์

```
[▾ Category ]  →  [▾ Type ]  →  [▾ Subtype ]  →  [▾ Manufacturer ]  →  [▾ Model ]
   Storage          SAN          All-Flash          Dell              PowerStore 1200T
                                                                            ↓
                                                              Auto-fill สเปกจาก Model Catalog
```

| พฤติกรรม | รายละเอียด |
|---|---|
| เลือกชั้นบน | ล้างค่าชั้นล่างทั้งหมดและโหลดรายการใหม่ |
| ชั้นล่างที่ยังไม่พร้อม | ปิดการใช้งาน (Disabled) พร้อมข้อความ `Select a category first` |
| ไม่มีข้อมูลให้เลือก | แสดงปุ่ม `+ Add new` แทนข้อความว่างเปล่า |
| Manufacturer | ⭐ **กรองเฉพาะยี่ห้อที่มีรุ่นในประเภทนี้จริง** — เลือก SAN แล้วจะไม่เห็น "Canon" |
| Subtype | ข้ามได้ (ไม่บังคับ) หาก Type นั้นไม่มี Subtype ย่อย |

### 8.2 ชุดที่ 2 — สถานที่ถึงตำแหน่งในตู้

```
[▾ Site ] → [▾ Building ] → [▾ Floor ] → [▾ Room ] → [▾ Rack ] → [▾ U Position ]
  HQ BKK      Main Bldg       Floor 1      DC 1        RACK-A2      U 37-38 (2U)
```

| พฤติกรรม | รายละเอียด |
|---|---|
| ระดับที่ข้ามได้ | ทุกระดับกลางข้ามได้ — บาง Site ไม่มีชั้นหรือห้องย่อย |
| Rack | แสดงเฉพาะตู้ในห้องที่เลือก พร้อมตัวเลขพื้นที่ว่าง เช่น `RACK-A2 (14U free)` |
| **U Position** | ⭐ **แสดงเฉพาะช่วงที่ว่างและกว้างพอสำหรับความสูงของอุปกรณ์** |
| ความสูง | ดึงจาก Model Catalog อัตโนมัติ ไม่ต้องกรอก |
| อุปกรณ์ที่ไม่ติดตั้งในตู้ | เลือกได้แค่ถึงระดับ Room แล้วหยุด |

### 8.3 ชุดที่ 3 — เครือข่ายถึง IP ที่ว่าง

```
[▾ Zone ] → [▾ VLAN ] → [▾ IP Range ] → [▾ Available IP ]
  OA Network   VLAN 20     Static         10.10.20.47
               OA-USER     .11-.99        (26 available)
```

| พฤติกรรม | รายละเอียด |
|---|---|
| VLAN | กรองตาม Zone ที่เลือก |
| IP Range | ⭐ แสดงเฉพาะช่วง `STATIC` (ช่วง DHCP ไม่ให้เลือกด้วยมือ) |
| Available IP | ⭐ **แสดงเฉพาะ IP ที่ `status = AVAILABLE`** เรียงจากน้อยไปมาก |
| จำนวนที่แสดง | สูงสุด 100 รายการแรก + ช่องค้นหา (ป้องกันปัญหาเมื่อ Subnet ใหญ่) |
| ปุ่มช่วย | `Suggest next available` เลือก IP ว่างตัวแรกให้ทันที |
| หากไม่มี IP ว่าง | แจ้ง `No available IP in this range` + ปุ่มไปหน้าจัดการช่วง IP |

### 8.4 ชุดที่ 4 — Cluster และบทบาท

```
[▾ Cluster ] → [▾ Node ] → [▾ Volume ]        [▾ Role Group ] → [▾ Role ]
  CL-VM-HQ      ESXi-01     DS-PROD-01           Infrastructure    DHCP Server
```

| พฤติกรรม | รายละเอียด |
|---|---|
| Node | แสดงเฉพาะสมาชิกของ Cluster ที่เลือก (`left_date IS NULL`) |
| Volume | แสดงทั้ง Volume ของ Node และ Shared Volume ของ Cluster โดยมีป้ายกำกับแยก |
| Role Group | 6 กลุ่ม → Role ในกลุ่มนั้น |
| Role ที่เลือกแล้ว | ซ่อนออกจากรายการ ป้องกันเลือกซ้ำ |

---

## 9. ระบบกรองข้อมูล (Filter) ที่ปรับใหม่

### 9.1 แผงตัวกรองแบบลำดับชั้น

```
┌─ FILTERS ─────────────────────────────────┐
│ 🔍 [ Search...                          ] │
│                                           │
│ ▼ Classification                          │
│   Category    [▾ Server            ]      │
│   Type        [▾ Rack Server       ]  ←── กรองตาม Category
│   Subtype     [▾ All               ]  ←── กรองตาม Type
│   Manufacturer[▾ All               ]  ←── กรองตาม Type
│   Model       [▾ All               ]  ←── กรองตาม Manufacturer
│                                           │
│ ▼ Location                                │
│   Site        [▾ HQ Bangkok        ]      │
│   Room        [▾ Data Center 1     ]      │
│   Rack        [▾ All               ]      │
│                                           │
│ ▼ Network                                 │
│   Zone        [▾ All               ]      │
│   VLAN        [▾ All               ]      │
│                                           │
│ ▼ Infrastructure                          │
│   Server Role [▾ All               ]      │
│   Cluster     [▾ All               ]      │
│                                           │
│ ▼ Status & Dates                          │
│   Status      [✓] In Use [ ] In Stock     │
│   Warranty    [▾ Expiring ≤ 90 days]      │
│                                           │
│ ( Reset )            [ Save as view ]     │
└───────────────────────────────────────────┘
```

### 9.2 ฟีเจอร์เพิ่มเติมที่เสนอ

| ฟีเจอร์ | รายละเอียด |
|---|---|
| **Saved Views** | บันทึกชุดตัวกรองที่ใช้บ่อยไว้เรียกซ้ำ เช่น `Servers หมดประกันใน DC1` |
| **จำนวนกำกับทุกตัวเลือก** | `Rack Server (128)` — รู้ก่อนเลือกว่าจะได้ผลลัพธ์กี่รายการ |
| **ซ่อนตัวเลือกที่ไม่มีข้อมูล** | ไม่แสดงตัวเลือกที่กรองแล้วได้ 0 รายการ |
| **Filter Chips** | แสดงเงื่อนไขที่ใช้อยู่เหนือตาราง ถอดทีละอันได้ |
| **URL สะท้อนตัวกรอง** | คัดลอกลิงก์ส่งให้เพื่อนร่วมงานแล้วเห็นผลลัพธ์เดียวกัน |

---

## 10. สรุปผลกระทบต่อฐานข้อมูล

| ประเภท | v1.2 | **v1.3 (เสนอ)** | ที่เพิ่ม |
|---|:---:|:---:|---|
| ตาราง | 35 | **44** | `asset_types` · `device_models` · `racks` · `rack_mounts` · `ip_addresses` · `storage_details` · `power_details` · `peripheral_details` · `mobile_iot_details` |
| ตารางที่ถูกยุบ | — | −1 | `network_device_types` → รวมเข้า `asset_types` |
| View | 15 | ~22 | Cascading 5 · Rack Utilization · IP Availability |
| Trigger | 4 | 6 | ตรวจ U ซ้อนทับ · ตรวจ IP ซ้ำ |
| Seed Data | 59 | **~220** | 8 หมวด · 44 Type · 110 Subtype |

**ผลกระทบต่อแผนงานโดยประมาณ: +12 ถึง 15 วันทำงาน**

---

## 11. ❓ สิ่งที่ขอให้ยืนยันก่อนผมเขียน SQL

| # | ประเด็น | ต้องการคำตอบ |
|:---:|---|---|
| **1** | **ผังประเภท 8 หมวด · 44 Type · 110 Subtype** (ส่วนที่ 3) | มีประเภทไหนที่องค์กรคุณไม่มี ควรตัดออก? มีประเภทไหนขาดไป? |
| **2** | **รายการฟิลด์ 4 ตารางใหม่** (ส่วนที่ 4.2–4.5) | ⭐ **สำคัญที่สุด** — ฟิลด์ครบไหม? ต้องการเพิ่มอะไร? |
| **3** | **การย้าย IP ออกจากตารางขยาย** (ส่วนที่ 7.3) | ยืนยันให้ลบฟิลด์ IP เดิมออกได้ไหม? |
| **4** | **รุ่นที่ควร Pre-seed** | ต้องการให้ผมใส่รุ่นยอดนิยมให้ล่วงหน้าไหม (Dell, HPE, Cisco, Fortinet, APC, Synology)? |
| **5** | **จำนวน Rack และรูปแบบการตั้งชื่อ** | องค์กรมีกี่ตู้ ตั้งชื่อแบบไหน (`RACK-A2` หรือ `A-02`)? |

> ตอบมาได้เลยครับ หรือบอกว่า **"ตามที่เสนอ"** ถ้าเห็นด้วยทั้งหมด — ผมจะเริ่มเขียน SQL ทันที

---

*เอกสารนี้เป็นข้อเสนอ ยังไม่ได้แก้ไขฐานข้อมูลใดๆ*
