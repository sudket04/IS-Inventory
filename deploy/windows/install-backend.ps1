<#
  ติดตั้ง IS-Inventory Backend (ASP.NET Core, Self-Contained win-x64) เป็น IIS Site
  รันบน Windows Server ด้วยสิทธิ์ Administrator เท่านั้น — ดูขั้นตอนเต็มใน docs/DEPLOYMENT.md §3.2

  ก่อนรัน: ต้องแตก is-inventory-backend-win-x64.zip ไปที่ $SitePath แล้ว
  และต้องตั้ง Environment Variable ระดับ System (ConnectionStrings__IsInventoryDatabase, Jwt__Secret,
  Licensing__EncryptionKeyBase64, Cors__AllowedOrigins__0 ฯลฯ) ไว้ก่อนรัน Script นี้
#>

#Requires -RunAsAdministrator

$SiteName    = "IS-Inventory-API"
$AppPoolName = "IS-Inventory-API"
$SitePath    = "C:\IS-Inventory\backend"
$Port        = 5080

Import-Module WebAdministration -ErrorAction Stop

if (-not (Test-Path $SitePath)) {
    throw "ไม่พบโฟลเดอร์ $SitePath — แตก is-inventory-backend-win-x64.zip ไปวางก่อน"
}
if (-not (Test-Path (Join-Path $SitePath "IsInventory.Api.exe"))) {
    throw "ไม่พบ IsInventory.Api.exe ใน $SitePath — ตรวจว่าแตก zip ถูกโฟลเดอร์"
}

# --- Application Pool: No Managed Code เพราะ Backend เป็น Self-Contained รันเอง (ANCM แค่ Proxy) ---
if (Test-Path "IIS:\AppPools\$AppPoolName") {
    Write-Host "App Pool $AppPoolName มีอยู่แล้ว ข้ามการสร้าง"
} else {
    New-WebAppPool -Name $AppPoolName | Out-Null
    Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ""
    Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name startMode -Value "AlwaysRunning"
    Write-Host "สร้าง App Pool $AppPoolName แล้ว (No Managed Code, Always Running)"
}

# --- Site ---
if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
    Write-Host "Site $SiteName มีอยู่แล้ว ข้ามการสร้าง (ลบเองก่อนถ้าต้องการสร้างใหม่)"
} else {
    New-Website -Name $SiteName -PhysicalPath $SitePath -ApplicationPool $AppPoolName -Port $Port | Out-Null
    Write-Host "สร้าง Site $SiteName แล้ว ผูก Port $Port (Physical Path: $SitePath)"
}

Write-Host ""
Write-Host "เสร็จแล้ว — ทดสอบด้วย: Invoke-WebRequest http://localhost:$Port/api/auth/me (คาดว่าได้ 401 เพราะยังไม่ Login คือแปลว่า Backend ตอบสนองแล้ว)"
Write-Host "ถ้า Error 500.30 ให้เช็ค log ที่ $SitePath\logs\stdout*.log (ต้องสร้างโฟลเดอร์ logs เองถ้ายังไม่มี และเปิด stdoutLogEnabled ใน web.config ชั่วคราวตอน Debug)"

# --- ตั้งรหัสผ่านเริ่มต้นของบัญชี admin ---
# บัญชี admin ที่ seed มาจาก 02-schema-sqlserver.sql มี password_hash เป็นค่า placeholder
# ('$argon2id$REPLACE_ON_INSTALL') ที่ Login ไม่ได้จริง — ต้องรันขั้นตอนนี้ครั้งเดียวตอนติดตั้งใหม่
# เพื่อตั้งรหัสผ่านจริงด้วย Argon2id hash (สร้างผ่าน IsInventory.Api.exe เอง ไม่ใช่ Script ภายนอก)
# ตอบ Y เฉพาะตอนติดตั้งครั้งแรกเท่านั้น — ถ้ารัน Script นี้ซ้ำเพื่อแก้ App Pool/Site ทีหลัง ให้ตอบ N
# เพราะจะรีเซ็ตรหัสผ่านของ admin ที่ใช้งานอยู่จริงทับ (ระบบจะบังคับเปลี่ยนรหัสผ่านทันทีหลัง Login ครั้งแรก)
Write-Host ""
$doSeed = Read-Host "ตั้งรหัสผ่านเริ่มต้นของบัญชี admin ตอนนี้หรือไม่? (y/N)"
if ($doSeed -eq "y" -or $doSeed -eq "Y") {
    $policyOk = $false
    $matchOk = $false
    do {
        $securePwd = Read-Host "กำหนดรหัสผ่านเริ่มต้นสำหรับบัญชี admin (อย่างน้อย 8 ตัวอักษร มีทั้งตัวอักษรและตัวเลข)" -AsSecureString
        $secureConfirm = Read-Host "พิมพ์รหัสผ่านอีกครั้งเพื่อยืนยัน" -AsSecureString
        $plainPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePwd))
        $plainConfirm = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureConfirm))
        $policyOk = $plainPwd -cmatch '^(?=.*[A-Za-z])(?=.*\d).{8,}$'
        $matchOk = $plainPwd -eq $plainConfirm
        if (-not $policyOk) { Write-Warning "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรและตัวเลข" }
        elseif (-not $matchOk) { Write-Warning "รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณากรอกใหม่" }
    } while (-not ($policyOk -and $matchOk))

    # ConnectionStrings__IsInventoryDatabase ต้องเป็น System Environment Variable ที่ตั้งไว้แล้ว
    # (§3.2 ข้อ 2) — ถ้าเพิ่งตั้งในหน้าต่าง PowerShell เดียวกันนี้ ให้เปิด PowerShell ใหม่ก่อนรันส่วนนี้
    $env:ISINVENTORY_SEED_ADMIN_PASSWORD = $plainPwd
    Push-Location $SitePath
    try {
        & .\IsInventory.Api.exe seed-admin
        if ($LASTEXITCODE -ne 0) {
            throw "ตั้งรหัสผ่านเริ่มต้นไม่สำเร็จ (exit code $LASTEXITCODE) — ตรวจว่า ConnectionStrings__IsInventoryDatabase ตั้งไว้ถูกต้องและมองเห็นได้จาก PowerShell session นี้หรือยัง"
        } else {
            Write-Host "ตั้งรหัสผ่านเริ่มต้นของ admin สำเร็จ — ระบบจะบังคับให้เปลี่ยนรหัสผ่านทันทีที่ Login ครั้งแรก"
        }
    } finally {
        Pop-Location
        Remove-Item Env:\ISINVENTORY_SEED_ADMIN_PASSWORD -ErrorAction SilentlyContinue
        $plainPwd = $null
        $plainConfirm = $null
    }
} else {
    Write-Host "ข้ามขั้นตอนนี้ — ถ้ายังไม่เคยตั้งรหัสผ่าน admin ให้รัน: .\IsInventory.Api.exe seed-admin (ที่ $SitePath) พร้อมตั้ง Environment Variable ISINVENTORY_SEED_ADMIN_PASSWORD ก่อน"
}
