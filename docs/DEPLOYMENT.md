# คู่มือ Deploy ขึ้น Server จริง (Windows Server + IIS)

> อ้างอิงการตัดสินใจใน `docs/HANDOFF.md` §10.2 (Self-Contained Deployment, ห้ามพึ่ง Internet
> หลังติดตั้ง — NFR-15) และ §9 (Deploy = Windows Server + IIS, ไม่ใช้ Docker)
>
> เอกสารนี้คือ**ชุดติดตั้ง (Deployment Kit)** ที่สร้างไว้ล่วงหน้า — Build มาจาก branch
> `claude/zealous-hamilton-hn3ggp` แล้ว ไม่ต้อง `dotnet restore` / `npm install` บน Production
> Server อีก (ตัด Internet Dependency ตอน Deploy จริงออกไปเกือบหมด เหลือแค่การติดตั้ง
> Runtime/Role ของ Windows เอง)

สถานะ ณ วันที่เขียน: **Sprint 0–5, 7 เสร็จครบ** — ยังไม่รวม Sprint 6 (Import/Notification),
Sprint 8 (Collector Agent), Sprint 9 (Settings ที่เหลือ), Sprint 10 (Test/Security Review เต็มรูปแบบ)
ดังนั้นชุดนี้เหมาะสำหรับ **ทดลองใช้งานจริงบน Server จริง (Pilot/UAT)** ไม่ใช่ Go-Live เต็มรูปแบบ

---

## 1. สิ่งที่ต้องเตรียมบน Windows Server (ทำตอนยังต่อ Internet อยู่)

| # | รายการ | เหตุผล |
|---|---|---|
| 1 | **Windows Server** 2019/2022 + IIS Role (`Web-Server`, `Web-Mgmt-Console`, `Web-Http-Redirect`) | Host หลัก |
| 2 | **ASP.NET Core Hosting Bundle** (.NET 8) — https://dotnet.microsoft.com/download/dotnet/8.0 | ติดตั้ง `AspNetCoreModuleV2` ให้ IIS reverse-proxy เข้า Kestrel ของ Backend (แม้ Backend เป็น Self-Contained ก็ยังต้องมีตัว Module นี้ในเครื่อง IIS) |
| 3 | **URL Rewrite Module** — https://www.iis.net/downloads/microsoft/url-rewrite | ทำ Reverse Proxy จาก IIS ไปหา Frontend (Node) |
| 4 | **Application Request Routing (ARR)** — https://www.iis.net/downloads/microsoft/application-request-routing | คู่กับ URL Rewrite สำหรับ Reverse Proxy |
| 5 | **Node.js 20 LTS (MSI)** — https://nodejs.org/ | รัน Frontend (`next start` แบบ standalone ต้องมี Node runtime) |
| 6 | **NSSM** (Non-Sucking Service Manager) — https://nssm.cc/download | ผูก `node.exe server.js` เป็น Windows Service (ไม่งั้น Node จะตายเมื่อ Logoff/Reboot) |
| 7 | **SQL Server** พร้อม Database เปล่า + Login สำหรับ App (ตาม Phase 0 Pre-Flight เดิม) | ฐานข้อมูล |
| 8 | ใบรับรอง TLS (Internal CA หรือของจริง) ถ้าจะเปิด HTTPS | ความปลอดภัย (แนะนำอย่างยิ่งเพราะมี JWT + License Key) |

ดาวน์โหลดทั้งหมดนี้ไว้ **ในหน้าต่างติดตั้งเดียว** ตามแผน NFR-15 แล้วค่อยตัด Internet ถาวร

---

## 2. ไฟล์ในชุดติดตั้ง

Build จาก branch `claude/zealous-hamilton-hn3ggp` (commit ล่าสุดตอนสร้างชุดนี้: หลัง `8321fb9`)

| ไฟล์ | เนื้อหา | คำสั่งที่ใช้สร้าง |
|---|---|---|
| `kknd-backend-win-x64.zip` | Backend Self-Contained (.NET Runtime ฝังในตัว ไม่ต้องลง .NET แยก) + `web.config` (ตั้ง `AspNetCoreModuleV2` ให้แล้ว) | `dotnet publish -c Release -r win-x64 --self-contained true` |
| `kknd-frontend-standalone.zip` | Frontend Next.js โหมด `output: standalone` (เฉพาะไฟล์ที่ต้องใช้จริง + `.next/static` + `public`) | `npm run build` (`next.config.ts` ตั้ง `output: "standalone"` แล้ว) |
| `deploy/windows/install-backend.ps1` | Script สร้าง IIS App Pool + Site ให้ Backend | — |
| `deploy/windows/install-frontend-service.ps1` | Script ผูก Frontend เป็น Windows Service ด้วย NSSM | — |
| `deploy/windows/reverse-proxy-web.config.xml` | ตัวอย่าง URL Rewrite Rule สำหรับ IIS Site หน้าบ้าน (proxy `/api/*` → Backend, ที่เหลือ → Frontend) | — |

> Backend ไม่มี `appsettings.Production.json` แนบมา (ตั้งใจ) — Connection String / JWT Secret /
> License Key **ต้องตั้งผ่าน Environment Variable เท่านั้น** ตามที่ตัดสินใจไว้ใน NFR-07
> (ห้ามมี Secret อยู่ในไฟล์ที่ Build/Commit)

---

## 3. ขั้นตอนติดตั้ง

### 3.1 Database

1. รัน SQL Script **8 ไฟล์ตามลำดับนี้เท่านั้น** (เลขนำหน้าคือลำดับ ห้ามสลับ) บน SQL Server จริง:
   ```
   02-schema-sqlserver.sql
   04-vlan-module.sql
   06-module-v1.2.sql
   10-module-v1.3a-taxonomy.sql
   11-module-v1.3b-details-rack-ipam.sql
   12-module-v1.4-contracts-temporal.sql
   14-module-v1.5-permission-control.sql
   15-module-v1.6-server-applications.sql
   ```
2. สร้าง SQL Login/User สำหรับ App แยกจาก `sa` ให้สิทธิ์เฉพาะ Database นี้ (`db_datareader`,
   `db_datawriter`, `EXECUTE` และสิทธิ์สร้าง/แก้ Temporal Table history ตามที่ script อาจต้องใช้)
3. สร้าง Admin User เริ่มต้น 1 คนตามขั้นตอนใน `docs/database/01-database-design.md` /
   HANDOFF §4.1 (ถ้ายังไม่เคย Seed)

### 3.2 Backend

1. แตก `kknd-backend-win-x64.zip` ไปที่ เช่น `C:\KKND\backend\`
2. ตั้ง **Environment Variable ระดับ System** (System Properties → Environment Variables) —
   ต้องตั้งก่อนสร้าง IIS App Pool เพื่อให้ Worker Process มองเห็น:

   | ชื่อ | ตัวอย่างค่า | หมายเหตุ |
   |---|---|---|
   | `ASPNETCORE_ENVIRONMENT` | `Production` | |
   | `ConnectionStrings__KkndDatabase` | `Server=...;Database=KKND;User Id=...;Password=...;TrustServerCertificate=True` | |
   | `Jwt__Secret` | (สุ่มด้วย `openssl rand -base64 48` หรือเทียบเท่าบน PowerShell) | อย่างน้อย 32 byte |
   | `Jwt__Issuer` / `Jwt__Audience` | `kknd-api` / `kknd-frontend` | ต้องตรงกับค่า Default ใน `appsettings.json` หรือเปลี่ยนพร้อมกันทั้งคู่ |
   | `Licensing__EncryptionKeyBase64` | สร้างด้วย `openssl rand -base64 32` | **ห้ามเปลี่ยนหลังมีข้อมูลจริงแล้ว** — จะถอดรหัส License Key เก่าไม่ได้ |
   | `Cors__AllowedOrigins__0` | `https://kknd.yourdomain.local` | ต้องตรงกับ Origin ที่ผู้ใช้เปิด Frontend จริง |

3. รัน `deploy/windows/install-backend.ps1` (as Administrator) — แก้ตัวแปรด้านบนของ Script
   (`$SitePath`, `$Port`) ให้ตรงกับที่แตกไฟล์ไว้ก่อนรัน Script จะ:
   - สร้าง IIS Application Pool ชื่อ `KKND-API` (No Managed Code, Always Running)
   - สร้าง IIS Site ชื่อ `KKND-API` ผูกกับ Port ที่กำหนด (ค่าเริ่มต้น `5080`)
4. ทดสอบ: เปิด `http://localhost:5080/api/health` (หรือ endpoint ที่มีจริง) บนเครื่อง Server เอง

### 3.3 Frontend

1. แตก `kknd-frontend-standalone.zip` ไปที่ เช่น `C:\KKND\frontend\`
2. รัน `deploy/windows/install-frontend-service.ps1` (as Administrator) — แก้ `$NssmPath`,
   `$AppPath`, `$NodeExePath` ให้ตรงเครื่องก่อนรัน Script จะ:
   - สร้าง Windows Service ชื่อ `KKND-Frontend` รัน `node.exe server.js`
   - ตั้ง Environment ของ Service: `PORT=3000`, `HOSTNAME=127.0.0.1`, `NODE_ENV=production`
     (ค่า `NEXT_PUBLIC_API_URL` **ไม่ใช่** Environment Variable ที่ตั้งตอนนี้ได้ — ดูคำเตือนถัดไป)
3. เริ่ม Service: `Start-Service KKND-Frontend`
4. ทดสอบ: เปิด `http://localhost:3000` บนเครื่อง Server เอง

> ⚠️ **ข้อควรระวัง**: `NEXT_PUBLIC_API_URL` ถูกฝัง (inline) เข้าไปใน JS Bundle **ตอน Build**
> (`npm run build`) ไม่ใช่ตอน Runtime — ชุดนี้ Build มาด้วยค่า Default `http://localhost:5080`
> (ค่าจาก `frontend/.env.local` ตอน Build ในชุดนี้) ถ้า Domain/Port ของ Backend จริงต่างจากนี้
> (เช่นใช้ Reverse Proxy ตาม §3.4 ที่ URL จริงคือ `https://kknd.yourdomain.local/api`)
> **ต้อง Build ใหม่**ด้วยค่าจริงแล้วส่งชุดติดตั้งใหม่มาแทน — ตั้ง Environment Variable ตอน
> Run บน Server จะไม่มีผลอะไรกับค่านี้ ดู §5

### 3.4 IIS Reverse Proxy (รวม Backend + Frontend ไว้หลัง Domain เดียว)

ใช้ `deploy/windows/reverse-proxy-web.config.xml` เป็นต้นแบบ:
1. สร้าง IIS Site ใหม่ชื่อ `KKND` ผูก Binding `https://kknd.yourdomain.local` (Port 443, ใส่ Cert)
   — Physical Path ชี้ไปโฟลเดอร์เปล่าที่มีแค่ `web.config` (คัดลอกไฟล์ตัวอย่างไปวาง)
2. เปิด ARR ระดับ Server: IIS Manager → Server (เครื่องบนสุด) → Application Request Routing
   Cache → Server Proxy Settings → เช็ค "Enable proxy"
3. Rule ในไฟล์ตัวอย่างทำ:
   - `/api/*` → `http://127.0.0.1:5080/api/{R:1}` (Backend)
   - ที่เหลือทั้งหมด → `http://127.0.0.1:3000/{R:0}` (Frontend)
4. Restart Site แล้วเปิด `https://kknd.yourdomain.local` จากเครื่องอื่นในวง LAN ทดสอบ

### 3.5 ปิด Internet ถาวร

หลังทดสอบ Smoke Test (login, สร้าง Asset, ดู Dashboard, Export Excel) ผ่านหมดแล้ว:
- ตัดการเชื่อมต่อ Internet ของ Server (Firewall Outbound Rule หรือถอดสาย/ปิด NIC ทีม Network)
- ปิด Windows Update อัตโนมัติ (`services.msc` → Windows Update → Disabled หรือ Group Policy)
- **ไม่ต้อง** ปิด NuGet/npm restore เพิ่มเติม — ชุดนี้ไม่มี `dotnet restore`/`npm install`
  เกิดขึ้นบน Production Server อยู่แล้ว (Build มาสำเร็จรูปทั้งคู่)

---

## 4. Checklist หลังติดตั้ง

- [ ] Login ด้วย Admin User ได้ → เห็น Dashboard มีตัวเลขจริง (ไม่ใช่ 0 ทั้งหมด ถ้ามี Seed Data)
- [ ] สร้าง Asset 1 ตัว → เห็นใน Audit Log
- [ ] Export Excel จากหน้า Reports เปิดไฟล์ที่ได้ด้วย Excel จริงได้ (ไม่ Corrupt)
- [ ] สร้าง File Share 1 รายการ → ผูก AD Group (กรอกมือ) → เห็นใน Permission History
- [ ] Restart Server ทั้งเครื่อง 1 ครั้ง → ทั้ง Backend (IIS, Start อัตโนมัติ) และ Frontend
      (`KKND-Frontend` Service, ตั้ง Startup Type = Automatic) กลับมาเองโดยไม่ต้องมีคนสั่งมือ
- [ ] ปิด Internet แล้วรีสตาร์ททั้งสอง Service/Site อีกครั้ง → ต้องยังทำงานได้ปกติ (ยืนยันว่า
      ไม่มีจุดไหนแอบพึ่ง Internet ตอน Runtime)

---

## 5. ข้อจำกัดของชุดนี้ (ยังไม่ใช่ Go-Live เต็มรูปแบบ)

ชุดติดตั้งนี้ครอบคลุม Sprint 0–5, 7 เท่านั้น ตาม `docs/ROADMAP.md` §2 สิ่งที่ **ยังไม่มี**:

| ที่ยังไม่มี | จะมาใน Sprint |
|---|---|
| Import Excel / Notification (Email+In-app) | Sprint 6 |
| Collector Agent (Sync AD Group จริง + FSRM Quota อัตโนมัติ) — ตอนนี้ AD Group ต้องกรอกมือทั้งหมด | Sprint 8 |
| Administration Settings ที่เหลือ (Locations UI ครบ/System Settings อื่นๆ) | Sprint 9 |
| Integration Test เต็มรูปแบบ, Performance Test (2,000+ รายการ), Security Review ทางการ, คู่มือผู้ใช้ | Sprint 10 |

ถ้าต้องการ Rebuild ชุดติดตั้งหลังแก้โค้ดเพิ่ม (เช่น ต้องเปลี่ยน `NEXT_PUBLIC_API_BASE_URL` ให้
ตรงกับ Domain จริงตาม §3.3 ด้านบน) แจ้งให้สร้างชุดใหม่ได้ทันที — ไม่ต้องทำเองบน Production Server
