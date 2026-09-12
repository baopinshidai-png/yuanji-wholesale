const store = require('../../utils/store.js')
const app = getApp()

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'unpaid', label: '待付款' },
  { key: 'unship', label: '待发货' },
  { key: 'shipped', label: '待收货' },
  { key: 'done', label: '已完成' }
]

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
    tabs: TABS,
    tab: 'all',
    orders: []
  },
  onLoad(query) {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      tab: query.tab || 'all'
    })
  },
  onShow() {
    const self = this
    // 订单列表以后端为准（后端不可用时 loadOrders 会返回本地缓存）
    store.loadOrders(this.data.tab).then(function () {
      self.refresh()
    }).catch(function () {
      self.refresh()
    })
  },
  refresh() {
    const tab = this.data.tab
    const list = store.state.orders
      .filter(function (o) { return tab === 'all' || o.status === tab })
      .map(function (o) {
        return Object.assign({}, o, {
          statusText: STATUS_TEXT[o.status] || o.status,
          count: o.items.reduce(function (n, i) { return n + i.qty }, 0)
        })
      })
    this.setData({ orders: list })
  },
  setTab(e) {
    const self = this
    this.setData({ tab: e.currentTarget.dataset.k }, function () { self.refresh() })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/mine/index' }) } })
  },
  detail(e) {
    wx.navigateTo({ url: '/pages/order-detail/index?id=' + e.currentTarget.dataset.id })
  },
  pay(e) {
    const id = e.currentTarget.dataset.id
    const self = this
    wx.showModal({
      title: '确认支付',
      content: '将调起微信支付完成付款。',
      confirmText: '确认支付',
      success: function (res) {
        if (!res.confirm) return
        store.payOrder(id).then(function (r) {
          self.refresh()
          wx.showToast({ title: r && r.mode === 'wechat' ? '支付成功' : '支付成功（演示）', icon: 'success' })
        }).catch(function (err) {
          wx.showToast({ title: (err && err.message) || '支付未完成', icon: 'none' })
        })
      }
    })
  },
  refund(e) {
    const id = e.currentTarget.dataset.id
    const self = this
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
          .refundOrder(id, reason)
          .then(function (r) {
            wx.hideLoading()
            self.refresh()
            wx.showToast({ title: r && r.mode === 'wechat' ? '退款申请已提交' : '退款成功（演示）', icon: 'none' })
          })
          .catch(function (err) {
            wx.hideLoading()
            wx.showToast({ title: (err && err.message) || '退款失败', icon: 'none' })
          })
      }
    })
  },
  ship(e) {
    const id = e.currentTarget.dataset.id
    const self = this
    wx.showModal({
      title: '模拟档口发货',
      content: '演示环境不接入真实物流，确认后生成运单号并进入「待收货」。',
      confirmText: '模拟发货',
      success: function (res) {
        if (!res.confirm) return
        store.setOrderStatus(id, 'shipped', 'SF' + String(Date.now()).slice(-10))
        self.refresh()
      }
    })
  },
  receive(e) {
    const id = e.currentTarget.dataset.id
    const self = this
    wx.showModal({
      title: '确认收货',
      content: '确认已收到货？确认后订单完成。',
      success: function (res) {
        if (!res.confirm) return
        store.setOrderStatus(id, 'done')
        self.refresh()
      }
    })
  },
  cancel(e) {
    const id = e.currentTarget.dataset.id
    const self = this
    wx.showModal({
      title: '取消订单',
      content: '确定取消这个订单？',
      success: function (res) {
        if (!res.confirm) return
        store.setOrderStatus(id, 'cancelled')
        self.refresh()
      }
    })
  },
  goHome() {
    wx.switchTab({ url: '/pages/home/index' })
  }
})
