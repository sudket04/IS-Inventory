# คู่มือ Deploy ขึ้น Server จริง (Windows Server + IIS)

## 0. Environment เฉพาะของชุดนี้ (Pilot บน mcphomepage-mcp.co.th)

การติดตั้งรอบนี้ทำบน Windows Server 2025 ที่เตรียมไว้แล้วดังนี้ — ส่วนที่เหลือของเอกสารนี้อ้างอิงค่า
เหล่านี้เป็นค่าจริง (ไม่ใช่ Placeholder อีกต่อไป):

| รายการ | ค่า |
|---|---|
| ที่เก็บไฟล์โปรเจกต์ | `D:\IS Admin\IS Inventory\` (`\backend\`, `\frontend\`) |
| SQL Server | 2025 — ติดตั้งไว้แล้ว (T-SQL/EF Core เข้ากันได้กับ 2022 ที่ทดสอบไว้ ไม่มีการเปลี่ยน Schema/Script) |
| IIS Site "IS Inventory" | พอร์ต 50002, **HTTP ชั่วคราว** (ยังไม่มี Cert — จะย้ายเป็น 443 + Cert ทีหลัง) — สร้างไว้แล้วนอกชุดนี้ |
| Node.js | ติดตั้งไว้แล้ว |
| URL สาธารณะ | `http://mcphomepage-mcp.co.th/is-inventory` — เครื่องนี้เป็นเจ้าของโดเมนโดยตรง (ไม่มี Gateway อื่นคั่นกลาง) |

**สถาปัตยกรรม 3 ชั้น** (ดูรายละเอียดที่ §3.4):

```
ผู้ใช้ → http://mcphomepage-mcp.co.th/is-inventory/...
       → [Front-Door Site: Hostname mcphomepage-mcp.co.th พอร์ต 80] (ใหม่ — install-frontdoor-site.ps1)
       → Forward path เต็ม (คง /is-inventory/ ไว้) →
       → [Site "IS Inventory" พอร์ต 50002] (มีอยู่แล้ว — วาง reverse-proxy-web.config.xml)
       → is-inventory/api/* → Backend (Site "IS-Inventory-API", 127.0.0.1:5080 เท่านั้น)
       → is-inventory/*     → Frontend (Windows Service "IS-Inventory-Frontend", 127.0.0.1:3000, Next basePath=/is-inventory)
```

Frontend Build มาด้วย `BASE_PATH=/is-inventory` และ `NEXT_PUBLIC_API_URL=http://mcphomepage-mcp.co.th/is-inventory`
ฝังตายตัว (ดู §3.3) — ถ้า Path หรือโดเมนเปลี่ยนต้อง Build ชุดใหม่เท่านั้น แก้ Environment Variable ตอน
Runtime ไม่มีผล

> อ้างอิงการตัดสินใจใน `docs/HANDOFF.md` §10.2 (Self-Contained Deployment, ห้ามพึ่ง Internet
> หลังติดตั้ง — NFR-15) และ §9 (Deploy = Windows Server + IIS, ไม่ใช้ Docker)
>
> เอกสารนี้คือ**ชุดติดตั้ง (Deployment Kit)** ที่สร้างไว้ล่วงหน้า — Build มาจาก branch
> `claude/zealous-hamilton-hn3ggp` แล้ว ไม่ต้อง `dotnet restore` / `npm install` บน Production
> Server อีก (ตัด Internet Dependency ตอน Deploy จริงออกไปเกือบหมด เหลือแค่การติดตั้ง
> Runtime/Role ของ Windows เอง)

สถานะ ณ วันที่เขียน (อัปเดตล่าสุด): **Sprint 0–5, 7 เสร็จครบ + งานนอก Sprint Plan: Server Domain v1.7
(Server Inventory/Server List — HANDOFF §4.18), รหัสผ่านเริ่มต้น/บังคับเปลี่ยนรหัสผ่าน (HANDOFF §4.19),
Self-protection + ระบบสิทธิ์รายเมนู Phase 1/2 (HANDOFF §4.20) และ Site/Team บังคับกรอกตอนสร้าง User
(HANDOFF §4.21)** — ยังไม่รวม Sprint 6 (Import/Notification), Sprint 8 (Collector Agent), Sprint 9
(Settings ที่เหลือ), Sprint 10 (Test/Security Review เต็มรูปแบบ) และยังไม่มี Audit Log สำหรับการถูก
บล็อกสิทธิ์ (ดูหมายเหตุใน HANDOFF §4.20) ดังนั้นชุดนี้เหมาะสำหรับ **ทดลองใช้งานจริงบน Server จริง
(Pilot/UAT)** ไม่ใช่ Go-Live เต็มรูปแบบ

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

Build จาก branch `claude/zealous-hamilton-hn3ggp` (commit ล่าสุดตอนสร้างชุดนี้: `70124b4` — รวม
Server Domain v1.7 §4.18 และรหัสผ่านเริ่มต้น/บังคับเปลี่ยน §4.19 แล้ว)

| ไฟล์ | เนื้อหา | คำสั่งที่ใช้สร้าง |
|---|---|---|
| `is-inventory-backend-win-x64.zip` | Backend Framework-Dependent (win-x64) + `web.config` (ตั้ง `AspNetCoreModuleV2` ให้แล้ว) — ต้องมี ASP.NET Core Hosting Bundle บน Server อยู่แล้ว (ข้อ 2 ใน §1 ซึ่งเป็น Prerequisite อยู่แล้วไม่ว่าจะ Self-Contained หรือไม่ เพราะ In-Process Hosting Model ต้องพึ่ง Shared Runtime ที่ Hosting Bundle ติดตั้งไว้) — เลือกแบบนี้เพราะไฟล์เล็กกว่า Self-Contained ~3 เท่า โดยไม่เพิ่ม Internet Dependency ใดๆ | `dotnet publish -c Release -r win-x64 --self-contained false` |
| `is-inventory-frontend-standalone.zip` | Frontend Next.js โหมด `output: standalone` (เฉพาะไฟล์ที่ต้องใช้จริง + `.next/static` + `public`) | `npm run build` (`next.config.ts` ตั้ง `output: "standalone"` แล้ว) |
| `deploy/windows/install-backend.ps1` | Script สร้าง IIS App Pool + Site ให้ Backend (ผูก 127.0.0.1:5080 เท่านั้น — internal-only) | — |
| `deploy/windows/install-frontend-service.ps1` | Script ผูก Frontend เป็น Windows Service ด้วย NSSM (127.0.0.1:3000) | — |
| `deploy/windows/reverse-proxy-web.config.xml` | web.config สำหรับ Site "IS Inventory" (พอร์ต 50002 ที่มีอยู่แล้ว) — proxy `is-inventory/api/*` → Backend (ตัด prefix), `is-inventory/*` ที่เหลือ → Frontend (คง prefix) | — |
| `deploy/windows/install-frontdoor-site.ps1` | Script สร้าง IIS Site ใหม่ผูก Hostname `mcphomepage-mcp.co.th` พอร์ต 80 | — |
| `deploy/windows/frontdoor-web.config.xml` | web.config ของ Front-Door Site — proxy `/is-inventory/*` → Site "IS Inventory" (พอร์ต 50002) โดยคง Path เต็มไว้ | — |

> Backend ไม่มี `appsettings.Production.json` แนบมา (ตั้งใจ) — Connection String / JWT Secret /
> License Key **ต้องตั้งผ่าน Environment Variable เท่านั้น** ตามที่ตัดสินใจไว้ใน NFR-07
> (ห้ามมี Secret อยู่ในไฟล์ที่ Build/Commit)

---

## 3. ขั้นตอนติดตั้ง

### 3.1 Database

1. รัน SQL Script **11 ไฟล์ตามลำดับนี้เท่านั้น** (เลขนำหน้าคือลำดับ ห้ามสลับ) บน SQL Server 2025:
   ```
   02-schema-sqlserver.sql
   04-vlan-module.sql
   06-module-v1.2.sql
   10-module-v1.3a-taxonomy.sql
   11-module-v1.3b-details-rack-ipam.sql
   12-module-v1.4-contracts-temporal.sql
   14-module-v1.5-permission-control.sql
   15-module-v1.6-server-applications.sql
   16-module-v1.7-server-domain.sql
   17-module-user-menu-permissions.sql
   18-module-user-site-team.sql
   ```
   ไฟล์ `16-module-v1.7-server-domain.sql` เพิ่มโครงสร้างของ Server Inventory (Hardware) / Server List
   (HANDOFF §4.18) — **ขาดไม่ได้** ถ้าจะใช้ 2 หน้านี้ ไม่งั้น Backend จะ Error ตอนเรียก API ที่เกี่ยวข้อง.
   ไฟล์ `17-module-user-menu-permissions.sql` เพิ่มระบบสิทธิ์รายเมนู (HANDOFF §4.20 — Self-protection
   + Permission Phase 1/2) และ `18-module-user-site-team.sql` เพิ่ม Site/Team บังคับกรอกตอนสร้าง User
   (HANDOFF §4.21) — **ขาดไม่ได้ทั้งคู่** ไม่งั้น Login/สร้าง User จะ Error ทันที เพราะ Backend เรียก
   ตารางเหล่านี้ตั้งแต่ `POST /api/auth/login` และ `POST /api/users`
   > ไฟล์ `18-module-user-site-team.sql` แก้โครงสร้าง Temporal Table (`dbo.users`) — ต้องรันเป็น Script
   > เดียวจบในครั้งเดียว (มี `SYSTEM_VERSIONING OFF`→แก้โครงสร้าง→`ON` อยู่ในตัวสคริปต์แล้ว) ห้ามรันแยกท่อน
2. สร้าง SQL Login/User สำหรับ App แยกจาก `sa` ให้สิทธิ์เฉพาะ Database นี้ (`db_datareader`,
   `db_datawriter`, `EXECUTE` และสิทธิ์สร้าง/แก้ Temporal Table history ตามที่ script อาจต้องใช้)
3. บัญชี `admin` ถูก Seed มาจาก `02-schema-sqlserver.sql` แล้วโดยอัตโนมัติ แต่ยัง **Login ไม่ได้จริง**
   (password_hash เป็นค่า placeholder) — ตั้งรหัสผ่านจริงที่ขั้นตอน §3.2 ข้อ 3 ด้านล่าง (ต้องรอให้
   Backend แตกไฟล์และตั้ง Environment Variable เสร็จก่อน เพราะใช้ `IsInventory.Api.exe` ตั้งค่าให้)

### 3.2 Backend

1. แตก `is-inventory-backend-win-x64.zip` ไปที่ `D:\IS Admin\IS Inventory\backend\`
2. ตั้ง **Environment Variable ระดับ System** (System Properties → Environment Variables) —
   ต้องตั้งก่อนสร้าง IIS App Pool เพื่อให้ Worker Process มองเห็น:

   | ชื่อ | ค่าสำหรับ Deploy นี้ | หมายเหตุ |
   |---|---|---|
   | `ASPNETCORE_ENVIRONMENT` | `Production` | |
   | `ConnectionStrings__IsInventoryDatabase` | `Server=...;Database=IS_Inventory;User Id=...;Password=...;TrustServerCertificate=True` | ชื่อ Database ตรงกับ `CREATE DATABASE IS_Inventory` ใน `02-schema-sqlserver.sql` — แก้ `Server=` ให้ตรง Instance ของ SQL Server 2025 บนเครื่องนี้ |
   | `Jwt__Secret` | (สุ่มด้วย `openssl rand -base64 48` หรือเทียบเท่าบน PowerShell) | อย่างน้อย 32 byte |
   | `Jwt__Issuer` / `Jwt__Audience` | `is-inventory-api` / `is-inventory-frontend` | ต้องตรงกับค่า Default ใน `appsettings.json` หรือเปลี่ยนพร้อมกันทั้งคู่ |
   | `Licensing__EncryptionKeyBase64` | สร้างด้วย `openssl rand -base64 32` | **ห้ามเปลี่ยนหลังมีข้อมูลจริงแล้ว** — จะถอดรหัส License Key เก่าไม่ได้ |
   | `Cors__AllowedOrigins__0` | `http://mcphomepage-mcp.co.th` | Frontend/Backend อยู่หลัง Host เดียวกันผ่าน Reverse Proxy (§3.4) จึงเป็น Same-Origin อยู่แล้ว — ตั้งค่านี้ไว้เป็น Fallback เผื่อเรียกตรง (เช่น ทดสอบผ่าน Site "IS Inventory" ที่ยังไม่ผ่าน Front-Door) |

3. รัน `deploy/windows/install-backend.ps1` (as Administrator) — แก้ตัวแปรด้านบนของ Script
   (`$SitePath`, `$Port`) ให้ตรงกับที่แตกไฟล์ไว้ก่อนรัน Script จะ:
   - สร้าง IIS Application Pool ชื่อ `IS-Inventory-API` (No Managed Code, Always Running)
   - สร้าง IIS Site ชื่อ `IS-Inventory-API` ผูกกับ Port ที่กำหนด (ค่าเริ่มต้น `5080`)
   - **ถามตอนท้าย**ว่าจะตั้งรหัสผ่านเริ่มต้นของบัญชี `admin` เลยหรือไม่ (`y` เฉพาะตอนติดตั้งครั้งแรก) —
     ถ้าตอบ `y` จะขอให้พิมพ์รหัสผ่าน (ซ่อนตัวอักษร, พิมพ์ยืนยันซ้ำ) แล้วเรียก
     `IsInventory.Api.exe seed-admin` ให้เอง (Hash ด้วย Argon2id จริงผ่านโค้ดตัวเดียวกับที่ Login ใช้ตรวจ
     ไม่ใช่ค่าที่ Script คำนวณเอง) — ระบบจะบังคับให้เปลี่ยนรหัสผ่านนี้ทันทีที่ Login ครั้งแรก (`must_change_password`)
     ตอบ `N` ได้ถ้ารัน Script ซ้ำแค่เพื่อแก้ App Pool/Site ทีหลัง (ตอบ `y` ซ้ำจะรีเซ็ตรหัสผ่าน admin ที่ใช้งานอยู่ทับ)
4. ทดสอบ: เปิด `http://localhost:5080/api/health` (หรือ endpoint ที่มีจริง) บนเครื่อง Server เอง

### 3.3 Frontend

1. แตก `is-inventory-frontend-standalone.zip` ไปที่ `D:\IS Admin\IS Inventory\frontend\`
   — ชุดนี้ Build มาด้วย `BASE_PATH=/is-inventory` และ
   `NEXT_PUBLIC_API_URL=http://mcphomepage-mcp.co.th/is-inventory` ฝังตายตัวแล้ว (ดูคำเตือนถัดไป)
2. รัน `deploy/windows/install-frontend-service.ps1` (as Administrator) — แก้ `$NssmPath`,
   `$NodeExePath` ให้ตรงเครื่องก่อนรัน (`$AppPath` ตั้งเป็น `D:\IS Admin\IS Inventory\frontend` ไว้แล้ว)
   Script จะ:
   - สร้าง Windows Service ชื่อ `IS-Inventory-Frontend` รัน `node.exe server.js`
   - ตั้ง Environment ของ Service: `PORT=3000`, `HOSTNAME=127.0.0.1`, `NODE_ENV=production`
     (ค่า `NEXT_PUBLIC_API_URL`/`BASE_PATH` **ไม่ใช่** Environment Variable ที่ตั้งตอนนี้ได้ — ดูคำเตือนถัดไป)
3. เริ่ม Service: `Start-Service IS-Inventory-Frontend`
4. ทดสอบ: เปิด `http://localhost:3000/is-inventory` บนเครื่อง Server เอง (มี `/is-inventory` ต่อท้าย
   เพราะ Build มาด้วย `basePath` — เปิด `http://localhost:3000` เฉยๆ จะได้ 404)

> ⚠️ **ข้อควรระวัง**: `NEXT_PUBLIC_API_URL` และ `BASE_PATH` ถูกฝัง (inline) เข้าไปใน JS Bundle
> **ตอน Build** (`npm run build`) ไม่ใช่ตอน Runtime — ชุดนี้ Build มาด้วย
> `NEXT_PUBLIC_API_URL=http://mcphomepage-mcp.co.th/is-inventory` และ `BASE_PATH=/is-inventory`
> ตรงกับ URL สาธารณะจริงของ Deploy นี้แล้ว ถ้า Domain/Path เปลี่ยนภายหลัง (เช่นย้ายไป Cert 443)
> **ต้อง Build ใหม่**ด้วยค่าจริงแล้วส่งชุดติดตั้งใหม่มาแทน — ตั้ง Environment Variable ตอน
> Run บน Server จะไม่มีผลอะไรกับค่านี้ ดู §5

### 3.4 IIS Reverse Proxy (2 ชั้น — Site "IS Inventory" ที่มีอยู่แล้ว + Front-Door ใหม่)

Deploy นี้มี IIS Site 3 ตัวรวมกัน (ดูแผนภาพที่ §0):

**ก) Site "IS Inventory" (พอร์ต 50002 — สร้างไว้แล้วนอกชุดนี้, HTTP ชั่วคราว)**
1. เปิด ARR ระดับ Server ครั้งเดียว (ถ้ายังไม่เปิด): IIS Manager → Server (เครื่องบนสุด) →
   Application Request Routing Cache → Server Proxy Settings → เช็ค "Enable proxy"
2. คัดลอก `deploy/windows/reverse-proxy-web.config.xml` ไปวางเป็น `web.config` ที่ Physical Path
   ของ Site "IS Inventory" (ทับของเดิมถ้ามี)
3. Rule ในไฟล์ทำ:
   - `is-inventory/api/*` → `http://127.0.0.1:5080/api/{R:1}` (Backend — ตัด prefix ออก)
   - `is-inventory/*` ที่เหลือ → `http://127.0.0.1:3000/is-inventory{R:1}` (Frontend — คง prefix ไว้)
4. Restart Site แล้วทดสอบบนเครื่อง Server เอง: `Invoke-WebRequest http://localhost:50002/is-inventory`

**ข) Front-Door Site ใหม่ (ผูก Hostname `mcphomepage-mcp.co.th` พอร์ต 80)**
1. รัน `deploy/windows/install-frontdoor-site.ps1` (as Administrator) — สร้าง Site ใหม่ผูก
   `mcphomepage-mcp.co.th:80` วาง `frontdoor-web.config.xml` ที่ Forward `/is-inventory/*` ไปยัง
   Site "IS Inventory" (พอร์ต 50002) โดยคง Path เต็มไว้
   > ถ้าเครื่องนี้มี Site อื่นผูก Hostname เดียวกันอยู่แล้ว Script จะหยุดและเตือน — ให้เอา Rule ใน
   > `frontdoor-web.config.xml` ไปรวมกับ Site เดิมแทน อย่าสร้าง Binding ซ้อน
2. ตรวจสอบ DNS/Host Entry: เครื่องอื่นในวง LAN ต้อง Resolve `mcphomepage-mcp.co.th` มาที่ IP ของ
   Server เครื่องนี้ได้ (ให้ทีม Network เพิ่มถ้ายังไม่มี)
3. ทดสอบจากเครื่องอื่น: เปิด `http://mcphomepage-mcp.co.th/is-inventory` — ต้องได้หน้า Login

**ในอนาคต (มี Cert แล้ว)**: เปลี่ยน Binding ของ Front-Door Site จากพอร์ต 80 (http) เป็น 443 (https)
แล้วใส่ Cert — ไม่ต้องแก้ Rule ใน `frontdoor-web.config.xml`/`reverse-proxy-web.config.xml`, แต่ต้อง
Build Frontend ใหม่ถ้า URL เปลี่ยนจาก `http://` เป็น `https://` (ดูคำเตือนใน §3.3)

### 3.5 ปิด Internet ถาวร

หลังทดสอบ Smoke Test (login, สร้าง Asset, ดู Dashboard, Export Excel) ผ่านหมดแล้ว:
- ตัดการเชื่อมต่อ Internet ของ Server (Firewall Outbound Rule หรือถอดสาย/ปิด NIC ทีม Network)
- ปิด Windows Update อัตโนมัติ (`services.msc` → Windows Update → Disabled หรือ Group Policy)
- **ไม่ต้อง** ปิด NuGet/npm restore เพิ่มเติม — ชุดนี้ไม่มี `dotnet restore`/`npm install`
  เกิดขึ้นบน Production Server อยู่แล้ว (Build มาสำเร็จรูปทั้งคู่)

---

## 4. Checklist หลังติดตั้ง

- [ ] เปิด `http://mcphomepage-mcp.co.th/is-inventory` จากเครื่องอื่นในวง LAN ได้ (ไม่ใช่แค่บนเครื่อง Server เอง)
- [ ] Login ด้วยรหัสผ่านเริ่มต้นที่ตั้งไว้ตอนติดตั้ง (§3.2 ข้อ 3) → ระบบบังคับให้เปลี่ยนรหัสผ่านทันที
      ก่อนเข้าหน้าอื่นได้ (พิมพ์ URL ตรงไปหน้าไหนก็ยังโดนหน้าบังคับสกัดอยู่) → เปลี่ยนสำเร็จแล้วเข้า
      Dashboard ได้ปกติ
- [ ] เห็น Dashboard มีตัวเลขจริง (ไม่ใช่ 0 ทั้งหมด ถ้ามี Seed Data)
- [ ] สร้าง Asset 1 ตัว → เห็นใน Audit Log
- [ ] สร้าง Server ผ่าน **Server Inventory (Hardware)** 1 เครื่อง (เลือก Asset Type → กรอก CPU/Memory/
      Storage แบบ Add ได้หลายรายการ) แล้วไป **Server List** กด Activate เครื่องนั้นด้วยข้อมูล Workload
      (OS/Environment/IP) — ยืนยันว่า Migration `16-module-v1.7-server-domain.sql` (§3.1) รันไปแล้วจริง
- [ ] Export Excel จากหน้า Reports เปิดไฟล์ที่ได้ด้วย Excel จริงได้ (ไม่ Corrupt)
- [ ] สร้าง File Share 1 รายการ → ผูก AD Group (กรอกมือ) → เห็นใน Permission History
- [ ] Restart Server ทั้งเครื่อง 1 ครั้ง → ทั้ง Backend (IIS, Start อัตโนมัติ) และ Frontend
      (`IS-Inventory-Frontend` Service, ตั้ง Startup Type = Automatic) กลับมาเองโดยไม่ต้องมีคนสั่งมือ
- [ ] ปิด Internet แล้วรีสตาร์ททั้งสอง Service/Site อีกครั้ง → ต้องยังทำงานได้ปกติ (ยืนยันว่า
      ไม่มีจุดไหนแอบพึ่ง Internet ตอน Runtime)
- [ ] Admin > Users → กด "New user" → บังคับเลือก Role/Site/Team ครบก่อน Submit ได้ (HANDOFF §4.21)
- [ ] Admin > Users → กดไอคอน Permissions ที่แถวผู้ใช้อื่น (ไม่ใช่ตัวเอง) → เปลี่ยน Override
      1 เมนูเป็น Allow/Deny → กลับไป Login ด้วยบัญชีนั้น → ปุ่ม Add/Edit/Delete ในเมนูนั้นเปลี่ยนตาม
      จริง (Permission Phase 2, HANDOFF §4.20)

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
