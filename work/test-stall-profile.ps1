# Stall profile + settlement account + platform review (+ settlement gating)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = 'C:\Users\Administrator\Documents\Codex\2026-09-11\new-chat\outputs\yuanji-server'
$base = 'http://127.0.0.1:3500/api/v1'
$admin = @{ 'x-admin-token' = 'prof-test' }

$env:PORT = '3500'
$env:ADMIN_TOKEN = 'prof-test'
$env:DB_FILE = (Join-Path $root 'data\db-profile-test.json')
$env:LOG = 'off'
$proc = Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $PSScriptRoot 'prof-out.log') -RedirectStandardError (Join-Path $PSScriptRoot 'prof-err.log')
Start-Sleep -Seconds 3

try {
  $invite = (Invoke-RestMethod -Uri "$base/admin/stalls/s1/invite" -Method POST -Headers $admin).data
  $sl = (Invoke-RestMethod -Uri "$base/stall/login" -Method POST -ContentType 'application/json' -Body (@{ code = $invite.code } | ConvertTo-Json)).data
  $sh = @{ Authorization = 'Bearer ' + $sl.token }

  Write-Host '=== 1) stall submits profile + settlement account ==='
  $before = (Invoke-RestMethod -Uri "$base/stall/profile" -Headers $sh).data
  Write-Host ("  before: status=" + $before.profile.status)
  $saved = (Invoke-RestMethod -Uri "$base/stall/profile" -Method POST -Headers $sh -ContentType 'application/json' -Body (@{
    contact = 'Amy'; phone = '13800000000'; city = 'Guangzhou Shahe'; licenseNo = '91440100TEST'
    accountType = 'MERCHANT_ID'; accountAccount = '1900000109'; accountName = 'HERS Studio'
  } | ConvertTo-Json)).data
  Write-Host ("  after submit: status=" + $saved.profile.status + " account=" + $saved.profile.account.account)

  Write-Host '=== 2) buyer pays before review -> settlement should HOLD ==='
  $login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{ code = 'prof-' + (Get-Random); nick = 'Buyer' } | ConvertTo-Json)
  $bh = @{ Authorization = 'Bearer ' + $login.data.token }
  $null = Invoke-RestMethod -Uri "$base/user/cert" -Method POST -Headers $bh -ContentType 'application/json' -Body (@{ shop = 'ProfShop' } | ConvertTo-Json)
  $null = Invoke-RestMethod -Uri "$base/cart" -Method POST -Headers $bh -ContentType 'application/json' -Body (@{ goodsId = 'g1'; color = 'ivory'; size = 'M'; qty = 1 } | ConvertTo-Json)
  $order = (Invoke-RestMethod -Uri "$base/orders" -Method POST -Headers $bh -ContentType 'application/json' -Body (@{ remark = 'profile test' } | ConvertTo-Json)).data
  $oid = $order.orderId
  $null = Invoke-RestMethod -Uri "$base/orders/$oid/pay" -Method POST -Headers $bh
  Start-Sleep -Seconds 1
  $s1 = (Invoke-RestMethod -Uri "$base/orders/$oid/settle" -Headers $bh).data.settle
  Write-Host ("  settle status=" + $s1.status + " reason=" + $s1.reason)
  if ($s1.status -ne 'hold') { throw 'settlement should hold before review' }

  Write-Host '=== 3) platform reviews (approve) ==='
  $pending = (Invoke-RestMethod -Uri "$base/admin/stall-profiles?status=pending" -Headers $admin).data
  Write-Host ("  pending profiles: " + $pending.Count + " first=" + $pending[0].stallName)
  $review = (Invoke-RestMethod -Uri "$base/admin/stalls/s1/review" -Method POST -Headers $admin -ContentType 'application/json' -Body (@{ approve = $true; note = 'ok' } | ConvertTo-Json)).data
  Write-Host ("  review: status=" + $review.profile.status + " account.status=" + $review.profile.account.status + " receiver=" + $review.registered.mode)

  Write-Host '=== 4) run pending settlements -> should settle now ==='
  $run = (Invoke-RestMethod -Uri "$base/admin/settle/run" -Method POST -Headers $admin).data
  Write-Host ("  settled orders: " + ($run.settled -join ',') + " rate=" + $run.rate)
  $s2 = (Invoke-RestMethod -Uri "$base/orders/$oid/settle" -Headers $bh).data.settle
  Write-Host ("  settle status now=" + $s2.status + " stallShare=" + $s2.amountFen + "fen platformFee=" + $s2.platformFeeFen + "fen")
  if ($s2.status -ne 'success') { throw 'settlement should succeed after approval' }

  Write-Host '=== 5) stall sees approved status ==='
  $after = (Invoke-RestMethod -Uri "$base/stall/profile" -Headers $sh).data
  Write-Host ("  stall profile status=" + $after.profile.status + " accountStatus=" + $after.accountStatus)
} finally {
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
  Remove-Item Env:PORT, Env:ADMIN_TOKEN, Env:DB_FILE, Env:LOG -ErrorAction SilentlyContinue
}
Write-Host 'STALL PROFILE + REVIEW + SETTLEMENT GATING TESTS PASSED'
