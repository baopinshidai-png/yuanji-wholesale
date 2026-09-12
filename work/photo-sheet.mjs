// 把候选商品图拼成联系表（每槽位一行），用 Chrome 无头截图，便于人工挑图
// 用法：node work/photo-sheet.mjs
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const DIR = path.resolve('work/photos')
const OUT = path.resolve('work/photos/sheets')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const QUERIES = {
  1: '打底衫 g1/g6/g12/g23',
  2: '无袖毛背心 g2',
  3: '半身裙 g3',
  4: '连帽开衫 g4',
  5: '灯芯绒裤 g5',
  6: '吊带背心 g6',
  7: '短外套 g7',
  8: '卫衣套装 g8',
  9: '针织套装 g9',
  10: '提花毛衣 g10',
  11: '条纹毛衣 g11',
  12: '两件套 g12',
  13: '牛仔裤 g13',
  14: '两件套 g14',
  15: '毛呢半身裙 g15',
  16: '麂皮外套 g16',
  17: '三件套 g17',
  18: '加绒卫衣 g18',
}

const files = fs.readdirSync(DIR).filter((f) => /^\d\d_\d\.jpg$/.test(f))
const groups = {}
for (const f of files) {
  const n = Number(f.slice(0, 2))
  ;(groups[n] = groups[n] || []).push(f)
}

fs.mkdirSync(OUT, { recursive: true })
const chunks = [
  [1, 6],
  [7, 12],
  [13, 18],
]
chunks.forEach(([from, to], idx) => {
  const rows = []
  for (let n = from; n <= to; n += 1) {
    const imgs = (groups[n] || [])
      .map((f) => `<div class="cell"><img src="../${f}"><div class="cap">${f.replace(/\.jpg$/, '')}</div></div>`)
      .join('')
    rows.push(`<div class="row"><div class="label"><b>${n}</b><span>${QUERIES[n] || ''}</span></div>${imgs}</div>`)
  }
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#fff;font-family:system-ui,"Microsoft YaHei";}
  .row{display:flex;align-items:flex-start;gap:10px;padding:10px;border-bottom:1px solid #eee;}
  .label{width:150px;font-size:13px;color:#333;padding-top:6px;}
  .label b{display:block;font-size:20px;}
  .cell{width:210px;}
  .cell img{width:210px;height:270px;object-fit:contain;background:#f6f6f8;border-radius:6px;display:block;}
  .cap{font-size:12px;color:#888;text-align:center;padding-top:4px;}
  </style></head><body>${rows.join('')}</body></html>`
  const htmlPath = path.join(OUT, `sheet${idx + 1}.html`)
  fs.writeFileSync(htmlPath, html, 'utf8')
  const png = path.join(OUT, `sheet${idx + 1}.png`)
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--virtual-time-budget=8000',
    '--window-size=1300,1900',
    `--screenshot=${png}`,
    'file:///' + htmlPath.replace(/\\/g, '/'),
  ])
  console.log('sheet', idx + 1, '->', png)
})
