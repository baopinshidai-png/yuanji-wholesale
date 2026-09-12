const store = require('../../utils/store.js')
const app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    cart: [],
    certified: false,
    total: '0.00',
    discount: '0.00',
    payable: '0.00',
    showDetail: false,
    edit: false
  },
  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    })
  },
  onShow() {
    this.refresh()
  },
  refresh() {
    const total = store.cartTotal()
    const discount = store.cartDiscount()
    this.setData({
      cart: store.state.cart,
      certified: store.state.certified,
      total: total.toFixed(2),
      discount: discount.toFixed(2),
      payable: Math.max(0, total - discount).toFixed(2)
    })
  },
  step(e) {
    const i = Number(e.currentTarget.dataset.i)
    const d = Number(e.currentTarget.dataset.d)
    store.setQty(i, this.data.cart[i].qty + d)
    this.refresh()
  },
  remove(e) {
    const i = Number(e.currentTarget.dataset.i)
    const self = this
    wx.showModal({
      title: '移除商品',
      content: '确定从进货车移除该商品？',
      success: function (res) {
        if (res.confirm) {
          store.removeIndex(i)
          self.refresh()
        }
      }
    })
  },
  toggleDetail() {
    this.setData({ showDetail: !this.data.showDetail })
  },
  toggleEdit() {
    this.setData({ edit: !this.data.edit })
  },
  goHome() {
    wx.switchTab({ url: '/pages/home/index' })
  },
  goLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  },
  checkout() {
    if (!this.data.cart.length) {
      wx.showToast({ title: '进货车是空的', icon: 'none' })
      return
    }
    if (!store.state.certified) {
      wx.showModal({
        title: '需要店主认证',
        content: '完成店主认证后才能按拿货价结算，是否现在认证？',
        success: function (res) {
          if (res.confirm) wx.navigateTo({ url: '/pages/cert/index' })
        }
      })
      return
    }
    wx.navigateTo({ url: '/pages/checkout/index' })
  }
})
