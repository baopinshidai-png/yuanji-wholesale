// 运营位配置 + 对账逐笔差异 的接口/逻辑测试（mock 模式，不依赖微信商户号）
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const BASE = 'http://127.0.0.1:3000/api/v1'
const ADMIN = { 'x-admin-token': process.env.ADMIN_TOKEN || 'ops-2026', 'content-type': 'application/json' }

const api = async (p, opt = {}) => {
  const res = await fetch(BASE + p, Object.assign({ headers: ADMIN }, opt))
  const body = await res.json()
  if (!res.ok || body.code !== 0) throw new Error(body.msg || res.status)
  return body.data
}

// ---------- 1) 首页运营位：新增 → 首页可见 → 停用 → 首页消失 → 删除 ----------
const created = await api('/admin/campaigns', {
  method: 'POST',
  body: JSON.stringify({ position: 'home_top', title: '测试banner·国庆预热', subtitle: '本地测试', link: '/pages/list/index?sort=new', sort: 9 }),
})
const id = created.campaign.id
let home = await api('/home')
const visible = home.campaigns.filter((c) => c.id === id).length
console.log('1) 新增运营位:', id, '首页可见:', visible)
if (visible !== 1) throw new Error('运营位未出现在首页')

await api('/admin/campaigns/' + id + '/toggle', { method: 'POST', body: JSON.stringify({ enabled: false }) })
home = await api('/home')
const visibleAfterOff = home.campaigns.filter((c) => c.id === id).length
console.log('   停用后首页可见:', visibleAfterOff)
if (visibleAfterOff !== 0) throw new Error('停用后仍在首页展示')
await api('/admin/campaigns/' + id + '/remove', { method: 'POST' })
console.log('   已删除测试运营位')

// ---------- 2) 对账差异：造一份微信账单 CSV，比对本地订单 ----------
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yuanji-bill-'))
process.env.BILL_DIR = tmpDir
process.env.DB_FILE = path.resolve('outputs/yuanji-server/data/db.json')
const { parseTradeBill, diffOrders } = await import('../outputs/yuanji-server/src/bills.js')
const { db } = await import('../outputs/yuanji-server/src/db.js')

const today = new Date().toISOString().slice(0, 10)
const paid = db.orders.find((o) => o.paidAt && String(o.paidAt).slice(0, 10) === today) || db.orders.find((o) => o.paidAt)
const localId = paid.id
const localAmount = paid.payable

const header = '交易时间,公众账号ID,商户号,特约商户号,设备号,微信订单号,商户订单号,用户标识,交易类型,交易状态,付款银行,货币种类,应结订单金额,代金券金额,微信退款单号,商户退款单号,退款金额,充值券退款金额,退款类型,退款状态,商品名称,商户数据包,手续费,费率,订单金额,申请退款金额'
const row = (orderNo, status, amount) =>
  ['`' + today + ' 10:00:00', 'wxappid', '1600000000', '0', '', 'WX' + orderNo, orderNo, 'oUser', 'JSAPI', status, 'OTHERS', 'CNY', amount, '0.00', '0', '0', '0.00', '0.00', '', '', 'goods', '', '0.006', '0.60%', amount, '0.00'].join(',')
const csv = [
  '微信支付交易账单',
  '商户号：1600000000',
  header,
  row(localId, 'SUCCESS', localAmount),            // 本地有 + 微信有 + 金额一致
  row('YJ-NOT-LOCAL-001', 'SUCCESS', '88.00'),      // 微信有、本地无
  '总交易单数,2,127.90,0,0.00',
].join('\n')

const parsed = parseTradeBill(csv)
const diffs = diffOrders(today, parsed.rows)
console.log('2) 账单解析:', parsed.rows.length, '行；差异：微信无记录', diffs.missingInWechat.length, '/ 本地无订单', diffs.missingLocal.length, '/ 金额不一致', diffs.amountMismatch.length)
if (parsed.rows.length !== 2) throw new Error('账单解析行数不对')
if (diffs.missingLocal.length !== 1 || diffs.missingLocal[0] !== 'YJ-NOT-LOCAL-001') throw new Error('未识别出本地缺失订单')

// 金额不一致场景
const diffs2 = diffOrders(today, [{ outTradeNo: localId, status: 'SUCCESS', amount: localAmount + 5 }])
console.log('   金额不一致识别:', diffs2.amountMismatch.length)
if (diffs2.amountMismatch.length !== 1) throw new Error('未识别金额不一致')

// 本地已收款但微信账单缺失
const diffs3 = diffOrders(today, [])
console.log('   微信缺失识别:', diffs3.missingInWechat.length)
if (diffs3.missingInWechat.length < 1) throw new Error('未识别微信账单缺失')

fs.rmSync(tmpDir, { recursive: true, force: true })
console.log('✅ 运营位 + 对账差异 测试通过')
