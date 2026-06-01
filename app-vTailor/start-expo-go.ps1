# Expo Go on phone - interactive terminal (QR code needs real TTY, not Cursor background)
$ErrorActionPreference = "Stop"
$AppRoot = $PSScriptRoot

Write-Host "=== vTailor Expo Go ===" -ForegroundColor Cyan
& "$AppRoot\scripts\sync-mobile-env.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

function Get-LanIpv4 {
  Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -match '^192\.168\.\d+\.\d+$' -and
      $_.PrefixOrigin -ne 'WellKnown' -and
      $_.InterfaceAlias -match 'Wi-?Fi|Wireless'
    } |
    Select-Object -First 1 -ExpandProperty IPAddress
}

$lanIp = Get-LanIpv4
if (-not $lanIp) {
  $lanIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -match '^192\.168\.\d+\.\d+$' } |
    Select-Object -First 1 -ExpandProperty IPAddress)
}
if (-not $lanIp) { $lanIp = "192.168.100.46" }

$expUrl = "exp://${lanIp}:8081"

# Stop old Metro so a fresh QR session starts
Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

if (-not (Test-Path "$AppRoot\node_modules")) {
  Write-Host "Installing npm packages (first time)..."
  Set-Location $AppRoot
  npm install
}

Write-Host ""
Write-Host "Expo Go link (agar QR na dikhe, Expo Go mein manually paste karo):" -ForegroundColor Green
Write-Host "  $expUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "Browser dev tools (QR yahan bhi hota hai): http://localhost:8081" -ForegroundColor Cyan
Write-Host "Backend: cd ..\..\Folder ; .\start-api.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening NEW terminal window with Expo (wait for QR, 1-2 min)..." -ForegroundColor Green

$cmd = @"
cd /d "$AppRoot"
set CI=
set EXPO_NO_TELEMETRY=1
echo.
echo === Expo Go URL: $expUrl ===
echo === Browser: http://localhost:8081 ===
echo === Keys: r=reload  m=menu  ? = help ===
echo.
call npx expo start --clear --lan
pause
"@

$tempBat = Join-Path $env:TEMP "vtailor-expo-go.bat"
Set-Content -Path $tempBat -Value $cmd -Encoding ASCII
Start-Process cmd.exe -ArgumentList "/k", $tempBat

Start-Sleep -Seconds 3
Start-Process "http://localhost:8081"
