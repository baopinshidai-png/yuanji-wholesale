// 数据访问层：优先走后端接口（outputs/yuanji-server），失败时退回本地假数据保证离线可演示。
// 后端接口清单见 outputs/docs/产品与技术方案.md 第六节；服务端地址在 utils/config.js。
const config = require('./config.js')
const token = require('./token.js')
const data = require('./data.js')
const image = require('./image.js')

let remoteOk = false
const listeners = []

function isRemote() {
  return remoteOk
}

function onChange(fn) {
  listeners.push(fn)
}

function emit() {
  remoteOk = true
  listeners.splice(0).forEach(function (fn) {
    try {
      fn()
    } catch (e) {
      /* ignore */
    }
  })
}

// ---------- 基础请求 ----------
// 去掉 undefined / 空字符串参数，避免把 sort=undefined 这种脏参数发给后端
function clean(obj) {
  const out = {}
  Object.keys(obj || {}).forEach(function (k) {
    const v = obj[k]
    if (v !== undefined && v !== null && v !== '') out[k] = v
  })
  return out
}

function request(path, options) {
  return new Promise(function (resolve, reject) {
    if (!config.USE_REMOTE) {
      reject(new Error('已关闭远程接口'))
      return
    }
    const header = { 'content-type': 'application/json' }
    // /stall/* 走档口工作台凭证，其余走买家登录凭证
    const useStall = path.indexOf('/stall/') === 0
    const auth = useStall ? token.getStall() : token.get()
    if (auth) header.Authorization = 'Bearer ' + auth
    wx.request({
      url: config.BASE_URL + path,
      method: (options && options.method) || 'GET',
      data: clean(options && options.data),
      header: header,
      timeout: config.TIMEOUT,
      success: function (res) {
        const body = res.data || {}
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 0) resolve(body.data)
        else reject(new Error(body.msg || '接口错误 ' + res.statusCode))
      },
      fail: function (err) {
        reject(new Error((err && err.errMsg) || '网络异常'))
      },
    })
  })
}

// 读接口：失败就用本地数据兜底（离线演示 / 后端没启动时不影响演示）
function read(promise, fallback) {
  return promise.catch(function (e) {
    console.warn('[api] 走本地数据：' + path0(e))
    return typeof fallback === 'function' ? fallback() : fallback
  })
}

function path0(e) {
  return (e && e.message) || e
}

// ---------- 本地兜底实现（等价于旧版 mock） ----------
function localGoodsList(params) {
  const p = params || {}
  let list = data.GOODS.slice()
  if (p.market) list = list.filter((g) => g.market === p.market)
  if (p.category) list = list.filter((g) => g.title.indexOf(p.category) > -1)
  if (p.kw) list = list.filter((g) => g.title.indexOf(p.kw) > -1 || g.stallName.indexOf(p.kw) > -1)
  if (p.filter === '24h发货') list = list.filter((g) => g.services.indexOf('24H发货') > -1)
  else if (p.filter && p.filter !== '全部') list = list.filter((g) => g.market === p.filter)
  if (p.sort === 'sold') list.sort((a, b) => b.joined - a.joined)
  if (p.sort === 'new') list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
  if (p.sort === 'price') list.sort((a, b) => a.price - b.price)
  return list
}

// ---------- 目录数据 ----------
function getHome() {
  return read(request('/home'), () => ({
    gifts: [],
    boards: [],
    markets: data.MARKETS,
    filters: data.FILTERS,
    categories: { cats: data.CATEGORIES, hot: data.HOT_CATEGORIES },
  })).then(function (res) {
    if (res && res.markets && res.markets.length) emit()
    return res
  })
}

function getGoodsList(params) {
  return read(
    request('/goods', { data: params }).then((r) => image.normalizeList(r.list)),
    () => image.normalizeList(localGoodsList(params)),
  )
}

function getGoodsDetail(id) {
  return read(request('/goods/' + id), () => data.getGoods(id) || data.GOODS[0]).then(image.normalizeGoods)
}

function searchGoods(kw, sort) {
  return read(
    request('/search', { data: { kw: kw, sort: sort } }).then((r) => r.list),
    () => (kw ? data.searchGoods(kw) : data.GOODS.slice()),
  ).then(image.normalizeList)
}

function getStalls() {
  return read(request('/stalls'), () => data.STALLS)
}

function getStall(id) {
  return read(request('/stalls/' + id).then((r) => r.stall), () => data.getStall(id))
}

function getStallGoods(id) {
  return read(request('/stalls/' + id).then((r) => r.goods), () => data.goodsByStall(id)).then(image.normalizeList)
}

function getMaterials() {
  return read(request('/materials'), () => data.GOODS.slice(0, 12)).then(image.normalizeList)
}

function getCategories() {
  return read(request('/categories'), () => ({ cats: data.CATEGORIES, hot: data.HOT_CATEGORIES }))
}

// 启动时把目录数据灌进 data.js（页面里读 data.GOODS / data.STALLS 的地方不用改）
function hydrate() {
  if (!config.USE_REMOTE) return Promise.resolve(false)
  return Promise.all([getGoodsList({ pageSize: 200 }), getStalls(), getCategories()])
    .then(function (res) {
      const goods = res[0]
      const stalls = res[1]
      const cats = res[2]
      if (goods && goods.length) {
        image.normalizeList(goods)
        data.GOODS.length = 0
        goods.forEach((g) => data.GOODS.push(g))
      }
      if (stalls && stalls.length) {
        data.STALLS.length = 0
        stalls.forEach((s) => data.STALLS.push(s))
      }
      if (cats && cats.cats) {
        data.CATEGORIES.length = 0
        cats.cats.forEach((c) => data.CATEGORIES.push(c))
      }
      if (cats && cats.hot) {
        data.HOT_CATEGORIES.length = 0
        cats.hot.forEach((c) => data.HOT_CATEGORIES.push(c))
      }
      emit()
      console.log('[api] 目录数据已从后端加载：商品 ' + data.GOODS.length + ' / 档口 ' + data.STALLS.length)
      return true
    })
    .catch(function (e) {
      console.warn('[api] 后端不可用，继续用本地假数据：' + path0(e))
      return false
    })
}

// ---------- 价格闸门 ----------
function priceView(goods) {
  if (goods && goods.pv) return goods.pv // 服务端已按认证状态算好
  const store = require('./store.js')
  return store.localPriceView(goods)
}

// ---------- 卡券 ----------
function getCoupons() {
  return read(request('/coupons'), () =>
    data.COUPONS.map(function (c) {
      return Object.assign({}, c, { claimed: false })
    }),
  )
}

function claimCoupon(id) {
  return read(request('/coupons/' + id + '/claim', { method: 'POST' }), () => ({ claimed: true }))
}

// ---------- 账号 ----------
function login(payload) {
  return request('/auth/login', { method: 'POST', data: payload || {} })
}

function getUser() {
  return read(request('/user/profile'), () => null)
}

function certify(info) {
  return request('/user/cert', { method: 'POST', data: info })
}

function isCertified() {
  return read(request('/user/cert').then((r) => r.certified), () => false)
}

// ---------- 收藏 / 订阅 ----------
function getFavorites() {
  return read(request('/favorites'), () => [])
}

function syncFavorite(goodsId, on) {
  return read(
    on
      ? request('/favorites', { method: 'POST', data: { goodsId: goodsId } })
      : request('/favorites/' + goodsId, { method: 'DELETE' }),
    () => ({ ok: false }),
  )
}

function getSubscriptions() {
  return read(request('/subscriptions'), () => [])
}

function syncSub(stallId, on) {
  return read(
    on
      ? request('/subscriptions', { method: 'POST', data: { stallId: stallId } })
      : request('/subscriptions/' + stallId, { method: 'DELETE' }),
    () => ({ ok: false }),
  )
}

// ---------- 订单 ----------
function previewOrder() {
  return read(request('/orders/preview', { method: 'POST' }), () => ({ total: 0, discount: 0, payable: 0 }))
}

function createOrder(payload) {
  return request('/orders', { method: 'POST', data: payload || {} })
}

function getOrders(status) {
  return read(
    request('/orders', { data: { status: status || 'all' } }).then((r) => r.list),
    () => null, // null 表示后端不可用，调用方自己用本地订单兜底
  ).then(function (list) {
    if (list) list.forEach(function (o) { if (o.items) o.items.forEach(image.normalizeItem) })
    return list
  })
}

function getOrder(id) {
  return read(request('/orders/' + id), () => null).then(function (o) {
    if (o && o.items) o.items.forEach(image.normalizeItem)
    return o
  })
}

function setOrderStatus(id, action, logistics) {
  return read(
    request('/orders/' + id + '/' + action, { method: 'POST', data: { logistics: logistics } }),
    () => null,
  )
}

// 去付款：后端返回 { mode:'wechat', payParams } 或 { mode:'mock', order }
function payOrder(id) {
  return request('/orders/' + id + '/pay', { method: 'POST' })
}

// 主动查单（支付回调丢失时用）
function getPayStatus(id) {
  return read(request('/orders/' + id + '/pay-status'), () => null)
}

// 申请退款：后端返回 { mode:'wechat'|'mock', order }
function refundOrder(id, reason) {
  return request('/orders/' + id + '/refund', { method: 'POST', data: { reason: reason || '' } })
}

function getRefundStatus(id) {
  return read(request('/orders/' + id + '/refund-status'), () => null)
}

// ---------- 档口工作台（商家端） ----------
function stallLogin(code) {
  return request('/stall/login', { method: 'POST', data: { code: code } })
}

function stallStats() {
  return request('/stall/stats').catch(function () { return null })
}

function stallOrders(status) {
  return request('/stall/orders', { data: { status: status || 'all' } }).then(function (r) {
    return (r.list || []).map(function (o) {
      if (o.items) o.items.forEach(image.normalizeItem)
      return o
    })
  })
}

function stallShip(orderId, logistics) {
  return request('/stall/orders/' + orderId + '/ship', { method: 'POST', data: { logistics: logistics } })
}

function stallGoods() {
  return request('/stall/goods').then(function (list) {
    return (list || []).map(function (g) {
      return image.normalizeGoods(g)
    })
  })
}

function stallToggleGoods(goodsId, off) {
  return request('/stall/goods/' + goodsId + '/toggle', { method: 'POST', data: { off: off } })
}

// 图片上传：把本地图片读成 base64 提交，后端存文件并返回可访问 URL
function uploadImage(base64, contentType, filename) {
  return request('/upload', {
    method: 'POST',
    data: { data: base64, contentType: contentType || 'image/jpeg', filename: filename || 'cover.jpg' },
  })
}

function stallCreateGoods(payload) {
  return request('/stall/goods', { method: 'POST', data: payload })
}

function stallUpdateGoods(goodsId, payload) {
  return request('/stall/goods/' + goodsId + '/update', { method: 'POST', data: payload })
}

// 档口资料与结算账户（含审核状态）
function stallProfile() {
  return request('/stall/profile')
}

function stallSaveProfile(payload) {
  return request('/stall/profile', { method: 'POST', data: payload })
}

function stallSettlements() {
  return request('/stall/settlements')
}

function stallRemoveGoods(goodsId) {
  return request('/stall/goods/' + goodsId + '/remove', { method: 'POST' })
}

// 物流轨迹
function orderLogistics(orderId) {
  return request('/orders/' + orderId + '/logistics').catch(function () { return null })
}

// ---------- 售后工单 ----------
function createAfterSale(payload) {
  return request('/aftersales', { method: 'POST', data: payload })
}

function getAfterSales() {
  return request('/aftersales').then(function (r) { return r.list })
}

function getAfterSale(id) {
  return request('/aftersales/' + id)
}

function stallAfterSales() {
  return request('/stall/aftersales').then(function (r) { return r.list })
}

function stallHandleAfterSale(id, agree, note) {
  return request('/stall/aftersales/' + id + '/handle', {
    method: 'POST',
    data: { agree: agree, note: note || '' },
  })
}

// 买家填写退货运单号
function submitAfterSaleReturn(id, logistics) {
  return request('/aftersales/' + id + '/return', { method: 'POST', data: { logistics: logistics } })
}

// 档口确认收到退货 → 退款
function stallConfirmAfterSaleReceived(id) {
  return request('/stall/aftersales/' + id + '/received', { method: 'POST' })
}

module.exports = {
  request,
  isRemote,
  onChange,
  hydrate,
  getHome,
  getGoodsList,
  getGoodsDetail,
  searchGoods,
  getStalls,
  getStall,
  getStallGoods,
  getCategories,
  getMaterials,
  priceView,
  getCoupons,
  claimCoupon,
  login,
  getUser,
  certify,
  isCertified,
  getFavorites,
  syncFavorite,
  getSubscriptions,
  syncSub,
  previewOrder,
  createOrder,
  getOrders,
  getOrder,
  setOrderStatus,
  payOrder,
  getPayStatus,
  refundOrder,
  getRefundStatus,
  stallLogin,
  stallStats,
  stallOrders,
  stallShip,
  stallGoods,
  stallToggleGoods,
  uploadImage,
  stallCreateGoods,
  stallUpdateGoods,
  stallProfile,
  stallSaveProfile,
  stallSettlements,
  stallRemoveGoods,
  orderLogistics,
  createAfterSale,
  getAfterSales,
  getAfterSale,
  stallAfterSales,
  stallHandleAfterSale,
  submitAfterSaleReturn,
  stallConfirmAfterSaleReceived,
}
