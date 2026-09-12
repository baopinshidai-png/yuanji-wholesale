// 微信支付分账（APIv3）：平台代收后按档口分账，避免「二清」
// 没配商户号时走 mock：按同样规则算出分账计划并直接标记成功，便于演示与对账核对
import { db, save } from './db.js'
import { payConfig, payMode, payReady, wxPayRequest } from './pay.js'

export const platformFeeRate = () => Number(process.env.PLATFORM_FEE_RATE || 0.05)

// 档口的结算账户（分账接收方）：MERCHANT_ID（档口自己的商户号）或 PERSONAL_OPENID
export function stallAccount(stallId) {
  const account = (db.stallAccounts && db.stallAccounts[stallId]) || null
  if (!account) return null
  // 只有平台审核通过的结算账户才参与分账，未审核/被驳回的继续挂账
  if (account.status && account.status !== 'approved') {
    return Object.assign({}, account, { blocked: true })
  }
  return account
}

export function setStallAccount(stallId, account) {
  db.stallAccounts = db.stallAccounts || {}
  db.stallAccounts[stallId] = Object.assign({}, account, { updatedAt: new Date().toISOString() })
  save()
  return db.stallAccounts[stallId]
}

// 分账接收方登记到微信（真支付模式才需要）
export async function registerReceiver(stallId) {
  const account = stallAccount(stallId)
  if (!account) throw new Error('该档口还没绑定结算账户')
  if (payMode() === 'mock') return { mode: 'mock', account }
  const c = payConfig()
  const body = {
    appid: c.appid,
    mchid: c.mchid,
    type: account.type || 'MERCHANT_ID',
    account: account.account,
    relation_type: 'SERVICE_PROVIDER',
  }
  if (account.name) body.name = account.name
  const res = await wxPayRequest('POST', '/v3/profitsharing/receivers/add', body)
  account.registered = true
  account.registeredAt = new Date().toISOString()
  save()
  return { mode: 'wechat', account, result: res }
}

// 结算计划：订单实付 - 平台服务费 = 档口货款
export function settlementPlan(order) {
  const rate = platformFeeRate()
  const totalFen = Math.round(Number(order.payable) * 100)
  const feeFen = Math.round(totalFen * rate)
  const shareFen = Math.max(0, totalFen - feeFen)
  const stallId = order.stallId || (order.items[0] && order.items[0].stallId) || ''
  const raw = stallAccount(stallId)
  const receiver = raw && !raw.blocked ? raw : null
  return {
    stallId: stallId,
    stallName: order.stallName || (order.items[0] && order.items[0].stallName) || '',
    totalFen: totalFen,
    feeFen: feeFen,
    shareFen: shareFen,
    rate: rate,
    receiver: receiver,
    blockedReason: raw && raw.blocked ? '档口结算账户待平台审核（' + (raw.status || 'pending') + '）' : '',
  }
}

// 发起分账（订单支付成功后调用）
export async function settleOrder(order) {
  if (!order) throw new Error('订单不存在')
  if (order.status === 'unpaid' || order.status === 'cancelled') return null
  if (order.settle && order.settle.status === 'success') return order.settle

  const plan = settlementPlan(order)
  const outOrderNo = 'S' + order.id
  const base = {
    outOrderNo: outOrderNo,
    stallId: plan.stallId,
    stallName: plan.stallName,
    amountFen: plan.shareFen,
    platformFeeFen: plan.feeFen,
    rate: plan.rate,
    receiver: plan.receiver,
    updatedAt: new Date().toISOString(),
  }

  if (!plan.receiver || !plan.receiver.account) {
    order.settle = Object.assign(base, {
      status: 'hold',
      reason: plan.blockedReason || '档口未绑定结算账户，货款暂留平台',
    })
    save()
    return order.settle
  }

  if (payMode() === 'mock') {
    order.settle = Object.assign(base, {
      status: 'success',
      mode: 'mock',
      settledAt: new Date().toISOString(),
      note: '演示模式：未发起真实分账',
    })
    save()
    return order.settle
  }

  const c = payConfig()
  const body = {
    appid: c.appid,
    transaction_id: order.transactionId,
    out_order_no: outOrderNo,
    receivers: [
      {
        type: plan.receiver.type || 'MERCHANT_ID',
        account: plan.receiver.account,
        amount: plan.shareFen,
        description: (plan.stallName || '档口') + ' 货款',
      },
    ],
    unfreeze_unsplit: true,
  }
  const res = await wxPayRequest('POST', '/v3/profitsharing/orders', body)
  order.settle = Object.assign(base, {
    status: res.status === 'FINISHED' ? 'success' : 'processing',
    mode: 'wechat',
    wechatStatus: res.status,
    settledAt: res.status === 'FINISHED' ? new Date().toISOString() : '',
  })
  save()
  return order.settle
}

// 查询分账结果
export async function querySettlement(order) {
  if (!order || !order.settle) return null
  if (payMode() === 'mock' || order.settle.mode === 'mock') return order.settle
  const res = await wxPayRequest(
    'GET',
    '/v3/profitsharing/orders/' + order.settle.outOrderNo + '?transaction_id=' + order.transactionId,
  )
  if (res.status === 'FINISHED') {
    order.settle.status = 'success'
    order.settle.settledAt = res.finish_time || new Date().toISOString()
  }
  save()
  return order.settle
}

// 分账回退（已分账的订单发生退款时必须回退）
export async function returnSharing(order, reason) {
  if (!order || !order.settle) return null
  if (order.settle.status !== 'success') return order.settle
  const outReturnNo = 'RT' + order.settle.outOrderNo
  if (payMode() === 'mock' || order.settle.mode === 'mock') {
    order.settle.status = 'returned'
    order.settle.returnedAt = new Date().toISOString()
    order.settle.returnReason = reason || ''
    save()
    return order.settle
  }
  const c = payConfig()
  const res = await wxPayRequest('POST', '/v3/profitsharing/return-orders', {
    out_order_no: order.settle.outOrderNo,
    out_return_no: outReturnNo,
    return_mchid: c.mchid,
    amount: order.settle.amountFen,
    description: reason || '订单退款，分账回退',
  })
  order.settle.status = res.status === 'SUCCESS' ? 'returned' : 'returning'
  order.settle.returnedAt = new Date().toISOString()
  order.settle.returnReason = reason || ''
  save()
  return order.settle
}

// 扫描：已支付但还没分账（或分账失败/挂账后补绑账户）的订单
export async function settlePendingOrders() {
  const pending = db.orders.filter(
    (o) =>
      ['unship', 'shipped', 'done'].indexOf(o.status) > -1 &&
      (!o.settle || o.settle.status === 'hold' || o.settle.status === 'failed'),
  )
  const done = []
  for (const order of pending) {
    const plan = settlementPlan(order)
    if (!plan.receiver || !plan.receiver.account) continue // 没绑账户的继续挂账
    try {
      const res = await settleOrder(order)
      if (res) done.push(order.id)
    } catch (e) {
      order.settle = Object.assign(order.settle || {}, { status: 'failed', error: e.message })
      save()
      console.warn('[profitsharing] 订单 ' + order.id + ' 分账失败：' + e.message)
    }
  }
  return done
}

export function settlementOverview() {
  const list = db.orders.map((o) => ({
    id: o.id,
    status: o.status,
    payable: o.payable,
    stallId: o.stallId,
    stallName: o.stallName,
    settle: o.settle || null,
  }))
  const sum = (status) =>
    list
      .filter((o) => o.settle && o.settle.status === status)
      .reduce((n, o) => n + (o.settle.amountFen || 0), 0)
  return {
    rate: platformFeeRate(),
    mock: !payReady(),
    counts: {
      success: list.filter((o) => o.settle && o.settle.status === 'success').length,
      hold: list.filter((o) => o.settle && o.settle.status === 'hold').length,
      unsettled: list.filter((o) => !o.settle).length,
    },
    amountsFen: { settled: sum('success'), hold: sum('hold') },
    orders: list,
  }
}
