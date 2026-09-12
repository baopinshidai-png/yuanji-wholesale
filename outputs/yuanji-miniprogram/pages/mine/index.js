const store = require('../../utils/store.js')
const app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    user: null,
    certified: false,
    orders: [
      { key: 'unpaid', label: '待付款', icon: '/images/icons/coupon.png' },
      { key: 'unship', label: '待发货', icon: '/images/icons/box.png' },
      { key: 'shipped', label: '待收货', icon: '/images/icons/location.png' },
      { key: 'aftersale', label: '售后进度', icon: '/images/icons/service.png' }
    ],
    assets: [
      { key: 'wallet', label: '钱包' },
      { key: 'coupon', label: '卡券' },
      { key: 'redpack', label: '红包' }
    ],
    services: ['档口入驻', '资质规则', '常见问题', '设置']
  },
  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    })
  },
  onShow() {
    this.setData({
      user: store.state.user,
      certified: store.state.certified,
      subsCount: store.state.subs.length,
      favCount: store.state.favorites.length
    })
  },
  goSubs() {
    wx.navigateTo({ url: '/pages/subs/index' })
  },
  goFavorites() {
    wx.navigateTo({ url: '/pages/favorites/index' })
  },
  goCoupons() {
    wx.navigateTo({ url: '/pages/coupons/index' })
  },
  goMaterial() {
    wx.navigateTo({ url: '/pages/material/index' })
  },
  goLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  },
  goCert() {
    wx.navigateTo({ url: '/pages/cert/index' })
  },
  goOrders() {
    wx.navigateTo({ url: '/pages/orders/index' })
  },
  goOrdersBy(e) {
    wx.navigateTo({ url: '/pages/orders/index?tab=' + e.currentTarget.dataset.k })
  },
  goAddress() {
    wx.navigateTo({ url: '/pages/address/index' })
  },
  goDoc(e) {
    wx.navigateTo({ url: '/pages/doc/index?type=' + (e.currentTarget.dataset.type || 'terms') })
  },
  goStallConsole() {
    wx.navigateTo({ url: '/pages/stall-console/index' })
  },
  goAftersales() {
    wx.navigateTo({ url: '/pages/aftersales/index' })
  },
  notReady() {
    wx.showToast({ title: '演示环境：功能待接入', icon: 'none' })
  },
  logout() {
    const self = this
    wx.showModal({
      title: '退出登录',
      content: '退出后将隐藏拿货价与订单信息',
      success: function (res) {
        if (res.confirm) {
          store.logout()
          self.setData({ user: null, certified: false })
        }
      }
    })
  }
})
