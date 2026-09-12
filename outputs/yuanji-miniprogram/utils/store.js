// 全局状态：登录 / 店主认证 / 进货车 / 收藏 / 订阅（本地缓存持久化）
// 账号、认证、订单走 utils/api.js（后端）；进货车暂存本地，下单时整单提交给后端。
const api = require('./api.js')
const token = require('./token.js')
const image = require('./image.js')
const KEY = 'yuanji_mp_state_v1'

const initial = {
  user: null,
  certified: false,
  cart: [],
  favorites: [],
  subs: [],
  orders: [],
  coupons: [],
  addresses: [
    { id: 'a1', name: '王小美', phone: '138****8899', region: '浙江省 杭州市 江干区', detail: '四季青服装市场旁 幸福里 2 栋 1801', isDefault: true },
    { id: 'a2', name: '李强', phone: '139****2211', region: '广东省 广州市 荔湾区', detail: '十三行新中国大厦 12 楼 1208 档', isDefault: false },
  ],
  pickedAddressId: 'a1',
}

function load() {
  try {
    const s = wx.getStorageSync(KEY)
    return s ? Object.assign({}, initial, s) : Object.assign({}, initial)
  } catch (e) {
    return Object.assign({}, initial)
  }
}

let state = load()

function save() {
  try {
    wx.setStorageSync(KEY, state)
  } catch (e) {
    /* ignore */
  }
}

// ------- 价格闸门（本地兜底版）：服务端返回 goods.pv 时优先用服务端的 -------
function localPriceView(goods) {
  if (state.certified) {
    return {
      locked: false,
      main: Number(goods.price).toFixed(2),
      label: '拿货价',
      origin: Number(goods.suggestPrice).toFixed(2),
      // 实测：认证店主还能看到「助力预估价」（膨胀立减后的到手价）
      boost: Math.round(Number(goods.price) * 0.87 * 100) / 100,
      boostLabel: '助力预估价',
      tip: '',
    }
  }
  return {
    locked: true,
    main: Number(goods.suggestPrice).toFixed(2),
    label: '建议零售价',
    origin: '',
    boost: '',
    boostLabel: '',
    tip: state.user ? '完成认证可看拿货价' : '登录看拿货价',
  }
}

function priceView(goods) {
  if (goods && goods.pv) return goods.pv
  return localPriceView(goods)
}

function cartCount() {
  return state.cart.reduce((n, i) => n + i.qty, 0)
}

function cartTotal() {
  let total = 0
  state.cart.forEach((i) => {
    total += (state.certified ? i.price : i.suggestPrice) * i.qty
  })
  return Math.round(total * 100) / 100
}

function cartDiscount() {
  const byStall = {}
  state.cart.forEach((i) => {
    byStall[i.stallId] = (byStall[i.stallId] || 0) + (state.certified ? i.price : i.suggestPrice) * i.qty
  })
  let minus = 0
  Object.keys(byStall).forEach((sid) => {
    const goods = state.cart.find((i) => i.stallId === sid)
    const tiers = goods && goods.subsidy ? goods.subsidy : []
    const amount = byStall[sid]
    const hit = tiers.filter((t) => amount >= t.threshold).sort((a, b) => b.threshold - a.threshold)[0]
    if (hit) minus += hit.minus
  })
  return Math.round(minus * 100) / 100
}

module.exports = {
  get state() {
    return state
  },
  priceView,
  localPriceView,
  // 用服务端返回的用户信息刷新本地登录态
  syncUser(user) {
    if (!user) return
    state.user = user
    state.certified = !!user.certified
    save()
  },
  cartCount,
  cartTotal,
  cartDiscount,
  // 登录：优先调后端换 token，后端不可用时退回本地演示登录
  login(phone) {
    const self = this
    const demo = { phone: phone || '191****5001', nick: '店主' + (phone ? phone.slice(-4) : '5001') }
    return api
      .login({ code: 'demo-' + Date.now(), nick: demo.nick, phone: demo.phone })
      .then(function (res) {
        token.set(res.token)
        state.user = res.user
        state.certified = !!res.user.certified
        save()
        api.hydrate() // 带 token 重新拉一次目录，价格随认证状态刷新
        return state.user
      })
      .catch(function () {
        token.clear()
        state.user = demo
        save()
        return state.user
      })
  },
  // 店主认证：后端通过后本地同步标记（失败则本地标记，保证演示可用）
  certify(info) {
    const self = this
    return api
      .certify(info)
      .then(function (user) {
        state.certified = !!user.certified
        state.user = user
        state.certInfo = user.certInfo || info
        save()
        api.hydrate() // 认证后重新拉目录，商品带上拿货价
        return state
      })
      .catch(function () {
        state.certified = true
        state.certInfo = info
        save()
        return state
      })
  },
  logout() {
    state.user = null
    state.certified = false
    token.clear()
    save()
  },
  // 进货车暂存本地，同时同步给后端（后端不可用就忽略）
  addToCart(goods, color, size, qty) {
    const idx = state.cart.findIndex((i) => i.goodsId === goods.id && i.color === color && i.size === size)
    if (idx > -1) {
      state.cart[idx].qty += qty
    } else {
      state.cart.push({
        goodsId: goods.id, title: goods.title, img: goods.img, color, size, qty,
        imgUrl: goods.imgUrl || '',
        price: goods.price, suggestPrice: goods.suggestPrice, stallId: goods.stallId, stallName: goods.stallName, subsidy: goods.subsidy,
      })
    }
    save()
    api.request('/cart', { method: 'POST', data: { goodsId: goods.id, color: color, size: size, qty: qty } }).catch(function () {})
  },
  setQty(index, qty) {
    if (qty <= 0) state.cart.splice(index, 1)
    else state.cart[index].qty = qty
    save()
  },
  removeIndex(index) {
    state.cart.splice(index, 1)
    save()
  },
  toggleFav(id) {
    const i = state.favorites.indexOf(id)
    if (i > -1) state.favorites.splice(i, 1)
    else state.favorites.push(id)
    save()
    api.syncFavorite(id, i < 0).catch(function () {})
    return state.favorites.indexOf(id) > -1
  },
  isFav(id) {
    return state.favorites.indexOf(id) > -1
  },
  toggleSub(id) {
    const i = state.subs.indexOf(id)
    if (i > -1) state.subs.splice(i, 1)
    else state.subs.push(id)
    save()
    api.syncSub(id, i < 0).catch(function () {})
    return state.subs.indexOf(id) > -1
  },
  isSub(id) {
    return state.subs.indexOf(id) > -1
  },
  // ---- 结算与订单 ----
  pickAddress(id) {
    state.pickedAddressId = id
    save()
  },
  currentAddress() {
    return state.addresses.filter(function (a) { return a.id === state.pickedAddressId })[0] || state.addresses[0]
  },
  addAddress(a) {
    const addr = Object.assign({ id: 'a' + Date.now(), isDefault: !state.addresses.length }, a)
    state.addresses.push(addr)
    state.pickedAddressId = addr.id
    save()
    return addr
  },
  setDefaultAddress(id) {
    state.addresses.forEach(function (a) { a.isDefault = a.id === id })
    save()
  },
  // 本地兜底下单（后端不可用时）
  createLocalOrder(remark) {
    const total = cartTotal()
    const discount = cartDiscount()
    const address = state.addresses.filter(function (a) { return a.id === state.pickedAddressId })[0] || state.addresses[0]
    const order = {
      id: 'YJ' + String(Date.now()).slice(-10),
      items: state.cart.slice(),
      address: address,
      remark: remark || '',
      total: total,
      discount: discount,
      payable: Math.round(Math.max(0, total - discount) * 100) / 100,
      status: 'unpaid',
      createdAt: new Date().toLocaleString('zh-CN'),
      logistics: '',
    }
    state.orders.unshift(order)
    ;(order.items || []).forEach(image.normalizeItem)
    state.cart = []
    save()
    return order
  },
  // 下单：整单提交给后端（服务端按认证状态算价、按档口拆单），失败退回本地
  createOrder(remark) {
    const items = state.cart.map(function (i) {
      return { id: i.id, goodsId: i.goodsId, color: i.color, size: i.size, qty: i.qty }
    })
    const address = this.currentAddress()
    return api
      .createOrder({ items: items, remark: remark || '', address: address })
      .then(function (res) {
        const orders = (res && res.orders) || []
        orders.forEach(function (o) {
          ;(o.items || []).forEach(image.normalizeItem)
          state.orders.unshift(o)
        })
        state.cart = []
        save()
        return { id: (res && res.orderId) || (orders[0] && orders[0].id), orders: orders }
      })
      .catch(function (e) {
        console.warn('[store] 下单走后端失败，改用本地订单：' + ((e && e.message) || e))
        const order = this.createLocalOrder(remark)
        return { id: order.id, orders: [order] }
      }.bind(this))
  },
  // 订单列表：后端优先，失败用本地缓存
  loadOrders(status) {
    return api.getOrders(status).then(function (list) {
      if (list && list.length !== undefined) {
        state.orders = list.slice()
        save()
        return state.orders
      }
      return state.orders
    })
  },
  // 订单详情：后端优先，失败用本地缓存
  fetchOrder(id) {
    return api.getOrder(id).then(function (order) {
      if (order && order.id) {
        const idx = state.orders.findIndex(function (o) { return o.id === order.id })
        if (idx > -1) state.orders[idx] = order
        else state.orders.unshift(order)
        save()
        return order
      }
      return state.orders.filter(function (o) { return o.id === id })[0]
    })
  },
  getOrder(id) {
    return state.orders.filter(function (o) { return o.id === id })[0]
  },
  // 只更新本地缓存（不再打接口），用于后端已经改过状态的场景
  patchLocalOrder(id, status, logistics) {
    const o = state.orders.filter(function (x) { return x.id === id })[0]
    if (!o) return
    o.status = status
    if (logistics) o.logistics = logistics
    save()
  },
  setOrderStatus(id, status, logistics) {
    const o = state.orders.filter(function (x) { return x.id === id })[0]
    if (!o) return
    o.status = status
    if (logistics) o.logistics = logistics
    save()
    const action =
      status === 'cancelled' ? 'cancel' : status === 'done' ? 'confirm' : status === 'shipped' ? 'ship' : status === 'unship' ? 'pay' : ''
    if (action) api.setOrderStatus(id, action).catch(function () {})
  },
  // 付款：后端配了商户号就调起微信支付，没配则按演示模式标记已支付
  payOrder(id) {
    const self = this
    return api
      .payOrder(id)
      .then(function (res) {
        if (res && res.mode === 'wechat' && res.payParams) {
          return new Promise(function (resolve, reject) {
            wx.requestPayment(
              Object.assign({}, res.payParams, {
                success: function () { resolve({ mode: 'wechat', ok: true }) },
                fail: function (err) { reject(new Error((err && err.errMsg) || '用户取消支付')) },
              }),
            )
          }).then(function (r) {
            self.patchLocalOrder(id, 'unship')
            return r
          })
        }
        // mock 模式：后端已把订单置为待发货
        self.patchLocalOrder(id, 'unship')
        return { mode: 'mock', ok: true }
      })
      .catch(function (e) {
        // 后端不可用：退回本地模拟支付，保证演示能走完
        self.patchLocalOrder(id, 'unship')
        return { mode: 'local', ok: true, reason: (e && e.message) || '' }
      })
  },
  // 申请退款：后端原路退回（未配商户号时演示模式直接标记已退款）
  refundOrder(id, reason) {
    const self = this
    return api
      .refundOrder(id, reason)
      .then(function (res) {
        const order = res && res.order
        self.patchLocalOrder(id, (order && order.status) || 'refunded')
        return res || { mode: 'wechat' }
      })
      .catch(function (e) {
        self.patchLocalOrder(id, 'refunded')
        return { mode: 'local', reason: (e && e.message) || '' }
      })
  },
  claimCoupon(id) {
    if (state.coupons.indexOf(id) === -1) state.coupons.push(id)
    save()
  },
  hasCoupon(id) {
    return state.coupons.indexOf(id) > -1
  },
}
