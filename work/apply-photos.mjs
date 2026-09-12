// 把挑好的电商商品图裁成小程序用的 600x800 JPG，写入 images/goods/gN.jpg
// 用法：node work/apply-photos.mjs
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const SRC = path.resolve('work/photos')
const OUT = path.resolve('outputs/yuanji-miniprogram/images/goods')

// 槽位 -> 选中的候选文件（人眼从联系表里挑的）
const PICKS = {
  1: '01_3',
  2: '02_2',
  3: '03_1',
  4: '04_4',
  5: '05_5',
  6: '06_4',
  7: '07_4',
  8: '08_4',
  9: '09_2',
  10: '10_3',
  11: '11_1',
  12: '12_4',
  13: '13_2',
  14: '14_3',
  15: '15_5',
  16: '16_2',
  17: '17_2',
  18: '18_4',
}

fs.mkdirSync(OUT, { recursive: true })
const report = []
for (const [slot, pick] of Object.entries(PICKS)) {
  const src = path.join(SRC, pick + '.jpg')
  if (!fs.existsSync(src)) {
    console.log(`槽位 ${slot}: 找不到 ${pick}.jpg`)
    continue
  }
  const dst = path.join(OUT, `g${slot}.jpg`)
  const meta = await sharp(src).metadata()
  await sharp(src)
    .resize(600, 800, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(dst)
  const size = Math.round(fs.statSync(dst).size / 1024)
  report.push({ slot, pick, srcW: meta.width, srcH: meta.height, kb: size })
  console.log(`g${slot}.jpg  ← ${pick}.jpg  ${meta.width}x${meta.height} → 600x800  ${size}KB`)
}
const total = report.reduce((n, r) => n + r.kb, 0)
console.log(`共 ${report.length} 张，合计 ${total}KB`)
