// 订单定时任务：超时未支付自动关单（真支付模式会调微信关单接口）
import { db, save } from './db.js'
import { payMode, closePayment } from './pay.js'
import { settlePendingOrders } from './profitsharing.js'
import { reconcile } from './bills.js'

let lastReconcileDay = ''

export const orderTimeoutMin = () => Number(process.env.ORDER_TIMEOUT_MIN || 30)
export const aftersaleEscalateHours = () => Number(process.env.AFTERSALE_ESCALATE_HOURS || 24)
const sweepIntervalSec = () => Number(process.env.SWEEP_INTERVAL_SEC || 60)

export async function closeExpiredOrders(now) {
  const current = now || Date.now()
  const timeoutMs = orderTimeoutMin() * 60 * 1000
  const expired = db.orders.filter((o) => {
    if (o.status !== 'unpaid') return false
    const created = new Date(o.createdAt || 0).getTime()
    return created > 0 && current - created > timeoutMs
  })

  const closed = []
  for (const order of expired) {
    if (payMode() === 'wechat') {
      try {
        await closePayment(order.id)
      } catch (e) {
        // 微信侧可能已经支付或已关闭，这里只记录，不阻断本地关单
        console.warn('[orders] 微信关单失败 ' + order.id + '：' + e.message)
      }
    }
    order.status = 'cancelled'
    order.cancelReason = '超时未支付，系统自动关闭'
    order.closedAt = new Date().toISOString()
    closed.push(order.id)
  }
  if (closed.length) save()
  return closed
}

// 售后超时未处理 → 自动升级为平台介入
export function escalateStaleAftersales(now) {
  const current = now || Date.now()
  const limit = aftersaleEscalateHours() * 3600 * 1000
  const escalated = []
  ;(db.aftersales || []).forEach((t) => {
    if (t.status !== 'pending') return
    const created = new Date(t.createdAt || 0).getTime()
    if (!created || current - created < limit) return
    t.status = 'escalated'
    t.escalatedAt = new Date().toISOString()
    t.note = '档口超过 ' + aftersaleEscalateHours() + ' 小时未处理，已自动转平台介入'
    escalated.push(t.id)
  })
  if (escalated.length) save()
  return escalated
}

export function startOrderScheduler() {
  const tick = () => {
    closeExpiredOrders()
      .then((closed) => {
        if (closed.length) console.log('[orders] 自动关单：' + closed.join(', '))
      })
      .catch((e) => console.warn('[orders] 自动关单异常：' + e.message))
    // 待分账订单（档口补绑结算账户后会自动补分账）
    settlePendingOrders()
      .then((done) => {
        if (done.length) console.log('[profitsharing] 补分账：' + done.join(', '))
      })
      .catch((e) => console.warn('[profitsharing] 补分账异常：' + e.message))
    // 售后超时未处理 → 自动升级平台介入
    try {
      const escalated = escalateStaleAftersales()
      if (escalated.length) console.log('[aftersales] 超时自动升级平台介入：' + escalated.join(', '))
    } catch (e) {
      console.warn('[aftersales] 升级异常：' + e.message)
    }
  }
  setTimeout(tick, 5000)
  setInterval(tick, Math.max(1, sweepIntervalSec()) * 1000)
  console.log('[orders] 超时未支付自动关单已启动：超时 ' + orderTimeoutMin() + ' 分钟，每 ' + sweepIntervalSec() + ' 秒扫描一次')

  // 对账：每天上午跑一次（首次启动 30 秒后先跑一次生成快照）
  const reconcileTick = () => {
    const day = new Date().toISOString().slice(0, 10)
    if (lastReconcileDay === day) return
    lastReconcileDay = day
    reconcile()
      .then((r) => console.log('[bills] 自动对账完成：' + r.date + ' 状态=' + r.status + ' ' + r.message))
      .catch((e) => console.warn('[bills] 自动对账失败：' + e.message))
  }
  setTimeout(reconcileTick, 30 * 1000)
  setInterval(reconcileTick, 6 * 3600 * 1000)
}
