const data = require('../../utils/data.js')
const app = getApp()

Page({
  data: { statusBarHeight: 20, navBarHeight: 44, goods: [] },
  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      goods: data.GOODS.slice(0, 12)
    })
  },
  download() {
    wx.showToast({ title: '演示环境：真机可保存到相册', icon: 'none' })
  },
  copy(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.t,
      success: function () {
        wx.showToast({ title: '商品信息已复制', icon: 'success' })
      }
    })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/mine/index' }) } })
  }
})
