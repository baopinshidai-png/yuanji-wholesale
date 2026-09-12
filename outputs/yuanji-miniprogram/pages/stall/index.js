const data = require('../../utils/data.js')
const api = require('../../utils/api.js')
const store = require('../../utils/store.js')
const app = getApp()

Page({
  data: { statusBarHeight: 20, navBarHeight: 44, stall: null, goods: [], subbed: false },
  onLoad(query) {
    this.id = query.id
    this.load()
    const self = this
    api.onChange(function () {
      self.load()
    })
  },
  load() {
    const stall = data.getStall(this.id) || data.STALLS[0]
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      stall: stall,
      goods: data.goodsByStall(stall.id),
      subbed: store.isSub(stall.id)
    })
  },
  toggleSub() {
    const v = store.toggleSub(this.data.stall.id)
    this.setData({ subbed: v })
    wx.showToast({ title: v ? '已订阅档口' : '已取消订阅', icon: 'none' })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/home/index' }) } })
  }
})
