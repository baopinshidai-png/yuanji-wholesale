# Image upload + stall self-service goods listing test
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = 'C:\Users\Administrator\Documents\Codex\2026-09-11\new-chat\outputs\yuanji-server'
$base = 'http://127.0.0.1:3400/api/v1'
$admin = @{ 'x-admin-token' = 'up-test' }

$env:PORT = '3400'
$env:ADMIN_TOKEN = 'up-test'
$env:DB_FILE = (Join-Path $root 'data\db-upload-test.json')
$env:UPLOAD_DIR = (Join-Path $root 'data\uploads-test')
$env:LOG = 'off'
$proc = Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $PSScriptRoot 'up-out.log') -RedirectStandardError (Join-Path $PSScriptRoot 'up-err.log')
Start-Sleep -Seconds 3

try {
  Write-Host '=== 1) stall login ==='
  $invite = (Invoke-RestMethod -Uri "$base/admin/stalls/s1/invite" -Method POST -Headers $admin).data
  $sl = (Invoke-RestMethod -Uri "$base/stall/login" -Method POST -ContentType 'application/json' -Body (@{ code = $invite.code } | ConvertTo-Json)).data
  $sh = @{ Authorization = 'Bearer ' + $sl.token }
  Write-Host ("  stall=" + $sl.stall.name + " code=" + $invite.code)

  Write-Host '=== 2) upload cover image (base64) ==='
  $png64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  $up = (Invoke-RestMethod -Uri "$base/upload" -Method POST -Headers $sh -ContentType 'application/json' -Body (@{ data = $png64; contentType = 'image/png'; filename = 'cover.png' } | ConvertTo-Json)).data
  Write-Host ("  uploaded: " + $up.url + " bytes=" + $up.bytes)
  $img = Invoke-WebRequest -Uri $up.url -UseBasicParsing
  Write-Host ("  static fetch: " + $img.StatusCode + " " + $img.Headers['Content-Type'] + " bytes=" + $img.RawContentLength)
  if ($img.StatusCode -ne 200) { throw 'static image not served' }

  Write-Host '=== 3) stall creates goods ==='
  $body = @{
    title = 'Self-service test cardigan 99001#'
    price = 68
    suggestPrice = 199
    stock = 3
    colors = 'ivory,black'
    sizes = 'S,M,L'
    imgUrl = $up.url
    imgs = @($up.url, $up.url)
  } | ConvertTo-Json
  $created = (Invoke-RestMethod -Uri "$base/stall/goods" -Method POST -Headers $sh -ContentType 'application/json' -Body $body).data
  $gid = $created.goods.id
  Write-Host ("  created goods id=" + $gid + " price=" + $created.goods.price + " imgUrl set=" + [bool]$created.goods.imgUrl)
  Write-Host ("  images=" + $created.goods.imgs[0].list.Count + " stock=" + $created.goods.stock)

  Write-Host '=== 3b) stock guard: order qty 4 should fail, qty 2 should pass and decrement ==='
  $login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{ code = 'stock-' + (Get-Random); nick = 'Buyer' } | ConvertTo-Json)
  $bh = @{ Authorization = 'Bearer ' + $login.data.token }
  $null = Invoke-RestMethod -Uri "$base/user/cert" -Method POST -Headers $bh -ContentType 'application/json' -Body (@{ shop = 'StockShop' } | ConvertTo-Json)
  $null = Invoke-RestMethod -Uri "$base/cart" -Method POST -Headers $bh -ContentType 'application/json' -Body (@{ goodsId = $gid; color = 'ivory'; size = 'M'; qty = 4 } | ConvertTo-Json)
  $fail = ''
  try { Invoke-RestMethod -Uri "$base/orders" -Method POST -Headers $bh -ContentType 'application/json' -Body '{}' | Out-Null } catch { $fail = ($_.ErrorDetails.Message | ConvertFrom-Json).msg }
  Write-Host ("  over-stock order rejected: " + $fail)
  if (-not $fail) { throw 'expected stock rejection' }
  $cart = (Invoke-RestMethod -Uri "$base/cart" -Headers $bh).data
  $null = Invoke-RestMethod -Uri ("$base/cart/" + $cart.items[0].id) -Method PATCH -Headers $bh -ContentType 'application/json' -Body (@{ qty = 2 } | ConvertTo-Json)
  $ok = (Invoke-RestMethod -Uri "$base/orders" -Method POST -Headers $bh -ContentType 'application/json' -Body '{}').data
  $after = (Invoke-RestMethod -Uri "$base/goods/$gid").data
  Write-Host ("  order ok=" + $ok.orderId + " stock after=" + $after.stock)
  if ($after.stock -ne 1) { throw 'stock not decremented' }

  Write-Host '=== 4) buyer can see it (list + detail + search) ==='
  $list = (Invoke-RestMethod -Uri "$base/goods?pageSize=200").data
  $found = @($list.list | Where-Object { $_.id -eq $gid }).Count
  Write-Host ("  in goods list: " + $found + " (total " + $list.total + ")")
  $detail = (Invoke-RestMethod -Uri "$base/goods/$gid").data
  Write-Host ("  detail: " + $detail.title + " / imgUrl=" + $detail.imgUrl)
  $search = (Invoke-RestMethod -Uri "$base/search?kw=99001").data
  Write-Host ("  search hits: " + $search.total)
  if ($found -ne 1 -or $search.total -lt 1) { throw 'new goods not visible to buyer' }

  Write-Host '=== 5) stall goods list shows it as uploaded ==='
  $sg = (Invoke-RestMethod -Uri "$base/stall/goods" -Headers $sh).data
  $mine = $sg | Where-Object { $_.id -eq $gid }
  Write-Host ("  stall goods: " + $sg.Count + " uploaded=" + $mine.uploaded + " off=" + $mine.off)

  Write-Host '=== 6) off-shelf hides it again ==='
  $null = Invoke-RestMethod -Uri "$base/stall/goods/$gid/toggle" -Method POST -Headers $sh -ContentType 'application/json' -Body (@{ off = $true } | ConvertTo-Json)
  $list2 = (Invoke-RestMethod -Uri "$base/goods?pageSize=200").data
  $found2 = @($list2.list | Where-Object { $_.id -eq $gid }).Count
  Write-Host ("  after off-shelf in list: " + $found2)
  if ($found2 -ne 0) { throw 'off-shelf goods still visible' }
} finally {
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
  Remove-Item Env:PORT, Env:ADMIN_TOKEN, Env:DB_FILE, Env:UPLOAD_DIR, Env:LOG -ErrorAction SilentlyContinue
}
Write-Host 'UPLOAD + STALL GOODS TESTS PASSED'
