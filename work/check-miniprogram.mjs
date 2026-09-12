// 小程序静态校验：页面完整性 / JS 语法 / JSON 合法性 / 事件绑定 / 图片路径
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve('outputs/yuanji-miniprogram')
const errors = []
const warns = []

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

// 1. app.json
const app = readJson(path.join(ROOT, 'app.json'))
const pages = app.pages

for (const p of pages) {
  for (const ext of ['.js', '.json', '.wxml', '.wxss']) {
    const f = path.join(ROOT, p + ext)
    if (!fs.existsSync(f)) errors.push(`缺少文件: ${p}${ext}`)
  }
}

// tabBar 引用的页面必须在 pages 中
;(app.tabBar?.list || []).forEach((t) => {
  if (!pages.includes(t.pagePath)) errors.push(`tabBar 页面未注册: ${t.pagePath}`)
})

// 2. 所有 json 合法性 + 所有 js 语法
const walk = (dir, out = []) => {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}
const all = walk(ROOT)

for (const f of all) {
  if (f.endsWith('.json')) {
    try {
      readJson(f)
    } catch (e) {
      errors.push(`JSON 非法: ${path.relative(ROOT, f)} -> ${e.message}`)
    }
  }
  if (f.endsWith('.js')) {
    try {
      execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' })
    } catch (e) {
      errors.push(`JS 语法错误: ${path.relative(ROOT, f)}\n${String(e.stderr || e.message).slice(0, 400)}`)
    }
  }
}

// 3. wxml 里的事件处理函数必须在同名 js 中定义
const targets = pages
  .map((p) => ({ base: p, wxml: path.join(ROOT, p + '.wxml'), js: path.join(ROOT, p + '.js') }))
  .concat(
    walk(path.join(ROOT, 'components'))
      .filter((f) => f.endsWith('.wxml'))
      .map((wxml) => ({ base: path.relative(ROOT, wxml), wxml, js: wxml.replace(/\.wxml$/, '.js') })),
  )

for (const t of targets) {
  if (!fs.existsSync(t.wxml) || !fs.existsSync(t.js)) continue
  const wxml = fs.readFileSync(t.wxml, 'utf8')
  const js = fs.readFileSync(t.js, 'utf8')
  const handlers = new Set()
  for (const m of wxml.matchAll(/\b(?:bind|catch)(?::?[a-zA-Z-]+)?\s*=\s*"([^"{}]+)"/g)) {
    handlers.add(m[1].trim())
  }
  for (const h of handlers) {
    if (!h) continue
    const re = new RegExp(`(^|[\\s,{])${h}\\s*[(:]`, 'm')
    if (!re.test(js)) errors.push(`事件未实现: ${t.base} → ${h}`)
  }
}

// 4. 图片路径存在
for (const f of all.filter((x) => x.endsWith('.wxml'))) {
  const wxml = fs.readFileSync(f, 'utf8')
  for (const m of wxml.matchAll(/src="(\/images\/[^"]+)"/g)) {
    const rel = m[1].replace(/^\//, '')
    if (rel.includes('{{')) continue
    if (!fs.existsSync(path.join(ROOT, rel))) errors.push(`图片缺失: ${path.relative(ROOT, f)} → ${m[1]}`)
  }
}

// 5. WXML 标签闭合检查
const VOID = new Set(['input', 'import', 'include', 'wxs'])
for (const f of all.filter((x) => x.endsWith('.wxml'))) {
  let src = fs.readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
  const stack = []
  let broke = false
  for (const m of src.matchAll(/<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g)) {
    const [, close, tag, , selfClose] = m
    if (selfClose === '/' || VOID.has(tag)) continue
    if (close) {
      const last = stack.pop()
      if (last !== tag) {
        errors.push(`WXML 标签不匹配: ${path.relative(ROOT, f)} → </${tag}> 对应 <${last || 'none'}>`)
        broke = true
        break
      }
    } else {
      stack.push(tag)
    }
  }
  if (!broke && stack.length) errors.push(`WXML 未闭合: ${path.relative(ROOT, f)} → <${stack.join('> <')}>`)
}

// 6. 商品图数量
const imgs = fs.readdirSync(path.join(ROOT, 'images/goods'))
if (imgs.length < 18) warns.push(`商品图不足 18 张，当前 ${imgs.length}`)

console.log('页面数:', pages.length)
console.log('文件数:', all.length)
console.log('商品图:', imgs.length)
if (warns.length) console.log('\n警告:\n' + warns.join('\n'))
console.log(errors.length ? '\n❌ 错误:\n' + errors.join('\n') : '\n✅ 全部检查通过')
process.exit(errors.length ? 1 : 0)
