// 验证用：把指定页面临时设为小程序首页（app.json pages 顺序），DevTools 会自动重新编译
// 用法：node work/set-first-page.mjs pages/category/index | --restore
import fs from 'node:fs'

const FILE = 'outputs/yuanji-miniprogram/app.json'
const ORIGINAL = [
  'pages/home/index',
  'pages/category/index',
  'pages/cart/index',
  'pages/mine/index',
  'pages/list/index',
  'pages/goods/index',
  'pages/stall/index',
  'pages/search/index',
  'pages/login/index',
  'pages/cert/index',
  'pages/checkout/index',
  'pages/orders/index',
  'pages/order-detail/index',
  'pages/address/index',
  'pages/favorites/index',
  'pages/subs/index',
  'pages/coupons/index',
  'pages/material/index',
]

const arg = process.argv[2]
const app = JSON.parse(fs.readFileSync(FILE, 'utf8'))

if (!arg || arg === '--restore') {
  app.pages = ORIGINAL.slice()
  fs.writeFileSync(FILE, JSON.stringify(app, null, 2) + '\n', 'utf8')
  console.log('restored:', app.pages[0])
  process.exit(0)
}

if (ORIGINAL.indexOf(arg) === -1) {
  console.error('unknown page:', arg)
  process.exit(1)
}
app.pages = [arg].concat(ORIGINAL.filter((p) => p !== arg))
fs.writeFileSync(FILE, JSON.stringify(app, null, 2) + '\n', 'utf8')
console.log('first page is now:', arg)
