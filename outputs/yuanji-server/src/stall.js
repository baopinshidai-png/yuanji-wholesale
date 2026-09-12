// 档口工作台（商家端最小可用）：邀请码登录 → 接单发货 → 商品上下架 → 经营数据
import crypto from 'node:crypto'
import { db, save } from './db.js'
import { signToken, verifyToken, tokenFromRequest } from './auth.js'
import seed from './seed.js'

const TTL = 7 * 24 * 3600 * 1000

export const stallById = (id) => seed.stalls.find((s) => s.id === id)

// 平台给档口生成/查看邀请码
export function ensureInviteCode(stallId) {
  db.stallCodes = db.stallCodes || {}
  if (!db.stallCodes[stallId]) {
    db.stallCodes[stallId] = stallId.toUpperCase() + '-' + crypto.randomInt(1000, 9999)
    save()
  }
  return db.stallCodes[stallId]
}

export function stallByCode(code) {
  db.stallCodes = db.stallCodes || {}
  const key = Object.keys(db.stallCodes).find(
    (id) => String(db.stallCodes[id]).toUpperCase() === String(code || '').toUpperCase(),
  )
  return key ? stallById(key) : null
}

export function currentStall(req) {
  const payload = verifyToken(tokenFromRequest(req))
  if (!payload || !payload.stallId) return null
  return stallById(payload.stallId)
}

export function stallToken(stallId) {
  return signToken({ stallId: stallId, exp: Date.now() + TTL })
}

// ---------- 档口资料 / 结算账户（含平台审核状态） ----------
export function getProfile(stallId) {
  db.stallProfiles = db.stallProfiles || {}
  return (
    db.stallProfiles[stallId] || {
      stallId: stallId,
      status: 'none',
      contact: '',
      phone: '',
      licenseNo: '',
      city: '',
      account: null,
    }
  )
}

export function saveProfile(stallId, payload) {
  const p = payload || {}
  if (!p.contact) return { error: '请填写联系人' }
  if (!p.phone) return { error: '请填写联系电话' }
  const prev = getProfile(stallId)
  const account = p.accountAccount
    ? {
        type: p.accountType || 'MERCHANT_ID',
        account: p.accountAccount,
        name: p.accountName || p.contact,
        status: 'pending',
      }
    : prev.account || null

  const profile = {
    stallId: stallId,
    contact: p.contact,
    phone: p.phone,
    licenseNo: p.licenseNo || '',
    city: p.city || '',
    account: account,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reviewNote: '',
  }
  if (account) {
    db.stallAccounts = db.stallAccounts || {}
    db.stallAccounts[stallId] = Object.assign({}, account, { updatedAt: new Date().toISOString() })
    profile.account = db.stallAccounts[stallId] // 与结算账户保持同一份数据
  }
  db.stallProfiles = db.stallProfiles || {}
  db.stallProfiles[stallId] = profile
  save()
  return { profile: profile }
}

export function reviewProfile(stallId, approve, note) {
  const profile = getProfile(stallId)
  if (profile.status === 'none') return { error: '该档口还没提交资料' }
  profile.status = approve ? 'approved' : 'rejected'
  profile.reviewedAt = new Date().toISOString()
  profile.reviewNote = note || ''
  db.stallProfiles = db.stallProfiles || {}
  db.stallProfiles[stallId] = profile
  const account = (db.stallAccounts || {})[stallId]
  if (account) {
    account.status = approve ? 'approved' : 'rejected'
    account.reviewNote = profile.reviewNote
  }
  if (profile.account) {
    profile.account.status = approve ? 'approved' : 'rejected'
    profile.account.reviewNote = profile.reviewNote
  }
  save()
  return { profile: profile }
}

export function listProfiles(status) {
  db.stallProfiles = db.stallProfiles || {}
  return Object.keys(db.stallProfiles)
    .map((id) => db.stallProfiles[id])
    .filter((p) => !status || status === 'all' || p.status === status)
    .map((p) =>
      Object.assign({}, p, { stallName: (stallById(p.stallId) || {}).name || p.stallId }),
    )
}

// 档口订单（只看自己档口的）
export function stallOrders(stallId, status) {
  return db.orders
    .filter((o) => o.stallId === stallId)
    .filter((o) => !status || status === 'all' || o.status === status)
    .map((o) => ({
      id: o.id,
      status: o.status,
      payable: o.payable,
      discount: o.discount,
      count: o.items.reduce((n, i) => n + i.qty, 0),
      items: o.items,
      address: o.address,
      remark: o.remark,
      logistics: o.logistics || '',
      settle: o.settle || null,
      paidAt: o.paidAt || '',
      createdAt: o.createdAt,
    }))
}

export function shipStallOrder(stallId, orderId, logistics) {
  const order = db.orders.find((o) => o.id === orderId && o.stallId === stallId)
  if (!order) return { error: '订单不存在' }
  if (order.status !== 'unship') return { error: '只有待发货订单可以发货' }
  order.status = 'shipped'
  order.logistics = logistics || 'SF' + String(Date.now()).slice(-10)
  order.shippedAt = new Date().toISOString()
  save()
  return { order: order }
}

export function stallStats(stallId) {
  const mine = db.orders.filter((o) => o.stallId === stallId)
  const paid = mine.filter((o) => ['unship', 'shipped', 'done', 'refunding', 'refunded'].indexOf(o.status) > -1)
  const today = String(new Date().toISOString()).slice(0, 10)
  const todayPaid = paid.filter((o) => String(o.paidAt || o.createdAt || '').slice(0, 10) === today)
  const settledAmount = mine
    .filter((o) => o.settle && o.settle.status === 'success')
    .reduce((n, o) => n + (o.settle.amountFen || 0), 0)
  return {
    todayOrders: todayPaid.length,
    todayAmount: Math.round(todayPaid.reduce((n, o) => n + o.payable, 0) * 100) / 100,
    unship: mine.filter((o) => o.status === 'unship').length,
    shipped: mine.filter((o) => o.status === 'shipped').length,
    done: mine.filter((o) => o.status === 'done').length,
    refunding: mine.filter((o) => ['refunding', 'refunded'].indexOf(o.status) > -1).length,
    settledAmount: settledAmount / 100,
    totalOrders: mine.length,
  }
}

// 档口结算明细（已分账 / 挂账 / 已回退）
export function stallSettlements(stallId) {
  const rows = db.orders
    .filter((o) => o.stallId === stallId && o.settle)
    .map((o) => ({
      orderId: o.id,
      status: o.settle.status,
      amount: (o.settle.amountFen || 0) / 100,
      platformFee: (o.settle.platformFeeFen || 0) / 100,
      orderPayable: o.payable,
      settledAt: o.settle.settledAt || '',
      reason: o.settle.reason || '',
      createdAt: o.createdAt,
    }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const sum = (status) => rows.filter((r) => r.status === status).reduce((n, r) => n + r.amount, 0)
  return {
    rows: rows,
    totals: {
      settled: Math.round(sum('success') * 100) / 100,
      hold: Math.round(sum('hold') * 100) / 100,
      returned: Math.round(sum('returned') * 100) / 100,
      count: rows.length,
    },
  }
}

// 商品删除（软删除：档口与买家都不再可见）
export function removeGoods(stallId, goodsId) {
  const goods = uploadedGoods().find((g) => g.id === goodsId && g.stallId === stallId)
  if (!goods) return { error: '只能删除自己上架的商品' }
  db.goodsDeleted = db.goodsDeleted || {}
  db.goodsDeleted[goodsId] = true
  save()
  return { goodsId: goodsId, deleted: true }
}

export function deletedGoodsIds() {
  db.goodsDeleted = db.goodsDeleted || {}
  return Object.keys(db.goodsDeleted)
}

// 商品列表（含上下架状态）
export function uploadedGoods() {
  return db.stallGoods || []
}

// 档口上架新商品（title/price/imgUrl 必填）
export function createGoods(stallId, payload) {
  const stall = stallById(stallId)
  if (!stall) return { error: '档口不存在' }
  const p = payload || {}
  if (!p.title) return { error: '请填写商品标题' }
  const price = Number(p.price)
  if (!(price > 0)) return { error: '请填写正确的拿货价' }
  if (!p.imgUrl) return { error: '请先上传商品图片' }

  const colors = String(p.colors || '默认').split(/[,，/\s]+/).filter(Boolean)
  const sizes = String(p.sizes || '均码').split(/[,，/\s]+/).filter(Boolean)
  const imgs = (Array.isArray(p.imgs) && p.imgs.length ? p.imgs : [p.imgUrl]).filter(Boolean).slice(0, 5)
  if (!imgs.length) return { error: '请先上传商品图片' }
  const now = new Date()
  const day = String(now.getMonth() + 1).padStart(2, '0') + '.' + String(now.getDate()).padStart(2, '0')
  const goods = {
    id: 'x' + crypto.randomUUID().slice(0, 8),
    title: p.title,
    goodsNo: p.goodsNo || 'X' + String(Date.now()).slice(-6),
    stallId: stall.id,
    stallName: stall.name,
    market: stall.market,
    price: price,
    suggestPrice: Number(p.suggestPrice) > 0 ? Number(p.suggestPrice) : Math.round(price * 2.6 * 100) / 100,
    img: imgs[0],
    imgUrl: imgs[0],
    imgs: [{ label: '实拍图', list: imgs }],
    stock: Math.max(0, Number(p.stock) >= 0 ? Number(p.stock) : 100),
    skuStock: normalizeSkuStock(p.skuStock, colors, sizes, Number(p.stock) >= 0 ? Number(p.stock) : 100),
    joined: 0,
    day: day,
    isNew: true,
    hasVideo: false,
    fastShip: true,
    colors: colors.map(function (name) {
      return { name: name, hex: '#dddddd' }
    }),
    sizes: sizes,
    params: [
      { k: '面料', v: p.fabric || '见实拍' },
      { k: '季节', v: p.season || '秋' },
      { k: '版型', v: p.fit || '常规' },
    ],
    services: ['24H发货', '慢必赔', '批量采购价'],
    subsidy: stall.subsidy,
    shipCity: stall.shipCity,
    returns: !!stall.returns,
    lastShipDate: '09月21日',
    createdBy: 'stall',
    createdAt: now.toISOString(),
  }
  db.stallGoods = db.stallGoods || []
  db.stallGoods.unshift(goods)
  save()
  return { goods: goods }
}

export function updateGoods(stallId, goodsId, payload) {
  const goods = uploadedGoods().find((g) => g.id === goodsId && g.stallId === stallId)
  if (!goods) return { error: '只能编辑自己档口上架的商品' }
  const p = payload || {}
  if (p.title) goods.title = p.title
  if (Number(p.price) > 0) goods.price = Number(p.price)
  if (Number(p.suggestPrice) > 0) goods.suggestPrice = Number(p.suggestPrice)
  if (p.imgUrl) {
    goods.img = p.imgUrl
    goods.imgUrl = p.imgUrl
    goods.imgs = [{ label: '实拍图', list: [p.imgUrl] }]
  }
  if (Array.isArray(p.imgs) && p.imgs.length) {
    const imgs = p.imgs.filter(Boolean).slice(0, 5)
    goods.img = imgs[0]
    goods.imgUrl = imgs[0]
    goods.imgs = [{ label: '实拍图', list: imgs }]
  }
  if (p.stock !== undefined && p.stock !== '') goods.stock = Math.max(0, Number(p.stock) || 0)
  if (p.skuStock) {
    const colors = goods.colors.map((c) => c.name)
    goods.skuStock = normalizeSkuStock(p.skuStock, colors, goods.sizes, goods.stock)
  }
  if (p.colors) {
    goods.colors = String(p.colors)
      .split(/[,，/\s]+/)
      .filter(Boolean)
      .map((name) => ({ name: name, hex: '#dddddd' }))
  }
  if (p.sizes) goods.sizes = String(p.sizes).split(/[,，/\s]+/).filter(Boolean)
  goods.updatedAt = new Date().toISOString()
  save()
  return { goods: goods }
}

export function stallGoods(stallId) {
  db.goodsOff = db.goodsOff || {}
  return seed.goods
    .concat(uploadedGoods())
    .filter((g) => g.stallId === stallId)
    .map((g) => ({
      id: g.id,
      title: g.title,
      img: g.img,
      imgUrl: g.imgUrl || '',
      price: g.price,
      suggestPrice: g.suggestPrice,
      joined: g.joined,
      day: g.day,
      off: !!db.goodsOff[g.id],
      uploaded: g.createdBy === 'stall',
      stock: g.stock === undefined ? 9999 : g.stock,
      skuStock: g.skuStock || null,
      imgCount: (g.imgs && g.imgs[0] && g.imgs[0].list.length) || 1,
    }))
}

// 规格库存：{"颜色/尺码": 件数}；没填的组合默认用商品级库存
function normalizeSkuStock(input, colors, sizes, fallback) {
  const out = {}
  const map = input && typeof input === 'object' ? input : {}
  colors.forEach(function (c) {
    const name = typeof c === 'string' ? c : c.name
    sizes.forEach(function (s) {
      const key = name + '/' + s
      const v = map[key]
      out[key] = v === undefined || v === '' ? fallback : Math.max(0, Number(v) || 0)
    })
  })
  return out
}

export { normalizeSkuStock }

export function toggleGoods(stallId, goodsId, off) {
  const goods = seed.goods.concat(uploadedGoods()).find((g) => g.id === goodsId && g.stallId === stallId)
  if (!goods) return { error: '商品不存在' }
  db.goodsOff = db.goodsOff || {}
  if (off) db.goodsOff[goodsId] = true
  else delete db.goodsOff[goodsId]
  save()
  return { goodsId: goodsId, off: !!db.goodsOff[goodsId] }
}

export function offGoodsIds() {
  db.goodsOff = db.goodsOff || {}
  return Object.keys(db.goodsOff)
}
