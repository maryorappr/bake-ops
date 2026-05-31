$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$apiDir = Join-Path $root "apps\api"
$webDir = Join-Path $root "apps\web"

$apiRunning = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*apps\\api*src\\server.js*" }
if (-not $apiRunning) {
  Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList '/c', 'npm.cmd run dev' -WorkingDirectory $apiDir | Out-Null
}

$webRunning = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*apps\\web*next*dev*" }
if (-not $webRunning) {
  Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList '/c', 'npm.cmd run dev' -WorkingDirectory $webDir | Out-Null
}

Start-Sleep -Seconds 3
& tailscale serve --bg 3000 | Out-Null
& tailscale serve status
