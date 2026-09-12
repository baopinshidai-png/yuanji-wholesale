const data = require('../../utils/data.js')
const api = require('../../utils/api.js')
const store = require('../../utils/store.js')
const app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    title: '沙河大上新',
    banner: false,
    brands: ['HERS', 'FIFTEEN', 'SUSAN', '美姿', 'I AM 沐', 'MOJITO'],
    sorts: [
      { key: 'all', label: '综合' },
      { key: 'sold', label: '销量' },
      { key: 'new', label: '上新' },
      { key: 'price', label: '批发价' }
    ],
    sort: 'all',
    countdown: '00:00:00',
    goods: [],
    certified: false
  },
  onLoad(query) {
    const self = this
    const market = query.market || ''
    const cat = query.cat || ''
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      banner: query.banner === '1' || !!market,
      title: market ? market + '大上新' : cat ? cat + '专区' : '源头好货',
      certified: store.state.certified
    })
    // 列表数据走后端接口层（现在返回 mock）
    api.getGoodsList({ market: market, category: cat, sort: query.sort }).then(function (res) {
      let list = res
      if (query.tag === 'sale') list = list.filter(function (g) { return g.joined > 100 })
      if (query.tag === 'stock') list = list.filter(function (g) { return g.services.indexOf('24H发货') > -1 })
      if (query.sort === 'new') list = list.filter(function (g) { return g.isNew })
      if (!list.length) list = data.GOODS
      self.setData({ goods: list })
    })
    this.startCountdown()
  },
  onUnload() {
    if (this.timer) clearInterval(this.timer)
  },
  startCountdown() {
    let left = 5 * 3600 + 42 * 60 + 58
    const self = this
    const tick = function () {
      left = left > 0 ? left - 1 : 5 * 3600
      const h = String(Math.floor(left / 3600)).padStart(2, '0')
      const m = String(Math.floor((left % 3600) / 60)).padStart(2, '0')
      const s = String(left % 60).padStart(2, '0')
      self.setData({ countdown: h + ':' + m + ':' + s })
    }
    tick()
    this.timer = setInterval(tick, 1000)
  },
  setSort(e) {
    const key = e.currentTarget.dataset.key
    const list = this.data.goods.slice()
    if (key === 'sold') list.sort(function (a, b) { return b.joined - a.joined })
    if (key === 'new') list.sort(function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) })
    if (key === 'price') list.sort(function (a, b) { return a.price - b.price })
    this.setData({ sort: key, goods: list })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/home/index' }) } })
  },
  goSearch() {
    wx.navigateTo({ url: '/pages/search/index' })
  },
  goCart() {
    wx.switchTab({ url: '/pages/cart/index' })
  },
  openFilter() {
    wx.showToast({ title: '筛选面板见搜索页演示', icon: 'none' })
  },
  goLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  }
})
