const data = require('../../utils/data.js')
const store = require('../../utils/store.js')
const app = getApp()

Page({
  data: { statusBarHeight: 20, navBarHeight: 44, stalls: [] },
  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    })
  },
  onShow() {
    const subs = store.state.subs
    this.setData({ stalls: data.STALLS.filter(function (s) { return subs.indexOf(s.id) > -1 }) })
  },
  unsub(e) {
    store.toggleSub(e.currentTarget.dataset.id)
    this.onShow()
    wx.showToast({ title: '已取消订阅', icon: 'none' })
  },
  goStall(e) {
    wx.navigateTo({ url: '/pages/stall/index?id=' + e.currentTarget.dataset.id })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/mine/index' }) } })
  },
  goHome() {
    wx.switchTab({ url: '/pages/home/index' })
  }
})
