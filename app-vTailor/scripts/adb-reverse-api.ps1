# Maps phone localhost:8000 -> PC localhost:8000 (USB debugging). Then OTP can use 127.0.0.1 in .env.
$adb = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adb) {
  Write-Host "adb not found. Install Android platform-tools or use same Wi-Fi + start-api.ps1." -ForegroundColor Yellow
  exit 1
}
adb reverse tcp:8000 tcp:8000
if ($LASTEXITCODE -eq 0) {
  Write-Host "OK. Optional .env for USB only:"
  Write-Host "  EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/app/api/v1"
  Write-Host "Restart Expo (npx expo start -c) and try OTP again."
} else {
  Write-Host "adb reverse failed. Is the phone connected with USB debugging on?"
  exit 1
}
