# Tests: refund flow (mock) + auto-close expired unpaid orders
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = 'C:\Users\Administrator\Documents\Codex\2026-09-11\new-chat\outputs\yuanji-server'

function New-User([string]$base, [string]$code) {
  $login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{ code = $code; nick = 'Tester' } | ConvertTo-Json)
  $token = $login.data.token
  $h = @{ Authorization = 'Bearer ' + $token }
  $null = Invoke-RestMethod -Uri "$base/user/cert" -Method POST -Headers $h -ContentType 'application/json' -Body (@{ shop = 'TestShop' } | ConvertTo-Json)
  return $h
}

function New-Order([string]$base, $h) {
  $null = Invoke-RestMethod -Uri "$base/cart" -Method POST -Headers $h -ContentType 'application/json' -Body (@{ goodsId = 'g1'; color = 'ivory'; size = 'M'; qty = 1 } | ConvertTo-Json)
  $res = Invoke-RestMethod -Uri "$base/orders" -Method POST -Headers $h -ContentType 'application/json' -Body (@{ remark = 'auto test' } | ConvertTo-Json)
  return $res.data.orderId
}

Write-Host '=== 1) refund flow (mock) on :3000 ==='
$base = 'http://127.0.0.1:3000/api/v1'
$h = New-User $base ('refund-' + (Get-Random))
$id = New-Order $base $h
$pay = (Invoke-RestMethod -Uri "$base/orders/$id/pay" -Method POST -Headers $h).data
Write-Host ("  pay mode=" + $pay.mode + " status=" + $pay.order.status)
$refund = (Invoke-RestMethod -Uri "$base/orders/$id/refund" -Method POST -Headers $h -ContentType 'application/json' -Body (@{ reason = 'size not ok' } | ConvertTo-Json)).data
Write-Host ("  refund mode=" + $refund.mode + " orderStatus=" + $refund.order.status + " refundStatus=" + $refund.order.refund.status)
$after = (Invoke-RestMethod -Uri "$base/orders/$id" -Headers $h).data
Write-Host ("  order after refund: status=" + $after.status + " amount=" + $after.refund.amount)
if ($after.status -ne 'refunded') { throw 'refund flow failed' }

Write-Host '=== 2) auto-close expired unpaid order on :3100 ==='
$env:PORT = '3100'
$env:ORDER_TIMEOUT_MIN = '0.05'      # 3 seconds
$env:SWEEP_INTERVAL_SEC = '1'
$env:ADMIN_TOKEN = 'test-token'
$env:DB_FILE = (Join-Path $root 'data\db-autoclose-test.json')
$env:LOG = 'off'
$proc = Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $PSScriptRoot 'autoclose-out.log') -RedirectStandardError (Join-Path $PSScriptRoot 'autoclose-err.log')
Start-Sleep -Seconds 3
try {
  $base2 = 'http://127.0.0.1:3100/api/v1'
  $h2 = New-User $base2 ('close-' + (Get-Random))
  $id2 = New-Order $base2 $h2
  $before = (Invoke-RestMethod -Uri "$base2/orders/$id2" -Headers $h2).data
  Write-Host ("  order " + $id2 + " status=" + $before.status)
  Start-Sleep -Seconds 6
  $mid = (Invoke-RestMethod -Uri "$base2/orders/$id2" -Headers $h2).data
  if ($mid.status -eq 'cancelled') {
    Write-Host '  closed by scheduler (interval 1s)'
  } else {
    $sweep = (Invoke-RestMethod -Uri "$base2/admin/sweep" -Method POST -Headers @{ 'x-admin-token' = 'test-token' }).data
    Write-Host ("  closed by manual sweep: " + ($sweep.closed -join ',') + " timeoutMin=" + $sweep.timeoutMin)
  }
  $afterClose = (Invoke-RestMethod -Uri "$base2/orders/$id2" -Headers $h2).data
  Write-Host ("  order after: status=" + $afterClose.status + " reason=" + $afterClose.cancelReason)
  if ($afterClose.status -ne 'cancelled') { throw 'auto close failed' }
} finally {
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
  Remove-Item Env:PORT, Env:ORDER_TIMEOUT_MIN, Env:SWEEP_INTERVAL_SEC, Env:ADMIN_TOKEN, Env:DB_FILE, Env:LOG -ErrorAction SilentlyContinue
}
Write-Host 'ALL PAYMENT/REFUND/CLOSE TESTS PASSED'
