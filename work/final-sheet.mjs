// 预览小程序最终的 18 张商品图（g1..g18.jpg），输出 work/final-sheet.png
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const DIR = path.resolve('outputs/yuanji-miniprogram/images/goods')
const OUT = path.resolve('work/final-sheet.png')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const cells = []
for (let i = 1; i <= 18; i += 1) {
  const f = path.join(DIR, `g${i}.jpg`)
  if (!fs.existsSync(f)) continue
  cells.push(
    `<div class="cell"><img src="file:///${f.replace(/\\/g, '/')}"><div class="cap">g${i}</div></div>`,
  )
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#fff;font-family:system-ui,"Microsoft YaHei";}
.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;padding:10px;}
.cell img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:8px;display:block;}
.cap{font-size:12px;color:#666;text-align:center;padding:3px 0;}
</style></head><body><div class="grid">${cells.join('')}</div></body></html>`

const htmlPath = path.resolve('work/final-sheet.html')
fs.writeFileSync(htmlPath, html, 'utf8')
execFileSync(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--allow-file-access-from-files',
  '--virtual-time-budget=8000',
  '--window-size=1400,1100',
  `--screenshot=${OUT}`,
  'file:///' + htmlPath.replace(/\\/g, '/'),
])
console.log('sheet ->', OUT)
