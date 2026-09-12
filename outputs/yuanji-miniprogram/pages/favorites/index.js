const data = require('../../utils/data.js')
const store = require('../../utils/store.js')
const app = getApp()

Page({
  data: { statusBarHeight: 20, navBarHeight: 44, goods: [] },
  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    })
  },
  onShow() {
    const favs = store.state.favorites
    this.setData({ goods: data.GOODS.filter(function (g) { return favs.indexOf(g.id) > -1 }) })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/mine/index' }) } })
  },
  goHome() {
    wx.switchTab({ url: '/pages/home/index' })
  }
})
