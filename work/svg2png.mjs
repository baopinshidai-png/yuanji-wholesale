// 把小程序的商品占位图从 SVG 转成 PNG（小程序 image 组件对 SVG 支持不稳）
import fs from 'node:fs'
import path from 'node:path'

// ESM 下裸模块名不走 NODE_PATH，这里显式用运行时自带依赖目录
const sharpPath = process.env.SHARP_MODULE || 'file:///C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/lib/index.js'
const { default: sharp } = await import(sharpPath)

const SRC = path.resolve('outputs/clothing-wholesale/public/goods')
const OUT = path.resolve('outputs/yuanji-miniprogram/images/goods')
fs.mkdirSync(OUT, { recursive: true })

const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.svg'))
for (const f of files) {
  const png = f.replace(/\.svg$/, '.png')
  await sharp(path.join(SRC, f), { density: 200 }).resize(600, 600).png({ quality: 90 }).toFile(path.join(OUT, png))
}
console.log('converted', files.length, 'svg -> png')
