const data = require('../../utils/data.js')
const api = require('../../utils/api.js')
const app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    cats: data.CATEGORIES,
    hot: data.HOT_CATEGORIES,
    active: 'rec',
    activeSub: '',
    subs: [],
    goods: [],
    markets: data.MARKETS,
  },
  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      goods: data.GOODS.slice(0, 10),
    })
    // 后端目录数据到位后刷新一次（后端不可用时不会触发）
    const self = this
    api.onChange(function () {
      self.setData({
        cats: data.CATEGORIES,
        hot: data.HOT_CATEGORIES,
        markets: data.MARKETS,
        goods: data.GOODS.slice(0, 10),
      })
    })
  },
  onShow() {
    this.setData({ goods: this.data.goods.length ? this.data.goods : data.GOODS.slice(0, 10) })
  },
  pickCat(e) {
    const id = e.currentTarget.dataset.id
    const cat = data.CATEGORIES.find((c) => c.id === id)
    this.setData({ active: id, activeSub: '', subs: cat ? cat.subs : [] })
    if (id === 'rec' || id === 'style') {
      this.setData({ goods: data.GOODS.slice(0, 10) })
    } else if (id === 'market') {
      this.setData({ goods: data.GOODS.slice(0, 10) })
    } else {
      this.setData({ goods: data.GOODS.filter((g) => g.title.indexOf('毛衣') > -1 || g.title.indexOf('针织') > -1 || g.title.indexOf('裙') > -1).slice(0, 12) })
    }
  },
  pickSub(e) {
    const sub = e.currentTarget.dataset.sub
    this.setData({ activeSub: sub })
    wx.navigateTo({ url: '/pages/list/index?cat=' + sub })
  },
  pickHot(e) {
    wx.navigateTo({ url: '/pages/list/index?cat=' + e.currentTarget.dataset.c })
  },
  pickMarket(e) {
    wx.navigateTo({ url: '/pages/list/index?market=' + e.currentTarget.dataset.m })
  },
  goSearch() {
    wx.navigateTo({ url: '/pages/search/index' })
  },
})
