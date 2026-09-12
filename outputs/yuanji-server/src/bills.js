// 对账：本地账单汇总 + 导出 CSV，以及微信支付交易账单/资金账单下载
import fs from 'node:fs'
import path from 'node:path'
import { db, save } from './db.js'
import { payMode, wxPayRequest } from './pay.js'

const billDir = () => process.env.BILL_DIR || path.resolve('data/bills')
const dayOf = (v) => String(v || '').slice(0, 10)
const yuan = (fen) => Math.round(fen) / 100

// 本地账单汇总（不依赖微信，随时可看）
export function billSummary(date) {
  const target = date || dayOf(new Date().toISOString())
  const paidOrders = db.orders.filter((o) => ['unship', 'shipped', 'done', 'refunding', 'refunded'].indexOf(o.status) > -1)
  const inDay = (o, field) => dayOf(o[field]) === target

  const paidFen = paidOrders
    .filter((o) => inDay(o, 'paidAt') || (!o.paidAt && inDay(o, 'createdAt')))
    .reduce((n, o) => n + Math.round(o.payable * 100), 0)
  const refunded = db.orders.filter((o) => o.refund && o.refund.status === 'success' && inDay(o.refund, 'finishedAt'))
  const refundFen = refunded.reduce((n, o) => n + Math.round((o.refund.amount || 0) * 100), 0)
  const settled = db.orders.filter((o) => o.settle && o.settle.status === 'success')
  const stallShareFen = settled.reduce((n, o) => n + (o.settle.amountFen || 0), 0)
  const platformFeeFen = settled.reduce((n, o) => n + (o.settle.platformFeeFen || 0), 0)
  const holdFen = db.orders
    .filter((o) => o.settle && o.settle.status === 'hold')
    .reduce((n, o) => n + (o.settle.amountFen || 0), 0)

  const byStall = {}
  paidOrders.forEach((o) => {
    const key = o.stallId || '-'
    byStall[key] = byStall[key] || { stallId: key, stallName: o.stallName || '', orders: 0, paidFen: 0 }
    byStall[key].orders += 1
    if (inDay(o, 'paidAt') || (!o.paidAt && inDay(o, 'createdAt'))) byStall[key].paidFen += Math.round(o.payable * 100)
  })

  return {
    date: target,
    mode: payMode(),
    paid: { count: paidOrders.length, amount: yuan(paidFen) },
    refunded: { count: refunded.length, amount: yuan(refundFen) },
    settle: {
      settledCount: settled.length,
      stallShare: yuan(stallShareFen),
      platformFee: yuan(platformFeeFen),
      holdAmount: yuan(holdFen),
    },
    byStall: Object.keys(byStall).map((k) =>
      Object.assign({}, byStall[k], { paidAmount: yuan(byStall[k].paidFen) }),
    ),
  }
}

// 本地明细 CSV（订单粒度，含分账结果）
export function localBillCsv(date) {
  const target = date || dayOf(new Date().toISOString())
  const rows = [['订单号', '下单时间', '支付时间', '档口', '状态', '实付金额', '退款金额', '档口货款', '平台佣金', '分账状态']]
  db.orders.forEach((o) => {
    const inDay = dayOf(o.createdAt) === target || dayOf(o.paidAt) === target
    if (!inDay) return
    rows.push([
      o.id,
      dayOf(o.createdAt),
      dayOf(o.paidAt),
      o.stallName || '',
      o.status,
      o.payable,
      (o.refund && o.refund.amount) || 0,
      o.settle ? yuan(o.settle.amountFen) : 0,
      o.settle ? yuan(o.settle.platformFeeFen) : 0,
      (o.settle && o.settle.status) || 'unsettled',
    ])
  })
  return rows.map((r) => r.join(',')).join('\n')
}

export function writeLocalBill(date) {
  const target = date || dayOf(new Date().toISOString())
  fs.mkdirSync(billDir(), { recursive: true })
  const file = path.join(billDir(), 'local-' + target + '.csv')
  fs.writeFileSync(file, '\ufeff' + localBillCsv(target), 'utf8')
  return { file: file, date: target }
}

// 微信支付账单下载（交易账单 / 资金账单）
export async function downloadWechatBill(date, type) {
  if (payMode() !== 'wechat') {
    return { mode: 'mock', message: '未配置商户号，暂时只能导出本地账单（/admin/bills/export）' }
  }
  const target = date || dayOf(new Date().toISOString())
  const api = type === 'fundflow' ? '/v3/bill/fundflowbill' : '/v3/bill/tradebill'
  const path = api + '?bill_date=' + target + (type === 'fundflow' ? '&account_type=BASIC' : '&bill_type=ALL')
  const res = await wxPayRequest('GET', path)
  if (!res.download_url) return { mode: 'wechat', error: '账单还没生成，稍后重试', raw: res }
  const csv = await fetch(res.download_url).then((r) => r.text())
  fs.mkdirSync(billDir(), { recursive: true })
  const file = path.join(billDir(), (type === 'fundflow' ? 'fundflow-' : 'trade-') + target + '.csv')
  fs.writeFileSync(file, csv, 'utf8')
  return { mode: 'wechat', file: file, bytes: Buffer.byteLength(csv), lines: csv.split('\n').length }
}

// 自动对账：本地汇总 vs 微信账单（没配商户号时只出本地快照并标记 skipped）
export async function reconcile(date) {
  const target = date || dayOf(new Date(Date.now() - 24 * 3600 * 1000).toISOString())
  const summary = billSummary(target)
  const result = {
    date: target,
    checkedAt: new Date().toISOString(),
    local: summary,
    wechat: null,
    diff: null,
    status: 'skipped',
    message: '未配置商户号，只生成本地账单快照',
  }

  if (payMode() === 'wechat') {
    try {
      const bill = await downloadWechatBill(target, 'trade')
      if (bill && bill.file) {
        const csv = fs.readFileSync(bill.file, 'utf8')
        const parsed = parseTradeBill(csv)
        result.wechat = { file: bill.file, rows: parsed.rows.length, summary: parsed.summary }
        result.diffs = diffOrders(target, parsed.rows)
        const diffCount = result.diffs.missingInWechat.length + result.diffs.missingLocal.length + result.diffs.amountMismatch.length
        result.status = diffCount ? 'diff' : 'ok'
        result.message = diffCount ? '发现 ' + diffCount + ' 处差异，请人工核对' : '逐笔核对一致：本地 ' + result.diffs.localCount + ' 笔'
      } else {
        result.status = 'pending'
        result.message = (bill && bill.message) || '微信账单尚未生成'
      }
    } catch (e) {
      result.status = 'error'
      result.message = '拉取微信账单失败：' + e.message
    }
  }

  // 逐笔差异告警
  if (result.diffs && result.diffs.missingLocal.length) {
    pushAlert('reconcile_missing_local', '微信有收款但本地无订单（' + result.diffs.missingLocal.length + ' 笔），需立即排查：' + result.diffs.missingLocal.slice(0, 3).join(', '))
  }
  if (result.diffs && result.diffs.missingInWechat.length) {
    pushAlert('reconcile_missing_wechat', '本地已收款但微信账单无记录（' + result.diffs.missingInWechat.length + ' 笔）：' + result.diffs.missingInWechat.slice(0, 3).join(', '))
  }
  if (result.diffs && result.diffs.amountMismatch.length) {
    pushAlert('reconcile_amount', '金额不一致（' + result.diffs.amountMismatch.length + ' 笔）：' + result.diffs.amountMismatch.slice(0, 2).map((d) => d.orderId).join(', '))
  }

  const holdYuan = summary.settle.holdAmount
  if (holdYuan > 0) {
    pushAlert('settle_hold', '有 ¥' + holdYuan + ' 货款挂账（档口未绑定/未通过结算账户），补绑后跑一次补分账')
  }

  fs.mkdirSync(billDir(), { recursive: true })
  fs.writeFileSync(path.join(billDir(), 'reconcile-' + target + '.json'), JSON.stringify(result, null, 2), 'utf8')
  await notifyWebhook(result)
  return result
}

function pushAlert(type, message, date) {
  db.alerts = db.alerts || []
  db.alerts.unshift({ type: type, date: date || dayOf(new Date().toISOString()), message: message, createdAt: new Date().toISOString() })
  db.alerts = db.alerts.slice(0, 100)
  save()
}

// 解析微信交易账单 CSV（按表头定位列，兼容字段顺序调整）
export function parseTradeBill(csv) {
  const lines = String(csv || '').split('\n').map((l) => l.replace(/\r$/, ''))
  const headerLine = lines.find((l) => l.indexOf('交易时间') > -1 && l.indexOf('商户订单号') > -1)
  const rows = []
  const summary = {}
  if (!headerLine) return { rows: rows, summary: summary }
  const cols = headerLine.replace(/`/g, '').split(',').map((s) => s.trim())
  const idx = (name) => cols.indexOf(name)
  const iOrder = idx('商户订单号')
  const iStatus = idx('交易状态')
  const iAmount = idx('应结订单金额') > -1 ? idx('应结订单金额') : idx('订单金额')
  const iRefund = idx('退款金额')
  const iTime = idx('交易时间')

  lines.forEach((line) => {
    const clean = line.replace(/^`/, '')
    if (clean.indexOf('总交易单数') === 0) {
      const parts = clean.split(',')
      summary.totalCount = parts[1]
      summary.totalAmount = parts[2]
      summary.refundCount = parts[3]
      summary.refundAmount = parts[4]
      return
    }
    if (line[0] !== '`') return
    const parts = clean.split(',')
    if (!parts[iOrder]) return
    rows.push({
      outTradeNo: parts[iOrder],
      status: parts[iStatus] || '',
      amount: Number(parts[iAmount] || 0),
      refundAmount: Number(parts[iRefund] || 0),
      time: parts[iTime] || '',
    })
  })
  return { rows: rows, summary: summary }
}

// 逐笔比对：本地已收款订单 vs 微信账单
export function diffOrders(date, wxRows) {
  const local = db.orders.filter((o) => dayOf(o.paidAt) === date && ['unship', 'shipped', 'done', 'refunding', 'refunded'].indexOf(o.status) > -1)
  const wxMap = {}
  ;(wxRows || []).forEach((r) => {
    if (r.status === 'SUCCESS' || r.status === 'REFUND') wxMap[r.outTradeNo] = r
  })
  const out = { localCount: local.length, wechatCount: Object.keys(wxMap).length, missingInWechat: [], missingLocal: [], amountMismatch: [] }
  local.forEach((o) => {
    const wx = wxMap[o.id]
    if (!wx) {
      out.missingInWechat.push(o.id)
      return
    }
    if (Math.abs(Number(wx.amount) - Number(o.payable)) > 0.009) {
      out.amountMismatch.push({ orderId: o.id, local: o.payable, wechat: wx.amount })
    }
  })
  const localIds = local.map((o) => o.id)
  Object.keys(wxMap).forEach((no) => {
    if (localIds.indexOf(no) < 0) out.missingLocal.push(no)
  })
  return out
}

// 有差异时推送到企业微信/钉钉机器人（配 NOTIFY_WEBHOOK 才发）
async function notifyWebhook(result) {
  const url = process.env.NOTIFY_WEBHOOK
  if (!url) return
  if (!result.diffs) return
  const count = result.diffs.missingInWechat.length + result.diffs.missingLocal.length + result.diffs.amountMismatch.length
  if (!count) return
  const text = '【源集对账提醒】' + result.date + ' 发现 ' + count + ' 处差异：微信无记录 ' +
    result.diffs.missingInWechat.length + ' 笔、本地无订单 ' + result.diffs.missingLocal.length +
    ' 笔、金额不一致 ' + result.diffs.amountMismatch.length + ' 笔。请登录运营后台查看。'
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ msgtype: 'text', text: { content: text } }),
    })
    console.log('[bills] 差异提醒已推送')
  } catch (e) {
    console.warn('[bills] 差异提醒推送失败：' + e.message)
  }
}
