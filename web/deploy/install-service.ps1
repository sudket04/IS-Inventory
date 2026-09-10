<#
.SYNOPSIS
  Registers IT Inventory as a Windows service using NSSM, so it starts on
  boot and restarts if it crashes, instead of running in a console window.

.DESCRIPTION
  Requires NSSM (https://nssm.cc/) to already be installed and on PATH.
  Run this from an elevated (Administrator) PowerShell prompt.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File deploy\install-service.ps1
#>
param(
  [string]$ServiceName = "ITInventory",
  [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$appDir = Split-Path -Parent $PSScriptRoot

if (-not (Get-Command nssm -ErrorAction SilentlyContinue)) {
  Write-Error "nssm.exe not found on PATH. Download it from https://nssm.cc/ and add it to PATH first."
  exit 1
}
$node = (Get-Command node -ErrorAction Stop).Source

if (-not (Test-Path (Join-Path $appDir ".env"))) {
  Write-Error ".env not found in $appDir — run deploy\setup.ps1 first."
  exit 1
}

Write-Host "==> installing service '$ServiceName' -> node server.js (port $Port)"
nssm install $ServiceName $node "server.js"
nssm set $ServiceName AppDirectory $appDir
nssm set $ServiceName AppEnvironmentExtra "PORT=$Port" "NODE_ENV=production"
nssm set $ServiceName AppStdout (Join-Path $appDir "deploy\service.log")
nssm set $ServiceName AppStderr (Join-Path $appDir "deploy\service.log")
nssm set $ServiceName Start SERVICE_AUTO_START

Write-Host "==> starting service"
nssm start $ServiceName

Write-Host ""
Write-Host "Service '$ServiceName' installed and started."
Write-Host "Logs: $appDir\deploy\service.log"
Write-Host "Manage it with:  nssm restart $ServiceName / nssm stop $ServiceName / services.msc"
