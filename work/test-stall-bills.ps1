# Stall console + bills smoke test (admin token required on the running dev server)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = 'C:\Users\Administrator\Documents\Codex\2026-09-11\new-chat\outputs\yuanji-server'
$base = 'http://127.0.0.1:3300/api/v1'
$admin = @{ 'x-admin-token' = 'ops-test' }

$env:PORT = '3300'
$env:ADMIN_TOKEN = 'ops-test'
$env:DB_FILE = (Join-Path $root 'data\db-ops-test.json')
$env:LOG = 'off'
$proc = Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $PSScriptRoot 'ops-out.log') -RedirectStandardError (Join-Path $PSScriptRoot 'ops-err.log')
Start-Sleep -Seconds 3

try {
  Write-Host '=== 1) platform issues stall invite code ==='
  $invite = (Invoke-RestMethod -Uri "$base/admin/stalls/s1/invite" -Method POST -Headers $admin).data
  Write-Host ("  stall=" + $invite.stallName + " code=" + $invite.code)

  Write-Host '=== 2) buyer places & pays an order for that stall ==='
  $login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{ code = 'ops-' + (Get-Random); nick = 'Buyer' } | ConvertTo-Json)
  $bh = @{ Authorization = 'Bearer ' + $login.data.token }
  $null = Invoke-RestMethod -Uri "$base/user/cert" -Method POST -Headers $bh -ContentType 'application/json' -Body (@{ shop = 'OpsShop' } | ConvertTo-Json)
  $null = Invoke-RestMethod -Uri "$base/cart" -Method POST -Headers $bh -ContentType 'application/json' -Body (@{ goodsId = 'g1'; color = 'ivory'; size = 'M'; qty = 2 } | ConvertTo-Json)
  $order = (Invoke-RestMethod -Uri "$base/orders" -Method POST -Headers $bh -ContentType 'application/json' -Body (@{ remark = 'ops test' } | ConvertTo-Json)).data
  $oid = $order.orderId
  $null = Invoke-RestMethod -Uri "$base/orders/$oid/pay" -Method POST -Headers $bh
  Write-Host ("  order " + $oid + " payable=" + $order.orders[0].payable + " paid")

  Write-Host '=== 3) stall logs in with the code ==='
  $sl = (Invoke-RestMethod -Uri "$base/stall/login" -Method POST -ContentType 'application/json' -Body (@{ code = $invite.code } | ConvertTo-Json)).data
  $sh = @{ Authorization = 'Bearer ' + $sl.token }
  Write-Host ("  stall login ok: " + $sl.stall.name + " tokenLen=" + $sl.token.Length)

  $stats = (Invoke-RestMethod -Uri "$base/stall/stats" -Headers $sh).data
  Write-Host ("  stats: todayOrders=" + $stats.todayOrders + " todayAmount=" + $stats.todayAmount + " unship=" + $stats.unship + " settled=" + $stats.settledAmount)

  $orders = (Invoke-RestMethod -Uri "$base/stall/orders?status=unship" -Headers $sh).data
  Write-Host ("  unship orders: " + $orders.total + " first=" + $orders.list[0].id + " items=" + $orders.list[0].count)

  Write-Host '=== 4) stall ships the order ==='
  $ship = (Invoke-RestMethod -Uri "$base/stall/orders/$oid/ship" -Method POST -Headers $sh -ContentType 'application/json' -Body (@{ logistics = 'SF1234567890' } | ConvertTo-Json)).data
  Write-Host ("  shipped: " + $ship.orderId + " logistics=" + $ship.logistics)
  $after = (Invoke-RestMethod -Uri "$base/orders/$oid" -Headers $bh).data
  Write-Host ("  buyer sees order status=" + $after.status + " logistics=" + $after.logistics)
  if ($after.status -ne 'shipped') { throw 'ship failed' }

  Write-Host '=== 5) stall toggles a goods off-shelf ==='
  $toggle = (Invoke-RestMethod -Uri "$base/stall/goods/g1/toggle" -Method POST -Headers $sh -ContentType 'application/json' -Body (@{ off = $true } | ConvertTo-Json)).data
  Write-Host ("  g1 off=" + $toggle.off)
  $pub = (Invoke-RestMethod -Uri "$base/goods?market=sh" ).data
  $stillVisible = ($pub.list | Where-Object { $_.id -eq 'g1' }).Count
  Write-Host ("  buyer goods list still contains g1? " + $stillVisible)
  if ($stillVisible -ne 0) { throw 'off-shelf goods still visible' }
  $null = Invoke-RestMethod -Uri "$base/stall/goods/g1/toggle" -Method POST -Headers $sh -ContentType 'application/json' -Body (@{ off = $false } | ConvertTo-Json)

  Write-Host '=== 6) bills ==='
  $summary = (Invoke-RestMethod -Uri "$base/admin/bills/summary" -Headers $admin).data
  Write-Host ("  summary: date=" + $summary.date + " paid=" + $summary.paid.count + "/" + $summary.paid.amount + " settled=" + $summary.settle.settledCount + " platformFee=" + $summary.settle.platformFee + " hold=" + $summary.settle.holdAmount)
  $export = (Invoke-RestMethod -Uri "$base/admin/bills/export" -Headers $admin).data
  Write-Host ("  csv rows: " + ($export.csv -split "`n").Count + " file=" + (Split-Path $export.file -Leaf))
  $bill = (Invoke-RestMethod -Uri "$base/admin/bills/download" -Method POST -Headers $admin -ContentType 'application/json' -Body (@{ type = 'trade' } | ConvertTo-Json)).data
  Write-Host ("  wechat bill: " + $bill.mode + " " + $bill.message)
} finally {
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
  Remove-Item Env:PORT, Env:ADMIN_TOKEN, Env:DB_FILE, Env:LOG -ErrorAction SilentlyContinue
}
Write-Host 'STALL CONSOLE + BILLS TESTS PASSED'
