// 把小程序页面截图拼成一张总览图，便于一次性核对
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const DIR = path.resolve('outputs/预览截图/miniprogram')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.resolve('work/shot-sheet.png')

const files = fs
  .readdirSync(DIR)
  .filter((f) => /^\d\d-.*\.png$/.test(f))
  .sort()

const cells = files
  .map(
    (f, i) =>
      `<div class="cell"><img src="file:///${path.join(DIR, f).replace(/\\/g, '/')}"><div class="cap">${f.replace(/\.png$/, '')}</div></div>`,
  )
  .join('')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#e9e9ee;font-family:system-ui,"Microsoft YaHei";}
.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;padding:10px;}
.cell img{width:100%;display:block;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,.12);}
.cap{font-size:11px;color:#444;text-align:center;padding:3px 0;}
</style></head><body><div class="grid">${cells}</div></body></html>`

const htmlPath = path.resolve('work/shot-sheet.html')
fs.writeFileSync(htmlPath, html, 'utf8')
execFileSync(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--allow-file-access-from-files',
  '--virtual-time-budget=8000',
  '--window-size=1500,1200',
  `--screenshot=${OUT}`,
  'file:///' + htmlPath.replace(/\\/g, '/'),
])
console.log(files.length, 'shots ->', OUT)
