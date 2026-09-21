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
