const data = require('../../utils/data.js')
const api = require('../../utils/api.js')
const store = require('../../utils/store.js')
const app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    markets: data.MARKETS,
    filters: data.FILTERS,
    activeFilter: '全部',
    cards: [
      { key: 'new', title: '今日新款', sub: '4000+款上新', img: 'g2', img2: 'g6', cls: 'big' },
      { key: 'sale', title: '今日特卖', sub: '夏末·最后一波', img: 'g12', img2: 'g14' },
      { key: 'stock', title: '档口现货', sub: '秋上新 免排单', img: 'g10', badge: '⚡24H极速发' },
    ],
    brands: ['HERS', 'FIFTEEN', 'SUSAN', '美姿', 'I AM 沐', 'MOJITO'],
    bigBrand: [],
    goods: [],
    certified: false,
    cartCount: 0,
    campaigns: [],
  },
  onLoad() {
    const self = this
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
    })
    // 首页聚合数据走后端接口层（现在返回 mock）
    api.getHome().then(function (home) {
      self.setData({
        markets: home.markets,
        filters: home.filters,
        campaigns: (home.campaigns || []).filter(function (c) {
          return c.position === 'home_top'
        }),
      })
    })
    this.refresh()
  },
  onShow() {
    this.refresh()
  },
  onPullDownRefresh() {
    this.refresh()
    wx.stopPullDownRefresh()
  },
  refresh() {
    const s = store.state
    const list = data.GOODS.filter((g) => {
      const f = this.data.activeFilter
      if (f === '全部') return true
      if (f === '24h发货') return g.services.indexOf('24H发货') > -1
      if (f === '男装' || f === '大码') return false
      return g.market === f || (f === '十三行' && g.market === '十三行')
    })
    this.setData({
      certified: s.certified,
      cartCount: store.cartCount(),
      goods: list,
      bigBrand: data.GOODS.slice(0, 6),
    })
  },
  onFilter(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.f }, () => this.refresh())
  },
  goSearch() {
    wx.navigateTo({ url: '/pages/search/index' })
  },
  goMarket(e) {
    wx.navigateTo({ url: '/pages/list/index?market=' + e.currentTarget.dataset.m })
  },
  goCard(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'new') wx.navigateTo({ url: '/pages/list/index?sort=new' })
    else if (key === 'sale') wx.navigateTo({ url: '/pages/list/index?tag=sale' })
    else wx.navigateTo({ url: '/pages/list/index?tag=stock' })
  },
  goList() {
    wx.navigateTo({ url: '/pages/list/index?market=沙河&banner=1' })
  },
  goLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  },
  goCert() {
    wx.navigateTo({ url: '/pages/cert/index' })
  },
  goMessage() {
    wx.showToast({ title: '消息中心：演示环境', icon: 'none' })
  },
  goCoupons() {
    wx.navigateTo({ url: '/pages/coupons/index' })
  },
  // 运营位点击：按后台配置的 link 跳转（tab 页用 switchTab）
  goCampaign(e) {
    const link = e.currentTarget.dataset.link || ''
    if (!link || link.indexOf('/pages/') !== 0) {
      wx.showToast({ title: '活动详情待配置', icon: 'none' })
      return
    }
    const tabs = ['/pages/home/index', '/pages/category/index', '/pages/cart/index', '/pages/mine/index']
    if (tabs.indexOf(link) > -1) wx.switchTab({ url: link })
    else wx.navigateTo({ url: link })
  },
})
