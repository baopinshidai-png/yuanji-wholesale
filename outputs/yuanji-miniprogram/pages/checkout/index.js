const store = require('../../utils/store.js')
const app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    items: [],
    address: null,
    total: '0.00',
    discount: '0.00',
    payable: '0.00',
    remark: '',
    payType: '微信支付',
    showDetail: false
  },
  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    })
    this.refresh()
  },
  onShow() {
    this.refresh()
  },
  refresh() {
    const total = store.cartTotal()
    const discount = store.cartDiscount()
    this.setData({
      items: store.state.cart,
      address: store.currentAddress(),
      total: total.toFixed(2),
      discount: discount.toFixed(2),
      payable: Math.max(0, total - discount).toFixed(2)
    })
  },
  onRemark(e) {
    this.setData({ remark: e.detail.value })
  },
  toggleDetail() {
    this.setData({ showDetail: !this.data.showDetail })
  },
  pickAddress() {
    wx.navigateTo({ url: '/pages/address/index?pick=1' })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/cart/index' }) } })
  },
  submit() {
    const self = this
    if (!this.data.items.length) {
      wx.showToast({ title: '进货车是空的', icon: 'none' })
      return
    }
    if (!store.state.certified) {
      wx.showModal({
        title: '需要店主认证',
        content: '完成店主认证后才能按拿货价结算。',
        confirmText: '去认证',
        success: function (res) {
          if (res.confirm) wx.navigateTo({ url: '/pages/cert/index' })
        }
      })
      return
    }
    wx.showModal({
      title: '确认下单',
      content: '确认后将生成订单（状态：待付款），后续可对接微信支付。',
      confirmText: '提交订单',
      success: function (res) {
        if (!res.confirm) return
        wx.showLoading({ title: '提交中', mask: true })
        store.createOrder(self.data.remark).then(function (result) {
          wx.hideLoading()
          const orders = (result && result.orders) || []
          if (orders.length > 1) {
            // 按档口拆成多个订单时，进订单列表看
            wx.redirectTo({ url: '/pages/orders/index' })
          } else {
            wx.redirectTo({ url: '/pages/order-detail/index?id=' + (result && result.id) })
          }
        }).catch(function (e) {
          wx.hideLoading()
          wx.showToast({ title: '下单失败：' + ((e && e.message) || '未知错误'), icon: 'none' })
        })
      }
    })
  }
})
