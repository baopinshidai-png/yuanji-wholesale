# Payment flow smoke test (mock mode): login -> cert -> cart -> order -> pay -> pay-status
$ProgressPreference = 'SilentlyContinue'
$base = 'http://127.0.0.1:3000/api/v1'

$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{ code = 'pay-test-' + (Get-Random); nick = 'PayTester' } | ConvertTo-Json)
$token = $login.data.token
$h = @{ Authorization = 'Bearer ' + $token }
Write-Host ("login: " + $login.data.user.nick)

$null = Invoke-RestMethod -Uri "$base/user/cert" -Method POST -Headers $h -ContentType 'application/json' -Body (@{ shop = 'PayTestShop'; city = 'Hangzhou' } | ConvertTo-Json)
$null = Invoke-RestMethod -Uri "$base/cart" -Method POST -Headers $h -ContentType 'application/json' -Body (@{ goodsId = 'g1'; color = 'ivory'; size = 'M'; qty = 1 } | ConvertTo-Json)

$order = (Invoke-RestMethod -Uri "$base/orders" -Method POST -Headers $h -ContentType 'application/json' -Body (@{ remark = 'pay test' } | ConvertTo-Json)).data
$id = $order.orderId
Write-Host ("order: " + $id + " status=" + $order.orders[0].status + " payable=" + $order.orders[0].payable)

$pay = (Invoke-RestMethod -Uri "$base/orders/$id/pay" -Method POST -Headers $h).data
Write-Host ("pay: mode=" + $pay.mode + " status=" + $pay.order.status)

$q = (Invoke-RestMethod -Uri "$base/orders/$id/pay-status" -Headers $h).data
Write-Host ("pay-status: " + $q.tradeState + " mode=" + $q.mode)

$list = (Invoke-RestMethod -Uri "$base/orders" -Headers $h).data
Write-Host ("orders: " + $list.total + " firstStatus=" + $list.list[0].status)
