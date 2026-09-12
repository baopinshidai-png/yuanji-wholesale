# Profit-sharing (settlement) smoke test: bind stall account -> pay -> settle -> refund -> return
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = 'C:\Users\Administrator\Documents\Codex\2026-09-11\new-chat\outputs\yuanji-server'
$base = 'http://127.0.0.1:3200/api/v1'
$admin = @{ 'x-admin-token' = 'settle-test' }

$env:PORT = '3200'
$env:ADMIN_TOKEN = 'settle-test'
$env:DB_FILE = (Join-Path $root 'data\db-settle-test.json')
$env:PLATFORM_FEE_RATE = '0.05'
$env:LOG = 'off'
$proc = Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $PSScriptRoot 'settle-out.log') -RedirectStandardError (Join-Path $PSScriptRoot 'settle-err.log')
Start-Sleep -Seconds 3

try {
  Write-Host '=== 1) bind stall settle account (mock receiver) ==='
  $bind = (Invoke-RestMethod -Uri "$base/admin/stalls/s1/settle-account" -Method POST -Headers $admin -ContentType 'application/json' -Body (@{ type = 'MERCHANT_ID'; account = '1900000109'; name = 'HERS' } | ConvertTo-Json)).data
  Write-Host ("  stall=" + $bind.stallId + " account=" + $bind.account.account + " registered=" + $bind.registered.mode)

  Write-Host '=== 2) buyer: login -> cert -> cart -> order -> pay ==='
  $login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{ code = 'settle-' + (Get-Random); nick = 'SettleTester' } | ConvertTo-Json)
  $h = @{ Authorization = 'Bearer ' + $login.data.token }
  $null = Invoke-RestMethod -Uri "$base/user/cert" -Method POST -Headers $h -ContentType 'application/json' -Body (@{ shop = 'SettleShop' } | ConvertTo-Json)
  $null = Invoke-RestMethod -Uri "$base/cart" -Method POST -Headers $h -ContentType 'application/json' -Body (@{ goodsId = 'g1'; color = 'ivory'; size = 'M'; qty = 1 } | ConvertTo-Json)
  $order = (Invoke-RestMethod -Uri "$base/orders" -Method POST -Headers $h -ContentType 'application/json' -Body (@{ remark = 'settle test' } | ConvertTo-Json)).data
  $id = $order.orderId
  Write-Host ("  order " + $id + " payable=" + $order.orders[0].payable + " stall=" + $order.orders[0].stallName)

  $pay = (Invoke-RestMethod -Uri "$base/orders/$id/pay" -Method POST -Headers $h).data
  Write-Host ("  pay mode=" + $pay.mode + " status=" + $pay.order.status)

  Start-Sleep -Seconds 1
  $settle = (Invoke-RestMethod -Uri "$base/orders/$id/settle" -Headers $h).data
  Write-Host ("  settle status=" + $settle.settle.status + " 档口得=" + $settle.settle.amountFen + "分 平台佣金=" + $settle.settle.platformFeeFen + "分 rate=" + $settle.settle.rate)
  if ($settle.settle.status -ne 'success') { throw 'settle failed' }

  Write-Host '=== 3) refund -> profit-sharing return ==='
  $refund = (Invoke-RestMethod -Uri "$base/orders/$id/refund" -Method POST -Headers $h -ContentType 'application/json' -Body (@{ reason = 'settle test refund' } | ConvertTo-Json)).data
  Write-Host ("  refund orderStatus=" + $refund.order.status)
  $settle2 = (Invoke-RestMethod -Uri "$base/orders/$id/settle" -Headers $h).data
  Write-Host ("  settle status after refund=" + $settle2.settle.status)
  if ($settle2.settle.status -ne 'returned') { throw 'sharing return failed' }

  Write-Host '=== 4) admin overview ==='
  $ov = (Invoke-RestMethod -Uri "$base/admin/settlements" -Headers $admin).data
  Write-Host ("  rate=" + $ov.rate + " mock=" + $ov.mock + " counts=" + ($ov.counts | ConvertTo-Json -Compress) + " settledFen=" + $ov.amountsFen.settled)
} finally {
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
  Remove-Item Env:PORT, Env:ADMIN_TOKEN, Env:DB_FILE, Env:PLATFORM_FEE_RATE, Env:LOG -ErrorAction SilentlyContinue
}
Write-Host 'PROFIT-SHARING TESTS PASSED'
