// 路由与业务逻辑（MVP）：/api/v1/*
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { db, save } from './db.js'
import { currentUser, loginWithCode } from './auth.js'
import { priceView, publicGoods, stallDiscount } from './pricing.js'
import {
  payConfig,
  payMode,
  createJsapiPayment,
  verifyNotify,
  decryptResource,
  queryPayment,
  createRefund,
  queryRefund,
} from './pay.js'
import { closeExpiredOrders, orderTimeoutMin } from './orders.js'
import {
  settleOrder,
  returnSharing,
  settlePendingOrders,
  settlementOverview,
  setStallAccount,
  registerReceiver,
  stallAccount,
  platformFeeRate,
} from './profitsharing.js'
import { billSummary, writeLocalBill, downloadWechatBill, localBillCsv, reconcile, parseTradeBill, diffOrders } from './bills.js'
import { queryTrace, logisticsReady } from './logistics.js'
import { allCampaigns, publicCampaigns, saveCampaign, toggleCampaign, removeCampaign, POSITIONS } from './campaigns.js'
import {
  currentStall,
  ensureInviteCode,
  stallByCode,
  stallGoods,
  stallOrders,
  stallStats,
  stallToken,
  shipStallOrder,
  toggleGoods,
  createGoods,
  updateGoods,
  uploadedGoods,
  getProfile,
  saveProfile,
  reviewProfile,
  listProfiles,
  stallSettlements,
  removeGoods,
  deletedGoodsIds,
  offGoodsIds,
} from './stall.js'
import { saveImage, assetBase, uploadStats } from './uploads.js'
import seed from './seed.js'

const goodsById = (id) => seed.goods.concat(uploadedGoods()).find((g) => g.id === id)
const stallById = (id) => seed.stalls.find((s) => s.id === id)
// 档口下架的商品对买家不可见
const visibleGoods = () => {
  const off = offGoodsIds()
  const deleted = deletedGoodsIds()
  return seed.goods
    .concat(uploadedGoods())
    .filter((g) => off.indexOf(g.id) < 0 && deleted.indexOf(g.id) < 0)
}

const routes = []
const add = (method, pattern, handler, opts = {}) => routes.push({ method, pattern, handler, ...opts })

function match(method, pathname) {
  for (const r of routes) {
    if (r.method !== method) continue
    const rp = r.pattern.split('/')
    const pp = pathname.split('/')
    if (rp.length !== pp.length) continue
    const params = {}
    let ok = true
    for (let i = 0; i < rp.length; i += 1) {
      if (rp[i].startsWith(':')) params[rp[i].slice(1)] = decodeURIComponent(pp[i])
      else if (rp[i] !== pp[i]) {
        ok = false
        break
      }
    }
    if (ok) return { route: r, params }
  }
  return null
}

const sortGoods = (list, sort) => {
  const arr = list.slice()
  if (sort === 'sold') arr.sort((a, b) => b.joined - a.joined)
  else if (sort === 'new') arr.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
  else if (sort === 'price') arr.sort((a, b) => a.price - b.price)
  return arr
}

function userCart(userId) {
  if (!db.carts[userId]) db.carts[userId] = []
  return db.carts[userId]
}

// ---------------- 首页 / 基础数据 ----------------
add('GET', '/api/v1/health', () => ({ ok: true, ts: Date.now() }))

add('GET', '/api/v1/home', () => ({
  gifts: [
    { id: 'g1', amount: '¥30', desc: '满3.99立减打包' },
    { id: 'g2', amount: '包邮', desc: '满899可用' },
    { id: 'g3', amount: '退货卡', desc: '满额3倍可用' },
  ],
  boards: [
    { key: 'new', title: '好评档口榜', sub: '高评分店铺', img: 'g1' },
    { key: 'sale', title: '最好卖的款', sub: '今日已拼9.4万件', img: 'g8' },
    { key: 'stock', title: '性价比首选', sub: '数量不踩雷', img: 'g16' },
  ],
  markets: seed.markets,
  filters: seed.filters,
  categories: { cats: seed.categories, hot: seed.hotCategories },
  campaigns: publicCampaigns(),
}))

add('GET', '/api/v1/markets', () => seed.markets)
add('GET', '/api/v1/categories', () => ({ cats: seed.categories, hot: seed.hotCategories }))

// ---------------- 商品 / 档口 / 搜索 ----------------
add('GET', '/api/v1/goods', (ctx) => {
  const clean = (v) => (v === 'undefined' || v === 'null' ? '' : v)
  const { market, category, sort, filter, kw } = {
    market: clean(ctx.query.market),
    category: clean(ctx.query.category),
    sort: clean(ctx.query.sort),
    filter: clean(ctx.query.filter),
    kw: clean(ctx.query.kw),
  }
  let list = visibleGoods()
  if (market) list = list.filter((g) => g.market === market)
  if (category) list = list.filter((g) => g.title.indexOf(category) > -1)
  if (kw) list = list.filter((g) => g.title.indexOf(kw) > -1 || g.stallName.indexOf(kw) > -1)
  if (filter === '24h发货') list = list.filter((g) => g.services.indexOf('24H发货') > -1)
  else if (filter && filter !== '全部') list = list.filter((g) => g.market === filter)
  list = sortGoods(list, sort)
  const page = Number(ctx.query.page || 1)
  const pageSize = Number(ctx.query.pageSize || 40)
  const start = (page - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize).map((g) => publicGoods(g, ctx.user)),
    total: list.length,
    page,
    pageSize,
  }
})

add('GET', '/api/v1/goods/:id', (ctx) => {
  const g = goodsById(ctx.params.id)
  if (!g) return ctx.fail(404, 40400, '商品不存在')
  return publicGoods(g, ctx.user)
})

add('GET', '/api/v1/stalls', () => seed.stalls)

add('GET', '/api/v1/stalls/:id', (ctx) => {
  const stall = stallById(ctx.params.id)
  if (!stall) return ctx.fail(404, 40400, '档口不存在')
  return {
    stall,
    goods: visibleGoods()
      .filter((g) => g.stallId === stall.id)
      .map((g) => publicGoods(g, ctx.user)),
  }
})

add('GET', '/api/v1/search', (ctx) => {
  const kw = (ctx.query.kw || '').trim()
  const base = visibleGoods()
  const list = kw ? base.filter((g) => g.title.indexOf(kw) > -1 || g.stallName.indexOf(kw) > -1) : base
  return { list: sortGoods(list, ctx.query.sort).map((g) => publicGoods(g, ctx.user)), total: list.length, kw }
})

add('GET', '/api/v1/materials', () => seed.goods.slice(0, 12))

// 图片上传：小程序把图片读成 base64 提交，服务端存本地并返回可访问 URL
add('POST', '/api/v1/upload', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!ctx.user && !stall) return ctx.fail(401, 40103, '请先登录或进入档口工作台')
  const body = ctx.body || {}
  let saved = null
  try {
    saved = saveImage(body.data, body.contentType, body.filename)
  } catch (e) {
    return ctx.fail(400, 40008, e.message)
  }
  const url = assetBase(ctx.req) + '/uploads/' + saved.name
  return { url: url, name: saved.name, bytes: saved.bytes, contentType: saved.contentType }
})

// 运营/排查用：上传目录统计
add('GET', '/api/v1/admin/uploads', (ctx) => {
  requireAdmin(ctx)
  return uploadStats()
})

add('GET', '/api/v1/coupons', (ctx) => {
  const mine = ctx.user ? db.claimedCoupons[ctx.user.id] || [] : []
  return seed.coupons.map((c) => Object.assign({}, c, { claimed: mine.indexOf(c.id) > -1 }))
})

// ---------------- 登录 / 认证 ----------------
add('POST', '/api/v1/auth/login', async (ctx) => {
  const { code, nick, phone } = ctx.body || {}
  const { user, token } = await loginWithCode(code, { nick, phone })
  return { token, user: publicUser(user) }
})

add('POST', '/api/v1/auth/phone', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  ctx.user.phone = (ctx.body && ctx.body.phone) || ctx.user.phone
  save()
  return publicUser(ctx.user)
})

add('GET', '/api/v1/user/profile', (ctx) => (ctx.user ? publicUser(ctx.user) : null))

add('GET', '/api/v1/user/cert', (ctx) => ({
  certified: !!(ctx.user && ctx.user.certified),
  certInfo: (ctx.user && ctx.user.certInfo) || null,
}))

add('POST', '/api/v1/user/cert', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const { shop, type, cat, city, phone } = ctx.body || {}
  if (!shop) return ctx.fail(400, 40001, '请填写店铺名称')
  ctx.user.certified = true
  ctx.user.certInfo = {
    shop,
    type: type || '实体店店主',
    cat: cat || '女装',
    city: city || '',
    phone: phone || ctx.user.phone || '',
    submittedAt: new Date().toISOString(),
  }
  save()
  return publicUser(ctx.user)
})

// ---------------- 收藏 / 订阅 ----------------
add('GET', '/api/v1/favorites', (ctx) => {
  if (!ctx.user) return []
  const ids = db.favorites[ctx.user.id] || []
  return seed.goods.filter((g) => ids.indexOf(g.id) > -1).map((g) => publicGoods(g, ctx.user))
})

add('POST', '/api/v1/favorites', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const { goodsId } = ctx.body || {}
  if (!goodsById(goodsId)) return ctx.fail(404, 40400, '商品不存在')
  const ids = (db.favorites[ctx.user.id] = db.favorites[ctx.user.id] || [])
  if (ids.indexOf(goodsId) < 0) ids.push(goodsId)
  save()
  return { favorited: true, ids }
})

add('DELETE', '/api/v1/favorites/:goodsId', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const ids = (db.favorites[ctx.user.id] = db.favorites[ctx.user.id] || [])
  const i = ids.indexOf(ctx.params.goodsId)
  if (i > -1) ids.splice(i, 1)
  save()
  return { favorited: false, ids }
})

add('GET', '/api/v1/subscriptions', (ctx) => {
  if (!ctx.user) return []
  const ids = db.subs[ctx.user.id] || []
  return seed.stalls.filter((s) => ids.indexOf(s.id) > -1)
})

add('POST', '/api/v1/subscriptions', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const { stallId } = ctx.body || {}
  if (!stallById(stallId)) return ctx.fail(404, 40400, '档口不存在')
  const ids = (db.subs[ctx.user.id] = db.subs[ctx.user.id] || [])
  if (ids.indexOf(stallId) < 0) ids.push(stallId)
  save()
  return { subscribed: true, ids }
})

add('DELETE', '/api/v1/subscriptions/:stallId', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const ids = (db.subs[ctx.user.id] = db.subs[ctx.user.id] || [])
  const i = ids.indexOf(ctx.params.stallId)
  if (i > -1) ids.splice(i, 1)
  save()
  return { subscribed: false, ids }
})

add('POST', '/api/v1/coupons/:id/claim', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const coupon = seed.coupons.find((c) => c.id === ctx.params.id)
  if (!coupon) return ctx.fail(404, 40400, '卡券不存在')
  const ids = (db.claimedCoupons[ctx.user.id] = db.claimedCoupons[ctx.user.id] || [])
  if (ids.indexOf(coupon.id) < 0) ids.push(coupon.id)
  save()
  return { claimed: true, ids }
})

// ---------------- 进货车 ----------------
add('GET', '/api/v1/cart', (ctx) => {
  if (!ctx.user) return { items: [], total: 0, discount: 0, count: 0 }
  const items = userCart(ctx.user.id)
    .map((i) => {
      const g = goodsById(i.goodsId)
      if (!g) return null
      return Object.assign({}, i, {
        title: g.title,
        img: g.img,
        stallName: g.stallName,
        stallId: g.stallId,
        price: g.price,
        suggestPrice: g.suggestPrice,
        subsidy: g.subsidy,
      })
    })
    .filter(Boolean)
  return Object.assign(cartSummary(items, ctx.user), { items })
})

add('POST', '/api/v1/cart', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const { goodsId, color, size, qty } = ctx.body || {}
  const g = goodsById(goodsId)
  if (!g) return ctx.fail(404, 40400, '商品不存在')
  const items = userCart(ctx.user.id)
  const hit = items.find((i) => i.goodsId === goodsId && i.color === color && i.size === size)
  if (hit) hit.qty += Number(qty || 1)
  else
    items.push({
      id: 'c' + crypto.randomUUID().slice(0, 8),
      goodsId,
      color: color || (g.colors[0] && g.colors[0].name),
      size: size || g.sizes[0],
      qty: Number(qty || 1),
    })
  save()
  return cartSummary(items, ctx.user)
})

add('PATCH', '/api/v1/cart/:id', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const items = userCart(ctx.user.id)
  const idx = items.findIndex((i) => i.id === ctx.params.id)
  if (idx < 0) return ctx.fail(404, 40400, '进货车条目不存在')
  const qty = Number((ctx.body && ctx.body.qty) || 0)
  if (qty <= 0) items.splice(idx, 1)
  else items[idx].qty = qty
  save()
  return cartSummary(items, ctx.user)
})

add('DELETE', '/api/v1/cart/:id', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const items = userCart(ctx.user.id)
  const idx = items.findIndex((i) => i.id === ctx.params.id)
  if (idx > -1) items.splice(idx, 1)
  save()
  return cartSummary(items, ctx.user)
})

// ---------------- 订单 ----------------
add('POST', '/api/v1/orders/preview', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  return cartSummary(userCart(ctx.user.id).map((i) => Object.assign({}, i, goodsById(i.goodsId))), ctx.user)
})

add('POST', '/api/v1/orders', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  if (!ctx.user.certified) return ctx.fail(403, 40300, '完成店主认证后才能下单')
  // 客户端可以把本地进货车直接提交（小程序端进货车暂存本地），未传则用服务端进货车
  const bodyItems = (ctx.body && ctx.body.items) || null
  const items = bodyItems && bodyItems.length
    ? bodyItems.map((i) => ({
        id: i.id || 'c' + String(i.goodsId),
        goodsId: i.goodsId,
        color: i.color,
        size: i.size,
        qty: Number(i.qty || 1),
      }))
    : userCart(ctx.user.id)
  if (!items.length) return ctx.fail(400, 40002, '进货车是空的')

  // 库存校验（档口自建商品有库存；平台代上架商品视为充足）
  for (const item of items) {
    const g = goodsById(item.goodsId)
    if (!g) return ctx.fail(404, 40400, '商品不存在：' + item.goodsId)
    // 规格级库存优先（颜色/尺码）
    const skuKey = (item.color || '') + '/' + (item.size || '')
    if (g.skuStock && g.skuStock[skuKey] !== undefined && g.skuStock[skuKey] < item.qty) {
      return ctx.fail(
        400,
        40015,
        '「' + g.title.slice(0, 10) + '…」' + item.color + '/' + item.size + ' 库存不足（剩 ' + g.skuStock[skuKey] + ' 件）',
      )
    }
    if (typeof g.stock === 'number' && g.stock < item.qty) {
      return ctx.fail(400, 40014, '「' + g.title.slice(0, 12) + '…」库存不足（剩 ' + g.stock + ' 件）')
    }
  }

  const { address, remark, addressId } = ctx.body || {}
  const usedAddress =
    address ||
    (db.addresses[ctx.user.id] || []).find((a) => a.id === addressId) ||
    (db.addresses[ctx.user.id] || [])[0] ||
    null

  // 按档口拆单
  const byStall = {}
  items.forEach((i) => {
    const g = goodsById(i.goodsId)
    if (!g) return
    ;(byStall[g.stallId] = byStall[g.stallId] || []).push({ item: i, goods: g })
  })

  const created = []
  Object.keys(byStall).forEach((stallId) => {
    const group = byStall[stallId]
    const orderItems = group.map(({ item, goods }) => ({
      goodsId: goods.id,
      title: goods.title,
      img: goods.img,
      imgUrl: goods.imgUrl || '',
      color: item.color,
      size: item.size,
      qty: item.qty,
      price: goods.price,
      suggestPrice: goods.suggestPrice,
      stallId: goods.stallId,
      stallName: goods.stallName,
    }))
    const total = orderItems.reduce((n, i) => n + i.price * i.qty, 0)
    const discount = stallDiscount((goodsById(orderItems[0].goodsId) || {}).subsidy, total)
    const order = {
      id: 'YJ' + String(Date.now()).slice(-10) + Math.floor(Math.random() * 90 + 10),
      userId: ctx.user.id,
      stallId,
      stallName: orderItems[0].stallName,
      items: orderItems,
      address: usedAddress,
      remark: remark || '',
      total: Math.round(total * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      payable: Math.round(Math.max(0, total - discount) * 100) / 100,
      status: 'unpaid',
      logistics: '',
      createdAt: new Date().toISOString(),
    }
    db.orders.unshift(order)
    created.push(order)
  })

  db.carts[ctx.user.id] = []
  // 扣减档口自建商品库存
  items.forEach((item) => {
    const g = goodsById(item.goodsId)
    if (!g) return
    if (typeof g.stock === 'number') g.stock = Math.max(0, g.stock - item.qty)
    const skuKey = (item.color || '') + '/' + (item.size || '')
    if (g.skuStock && g.skuStock[skuKey] !== undefined) {
      g.skuStock[skuKey] = Math.max(0, g.skuStock[skuKey] - item.qty)
    }
  })
  save()
  return { orders: created, orderId: created[0] && created[0].id }
})

add('GET', '/api/v1/orders', (ctx) => {
  if (!ctx.user) return { list: [], total: 0 }
  const status = ctx.query.status
  const list = db.orders
    .filter((o) => o.userId === ctx.user.id)
    .filter((o) => !status || status === 'all' || o.status === status)
    .map((o) => Object.assign({}, o, { count: o.items.reduce((n, i) => n + i.qty, 0) }))
  return { list, total: list.length }
})

add('GET', '/api/v1/orders/:id', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const order = db.orders.find((o) => o.id === ctx.params.id && o.userId === ctx.user.id)
  if (!order) return ctx.fail(404, 40400, '订单不存在')
  return Object.assign({}, order, { count: order.items.reduce((n, i) => n + i.qty, 0) })
})

add('POST', '/api/v1/orders/:id/cancel', (ctx) => setOrderStatus(ctx, 'cancelled'))
add('POST', '/api/v1/orders/:id/confirm', (ctx) => setOrderStatus(ctx, 'done'))
add('POST', '/api/v1/orders/:id/ship', (ctx) => setOrderStatus(ctx, 'shipped', 'SF' + Date.now().toString().slice(-10)))

// 去付款：配了商户号就走微信支付统一下单，没配则 mock（演示环境）
add('POST', '/api/v1/orders/:id/pay', async (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const order = db.orders.find((o) => o.id === ctx.params.id && o.userId === ctx.user.id)
  if (!order) return ctx.fail(404, 40400, '订单不存在')
  if (order.status !== 'unpaid') return ctx.fail(400, 40003, '订单当前状态不可支付')

  if (payMode() === 'mock') {
    order.status = 'unship'
    order.paidAt = new Date().toISOString()
    order.payMode = 'mock'
    save()
    await maybeSettle(order)
    return { mode: 'mock', order: order, tip: '未配置商户号，已按演示模式标记为待发货' }
  }

  const created = await createJsapiPayment(order, ctx.user)
  order.prepayId = created.prepayId
  order.payMode = 'wechat'
  order.outTradeNo = created.outTradeNo
  save()
  return { mode: 'wechat', orderId: order.id, payParams: created.payParams }
})

// 支付结果通知（微信服务器回调，不带登录态）
add('POST', '/api/v1/pay/notify', (ctx) => {
  const headers = Object.assign({}, ctx.req.headers, { __rawBody: ctx.req.__rawBody || '' })
  const check = verifyNotify(headers)
  const certConfigured = !!payConfig().platformCert
  if (!check.verified) {
    console.warn('[pay] 回调验签未通过：' + check.reason)
    if (certConfigured) {
      return { __raw: true, status: 401, body: { code: 'FAIL', message: '验签失败' } }
    }
    console.warn('[pay] 未配置平台证书，演示模式放行（生产必须配置）')
  }

  let payload = null
  try {
    payload = ctx.body && ctx.body.resource ? decryptResource(ctx.body.resource) : null
  } catch (e) {
    console.warn('[pay] 回调解密失败：' + e.message)
    return { __raw: true, status: 400, body: { code: 'FAIL', message: '解密失败' } }
  }

  const outTradeNo = payload && payload.out_trade_no
  const order = db.orders.find((o) => o.id === outTradeNo)
  if (!order) return { __raw: true, status: 404, body: { code: 'FAIL', message: '订单不存在' } }

  if (payload.trade_state === 'SUCCESS') {
    order.status = 'unship'
    order.transactionId = payload.transaction_id
    order.paidAt = payload.success_time || new Date().toISOString()
    save()
    console.log('[pay] 订单 ' + order.id + ' 支付成功，微信交易号 ' + payload.transaction_id)
    maybeSettle(order).catch((e) => console.warn('[pay] 分账失败：' + e.message))
  }
  return { __raw: true, status: 200, body: { code: 'SUCCESS', message: '成功' } }
})

// 主动查单（回调丢失时对账用）
add('GET', '/api/v1/orders/:id/pay-status', async (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const order = db.orders.find((o) => o.id === ctx.params.id && o.userId === ctx.user.id)
  if (!order) return ctx.fail(404, 40400, '订单不存在')
  if (payMode() === 'mock') return { tradeState: order.status === 'unpaid' ? 'NOTPAY' : 'SUCCESS', mode: 'mock' }
  const info = await queryPayment(order.id)
  if (info.trade_state === 'SUCCESS' && order.status === 'unpaid') {
    order.status = 'unship'
    order.transactionId = info.transaction_id
    order.paidAt = info.success_time || new Date().toISOString()
    save()
  }
  return { tradeState: info.trade_state, mode: 'wechat', transactionId: info.transaction_id || '' }
})

// 申请退款（整单或部分金额）
add('POST', '/api/v1/orders/:id/refund', async (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const order = db.orders.find((o) => o.id === ctx.params.id && o.userId === ctx.user.id)
  if (!order) return ctx.fail(404, 40400, '订单不存在')
  if (['unpaid', 'cancelled', 'refunding', 'refunded'].indexOf(order.status) > -1) {
    return ctx.fail(400, 40004, '当前订单状态不可退款')
  }
  const amount = Number((ctx.body && ctx.body.amount) || order.payable)
  if (!(amount > 0) || amount > order.payable) return ctx.fail(400, 40005, '退款金额不合法')
  const reason = (ctx.body && ctx.body.reason) || '用户申请退款'
  const outRefundNo = 'R' + order.id

  if (payMode() === 'mock') {
    order.status = 'refunded'
    order.refund = {
      status: 'success',
      amount: amount,
      reason: reason,
      outRefundNo: outRefundNo,
      mode: 'mock',
      finishedAt: new Date().toISOString(),
    }
    save()
    await returnSharing(order, reason)
    return { mode: 'mock', order: order, tip: '未配置商户号，已按演示模式原路退回' }
  }

  const res = await createRefund(order, amount, reason, outRefundNo)
  order.status = 'refunding'
  order.refund = {
    status: 'processing',
    amount: amount,
    reason: reason,
    outRefundNo: outRefundNo,
    refundId: res.refund_id || '',
    mode: 'wechat',
    requestedAt: new Date().toISOString(),
  }
  save()
  return { mode: 'wechat', refund: order.refund, order: order }
})

// 退款结果通知（微信回调）
add('POST', '/api/v1/pay/refund-notify', (ctx) => {
  const headers = Object.assign({}, ctx.req.headers, { __rawBody: ctx.req.__rawBody || '' })
  const check = verifyNotify(headers)
  const certConfigured = !!(payConfig().platformCert || payConfig().apiV3Key)
  if (!check.verified) {
    console.warn('[pay] 退款回调验签未通过：' + check.reason)
    if (certConfigured && !/没有可用的平台证书/.test(check.reason)) {
      return { __raw: true, status: 401, body: { code: 'FAIL', message: '验签失败' } }
    }
  }

  let payload = null
  try {
    payload = ctx.body && ctx.body.resource ? decryptResource(ctx.body.resource) : null
  } catch (e) {
    return { __raw: true, status: 400, body: { code: 'FAIL', message: '解密失败' } }
  }

  const order =
    db.orders.find((o) => o.id === (payload && payload.out_trade_no)) ||
    db.orders.find((o) => o.refund && o.refund.outRefundNo === (payload && payload.out_refund_no))
  if (!order) return { __raw: true, status: 404, body: { code: 'FAIL', message: '订单不存在' } }

  const state = payload && payload.refund_status
  order.refund = Object.assign({}, order.refund, {
    status: state === 'SUCCESS' ? 'success' : 'failed',
    refundId: payload.refund_id || (order.refund && order.refund.refundId) || '',
    finishedAt: payload.success_time || new Date().toISOString(),
    rawStatus: state,
  })
  if (state === 'SUCCESS') order.status = 'refunded'
  else if (order.status === 'refunding') order.status = 'unship' // 退款失败，回到待发货
  save()
  if (state === 'SUCCESS') returnSharing(order, '订单退款，分账回退').catch(() => {})
  console.log('[pay] 订单 ' + order.id + ' 退款状态：' + state)
  return { __raw: true, status: 200, body: { code: 'SUCCESS', message: '成功' } }
})

// 查退款（回调丢失时对账）
add('GET', '/api/v1/orders/:id/refund-status', async (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const order = db.orders.find((o) => o.id === ctx.params.id && o.userId === ctx.user.id)
  if (!order) return ctx.fail(404, 40400, '订单不存在')
  if (!order.refund || payMode() === 'mock') {
    return { status: (order.refund && order.refund.status) || 'none', mode: 'mock' }
  }
  const info = await queryRefund(order.refund.outRefundNo)
  const state = info.status
  if (state === 'SUCCESS' && order.status === 'refunding') {
    order.status = 'refunded'
    order.refund.status = 'success'
    order.refund.finishedAt = info.success_time || new Date().toISOString()
    save()
  }
  return { status: state, mode: 'wechat', refundId: info.refund_id || '' }
})

// 物流轨迹（买家视角）
add('GET', '/api/v1/orders/:id/logistics', async (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const order = db.orders.find((o) => o.id === ctx.params.id && o.userId === ctx.user.id)
  if (!order) return ctx.fail(404, 40400, '订单不存在')
  const trace = await queryTrace(order)
  return Object.assign({ orderId: order.id, realtime: logisticsReady() }, trace)
})

// 手动触发一次超时关单（运维/测试用，需要 x-admin-token）
add('POST', '/api/v1/admin/sweep', async (ctx) => {
  requireAdmin(ctx)
  const closed = await closeExpiredOrders()
  return { closed: closed, timeoutMin: orderTimeoutMin() }
})

// 运营总览：一眼看清今天要处理什么
add('GET', '/api/v1/admin/overview', (ctx) => {
  requireAdmin(ctx)
  const today = String(new Date().toISOString()).slice(0, 10)
  const paid = db.orders.filter((o) => ['unship', 'shipped', 'done', 'refunding', 'refunded'].indexOf(o.status) > -1)
  const todayPaid = paid.filter((o) => String(o.paidAt || o.createdAt || '').slice(0, 10) === today)
  const profiles = listProfiles('pending')
  const hold = db.orders.filter((o) => o.settle && o.settle.status === 'hold')
  const summary = billSummary(today)
  return {
    today: {
      orders: todayPaid.length,
      amount: Math.round(todayPaid.reduce((n, o) => n + o.payable, 0) * 100) / 100,
    },
    todos: {
      pendingProfiles: profiles.length,
      unship: db.orders.filter((o) => o.status === 'unship').length,
      refunding: db.orders.filter((o) => o.status === 'refunding').length,
      holdSettlements: hold.length,
      holdAmount: Math.round(hold.reduce((n, o) => n + ((o.settle && o.settle.amountFen) || 0), 0)) / 100,
    },
    money: summary,
    payMode: payMode(),
    alerts: (db.alerts || []).slice(0, 10),
  }
})

// 运营订单列表（全部用户）
add('GET', '/api/v1/admin/orders', (ctx) => {
  requireAdmin(ctx)
  const status = ctx.query.status
  const kw = (ctx.query.kw || '').trim()
  const list = db.orders
    .filter((o) => !status || status === 'all' || o.status === status)
    .filter((o) => !kw || o.id.indexOf(kw) > -1 || (o.stallName || '').indexOf(kw) > -1)
    .slice(0, Number(ctx.query.limit || 100))
    .map((o) => ({
      id: o.id,
      status: o.status,
      stallName: o.stallName,
      payable: o.payable,
      count: o.items.reduce((n, i) => n + i.qty, 0),
      createdAt: o.createdAt,
      paidAt: o.paidAt || '',
      logistics: o.logistics || '',
      refund: o.refund || null,
      settle: o.settle || null,
      buyer: ((db.users.find((u) => u.id === o.userId) || {}).nick) || '',
    }))
  return { list: list, total: list.length }
})

// ---------------- 分账（平台代收 → 按档口结算） ----------------

// 买家/档主查看某单的结算情况
add('GET', '/api/v1/orders/:id/settle', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const order = db.orders.find((o) => o.id === ctx.params.id && o.userId === ctx.user.id)
  if (!order) return ctx.fail(404, 40400, '订单不存在')
  return { orderId: order.id, rate: platformFeeRate(), settle: order.settle || null }
})

// 给档口绑定分账接收方（档口的商户号或微信号）
add('POST', '/api/v1/admin/stalls/:id/settle-account', async (ctx) => {
  requireAdmin(ctx)
  const stall = stallById(ctx.params.id)
  if (!stall) return ctx.fail(404, 40400, '档口不存在')
  const body = ctx.body || {}
  if (!body.account) return ctx.fail(400, 40006, '请填写分账接收方账号')
  const account = setStallAccount(stall.id, {
    type: body.type || 'MERCHANT_ID',
    account: body.account,
    name: body.name || '',
  })
  let registered = null
  try {
    registered = await registerReceiver(stall.id)
  } catch (e) {
    console.warn('[profitsharing] 登记分账接收方失败：' + e.message)
    registered = { error: e.message }
  }
  return { stallId: stall.id, account: account, registered: registered }
})

// 分账总览（平台后台用）
add('GET', '/api/v1/admin/settlements', (ctx) => {
  requireAdmin(ctx)
  return settlementOverview()
})

// 手动跑一次待分账（档口补绑账户后用）
add('POST', '/api/v1/admin/settle/run', async (ctx) => {
  requireAdmin(ctx)
  const settled = await settlePendingOrders()
  return { settled: settled, rate: platformFeeRate() }
})

// 分账结果通知（微信回调）
add('POST', '/api/v1/pay/profit-sharing-notify', (ctx) => {
  const headers = Object.assign({}, ctx.req.headers, { __rawBody: ctx.req.__rawBody || '' })
  const check = verifyNotify(headers)
  if (!check.verified && /签名不匹配|缺少验签头/.test(check.reason)) {
    console.warn('[pay] 分账回调验签未通过：' + check.reason)
    return { __raw: true, status: 401, body: { code: 'FAIL', message: '验签失败' } }
  }
  let payload = null
  try {
    payload = ctx.body && ctx.body.resource ? decryptResource(ctx.body.resource) : null
  } catch (e) {
    return { __raw: true, status: 400, body: { code: 'FAIL', message: '解密失败' } }
  }
  const order = db.orders.find((o) => o.settle && o.settle.outOrderNo === (payload && payload.out_order_no))
  if (!order) return { __raw: true, status: 404, body: { code: 'FAIL', message: '分账单不存在' } }
  order.settle.status = payload.status === 'FINISHED' ? 'success' : 'processing'
  order.settle.wechatStatus = payload.status
  order.settle.settledAt = payload.finish_time || order.settle.settledAt || ''
  save()
  console.log('[profitsharing] 订单 ' + order.id + ' 分账回调：' + payload.status)
  return { __raw: true, status: 200, body: { code: 'SUCCESS', message: '成功' } }
})

// ---------------- 档口工作台（商家端） ----------------

// 平台给档口发邀请码
add('POST', '/api/v1/admin/stalls/:id/invite', (ctx) => {
  requireAdmin(ctx)
  const stall = stallById(ctx.params.id)
  if (!stall) return ctx.fail(404, 40400, '档口不存在')
  return { stallId: stall.id, stallName: stall.name, code: ensureInviteCode(stall.id) }
})

// 档口用邀请码登录（拿 7 天有效的档口 token）
add('POST', '/api/v1/stall/login', (ctx) => {
  const code = (ctx.body && ctx.body.code) || ''
  const stall = stallByCode(code)
  if (!stall) return ctx.fail(401, 40101, '邀请码无效，请联系平台运营')
  return {
    token: stallToken(stall.id),
    stall: { id: stall.id, name: stall.name, market: stall.market, score: stall.score },
  }
})

add('GET', '/api/v1/stall/me', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  return { stall: { id: stall.id, name: stall.name, market: stall.market } }
})

// 档口资料与结算设置（自助填写）
add('GET', '/api/v1/stall/profile', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  const profile = getProfile(stall.id)
  return { stall: { id: stall.id, name: stall.name }, profile: profile, accountStatus: (profile.account && profile.account.status) || 'none' }
})

add('POST', '/api/v1/stall/profile', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  const res = saveProfile(stall.id, ctx.body)
  if (res.error) return ctx.fail(400, 40011, res.error)
  return Object.assign(res, { tip: '已提交，平台审核通过后货款会按分账结算' })
})

// 平台审核档口资料（通过后结算账户才会参与分账）
add('GET', '/api/v1/admin/stall-profiles', (ctx) => {
  requireAdmin(ctx)
  return listProfiles(ctx.query.status)
})

add('POST', '/api/v1/admin/stalls/:id/review', async (ctx) => {
  requireAdmin(ctx)
  const stall = stallById(ctx.params.id)
  if (!stall) return ctx.fail(404, 40400, '档口不存在')
  const body = ctx.body || {}
  const res = reviewProfile(stall.id, body.approve !== false, body.note || '')
  if (res.error) return ctx.fail(400, 40012, res.error)
  let registered = null
  if (body.approve !== false) {
    try {
      registered = await registerReceiver(stall.id)
    } catch (e) {
      registered = { error: e.message }
    }
  }
  return { profile: res.profile, registered: registered }
})

add('GET', '/api/v1/stall/stats', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  return stallStats(stall.id)
})

add('GET', '/api/v1/stall/orders', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  const list = stallOrders(stall.id, ctx.query.status)
  return { list: list, total: list.length }
})

add('POST', '/api/v1/stall/orders/:id/ship', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  const res = shipStallOrder(stall.id, ctx.params.id, (ctx.body && ctx.body.logistics) || '')
  if (res.error) return ctx.fail(400, 40007, res.error)
  return { ok: true, orderId: ctx.params.id, logistics: res.order.logistics }
})

add('GET', '/api/v1/stall/goods', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  return stallGoods(stall.id)
})

add('POST', '/api/v1/stall/goods/:id/toggle', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  const off = !(ctx.body && ctx.body.off === false)
  const res = toggleGoods(stall.id, ctx.params.id, off)
  if (res.error) return ctx.fail(404, 40400, res.error)
  return res
})

// 档口自助上架新商品
add('POST', '/api/v1/stall/goods', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  const res = createGoods(stall.id, ctx.body)
  if (res.error) return ctx.fail(400, 40009, res.error)
  return {
    goods: publicGoods(res.goods, null),
    tip: '已上架，买家列表/搜索立即可见',
  }
})

// 档口编辑自己上架的商品（平台代上架的商品不能改）
add('POST', '/api/v1/stall/goods/:id/update', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  const res = updateGoods(stall.id, ctx.params.id, ctx.body)
  if (res.error) return ctx.fail(400, 40010, res.error)
  return { goods: publicGoods(res.goods, null), tip: '已保存' }
})

// 档口删除自己上架的商品（软删除）
add('POST', '/api/v1/stall/goods/:id/remove', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  const res = removeGoods(stall.id, ctx.params.id)
  if (res.error) return ctx.fail(400, 40013, res.error)
  return { ok: true, goodsId: ctx.params.id, tip: '已删除，买家不再可见' }
})

// 档口结算明细
add('GET', '/api/v1/stall/settlements', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  return stallSettlements(stall.id)
})

// ---------------- 对账 ----------------

add('GET', '/api/v1/admin/bills/summary', (ctx) => {
  requireAdmin(ctx)
  return billSummary(ctx.query.date)
})

add('GET', '/api/v1/admin/bills/export', (ctx) => {
  requireAdmin(ctx)
  const written = writeLocalBill(ctx.query.date)
  return { file: written.file, date: written.date, csv: localBillCsv(written.date) }
})

add('POST', '/api/v1/admin/bills/download', async (ctx) => {
  requireAdmin(ctx)
  const body = ctx.body || {}
  return downloadWechatBill(body.date, body.type || 'trade')
})

// 手动跑一次对账（定时任务也会跑）
add('POST', '/api/v1/admin/bills/reconcile', async (ctx) => {
  requireAdmin(ctx)
  return reconcile(ctx.body && ctx.body.date)
})

// 读取某天的对账结果（含逐笔差异）
add('GET', '/api/v1/admin/bills/reconcile', (ctx) => {
  requireAdmin(ctx)
  const date = ctx.query.date || String(new Date(Date.now() - 24 * 3600 * 1000).toISOString()).slice(0, 10)
  const file = path.join(process.env.BILL_DIR || 'data/bills', 'reconcile-' + date + '.json')
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    return { date: date, status: 'none', message: '还没有这天的对账结果，先跑一次对账', diffs: null }
  }
})

// ---------------- 首页运营位（banner / 活动卡） ----------------
add('GET', '/api/v1/admin/campaigns', (ctx) => {
  requireAdmin(ctx)
  return { list: allCampaigns(), positions: POSITIONS }
})

add('POST', '/api/v1/admin/campaigns', (ctx) => {
  requireAdmin(ctx)
  const res = saveCampaign(ctx.body)
  if (res.error) return ctx.fail(400, 40022, res.error)
  return res
})

add('POST', '/api/v1/admin/campaigns/:id/toggle', (ctx) => {
  requireAdmin(ctx)
  const res = toggleCampaign(ctx.params.id, ctx.body && ctx.body.enabled)
  if (res.error) return ctx.fail(404, 40400, res.error)
  return res
})

add('POST', '/api/v1/admin/campaigns/:id/remove', (ctx) => {
  requireAdmin(ctx)
  const res = removeCampaign(ctx.params.id)
  if (res.error) return ctx.fail(404, 40400, res.error)
  return res
})

// ---------------- 售后工单 ----------------
add('POST', '/api/v1/aftersales', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const body = ctx.body || {}
  const order = db.orders.find((o) => o.id === body.orderId && o.userId === ctx.user.id)
  if (!order) return ctx.fail(404, 40400, '订单不存在')
  if (['unpaid', 'cancelled'].indexOf(order.status) > -1) return ctx.fail(400, 40016, '该订单状态不可申请售后')
  if (!body.reason) return ctx.fail(400, 40017, '请填写售后原因')
  db.aftersales = db.aftersales || []
  const ticket = {
    id: 'AS' + String(Date.now()).slice(-10),
    orderId: order.id,
    userId: ctx.user.id,
    stallId: order.stallId,
    stallName: order.stallName,
    type: body.type || '退款',
    reason: body.reason,
    images: body.images || [],
    amount: Number(body.amount) > 0 ? Number(body.amount) : order.payable,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  db.aftersales.unshift(ticket)
  order.afterSaleId = ticket.id
  save()
  return { ticket: ticket, tip: '已提交，档口/平台会尽快处理' }
})

add('GET', '/api/v1/aftersales', (ctx) => {
  if (!ctx.user) return { list: [], total: 0 }
  const list = (db.aftersales || []).filter((a) => a.userId === ctx.user.id)
  return { list: list, total: list.length }
})

add('GET', '/api/v1/aftersales/:id', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const ticket = (db.aftersales || []).find((a) => a.id === ctx.params.id && a.userId === ctx.user.id)
  if (!ticket) return ctx.fail(404, 40400, '售后单不存在')
  return ticket
})

add('GET', '/api/v1/admin/aftersales', (ctx) => {
  requireAdmin(ctx)
  const status = ctx.query.status
  const list = (db.aftersales || []).filter((a) => !status || status === 'all' || a.status === status)
  return { list: list, total: list.length }
})

// 档口侧：查看本档口售后单、同意/拒绝
add('GET', '/api/v1/stall/aftersales', (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  const status = ctx.query.status
  const list = (db.aftersales || [])
    .filter((a) => a.stallId === stall.id)
    .filter((a) => !status || status === 'all' || a.status === status)
  return { list: list, total: list.length }
})

add('POST', '/api/v1/stall/aftersales/:id/handle', async (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  const ticket = (db.aftersales || []).find((a) => a.id === ctx.params.id && a.stallId === stall.id)
  if (!ticket) return ctx.fail(404, 40400, '售后单不存在')
  if (ticket.status !== 'pending') return ctx.fail(400, 40018, '该售后单已处理')
  const body = ctx.body || {}
  ticket.handledAt = new Date().toISOString()
  ticket.handleNote = body.note || ''
  ticket.handledBy = 'stall'
  if (body.agree === false) {
    ticket.status = 'stall_rejected'
    save()
    return { ticket: ticket, tip: '已拒绝，买家可申请平台仲裁' }
  }
  // 退货/换货：先让买家寄回，档口确认收货后再退款
  if (/退货|换货|return|exchange/i.test(ticket.type)) {
    ticket.status = 'waiting_return'
    save()
    return { ticket: ticket, tip: '已同意，等待买家寄回（买家填运单号后可确认收货）' }
  }
  await refundForTicket(ticket, '档口同意售后')
  return { ticket: ticket, tip: '已同意并退款' }
})

// 统一的售后退款：退款 + 分账回退（mock 直接完成，真支付走微信退款）
async function refundForTicket(ticket, reasonPrefix) {
  const order = db.orders.find((o) => o.id === ticket.orderId)
  if (!order || ['unship', 'shipped', 'done', 'refunding'].indexOf(order.status) < 0) return ticket
  if (payMode() === 'mock') {
    order.status = 'refunded'
    order.refund = {
      status: 'success',
      amount: ticket.amount,
      reason: (reasonPrefix || '售后退款') + '：' + ticket.reason,
      mode: 'mock',
      finishedAt: new Date().toISOString(),
    }
    await returnSharing(order, '售后退款，分账回退')
    ticket.status = 'refunded'
  } else {
    ticket.status = 'agreed'
    order.status = 'refunding'
    order.refund = { status: 'processing', amount: ticket.amount, reason: reasonPrefix || '售后退款', mode: 'wechat' }
  }
  save()
  return ticket
}

// 买家填写退货运单号
add('POST', '/api/v1/aftersales/:id/return', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const ticket = (db.aftersales || []).find((a) => a.id === ctx.params.id && a.userId === ctx.user.id)
  if (!ticket) return ctx.fail(404, 40400, '售后单不存在')
  if (ticket.status !== 'waiting_return') return ctx.fail(400, 40019, '当前状态不需要填写退货单号')
  const logistics = ((ctx.body && ctx.body.logistics) || '').trim()
  if (!logistics) return ctx.fail(400, 40020, '请填写退货运单号')
  ticket.returnLogistics = logistics
  ticket.returnedAt = new Date().toISOString()
  ticket.status = 'returning'
  save()
  return { ticket: ticket, tip: '已提交，等待档口确认收货后退款' }
})

// 档口确认收到退货 → 退款 + 分账回退
add('POST', '/api/v1/stall/aftersales/:id/received', async (ctx) => {
  const stall = currentStall(ctx.req)
  if (!stall) return ctx.fail(401, 40102, '请先进入档口工作台')
  const ticket = (db.aftersales || []).find((a) => a.id === ctx.params.id && a.stallId === stall.id)
  if (!ticket) return ctx.fail(404, 40400, '售后单不存在')
  if (ticket.status !== 'returning') return ctx.fail(400, 40021, '该售后单不在待收货状态')
  ticket.receivedAt = new Date().toISOString()
  await refundForTicket(ticket, '档口确认收货后售后退款')
  return { ticket: ticket, tip: '已确认收货并退款' }
})

// 平台仲裁：强制退款（复用退款 + 分账回退）/ 驳回
add('POST', '/api/v1/admin/aftersales/:id/arbitrate', async (ctx) => {
  requireAdmin(ctx)
  const ticket = (db.aftersales || []).find((a) => a.id === ctx.params.id)
  if (!ticket) return ctx.fail(404, 40400, '售后单不存在')
  const body = ctx.body || {}
  const order = db.orders.find((o) => o.id === ticket.orderId)
  ticket.arbitratedAt = new Date().toISOString()
  ticket.note = body.note || ''
  if (body.approve === false) {
    ticket.status = 'rejected'
    save()
    return { ticket: ticket, tip: '已驳回' }
  }
  ticket.status = 'approved'
  if (order && ['unship', 'shipped', 'done'].indexOf(order.status) > -1 && payMode() === 'mock') {
    order.status = 'refunded'
    order.refund = { status: 'success', amount: ticket.amount, reason: '平台仲裁退款', mode: 'mock', finishedAt: new Date().toISOString() }
    await returnSharing(order, '售后仲裁退款，分账回退')
    ticket.status = 'refunded'
  }
  save()
  return { ticket: ticket, tip: '已通过并执行退款（演示模式）' }
})

function setOrderStatus(ctx, status, logistics) {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const order = db.orders.find((o) => o.id === ctx.params.id && o.userId === ctx.user.id)
  if (!order) return ctx.fail(404, 40400, '订单不存在')
  order.status = status
  if (logistics) order.logistics = logistics
  save()
  return order
}

// ---------------- 收货地址 ----------------
add('GET', '/api/v1/addresses', (ctx) => (ctx.user ? db.addresses[ctx.user.id] || [] : []))

add('POST', '/api/v1/addresses', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const list = (db.addresses[ctx.user.id] = db.addresses[ctx.user.id] || [])
  const addr = Object.assign({ id: 'a' + crypto.randomUUID().slice(0, 6), isDefault: !list.length }, ctx.body || {})
  list.push(addr)
  save()
  return addr
})

add('POST', '/api/v1/addresses/:id/default', (ctx) => {
  if (!ctx.user) return ctx.fail(401, 40100, '请先登录')
  const list = db.addresses[ctx.user.id] || []
  list.forEach((a) => {
    a.isDefault = a.id === ctx.params.id
  })
  save()
  return list
})

// 支付成功后按配置自动发起分账（PLATFORM_FEE_RATE 控制平台抽成）
async function maybeSettle(order) {
  if (process.env.PROFIT_SHARING_ON_PAY === '0') return null
  try {
    const info = await settleOrder(order)
    if (info) {
      console.log(
        '[profitsharing] 订单 ' + order.id + ' 分账状态=' + info.status + ' 档口得 ' + info.amountFen + ' 分 / 平台佣金 ' + info.platformFeeFen + ' 分',
      )
    }
    return info
  } catch (e) {
    console.warn('[profitsharing] 订单 ' + order.id + ' 分账异常：' + e.message)
    return null
  }
}

function requireAdmin(ctx) {
  const token = process.env.ADMIN_TOKEN
  if (!token || ctx.req.headers['x-admin-token'] !== token) return ctx.fail(403, 40301, '无权限')
  return true
}

function publicUser(user) {
  return {
    id: user.id,
    nick: user.nick,
    phone: user.phone,
    certified: user.certified,
    certInfo: user.certInfo || null,
  }
}

function cartSummary(items, user) {
  const full = items
    .map((i) => (i.price !== undefined ? i : Object.assign({}, i, goodsById(i.goodsId))))
    .filter((i) => i && i.goodsId)
  const byStall = {}
  let total = 0
  let count = 0
  full.forEach((i) => {
    const price = i.price !== undefined ? i.price : (goodsById(i.goodsId) || {}).price || 0
    const line = price * (i.qty || 1)
    total += line
    count += i.qty || 1
    byStall[i.stallId] = (byStall[i.stallId] || 0) + line
  })
  let discount = 0
  Object.keys(byStall).forEach((stallId) => {
    const g = full.find((i) => i.stallId === stallId)
    const tiers = (g && g.subsidy) || (goodsById((g && g.goodsId) || '') || {}).subsidy
    discount += stallDiscount(tiers, byStall[stallId])
  })
  return {
    items: full,
    count,
    total: Math.round(total * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    payable: Math.round(Math.max(0, total - discount) * 100) / 100,
  }
}

export async function handle(req, res, ctxBase) {
  const found = match(req.method, ctxBase.pathname)
  const ctx = Object.assign({}, ctxBase, {
    req,
    res,
    user: currentUser(req),
    fail(status, code, msg) {
      const err = new Error(msg)
      err.httpStatus = status
      err.code = code
      throw err
    },
  })
  if (!found) {
    const err = new Error('接口不存在: ' + req.method + ' ' + ctxBase.pathname)
    err.httpStatus = 404
    err.code = 40400
    throw err
  }
  const result = await found.route.handler(Object.assign(ctx, { params: found.params }))
  return result
}
