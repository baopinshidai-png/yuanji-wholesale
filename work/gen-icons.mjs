// 生成小程序图标：Tab 栏图标（81×81，常态/选中两色）+ 页面内图标（96×96）
// 用法：node work/gen-icons.mjs  然后由 work/render-icons.ps1 用 Chrome 转 PNG
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.resolve('work/icons')
fs.mkdirSync(OUT, { recursive: true })

const ICONS = {
  home: '<path d="M3.4 10.6 12 3.8l8.6 6.8"/><path d="M5.8 9.4V19a1.4 1.4 0 0 0 1.4 1.4h9.6A1.4 1.4 0 0 0 18.2 19V9.4"/>',
  grid: '<rect x="3.8" y="3.8" width="6.8" height="6.8" rx="2"/><rect x="13.4" y="3.8" width="6.8" height="6.8" rx="2"/><rect x="3.8" y="13.4" width="6.8" height="6.8" rx="2"/><rect x="13.4" y="13.4" width="6.8" height="6.8" rx="2"/>',
  cart: '<circle cx="9.6" cy="19.2" r="1.4"/><circle cx="17" cy="19.2" r="1.4"/><path d="M3 4h2.3l2.2 10.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L20.8 7.6H6.2"/>',
  user: '<circle cx="12" cy="8.4" r="3.6"/><path d="M5 20.2a7.2 7.2 0 0 1 14 0"/>',
  search: '<circle cx="11" cy="11" r="6.4"/><path d="m15.8 15.8 4.6 4.6"/>',
  bell: '<path d="M6.6 10.4a5.4 5.4 0 0 1 10.8 0c0 4 1.6 5.4 1.6 5.4H5s1.6-1.4 1.6-5.4z"/><path d="M10.2 19a2 2 0 0 0 3.6 0"/>',
  heart: '<path d="M12 20.2c-.4 0-7.4-4.5-7.4-9.6A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 7.4 3.1c0 5.1-7 9.6-7.4 9.6z"/>',
  service: '<path d="M4.4 15v-3.4a7.6 7.6 0 0 1 15.2 0V15"/><rect x="2.6" y="13.4" width="4" height="6.2" rx="1.6"/><rect x="17.4" y="13.4" width="4" height="6.2" rx="1.6"/><path d="M19.4 19.6c0 1.4-1.8 2.4-4 2.4"/>',
  shop: '<path d="M4 9.6h16V12H4zM5.4 12h13.2v8H5.4z"/><path d="M4 9.6 6 4h12l2 5.6"/>',
  box: '<path d="m12 3.6 7.4 3.8v9.4L12 20.4 4.6 16.8V7.4z"/><path d="M4.6 7.4 12 11.2l7.4-3.8M12 11.2v9.2"/>',
  coupon: '<path d="M3.6 7.4h16.8v2.9a1.7 1.7 0 0 0 0 3.4v2.9H3.6v-2.9a1.7 1.7 0 0 0 0-3.4z"/><path d="M12 8.6v6.8"/>',
  download: '<path d="M12 4.4v10.2M8 10.8l4 3.8 4-3.8M5 19.6h14"/>',
  camera: '<path d="M4 8.8h2.9l1.3-2h7.6l1.3 2H20a1.4 1.4 0 0 1 1.4 1.4v8A1.4 1.4 0 0 1 20 19.6H4a1.4 1.4 0 0 1-1.4-1.4v-8A1.4 1.4 0 0 1 4 8.8z"/><circle cx="12" cy="14" r="3.2"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.6V12l3.2 2"/>',
  fire: '<path d="M12 21c3.4 0 5.6-2.2 5.6-5.2 0-3.8-4.2-5.4-3.2-10.8C11.4 6.4 8.4 9.6 8.4 12.6c0 1 .4 1.8 1 2.4-1 .4-1.8-.4-2.2-1.4-.8 1-1.2 2.2-1.2 3.4C6 18.8 8.6 21 12 21z"/>',
  location: '<path d="M12 20.8s6.6-5.6 6.6-10.4A6.6 6.6 0 0 0 5.4 10.4C5.4 15.2 12 20.8 12 20.8z"/><circle cx="12" cy="10.2" r="2.4"/>',
  shield: '<path d="M12 3.6 5.4 6v5.4c0 4 2.8 7.2 6.6 8.6 3.8-1.4 6.6-4.6 6.6-8.6V6z"/><path d="m9.2 12 2 2 3.8-4"/>',
}

const NORMAL = '#9a9aa3'
const ACTIVE = '#ff2d55'
const DARK = '#3a3a40'

function svg(name, color, size, filled) {
  const body = ICONS[name]
  const inner = filled && name === 'home'
    ? '<path d="M11.1 3.2a1.4 1.4 0 0 1 1.8 0l8 6.6a1 1 0 0 1-.6 1.8h-.9V19a2 2 0 0 1-2 2h-3.4v-5.4h-4V21H6.6a2 2 0 0 1-2-2v-7.4h-.9a1 1 0 0 1-.6-1.8z" fill="' + color + '" stroke="none"/>'
    : filled && name === 'grid'
      ? body.replace(/<rect /g, '<rect fill="' + color + '" stroke="none" ')
      : filled && name === 'user'
        ? '<circle cx="12" cy="8.4" r="3.8" fill="' + color + '" stroke="none"/><path d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0z" fill="' + color + '" stroke="none"/>'
        : filled && name === 'cart'
          ? '<path d="M2.6 3.6h2.9l2.2 10.2a1.9 1.9 0 0 0 1.9 1.6h8.2a1.9 1.9 0 0 0 1.9-1.6L21.2 7h-15z" fill="' + color + '" stroke="none"/><circle cx="9.6" cy="19" r="1.7" fill="' + color + '" stroke="none"/><circle cx="17" cy="19" r="1.7" fill="' + color + '" stroke="none"/>'
          : body
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
}

const jobs = []
// Tab 栏：4 个 × 2 态
;['home', 'grid', 'cart', 'user'].forEach((n) => {
  jobs.push({ file: `tab-${n}.svg`, content: svg(n, NORMAL, 81, false) })
  jobs.push({ file: `tab-${n}-on.svg`, content: svg(n, ACTIVE, 81, true) })
})
// 页面内图标：深灰 + 品牌粉两套
Object.keys(ICONS).forEach((n) => {
  jobs.push({ file: `ui-${n}.svg`, content: svg(n, DARK, 96, false) })
  jobs.push({ file: `ui-${n}-brand.svg`, content: svg(n, ACTIVE, 96, false) })
})

jobs.forEach((j) => fs.writeFileSync(path.join(OUT, j.file), j.content, 'utf8'))
console.log('generated', jobs.length, 'svg ->', OUT)
