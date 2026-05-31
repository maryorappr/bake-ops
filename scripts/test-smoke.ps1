param(
  [string]$ApiBase = "http://127.0.0.1:4000",
  [string]$WebBase = "http://127.0.0.1:3000"
)

$ErrorActionPreference = "Stop"
$results = New-Object System.Collections.Generic.List[object]

function Add-Result($name, $ok, $details) {
  $results.Add([pscustomobject]@{
    Test = $name
    Status = if ($ok) { "PASS" } else { "FAIL" }
    Details = $details
  })
}

function Invoke-Json($method, $url, $body = $null) {
  if ($null -eq $body) {
    return Invoke-RestMethod -Method $method -Uri $url
  }

  return Invoke-RestMethod -Method $method -Uri $url -ContentType "application/json" -Body ($body | ConvertTo-Json -Compress)
}

try {
  $health = Invoke-Json GET "$ApiBase/api/health"
  Add-Result "API health" ($health.ok -and $health.db -eq "up") ("ok=$($health.ok), db=$($health.db)")
} catch { Add-Result "API health" $false $_.Exception.Message }

try {
  $orders = Invoke-Json GET "$ApiBase/api/orders"
  Add-Result "Orders endpoint" ($orders.Count -ge 1) ("count=$($orders.Count)")
} catch { Add-Result "Orders endpoint" $false $_.Exception.Message }

try {
  $order = Invoke-Json GET "$ApiBase/api/orders/ord_1"
  $orig = $order.status
  $updated = Invoke-Json PATCH "$ApiBase/api/orders/ord_1/status" @{ status = "prep" }
  $restored = Invoke-Json PATCH "$ApiBase/api/orders/ord_1/status" @{ status = $orig }
  Add-Result "Order status transition" ($updated.status -eq "prep" -and $restored.status -eq $orig) ("orig=$orig")
} catch { Add-Result "Order status transition" $false $_.Exception.Message }

try {
  $inv = Invoke-Json GET "$ApiBase/api/inventory/items"
  Add-Result "Inventory endpoint" ($inv.Count -ge 1) ("count=$($inv.Count)")
} catch { Add-Result "Inventory endpoint" $false $_.Exception.Message }

try {
  $recipes = Invoke-Json GET "$ApiBase/api/recipes"
  Add-Result "Recipes endpoint" ($recipes.Count -ge 1) ("count=$($recipes.Count)")
} catch { Add-Result "Recipes endpoint" $false $_.Exception.Message }

try {
  $check = Invoke-Json POST "$ApiBase/api/availability/check"
  Add-Result "Availability check" ($check.ok -and $check.checked -ge 1) ("checked=$($check.checked)")
} catch { Add-Result "Availability check" $false $_.Exception.Message }

try {
  $latest = Invoke-Json GET "$ApiBase/api/availability/latest"
  Add-Result "Availability latest" ($latest.Count -ge 1) ("count=$($latest.Count)")
} catch { Add-Result "Availability latest" $false $_.Exception.Message }

$routes = @("/", "/fulfillment", "/inventory", "/recipes", "/availability")
foreach ($route in $routes) {
  try {
    $resp = Invoke-WebRequest -Uri "$WebBase$route" -UseBasicParsing
    Add-Result "UI route $route" ($resp.StatusCode -eq 200) ("status=$($resp.StatusCode)")
  } catch {
    Add-Result "UI route $route" $false $_.Exception.Message
  }
}

$table = $results | Format-Table -AutoSize | Out-String -Width 220
Write-Output $table

$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
if ($failed -gt 0) {
  exit 1
}

exit 0
