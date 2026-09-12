// 小程序渲染自动核对：用微信开发者工具的自动化接口逐页截图、跑一遍核心交互链路、采集控制台报错
// 用法：node work/verify-render.mjs                      （自动启动开发者工具并跑全部页面 + 交互链路）
//       node work/verify-render.mjs --connect           （开发者工具已开着自动化端口时直接连）
//       node work/verify-render.mjs --pages home,goods  （只跑指定页面）
//       node work/verify-render.mjs --keep-open         （跑完保留开发者工具窗口）
// 产物：outputs/预览截图/miniprogram/*.png、outputs/预览截图/miniprogram/核对报告.md
import fs from 'node:fs'
import path from 'node:path'
import cp from 'node:child_process'
import { PNG } from 'pngjs'
import automator from 'miniprogram-automator'

// Node 20+ 不允许直接 spawn .bat，这里把 cli.bat 交给 cmd.exe（miniprogram-automator 内部会 spawn 它）
const realSpawn = cp.spawn
cp.spawn = function spawnPatched(file, args = [], options = {}) {
  if (typeof file === 'string' && /\.(bat|cmd)$/i.test(file)) {
    return realSpawn('cmd.exe', ['/c', file, ...(Array.isArray(args) ? args : [])], options)
  }
  return realSpawn(file, args, options)
}

const CLI = 'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat'
const WS = 'ws://127.0.0.1:9420'
const PROJECT = path.resolve('outputs/yuanji-miniprogram')
const OUT = path.resolve('outputs/预览截图/miniprogram')

const ALL_PAGES = [
  ['01-home', '/pages/home/index', '专场（首页）'],
  ['02-category', '/pages/category/index', '分类'],
  ['03-cart-empty', '/pages/cart/index', '进货车（空态）'],
  // 注意：小程序里中文参数是原样传递的（页面里的 goMarket 也是直接拼中文），不要 encodeURIComponent
  ['04-list', '/pages/list/index?market=广州沙河', '市场列表页'],
  ['05-goods-locked', '/pages/goods/index?id=g2', '商品详情（价格闸门·未认证）'],
  ['06-stall', '/pages/stall/index?id=s1', '档口主页'],
  ['07-search', '/pages/search/index', '搜索'],
  ['08-login', '/pages/login/index', '登录'],
  ['09-cert', '/pages/cert/index', '店主认证'],
  ['10-orders', '/pages/orders/index', '订单列表'],
  ['11-address', '/pages/address/index', '收货地址'],
  ['12-favorites', '/pages/favorites/index', '收藏商品'],
  ['13-subs', '/pages/subs/index', '订阅档口'],
  ['14-coupons', '/pages/coupons/index', '红包 / 卡券'],
  ['15-material', '/pages/material/index', '素材中心'],
  ['16-mine', '/pages/mine/index', '我的'],
  ['17-doc', '/pages/doc/index?type=terms', '协议与政策'],
  ['18-stall-console', '/pages/stall-console/index', '档口工作台（商家端）'],
  ['19-goods-edit', '/pages/goods-edit/index', '档口上架商品'],
  ['20-stall-profile', '/pages/stall-profile/index', '档口结算与资质'],
  ['21-aftersale', '/pages/aftersale/index?orderId=YJ1', '申请售后'],
  ['22-aftersales', '/pages/aftersales/index', '售后进度'],
]

const args = process.argv.slice(2)
const keepOpen = args.includes('--keep-open')
const byConnect = args.includes('--connect')
const skipFlow = args.includes('--skip-flow')
const onlyIdx = args.indexOf('--pages')
const only = onlyIdx > -1 && args[onlyIdx + 1] ? args[onlyIdx + 1].split(',').map((s) => s.trim()) : null

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// 自动化接口返回的 page.path 没有前导斜杠（如 pages/home/index），统一成可比对的形式
const norm = (p) => String(p || '').replace(/^\//, '')
// 开发者工具偶发关闭旧连接时会抛未处理的 rejection，兜住避免脚本直接崩
process.on('unhandledRejection', (err) => {
  console.log('  · 忽略一个未处理的异步错误：' + ((err && err.message) || err))
})
fs.mkdirSync(OUT, { recursive: true })

const rows = []
const shots = []
const checks = []
const problems = []
let current = '启动'

function analyze(file) {
  const png = PNG.sync.read(fs.readFileSync(file))
  const total = png.width * png.height
  let painted = 0
  const colors = new Set()
  for (let i = 0; i < total; i += 1) {
    const r = png.data[i * 4]
    const g = png.data[i * 4 + 1]
    const b = png.data[i * 4 + 2]
    if (r < 245 || g < 245 || b < 245) painted += 1
    if (colors.size < 4096 && i % 37 === 0) colors.add((r << 16) | (g << 8) | b)
  }
  return { w: png.width, h: png.height, ratio: painted / total, colors: colors.size }
}

// 自动化接口偶发“响应超时”（刚编译完的几秒），统一重试
async function retry(label, fn, tries = 5, delay = 3000) {
  let last
  for (let i = 1; i <= tries; i += 1) {
    try {
      return await fn()
    } catch (e) {
      last = e
      if (i < tries) {
        console.log(`  · ${label} 第 ${i} 次失败（${e.message}），${delay / 1000}s 后重试`)
        await sleep(delay)
      }
    }
  }
  problems.push(`[${label}] 重试 ${tries} 次仍失败：${last && last.message}`)
  return null
}

const open = (url, label) => retry(`${label} 打开 ` + url, () => mp.reLaunch(url))
const call = (page, label, method, ...rest) => retry(`${label} 调用 ${method}`, () => page.callMethod(method, ...rest))
const readData = (page, label) => retry(`${label} 读取 data`, () => page.data())

async function shot(name, label) {
  const file = path.join(OUT, name + '.png')
  const ok = await retry(`${label} 截图`, () => mp.screenshot({ path: file }))
  if (!ok && !fs.existsSync(file)) {
    shots.push({ name, label, px: { ratio: 0, colors: 0 }, blank: true, kb: 0 })
    problems.push(`[${label}] 截图失败`)
    return null
  }
  const stat = fs.statSync(file)
  const px = analyze(file)
  const blank = px.ratio < 0.02 || px.colors < 8
  if (blank) problems.push(`[${label}] 截图疑似空白（非空像素 ${(px.ratio * 100).toFixed(1)}%，颜色数 ${px.colors}）`)
  const row = { name, label, px, blank, kb: Math.round(stat.size / 1024) }
  shots.push(row)
  return row
}

async function visit(name, url, label, wait = 1300) {
  current = label
  const page = await open(url, label)
  if (!page) {
    rows.push({ label, url, keys: '-', ratio: '-', colors: '-', note: '打开失败' })
    return null
  }
  await sleep(wait)
  // 有页面会继承上一次的滚动位置，截图前统一回到顶部
  await retry(`${label} 回到顶部`, () => mp.pageScrollTo(0), 2, 800)
  const data = await readData(page, label)
  const s = await shot(name, label)
  rows.push({
    label,
    url,
    keys: data ? Object.keys(data).length : 0,
    ratio: s ? (s.px.ratio * 100).toFixed(1) + '%' : '-',
    colors: s ? s.px.colors : '-',
    note: s ? (s.blank ? '疑似空白' : '正常') : '截图失败',
  })
  return page
}

function check(name, ok, detail) {
  if (!ok) problems.push(`[交互] ${name} 未通过（${detail}）`)
  checks.push({ name, detail: String(detail), ok })
}

// ---------- 连接 / 启动开发者工具 ----------
if (byConnect) {
  console.log(`连接已开启自动化的开发者工具（${WS}）…`)
  var mp = await automator.connect({ wsEndpoint: WS })
} else {
  console.log('启动微信开发者工具自动化…（首次编译约 30~60 秒）')
  var mp = await automator.launch({
    cliPath: CLI,
    projectPath: PROJECT,
    trustProject: true,
    timeout: 240000,
  })
}

mp.on('console', (msg) => {
  const type = (msg && msg.type) || 'log'
  const text = msg && msg.args ? msg.args.join(' ') : String((msg && msg.text) || msg)
  if (type === 'error') problems.push(`[${current}] 控制台错误：${text}`)
})
mp.on('exception', (err) => {
  problems.push(`[${current}] 运行异常：${(err && err.message) || JSON.stringify(err)}`)
})

// 等小程序编译完成（未就绪时自动化接口会返回“响应超时”）
console.log('等待小程序就绪…')
const ready = await retry('等待小程序就绪', () => mp.currentPage(), 20, 3000)
console.log(ready ? `  当前页面：${ready.path}` : '  仍未就绪，继续尝试')

// ---------- 第一段：核心交互链路（登录 → 认证 → 加购 → 结算下单 → 订单） ----------
async function flow() {
  console.log('\n— 核心交互链路 —')
  await retry('mock showModal', () => mp.mockWxMethod('showModal', { confirm: true, cancel: false }))

  current = '交互·登录'
  let page = await open('/pages/login/index', '登录页')
  await sleep(800)
  await call(page, '登录页', 'toggleAgree')
  await call(page, '登录页', 'onGetPhone')
  await sleep(1500)
  await shot('17-flow-login-ok', '交互·登录成功')
  const cur = await retry('读取当前页', () => mp.currentPage())
  check('登录后离开登录页', cur && norm(cur.path) !== 'pages/login/index', cur ? cur.path : '读取失败')

  current = '交互·认证'
  page = await open('/pages/cert/index', '认证页')
  await sleep(800)
  await call(page, '认证页', 'onShop', { detail: { value: '源集服饰 · 杭州四季青档口' } })
  await call(page, '认证页', 'onCity', { detail: { value: '杭州' } })
  await call(page, '认证页', 'onPhone', { detail: { value: '19100005001' } })
  await call(page, '认证页', 'submit')
  await sleep(1600)
  await shot('18-flow-cert-ok', '交互·认证提交')

  current = '交互·加购'
  for (const id of ['g3', 'g3', 'g7']) {
    page = await open('/pages/goods/index?id=' + id, '商品详情 ' + id)
    await sleep(900)
    await call(page, '商品详情', 'toggleSku')
    await call(page, '商品详情', 'addCart')
    await sleep(700)
  }
  await shot('19-goods-unlocked', '商品详情（认证后解锁拿货价）')

  current = '交互·进货车'
  page = await open('/pages/cart/index', '进货车')
  await sleep(1200)
  const cartData = await readData(page, '进货车')
  await shot('20-cart-filled', '进货车（有货）')
  check(
    '加购后进货车有商品',
    !!(cartData && cartData.cart && cartData.cart.length),
    `商品 ${((cartData && cartData.cart) || []).length} 行 / 合计 ¥${cartData && cartData.payable}`,
  )

  current = '交互·结算'
  page = await open('/pages/checkout/index', '结算页')
  await sleep(1200)
  const checkoutData = await readData(page, '结算页')
  await shot('21-checkout-filled', '结算页（有货）')
  check(
    '结算页带出商品与收货地址',
    !!checkoutData && (checkoutData.items || []).length > 0 && !!checkoutData.address,
    `合计 ¥${checkoutData && checkoutData.total} / 地址 ${checkoutData && checkoutData.address && checkoutData.address.name}`,
  )
  await call(page, '结算页', 'submit')
  await sleep(2000)
  const detailPage = await retry('读取当前页', () => mp.currentPage())
  await shot('22-order-detail', '订单详情（提交订单后）')
  // 注意：一单跨多个档口时服务端会拆成多个订单，此时客户端会跳到订单列表
  check(
    '提交订单后进入订单详情或订单列表',
    !!detailPage && ['pages/order-detail/index', 'pages/orders/index'].indexOf(norm(detailPage.path)) > -1,
    detailPage ? detailPage.path : '读取失败',
  )

  current = '交互·订单'
  page = await open('/pages/orders/index', '订单列表')
  await sleep(1200)
  const ordersData = await readData(page, '订单列表')
  await shot('23-orders-filled', '订单列表（有订单）')
  check('订单列表出现新订单', !!(ordersData && (ordersData.orders || []).length), `订单 ${((ordersData && ordersData.orders) || []).length} 条`)

  // 付款（后端没配商户号时是演示支付；配了则调起微信支付）
  current = '交互·付款'
  const firstOrder = (ordersData && ordersData.orders && ordersData.orders[0]) || null
  if (firstOrder) {
    await call(page, '订单列表', 'pay', { currentTarget: { dataset: { id: firstOrder.id } } })
    await sleep(2200)
    await shot('25-order-paid', '交互·付款后')
    const afterPay = await readData(page, '订单列表')
    const paidOrder = ((afterPay && afterPay.orders) || []).find((o) => o.id === firstOrder.id)
    check(
      '付款后订单状态更新',
      !!paidOrder && paidOrder.status !== 'unpaid',
      paidOrder ? paidOrder.statusText || paidOrder.status : '未找到订单',
    )
  }

  // 档口工作台：邀请码登录 → 看到待发货订单 → 一键发货 → 买家侧变待收货
  current = '交互·档口工作台'
  const paidStallId = (firstOrder && firstOrder.stallId) || 's1'
  const inviteCode = String(paidStallId).toUpperCase() + '-2026'
  const consolePage = await open('/pages/stall-console/index', '档口工作台')
  await sleep(900)
  await call(consolePage, '档口工作台', 'onCode', { detail: { value: inviteCode } })
  await call(consolePage, '档口工作台', 'login')
  await sleep(2200)
  const consoleData = await readData(consolePage, '档口工作台')
  await shot('26-stall-console', '档口工作台（待发货）')
  const consoleOrders = (consoleData && consoleData.orders) || []
  check('档口工作台能看到本档口订单', consoleOrders.length > 0, `订单 ${consoleOrders.length} 条 / 邀请码 ${inviteCode}`)

  if (consoleOrders.length) {
    await call(consolePage, '档口工作台', 'ship', { currentTarget: { dataset: { id: consoleOrders[0].id } } })
    await sleep(2400)
    const afterShip = await readData(consolePage, '档口工作台')
    await shot('27-stall-shipped', '档口发货后')
    check(
      '档口发货后统计更新',
      !!(afterShip && afterShip.stats && afterShip.stats.shipped >= 1),
      `已发货 ${(afterShip && afterShip.stats && afterShip.stats.shipped) || 0} 单`,
    )
    // 买家侧确认状态
    const buyerPage = await open('/pages/orders/index', '订单列表')
    await sleep(1500)
    const buyerData = await readData(buyerPage, '订单列表')
    const shippedOrder = ((buyerData && buyerData.orders) || []).find((o) => o.id === consoleOrders[0].id)
    check(
      '买家侧订单变成待收货',
      !!shippedOrder && shippedOrder.status === 'shipped',
      shippedOrder ? shippedOrder.statusText || shippedOrder.status : '未找到订单',
    )
  }

  current = '交互·我的'
  page = await open('/pages/mine/index', '我的')
  await sleep(1200)
  const mineData = await readData(page, '我的')
  await shot('24-mine-certified', '我的（已认证）')
  check('我的页显示已认证', !!mineData && mineData.certified === true, `certified=${mineData && mineData.certified}`)

  await retry('restore showModal', () => mp.restoreWxMethod('showModal'))
}

// ---------- 第二段：复位成未登录 / 未认证 / 空进货车 ----------
async function resetToGuest() {
  console.log('\n— 复位为未认证状态 —')
  await retry('mock showModal', () => mp.mockWxMethod('showModal', { confirm: true, cancel: false }))
  current = '复位'
  let page = await open('/pages/cart/index', '进货车')
  await sleep(900)
  for (let i = 0; i < 20; i += 1) {
    const d = await readData(page, '进货车')
    if (!d || !d.cart || !d.cart.length) break
    await call(page, '进货车', 'step', { currentTarget: { dataset: { i: 0, d: -9999 } } })
    await sleep(250)
  }
  page = await open('/pages/mine/index', '我的')
  await sleep(900)
  await call(page, '我的', 'logout')
  await sleep(1000)
  const d = await readData(page, '我的')
  await retry('restore showModal', () => mp.restoreWxMethod('showModal'))
  check('复位为未登录未认证', !!d && !d.certified, `certified=${d && d.certified}`)
}

if (!skipFlow) {
  await flow()
  await resetToGuest()
}

// ---------- 第三段：逐页截图 ----------
console.log('\n— 逐页截图 —')
for (const [name, url, label] of ALL_PAGES) {
  if (only && !only.some((k) => name.includes(k) || url.includes(k))) continue
  await visit(name, url, label)
  const last = rows[rows.length - 1]
  console.log(`  ${last.note === '正常' ? '✔' : '✖'} ${last.label}　非空像素 ${last.ratio}　颜色数 ${last.colors}`)
}

// ---------- 报告 ----------
const report = []
report.push('# 小程序渲染自动核对报告')
report.push('')
report.push(`- 运行时间：${new Date().toLocaleString('zh-CN')}`)
report.push('- 方式：微信开发者工具自动化接口（miniprogram-automator）实机渲染逐页截图')
report.push('- 截图目录：`outputs/预览截图/miniprogram/`')
report.push('- 判定口径：截图非空像素占比 ≥ 2% 且颜色数 ≥ 8 记为「正常」；控制台 error 与运行异常全部记为问题')
report.push('')
report.push('## 一、逐页渲染结果')
report.push('')
report.push('| 页面 | 路径 | data 字段 | 非空像素 | 颜色数 | 截图 | 结论 |')
report.push('| --- | --- | --- | --- | --- | --- | --- |')
for (const r of rows) {
  const s = shots.find((x) => x.label === r.label)
  report.push(
    `| ${r.label} | \`${r.url}\` | ${r.keys} | ${r.ratio} | ${r.colors} | ${s ? '`' + s.name + '.png`' : ''} | ${r.note} |`,
  )
}
report.push('')
report.push('## 二、核心交互链路')
report.push('')
report.push('| 检查项 | 实际结果 | 结论 |')
report.push('| --- | --- | --- |')
for (const c of checks) report.push(`| ${c.name} | ${c.detail} | ${c.ok ? '通过' : '未通过'} |`)
report.push('')
report.push('## 三、过程截图')
report.push('')
report.push('| 环节 | 截图 | 非空像素 | 颜色数 | 结论 |')
report.push('| --- | --- | --- | --- | --- |')
for (const s of shots.filter((x) => /^1[7-9]-|^2[0-4]-/.test(x.name))) {
  report.push(`| ${s.label} | \`${s.name}.png\` | ${(s.px.ratio * 100).toFixed(1)}% | ${s.px.colors} | ${s.blank ? '疑似空白' : '正常'} |`)
}
report.push('')
report.push('## 四、控制台报错 / 运行异常')
report.push('')
report.push(problems.length ? problems.map((p) => '- ' + p).join('\n') : '- 无')
report.push('')
fs.writeFileSync(path.join(OUT, '核对报告.md'), report.join('\n'), 'utf8')

console.log('\n===== 核对汇总 =====')
for (const r of rows) console.log(`  ${r.note === '正常' ? '✔' : '✖'} ${r.label}　data 字段 ${r.keys}　非空像素 ${r.ratio}　颜色 ${r.colors}`)
console.log('  交互链路：')
for (const c of checks) console.log(`    ${c.ok ? '✔' : '✖'} ${c.name}　${c.detail}`)
console.log(problems.length ? '\n发现问题：\n' + problems.join('\n') : '\n✅ 渲染与交互核对：全部通过')
console.log('报告：outputs/预览截图/miniprogram/核对报告.md')

// 不留悬挂的自动化连接（否则开发者工具的自动化端口可能卡住下一次连接）
if (!keepOpen && !byConnect) {
  await mp.close()
} else if (typeof mp.disconnect === 'function') {
  mp.disconnect()
}
process.exit(problems.length ? 1 : 0)
