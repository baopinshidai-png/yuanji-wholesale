# Aftersales flow: buyer submits -> stall agrees (refund + sharing return) / platform arbitrates
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = 'C:\Users\Administrator\Documents\Codex\2026-09-11\new-chat\outputs\yuanji-server'
$base = 'http://127.0.0.1:3600/api/v1'
$admin = @{ 'x-admin-token' = 'as-test' }

$env:PORT = '3600'
$env:ADMIN_TOKEN = 'as-test'
$env:DB_FILE = (Join-Path $root 'data\db-aftersale-test.json')
$env:AFTERSALE_ESCALATE_HOURS = '0'
$env:SWEEP_INTERVAL_SEC = '1'
$env:LOG = 'off'
$proc = Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $PSScriptRoot 'as-out.log') -RedirectStandardError (Join-Path $PSScriptRoot 'as-err.log')
Start-Sleep -Seconds 3

function New-PaidOrder($base, $admin) {
  $invite = (Invoke-RestMethod -Uri "$base/admin/stalls/s1/invite" -Method POST -Headers $admin).data
  $login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{ code = 'as-' + (Get-Random); nick = 'Buyer' } | ConvertTo-Json)
  $bh = @{ Authorization = 'Bearer ' + $login.data.token }
  $null = Invoke-RestMethod -Uri "$base/user/cert" -Method POST -Headers $bh -ContentType 'application/json' -Body (@{ shop = 'ASShop' } | ConvertTo-Json)
  $null = Invoke-RestMethod -Uri "$base/cart" -Method POST -Headers $bh -ContentType 'application/json' -Body (@{ goodsId = 'g1'; color = 'ivory'; size = 'M'; qty = 1 } | ConvertTo-Json)
  $order = (Invoke-RestMethod -Uri "$base/orders" -Method POST -Headers $bh -ContentType 'application/json' -Body (@{ remark = 'aftersale test' } | ConvertTo-Json)).data
  $null = Invoke-RestMethod -Uri "$base/orders/$($order.orderId)/pay" -Method POST -Headers $bh
  return @{ buyer = $bh; orderId = $order.orderId; invite = $invite.code; payable = $order.orders[0].payable }
}

try {
  Write-Host '=== 1) buyer submits aftersale, stall agrees -> refunded ==='
  $a = New-PaidOrder $base $admin
  Write-Host ("  order " + $a.orderId + " payable=" + $a.payable + " paid")
  $t = (Invoke-RestMethod -Uri "$base/aftersales" -Method POST -Headers $a.buyer -ContentType 'application/json' -Body (@{ orderId = $a.orderId; type = 'quality'; reason = 'sleeve defect'; amount = 0 } | ConvertTo-Json)).data
  Write-Host ("  ticket " + $t.ticket.id + " status=" + $t.ticket.status + " amount=" + $t.ticket.amount)

  $sl = (Invoke-RestMethod -Uri "$base/stall/login" -Method POST -ContentType 'application/json' -Body (@{ code = $a.invite } | ConvertTo-Json)).data
  $sh = @{ Authorization = 'Bearer ' + $sl.token }
  $list = (Invoke-RestMethod -Uri "$base/stall/aftersales" -Headers $sh).data
  Write-Host ("  stall sees " + $list.total + " ticket(s)")
  $h = (Invoke-RestMethod -Uri "$base/stall/aftersales/$($t.ticket.id)/handle" -Method POST -Headers $sh -ContentType 'application/json' -Body (@{ agree = $true } | ConvertTo-Json)).data
  Write-Host ("  stall agree -> ticket=" + $h.ticket.status + " tip=" + $h.tip)
  $order = (Invoke-RestMethod -Uri "$base/orders/$($a.orderId)" -Headers $a.buyer).data
  Write-Host ("  order status now=" + $order.status + " refund=" + $order.refund.status)
  if ($order.status -ne 'refunded') { throw 'stall agree did not refund' }

  Write-Host '=== 2) buyer submits another, stall refuses -> platform arbitrates ==='
  $b = New-PaidOrder $base $admin
  $t2 = (Invoke-RestMethod -Uri "$base/aftersales" -Method POST -Headers $b.buyer -ContentType 'application/json' -Body (@{ orderId = $b.orderId; type = 'refund-only'; reason = 'not as described' } | ConvertTo-Json)).data
  $sl2 = (Invoke-RestMethod -Uri "$base/stall/login" -Method POST -ContentType 'application/json' -Body (@{ code = $b.invite } | ConvertTo-Json)).data
  $sh2 = @{ Authorization = 'Bearer ' + $sl2.token }
  $h2 = (Invoke-RestMethod -Uri "$base/stall/aftersales/$($t2.ticket.id)/handle" -Method POST -Headers $sh2 -ContentType 'application/json' -Body (@{ agree = $false; note = 'no evidence' } | ConvertTo-Json)).data
  Write-Host ("  stall refuse -> ticket=" + $h2.ticket.status)

  $pending = (Invoke-RestMethod -Uri "$base/admin/aftersales?status=all" -Headers $admin).data
  Write-Host ("  platform sees " + $pending.total + " ticket(s)")
  $arb = (Invoke-RestMethod -Uri "$base/admin/aftersales/$($t2.ticket.id)/arbitrate" -Method POST -Headers $admin -ContentType 'application/json' -Body (@{ approve = $true; note = 'buyer evidence ok' } | ConvertTo-Json)).data
  Write-Host ("  arbitrate -> ticket=" + $arb.ticket.status + " tip=" + $arb.tip)
  $order2 = (Invoke-RestMethod -Uri "$base/orders/$($b.orderId)" -Headers $b.buyer).data
  Write-Host ("  order2 status=" + $order2.status)
  if ($order2.status -ne 'refunded') { throw 'arbitration did not refund' }

  Write-Host '=== 3) buyer aftersale list ==='
  $mine = (Invoke-RestMethod -Uri "$base/aftersales" -Headers $b.buyer).data
  Write-Host ("  buyer tickets: " + $mine.total)

  Write-Host '=== 4) return-and-refund flow (return type) ==='
  $c = New-PaidOrder $base $admin
  $t3 = (Invoke-RestMethod -Uri "$base/aftersales" -Method POST -Headers $c.buyer -ContentType 'application/json' -Body (@{ orderId = $c.orderId; type = 'return-refund'; reason = 'wrong size'; images = @('http://127.0.0.1:3600/uploads/demo.png') } | ConvertTo-Json -Depth 5)).data
  $sl3 = (Invoke-RestMethod -Uri "$base/stall/login" -Method POST -ContentType 'application/json' -Body (@{ code = $c.invite } | ConvertTo-Json)).data
  $sh3 = @{ Authorization = 'Bearer ' + $sl3.token }
  $null = Invoke-RestMethod -Uri "$base/stall/aftersales/$($t3.ticket.id)/handle" -Method POST -Headers $sh3 -ContentType 'application/json' -Body (@{ agree = $true } | ConvertTo-Json)
  $afterAgree = (Invoke-RestMethod -Uri "$base/aftersales/$($t3.ticket.id)" -Headers $c.buyer).data
  Write-Host ("  after stall agree: status=" + $afterAgree.status + " (expect waiting_return)")

  $ret = (Invoke-RestMethod -Uri "$base/aftersales/$($t3.ticket.id)/return" -Method POST -Headers $c.buyer -ContentType 'application/json' -Body (@{ logistics = 'SF999888777' } | ConvertTo-Json)).data
  Write-Host ("  buyer filled return logistics -> status=" + $ret.ticket.status)

  $recv = (Invoke-RestMethod -Uri "$base/stall/aftersales/$($t3.ticket.id)/received" -Method POST -Headers $sh3).data
  Write-Host ("  stall confirmed receipt -> ticket=" + $recv.ticket.status)
  $order3 = (Invoke-RestMethod -Uri "$base/orders/$($c.orderId)" -Headers $c.buyer).data
  Write-Host ("  order3 status=" + $order3.status + " refund=" + $order3.refund.status)
  if ($order3.status -ne 'refunded') { throw 'return flow did not refund' }

  Write-Host '=== 5) stale-ticket escalation is covered by work/test-escalate.mjs ==='
} finally {
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
  Remove-Item Env:PORT, Env:ADMIN_TOKEN, Env:DB_FILE, Env:LOG, Env:AFTERSALE_ESCALATE_HOURS, Env:SWEEP_INTERVAL_SEC -ErrorAction SilentlyContinue
}
Write-Host 'AFTERSALES TESTS PASSED'
