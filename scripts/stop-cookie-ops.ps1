$ErrorActionPreference = "SilentlyContinue"

$api = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*apps\\api*src\\server.js*" }
$web = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*apps\\web*next*dev*" }

$api | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
$web | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Write-Output "Cookie Ops local dev services stopped."
