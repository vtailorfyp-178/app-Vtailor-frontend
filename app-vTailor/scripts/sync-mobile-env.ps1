# Updates app-vTailor/.env with this PC's Wi-Fi IP (for Expo Go on phone).
param(
  [string]$LanIp
)

$ErrorActionPreference = "Stop"
$AppRoot = Split-Path $PSScriptRoot -Parent
$EnvFile = Join-Path $AppRoot ".env"

function Get-LanIpv4 {
  Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -match '^192\.168\.\d+\.\d+$' -and
      $_.PrefixOrigin -ne 'WellKnown' -and
      $_.InterfaceAlias -match 'Wi-?Fi|Wireless'
    } |
    Select-Object -First 1 -ExpandProperty IPAddress
}

if (-not $LanIp) {
  $LanIp = Get-LanIpv4
}
if (-not $LanIp) {
  $LanIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -match '^192\.168\.\d+\.\d+$' } |
    Select-Object -First 1 -ExpandProperty IPAddress)
}
if (-not $LanIp) {
  Write-Host "ERROR: Could not detect Wi-Fi IP. Run: ipconfig" -ForegroundColor Red
  exit 1
}

$apiUrl = "http://${LanIp}:8000/app/api/v1"
$modelsUrl = "http://${LanIp}:3001"

$content = @"
# Auto-synced for Expo Go - PC Wi-Fi IP: $LanIp
# Backend: cd ..\..\Folder ; .\start-api.ps1
EXPO_PUBLIC_API_BASE_URL=$apiUrl
EXPO_PUBLIC_MODELS_API_URL=$modelsUrl
EXPO_PUBLIC_USE_CLOUDINARY_MODELS=true
"@

Set-Content -Path $EnvFile -Value $content.TrimEnd() -Encoding UTF8

Write-Host "Updated $EnvFile" -ForegroundColor Green
Write-Host "  EXPO_PUBLIC_API_BASE_URL=$apiUrl"
Write-Host "  EXPO_PUBLIC_MODELS_API_URL=$modelsUrl"
Write-Host ""
Write-Host "Phone: same Wi-Fi, Expo Go app, scan QR after npm run start:mobile"
