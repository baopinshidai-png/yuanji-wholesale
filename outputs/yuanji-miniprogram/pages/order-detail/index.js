const store = require('../../utils/store.js')
const api = require('../../utils/api.js')
const app = getApp()

const STATUS_TEXT = {
  unpaid: '待付款',
  unship: '待发货',
  shipped: '待收货',
  done: '已完成',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款'
}

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    order: null,
    statusText: '',
    count: 0,
    trace: null
  },
  onLoad(query) {
    this.id = query.id
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    })
    this.load()
  },
  onShow() {
    this.load()
  },
  // 详情以后端为准，失败退回本地缓存
  load() {
    const self = this
    store.fetchOrder(this.id).then(function () {
      self.refresh()
    }).catch(function () {
      self.refresh()
    })
    // 物流轨迹（演示轨迹或真实快递查询）
    api.orderLogistics(this.id).then(function (trace) {
      if (trace && trace.steps && trace.steps.length) self.setData({ trace: trace })
    })
  },
  refresh() {
    const o = store.getOrder(this.id)
    if (!o) {
      wx.showToast({ title: '订单不存在', icon: 'none' })
      return
    }
    this.setData({
      order: o,
      statusText: STATUS_TEXT[o.status] || o.status,
      count: o.items.reduce(function (n, i) { return n + i.qty }, 0)
    })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.navigateTo({ url: '/pages/orders/index' }) } })
  },
  copy() {
    wx.setClipboardData({ data: this.data.order.id })
  },
  afterSale() {
    wx.navigateTo({ url: '/pages/aftersale/index?orderId=' + this.data.order.id })
  },
  refund() {
    const self = this
    const o = this.data.order
    wx.showModal({
      title: '申请退款',
      content: '退款将原路退回，确认提交申请？',
      editable: true,
      placeholderText: '退款原因（选填）',
      confirmText: '提交申请',
      success: function (res) {
        if (!res.confirm) return
        const reason = (res.content || '').trim() || '用户申请退款'
        wx.showLoading({ title: '提交中', mask: true })
        store
          .refundOrder(o.id, reason)
          .then(function (r) {
            wx.hideLoading()
            self.load()
            wx.showToast({ title: r && r.mode === 'wechat' ? '退款申请已提交' : '退款成功（演示）', icon: 'none' })
          })
          .catch(function (err) {
            wx.hideLoading()
            wx.showToast({ title: (err && err.message) || '退款失败', icon: 'none' })
          })
      }
    })
  },
  act() {
    const self = this
    const o = this.data.order
    if (o.status === 'unpaid') {
      wx.showModal({
        title: '确认支付',
        content: '将调起微信支付完成付款。',
        confirmText: '确认支付',
        success: function (res) {
          if (!res.confirm) return
          store.payOrder(o.id).then(function () {
            self.load()
          }).catch(function (err) {
            wx.showToast({ title: (err && err.message) || '支付未完成', icon: 'none' })
          })
        }
      })
    } else if (o.status === 'unship') {
      store.setOrderStatus(o.id, 'shipped', 'SF' + String(Date.now()).slice(-10))
      this.refresh()
      wx.showToast({ title: '已模拟发货', icon: 'success' })
    } else if (o.status === 'shipped') {
      store.setOrderStatus(o.id, 'done')
      this.refresh()
      wx.showToast({ title: '已确认收货', icon: 'success' })
    } else {
      wx.switchTab({ url: '/pages/home/index' })
    }
  }
})
