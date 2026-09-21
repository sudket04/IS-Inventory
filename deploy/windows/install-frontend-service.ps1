<#
  ติดตั้ง IS-Inventory Frontend (Next.js standalone) เป็น Windows Service ด้วย NSSM
  รันบน Windows Server ด้วยสิทธิ์ Administrator เท่านั้น — ดูขั้นตอนเต็มใน docs/DEPLOYMENT.md §3.3

  ก่อนรัน:
    - แตก is-inventory-frontend-standalone.zip ไปที่ $AppPath แล้ว
    - ติดตั้ง Node.js 20 LTS แล้ว (node.exe อยู่ใน PATH หรือระบุ Path เต็มที่ $NodeExePath)
    - ดาวน์โหลด NSSM แล้วแตกไฟล์ไว้ที่ $NssmPath
#>

#Requires -RunAsAdministrator

$ServiceName = "IS-Inventory-Frontend"
$AppPath     = "C:\IS-Inventory\frontend"
$NodeExePath = "C:\Program Files\nodejs\node.exe"
$NssmPath    = "C:\Tools\nssm\win64\nssm.exe"
$Port        = 3000

if (-not (Test-Path $NssmPath)) {
    throw "ไม่พบ nssm.exe ที่ $NssmPath — ดาวน์โหลดจาก https://nssm.cc/download ก่อน"
}
if (-not (Test-Path (Join-Path $AppPath "server.js"))) {
    throw "ไม่พบ server.js ใน $AppPath — ตรวจว่าแตก is-inventory-frontend-standalone.zip ถูกโฟลเดอร์"
}
if (-not (Test-Path $NodeExePath)) {
    throw "ไม่พบ node.exe ที่ $NodeExePath — ติดตั้ง Node.js 20 LTS ก่อน หรือแก้ Path ใน Script นี้"
}

if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    Write-Host "Service $ServiceName มีอยู่แล้ว — ลบก่อนถ้าต้องการติดตั้งใหม่: & '$NssmPath' remove $ServiceName confirm"
    exit 1
}

& $NssmPath install $ServiceName $NodeExePath "server.js"
& $NssmPath set $ServiceName AppDirectory $AppPath
& $NssmPath set $ServiceName AppEnvironmentExtra "PORT=$Port" "HOSTNAME=127.0.0.1" "NODE_ENV=production"
& $NssmPath set $ServiceName Start SERVICE_AUTO_START
& $NssmPath set $ServiceName AppStdout "$AppPath\logs\stdout.log"
& $NssmPath set $ServiceName AppStderr "$AppPath\logs\stderr.log"
& $NssmPath set $ServiceName AppRotateFiles 1

New-Item -ItemType Directory -Force -Path "$AppPath\logs" | Out-Null

Write-Host "ติดตั้ง Service $ServiceName แล้ว — เริ่มด้วย: Start-Service $ServiceName"
Write-Host "ทดสอบหลังเริ่ม: Invoke-WebRequest http://localhost:$Port (ต้องได้หน้า Login กลับมา)"
Write-Host ""
Write-Host "คำเตือน: NEXT_PUBLIC_API_URL ถูกฝังใน Bundle ตอน Build แล้ว — Environment Variable ที่ Service"
Write-Host "นี้ไม่มีผลกับค่านั้น ถ้าต้องเปลี่ยน URL ของ Backend ต้อง Build ชุดติดตั้งใหม่ (ดู docs/DEPLOYMENT.md §3.3/§5)"
