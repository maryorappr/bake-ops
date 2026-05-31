$api = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*apps\\api*src\\server.js*" }
$web = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*apps\\web*next*dev*" }

"API running: $($api.Count -gt 0)"
"Web running: $($web.Count -gt 0)"

& tailscale serve status
