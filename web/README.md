# IT Infrastructure Inventory

เว็บจัดการ Inventory ของ IT Infrastructure — Server / Storage / Cluster /
Server list / Network device / VLAN / Software / License / AD user +
shared-folder permission พร้อม audit log, version history, recycle bin,
CSV export และการ import ไฟล์ AD / File Server

**HTML + CSS + JavaScript ทั้งหมด** — หน้าเว็บเป็น HTML/CSS/JS ธรรมดาในโฟลเดอร์
`public/` (ไม่มี framework ไม่มี build step) ฝั่งเซิร์ฟเวอร์เป็น Node.js (Express)
ฐานข้อมูลเป็น **SQL Server** ผ่าน driver `mssql` ซึ่งเป็น JavaScript ล้วน
จึง **ไม่ต้องติดตั้ง ODBC driver**

---

## 1. ติดตั้งและรัน

```bash
cd web
npm install

# ตั้งค่าการเชื่อมต่อ SQL Server (ดูหัวข้อ 2) — เลือกวิธีใดวิธีหนึ่ง
# วิธีที่ 1: คัดลอก .env.example เป็น .env แล้วแก้ค่าในไฟล์ (โหลดอัตโนมัติ)
copy .env.example .env

# วิธีที่ 2: ตั้งเป็น environment variable ของ session ปัจจุบัน
set MSSQL_SERVER=sqlsrv.company.local
set MSSQL_DATABASE=IS_Inventory
set MSSQL_USER=isadmin
set MSSQL_PASSWORD=ChangeMe#2026

npm run init-db     # สร้างตารางทั้งหมด + บัญชี admin แรก
npm run seed        # (ทางเลือก) ใส่ข้อมูลตัวอย่างทั้งระบบ
npm start           # http://127.0.0.1:8000
```

เข้าใช้งานครั้งแรก `admin / admin123` — **เปลี่ยนรหัสทันที** ที่ Administration › Users
ถ้ารัน `npm run seed` จะได้บัญชี `viewer / viewer123` (อ่านอย่างเดียว) มาด้วย

## 2. ตั้งค่า SQL Server

วิธีที่ง่ายที่สุด — ให้ `export-schema.js` generate สคริปต์ทั้งหมดให้
(สร้าง database + login + ตารางทั้ง 16 ตาราง ในไฟล์เดียว รันซ้ำได้อย่างปลอดภัย):

```bash
copy .env.example .env
# แก้ MSSQL_DATABASE / MSSQL_USER / MSSQL_PASSWORD ใน .env ตามต้องการ แล้ว
node export-schema.js
```

จะได้ `schema.sql` — เอาไปรันทั้งไฟล์ใน SSMS ด้วยบัญชีที่มีสิทธิ์ `sysadmin`
(หรือขั้นต่ำคือ `dbcreator` + `securityadmin`) ครั้งเดียวจบ

หรือจะสร้างเองด้วยมือก็ได้ (ปรับชื่อ database/login ตามต้องการ):

```sql
CREATE DATABASE IS_Inventory;
GO
USE IS_Inventory;
GO
CREATE LOGIN isadmin WITH PASSWORD = 'ChangeMe#2026';
CREATE USER  isadmin FOR LOGIN isadmin;
ALTER ROLE db_datareader ADD MEMBER isadmin;
ALTER ROLE db_datawriter ADD MEMBER isadmin;
ALTER ROLE db_ddladmin   ADD MEMBER isadmin;  -- ถอดออกได้หลังสร้าง schema
GO
```

(กรณีนี้ตารางยังต้องสร้างเอง — ดูย่อหน้าท้ายหัวข้อนี้)

เปิด TCP/IP ใน SQL Server Configuration Manager และเปิด port 1433 ใน firewall

ตัวแปรแวดล้อมที่ใช้:

| ตัวแปร | ค่าเริ่มต้น | หมายเหตุ |
|---|---|---|
| `MSSQL_SERVER` | localhost | ชื่อ/IP ของ SQL Server |
| `MSSQL_PORT` | 1433 | |
| `MSSQL_DATABASE` | IS_Inventory | |
| `MSSQL_USER` / `MSSQL_PASSWORD` | — | SQL Authentication |
| `MSSQL_TRUSTED` | — | `1` = Windows Authentication (NTLM) |
| `MSSQL_DOMAIN` | — | โดเมนสำหรับ NTLM |
| `MSSQL_ENCRYPT` | true | `false` เมื่อ SQL Server ไม่รองรับ TLS |
| `MSSQL_TRUST_CERT` | true | `false` เมื่อใช้ certificate ที่เชื่อถือได้จริง |
| `PORT` | 8000 | พอร์ตของเว็บ |
| `INVENTORY_HTTPS` | — | `1` เมื่ออยู่หลัง HTTPS reverse proxy |

ถ้าใช้ `schema.sql` สร้างตารางไปแล้ว (หรือ DBA ไม่ให้แอปสร้างตารางเอง /
ไม่ได้ให้สิทธิ์ `db_ddladmin`) ให้รัน `npm run init-db` อีกครั้งหลังจากนั้น
เพื่อสร้างบัญชี admin แรก (ข้ามตารางที่มีอยู่แล้วโดยอัตโนมัติ)

## 3. ใช้งานจริง

```bash
npm install --omit=dev
set NODE_ENV=production
node server.js
```

ตั้งเป็น Windows service ด้วย NSSM หรือ pm2 และวางหลัง IIS ARR / nginx
เมื่ออยู่หลัง HTTPS ให้ตั้ง `INVENTORY_HTTPS=1` เพื่อให้ cookie เป็น secure

มีสคริปต์ช่วยใน `deploy/` สำหรับ Windows Server:

```powershell
# ติดตั้งครั้งแรก (npm install, สร้าง .env, สร้าง schema + admin)
powershell -ExecutionPolicy Bypass -File deploy\setup.ps1

# ลงทะเบียนเป็น Windows service ด้วย NSSM (ต้องติดตั้ง NSSM ไว้ก่อนและรันแบบ Administrator)
powershell -ExecutionPolicy Bypass -File deploy\install-service.ps1
```

---

## โครงสร้างโค้ด

```
web/
  package.json        dependency: express, mssql, cookie-parser, multer
  entities.js       ★ นิยาม entity/ฟิลด์/คอลัมน์/ตัวกรอง/เมนู — แหล่งความจริงเดียว
  db.js               ชั้นฐานข้อมูล — DDL, CRUD, validation, history, audit, permission
  server.js           Express — JSON API ที่ generate จาก entities.js + auth/role
  seed.js             ข้อมูลตัวอย่างทั้งระบบ
  export-schema.js    generate schema.sql ไปรันใน SSMS
  public/
    index.html        โครงหน้าเว็บ (โหลด app.css + app.js)
    app.css           CSS ทั้งหมดของระบบ ไฟล์เดียว
    app.js            ตัวเรนเดอร์ทุกหน้าจอ (list/detail/form/dashboard/permission…)
```

**กฎข้อเดียวที่สำคัญที่สุด: เพิ่มฟิลด์ใหม่ให้แก้ที่ `entities.js` ที่เดียว**
แล้วรัน `npm run init-db` เพื่อเพิ่มคอลัมน์ (คำสั่ง `ALTER TABLE ADD` ให้อัตโนมัติ)
ฟอร์ม ตาราง ตัวกรอง ประวัติ และ CSV จะรับรู้เองทั้งหมด

```js
F("power_watt", "Power (W)", "int", "Physical", { placeholder: "e.g. 750" })
```

ชนิดฟิลด์: `text` `textarea` `select` `ref` `ip` `mac` `date` `int` `money` `bool`
ตัวเลือกอื่น: `required` `unique` `options` `ref` `refFilter` `onlyFor`
(ซ่อน/แสดงตามชนิดของ record เช่น Virtual vs Physical) `placeholder` `help`

---

## หน้าจอทั้งหมด

| กลุ่ม | หน้า |
|---|---|
| Overview | Dashboard |
| Server | Server hardware · Clusters (+ hosts) · Server list |
| Network | Network hardware · VLANs |
| Software | Software catalogue · License control |
| Permission Control | Permission dashboard · Access check · AD Users · Server Permission |
| Governance | Warranty & assets · Change history · Recycle bin |
| Reference | Locations & racks |
| Administration | Users (admin เท่านั้น) |

หน้า import AD/folder อยู่ที่ `#/permission/import` — **ไม่มีเมนูของตัวเอง**
เข้าจากปุ่ม **Import AD** ในหน้า AD Users เท่านั้น และเห็นเฉพาะ admin

## สิทธิ์การใช้งาน

- **admin** — เพิ่ม แก้ไข ลบ กู้คืน import และจัดการผู้ใช้ได้ทั้งหมด
- **viewer** — ดูและ export CSV ได้อย่างเดียว ปุ่ม Add/Edit/Delete/Import ถูกซ่อน

การบังคับสิทธิ์อยู่ที่ฝั่งเซิร์ฟเวอร์ (`adminOnly` ใน `server.js`) — viewer ที่ยิง
request ตรงจะได้ 403 และถูกบันทึกเป็น `denied` ใน audit log
**ห้ามเพิ่ม route ที่เขียนข้อมูลโดยไม่ใส่ `adminOnly`**

## กติกาข้อมูล

- **ลบ = soft delete เสมอ** (`is_deleted = 1`) กู้คืนได้จาก Recycle bin
  ทุก query มี `WHERE is_deleted = 0`
- **ทุกการแก้ไขเขียน 2 ที่** — `dbo.record_history` (snapshot + ฟิลด์ที่เปลี่ยน)
  และ `dbo.audit_log` (ใคร ทำอะไร เมื่อไหร่ จาก IP ไหน)
- **บังคับกรอก** เลขครุภัณฑ์ (`fixed_asset`) และวันหมดประกัน (`warranty_expiry`)
  ในทุก hardware
- id รันเลขอัตโนมัติต่อ entity — `HW-001` `SRV-001` `LIC-00001` `AD-00001`

## รูปแบบไฟล์ import

**AD export** — หนึ่งแถวต่อ user × group รับหัวคอลัมน์หลายแบบ:
`SamAccountName` / `UserLogon` / `Logon`, `DisplayName`, `GivenName` / `Name`,
`Surname` / `SN`, `Title` / `JobTitle`, `Department`, `Mail` / `EmailAddress`,
`Enabled` / `Status`, `GroupName` / `Group`

**Folder export** — `ServerName` (ต้องตรงกับ System name ของ server ที่ตั้ง
Server role = File Server), `FolderName`, `Path` / `UNC`, `Level`, `Department`,
`ReadWrite` / `Modify`, `ReadOnly` / `Read`, `Quota` / `QuotaGB`, `Owner`

รับทั้ง CSV และ TSV · แถวที่มีอยู่แล้วจะถูกอัปเดต ไม่สร้างซ้ำ

## ตารางในฐานข้อมูล

ระบบ: `dbo.users` `dbo.record_history` `dbo.audit_log` `dbo.settings`

ข้อมูล: `dbo.locations` `dbo.hardware` `dbo.clusters` `dbo.cluster_nodes`
`dbo.servers` `dbo.network_devices` `dbo.vlans` `dbo.software` `dbo.licenses`
`dbo.ad_users` `dbo.ad_memberships` `dbo.server_permissions`

## ยังไม่ได้ทำ

Excel (.xlsx) export · bulk edit/import · หน้า Rack elevation ·
ไฟล์แนบ (attachment) · e-mail alert เตือนประกันหมด
