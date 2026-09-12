const data = require('../../utils/data.js')
const store = require('../../utils/store.js')
const app = getApp()

const HISTORY_KEY = 'yuanji_search_history'

Page({
  data: {
    statusBarHeight: 20,
    kw: '',
    history: [],
    recommend: ['大牌联合上新，运费红包&满减', '线下S级品牌联合秋上新'],
    hotWords: ['连衣裙', '针织衫', '半身裙', '卫衣', '毛衣', '休闲裤'],
    results: [],
    searched: false,
    sort: 'all',
    filters: ['订阅的档口', '特价', '同步上新', '慢必赔', '批量采购价', '限量补贴'],
    markets: ['广州十三行', '十三行(1~3楼)', '十三行(4~6楼)', '广州沙河', '沙河南城', '沙河金马', '深圳南油', '濮院', '杭州四季青'],
    showFilter: false,
    activeFilter: ''
  },
  onLoad() {
    let history = []
    try {
      history = wx.getStorageSync(HISTORY_KEY) || []
    } catch (e) {
      history = []
    }
    this.setData({ statusBarHeight: app.globalData.statusBarHeight, history: history })
  },
  onInput(e) {
    this.setData({ kw: e.detail.value })
  },
  doSearch(word) {
    const kw = (word || this.data.kw || '').trim()
    if (!kw) return
    const history = [kw].concat(this.data.history.filter(function (h) { return h !== kw })).slice(0, 8)
    try {
      wx.setStorageSync(HISTORY_KEY, history)
    } catch (e) {
      /* ignore */
    }
    const self = this
    this.setData({ kw: kw, history: history, searched: true }, function () { self.apply() })
  },
  clearHistory() {
    try {
      wx.removeStorageSync(HISTORY_KEY)
    } catch (e) {
      /* ignore */
    }
    this.setData({ history: [] })
  },
  setSort(e) {
    const self = this
    this.setData({ sort: e.currentTarget.dataset.k }, function () { self.apply() })
  },
  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter })
  },
  pickFilterTab(e) {
    const f = e.currentTarget.dataset.f
    const self = this
    this.setData({ activeFilter: this.data.activeFilter === f ? '' : f }, function () { self.apply() })
  },
  resetFilter() {
    const self = this
    this.setData({ activeFilter: '' }, function () { self.apply() })
  },
  applyFilter() {
    this.setData({ showFilter: false })
    wx.showToast({ title: '已应用筛选', icon: 'none' })
  },
  // 关键词 + 快捷筛选 + 排序，真正作用在结果上
  apply() {
    const kw = (this.data.kw || '').trim()
    let list = kw ? data.searchGoods(kw) : data.GOODS.slice()
    const f = this.data.activeFilter
    if (f === '订阅的档口') list = list.filter(function (g) { return store.state.subs.indexOf(g.stallId) > -1 })
    if (f === '特价') list = list.filter(function (g) { return g.joined > 100 })
    if (f === '同步上新') list = list.filter(function (g) { return g.isNew })
    if (f === '慢必赔') list = list.filter(function (g) { return g.services.indexOf('慢必赔') > -1 })
    if (f === '批量采购价') list = list.filter(function (g) { return g.services.indexOf('批量采购价') > -1 })
    if (f === '限量补贴') list = list.filter(function (g) { return g.services.indexOf('满减') > -1 || g.services.indexOf('红包') > -1 })
    const s = this.data.sort
    if (s === 'sold') list.sort(function (a, b) { return b.joined - a.joined })
    if (s === 'new') list.sort(function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) })
    if (s === 'price') list.sort(function (a, b) { return a.price - b.price })
    this.setData({ results: list, resultHint: (this.data.activeFilter ? '已筛选：' + this.data.activeFilter + '　' : '') + list.length + ' 个货源' })
  },
  scan() {
    wx.showToast({ title: '以图搜款：需接入图搜服务', icon: 'none' })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/home/index' }) } })
  },
  goHome() {
    wx.switchTab({ url: '/pages/home/index' })
  }
})
