// 把 WXML 里商品图引用从 .png 改成 .jpg（只动 images/goods 下的，图标不动）
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('outputs/yuanji-miniprogram')
const walk = (dir, out = []) => {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

let changed = 0
for (const file of walk(ROOT).filter((f) => f.endsWith('.wxml'))) {
  const src = fs.readFileSync(file, 'utf8')
  const out = src.replace(/(src="[^"]*images\/goods\/[^"]*)\.png"/g, '$1.jpg"')
  if (out !== src) {
    fs.writeFileSync(file, out)
    changed += 1
    console.log('updated', path.relative(ROOT, file))
  }
}
console.log('files changed:', changed)
