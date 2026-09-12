const data = require('../../utils/data.js')
const store = require('../../utils/store.js')
const app = getApp()

Page({
  data: { statusBarHeight: 20, navBarHeight: 44, coupons: [], claimedCount: 0 },
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
    const claimed = store.state.coupons
    this.setData({
      coupons: data.COUPONS.map(function (c) {
        return Object.assign({}, c, { claimed: claimed.indexOf(c.id) > -1 })
      }),
      claimedCount: claimed.length
    })
  },
  claim(e) {
    store.claimCoupon(e.currentTarget.dataset.id)
    this.refresh()
    wx.showToast({ title: '领取成功', icon: 'success' })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/mine/index' }) } })
  }
})
