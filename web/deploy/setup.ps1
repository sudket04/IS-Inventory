<#
.SYNOPSIS
  First-time setup for IT Inventory on Windows Server: install dependencies,
  create .env from the template, create the SQL Server schema, sign-in
  account, and (optionally) demo data.

.EXAMPLE
  cd C:\inetpub\it-inventory\web
  powershell -ExecutionPolicy Bypass -File deploy\setup.ps1

.EXAMPLE
  # also load the sample IT estate
  powershell -ExecutionPolicy Bypass -File deploy\setup.ps1 -Seed
#>
param(
  [switch]$Seed
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

function Require-Command($name, $hint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Write-Error "$name was not found on PATH. $hint"
    exit 1
  }
}

Require-Command "node" "Install Node.js 18+ from https://nodejs.org/ first."
Require-Command "npm"  "Node.js install should have included npm."

Write-Host "==> node $(node -v) / npm $(npm -v)"

Write-Host "==> npm install --omit=dev"
npm install --omit=dev
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

if (-not (Test-Path ".env")) {
  Write-Host "==> creating .env from .env.example — edit it with your SQL Server details"
  Copy-Item ".env.example" ".env"
  Write-Warning "Edit .env now (MSSQL_SERVER / MSSQL_DATABASE / MSSQL_USER / MSSQL_PASSWORD), then re-run this script."
  exit 0
}

Write-Host "==> npm run init-db (creates tables + first admin account)"
npm run init-db
if ($LASTEXITCODE -ne 0) { throw "init-db failed — check the SQL Server connection settings in .env" }

if ($Seed) {
  Write-Host "==> npm run seed (sample data)"
  npm run seed
}

Write-Host ""
Write-Host "Setup done. Start the site with:  npm start"
Write-Host "First sign-in: admin / admin123 — change it right away under Administration > Users"
Write-Host "To run this as a Windows service, see deploy\install-service.ps1"
