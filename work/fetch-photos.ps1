# Fetch candidate product photos from Bing image search (queries live in photos-queries.json, UTF-8).
# Usage: powershell -ExecutionPolicy Bypass -File work/fetch-photos.ps1 [-Slot n]
param([int]$Slot = 0)
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

$OutDir = Join-Path $PSScriptRoot 'photos'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$queries = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'photos-queries.json') | ConvertFrom-Json
$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
$Take = 5

function Get-Candidates([string]$q) {
  $u = 'https://cn.bing.com/images/async?q=' + [uri]::EscapeDataString($q) + '&first=0&count=40&mmasync=1'
  $html = (Invoke-WebRequest -Uri $u -TimeoutSec 40 -UserAgent $UA -UseBasicParsing -Headers @{ Referer = 'https://cn.bing.com/images/' }).Content
  $urls = [regex]::Matches($html, 'murl&quot;:&quot;(.*?)&quot;') | ForEach-Object { $_.Groups[1].Value }
  $clean = @()
  foreach ($x in $urls) {
    $x = $x -replace '&amp;', '&'
    if ($x -match '\.(jpg|jpeg|png|webp)($|\?)') { $clean += $x }
  }
  return $clean
}

foreach ($s in $queries) {
  if ($Slot -gt 0 -and $s.n -ne $Slot) { continue }
  try {
    $cands = Get-Candidates $s.q
  } catch {
    Write-Host ("slot {0} search failed: {1}" -f $s.n, $_.Exception.Message)
    continue
  }
  $got = 0
  foreach ($u in $cands) {
    if ($got -ge $Take) { break }
    $got++
    $file = Join-Path $OutDir ("{0:d2}_{1}.jpg" -f $s.n, $got)
    if (Test-Path $file) { continue }
    try {
      Invoke-WebRequest -Uri $u -OutFile $file -TimeoutSec 60 -UserAgent $UA -UseBasicParsing -Headers @{ Referer = 'https://cn.bing.com/' }
      if ((Get-Item $file).Length -lt 15kb) {
        Remove-Item $file -ErrorAction SilentlyContinue
        $got--
      }
    } catch {
      Remove-Item $file -ErrorAction SilentlyContinue
      $got--
    }
  }
  Write-Host ("slot {0} done: {1} photos" -f $s.n, $got)
}

Write-Host ("dir: " + $OutDir)
Write-Host ("count: " + (Get-ChildItem $OutDir -Filter *.jpg | Measure-Object).Count)
