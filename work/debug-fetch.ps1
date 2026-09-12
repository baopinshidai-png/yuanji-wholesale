$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$queries = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'photos-queries.json') | ConvertFrom-Json
Write-Host ("slots=" + $queries.Count)
$s = $queries[0]
Write-Host ("n=" + $s.n + " q=" + $s.q)
$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
$u = 'https://cn.bing.com/images/async?q=' + [uri]::EscapeDataString($s.q) + '&first=0&count=40&mmasync=1'
Write-Host ("url=" + $u)
try {
  $r = Invoke-WebRequest -Uri $u -TimeoutSec 40 -UserAgent $UA -Headers @{ Referer = 'https://cn.bing.com/images/' }
  Write-Host ("status=" + $r.StatusCode + " len=" + $r.RawContentLength)
  $matches = [regex]::Matches($r.Content, 'murl&quot;:&quot;(.*?)&quot;')
  Write-Host ("matches=" + $matches.Count)
  $i = 0
  foreach ($m in $matches) {
    $i++
    if ($i -le 3) { Write-Host ("  " + $m.Groups[1].Value) }
  }
} catch {
  Write-Host ("ERR " + $_.Exception.GetType().FullName)
  Write-Host ("MSG " + $_.Exception.Message)
  Write-Host ("AT  " + $_.InvocationInfo.PositionMessage)
}
