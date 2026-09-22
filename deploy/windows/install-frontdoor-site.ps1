<#
  สร้าง IIS Site หน้าบ้าน (Front-Door) ที่ผูก Hostname mcphomepage-mcp.co.th พอร์ต 80 (HTTP ชั่วคราว
  จนกว่าจะมี Cert — จะย้ายไป 443 ทีหลัง) และ Forward Path /is-inventory/* ไปยัง Site "IS Inventory"
  (พอร์ต 50002) ที่ติดตั้งไว้แล้วด้วย install-backend.ps1 + install-frontend-service.ps1 +
  reverse-proxy-web.config.xml — รันบน Windows Server ด้วยสิทธิ์ Administrator เท่านั้น
  ดูขั้นตอนเต็มใน docs/DEPLOYMENT.md §3.4

  ก่อนรัน:
    - ติดตั้ง URL Rewrite Module + Application Request Routing (ARR) แล้ว และเปิด "Enable proxy"
      ที่ระดับ Server ใน ARR (IIS Manager -> เครื่องบนสุด -> Application Request Routing Cache ->
      Server Proxy Settings) — ทำครั้งเดียวทั้งเครื่อง ใช้ร่วมกับ Site "IS Inventory" ได้เลย
    - ตรวจสอบก่อนว่าพอร์ต 80 ของเครื่องนี้ยังไม่มี Site อื่นผูก Hostname mcphomepage-mcp.co.th อยู่
      (ถ้ามีแล้ว อย่ารัน Script นี้ — ไปรวม Rule ใน frontdoor-web.config.xml เข้ากับ Site เดิมแทน)
#>

#Requires -RunAsAdministrator

$SiteName     = "mcphomepage-mcp-co-th"
$HostName     = "mcphomepage-mcp.co.th"
$Port         = 80
$SitePath     = "C:\IS-Inventory\frontdoor"
$ConfigSource = Join-Path $PSScriptRoot "frontdoor-web.config.xml"

Import-Module WebAdministration -ErrorAction Stop

if (-not (Test-Path $ConfigSource)) {
    throw "ไม่พบ $ConfigSource — ต้องอยู่โฟลเดอร์เดียวกับ Script นี้"
}

if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
    Write-Host "Site $SiteName มีอยู่แล้ว ข้ามการสร้าง (ลบเองก่อนถ้าต้องการสร้างใหม่)"
} else {
    $existingOnHost = Get-Website | Where-Object {
        $_.Bindings.Collection | Where-Object { $_.bindingInformation -like "*:${Port}:${HostName}" }
    }
    if ($existingOnHost) {
        $existingName = ($existingOnHost | Select-Object -First 1).Name
        throw "มี Site อื่นผูก ${HostName}:${Port} อยู่แล้ว ($existingName) — รวม Rule ใน frontdoor-web.config.xml เข้ากับ Site นั้นแทน อย่าสร้างซ้อน"
    }

    New-Item -ItemType Directory -Force -Path $SitePath | Out-Null
    Copy-Item $ConfigSource (Join-Path $SitePath "web.config") -Force

    New-Website -Name $SiteName -PhysicalPath $SitePath -Port $Port -HostHeader $HostName | Out-Null
    Write-Host "สร้าง Site $SiteName แล้ว ผูก http://${HostName}:${Port} (Physical Path: $SitePath)"
}

Write-Host ""
Write-Host "เสร็จแล้ว — ทดสอบด้วย (จากเครื่องอื่นในวง LAN ที่ resolve ${HostName} ไปที่เครื่องนี้ได้):"
Write-Host "  Invoke-WebRequest http://${HostName}/is-inventory/api/auth/me   (คาดว่าได้ 401 คือ Backend ตอบสนองแล้ว)"
Write-Host "  Invoke-WebRequest http://${HostName}/is-inventory/             (คาดว่าได้หน้า Login)"
Write-Host ""
Write-Host "ถ้า resolve ${HostName} ไม่ได้จากเครื่องอื่น ให้ทีม Network เพิ่ม DNS/Host Entry ชี้มาที่ IP ของเครื่องนี้ก่อน"
Write-Host "ในอนาคตเมื่อมี Cert: เปลี่ยน Binding Site นี้จากพอร์ต 80 (http) เป็น 443 (https) แล้วใส่ Cert — ไม่ต้องแก้ frontdoor-web.config.xml"
