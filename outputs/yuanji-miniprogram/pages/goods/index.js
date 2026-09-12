const data = require('../../utils/data.js')
const api = require('../../utils/api.js')
const store = require('../../utils/store.js')
const app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    goods: null,
    pv: { main: '', label: '', origin: '', locked: true, tip: '' },
    tab: 'goods',
    imgTab: 0,
    imgIndex: 0,
    sku: false,
    color: '',
    size: '',
    qty: 1,
    fav: false,
    showSubsidy: false,
    showParams: false,
    showReturns: false,
    cartCount: 0
  },
  onLoad(query) {
    this.goodsId = query.id
    const g = data.getGoods(query.id) || data.GOODS[0]
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      goods: g,
      pv: store.priceView(g),
      fav: store.isFav(g.id),
      color: g.colors[0].name,
      size: g.sizes[0],
      cartCount: store.cartCount()
    })
    const self = this
    // 详情以服务端为准（价格按认证状态返回），失败自动退回本地数据
    api.getGoodsDetail(query.id).then(function (fresh) {
      if (fresh && fresh.id) self.setData({ goods: fresh, pv: store.priceView(fresh) })
    })
    api.onChange(function () {
      const latest = data.getGoods(self.goodsId)
      if (latest) self.setData({ goods: latest, pv: store.priceView(latest) })
    })
  },
  onShow() {
    if (this.data.goods) {
      this.setData({
        pv: store.priceView(this.data.goods),
        cartCount: store.cartCount(),
        fav: store.isFav(this.data.goods.id)
      })
    }
  },
  setTab(e) {
    this.setData({ tab: e.currentTarget.dataset.t })
  },
  setImgTab(e) {
    this.setData({ imgTab: Number(e.currentTarget.dataset.i), imgIndex: 0 })
  },
  onSwiper(e) {
    this.setData({ imgIndex: e.detail.current })
  },
  pickColor(e) {
    this.setData({ color: e.currentTarget.dataset.v })
  },
  pickSize(e) {
    this.setData({ size: e.currentTarget.dataset.v })
  },
  step(e) {
    const q = Math.max(1, this.data.qty + Number(e.currentTarget.dataset.d))
    this.setData({ qty: q })
  },
  toggleSku() {
    this.setData({ sku: !this.data.sku })
  },
  toggleSubsidy() {
    this.setData({ showSubsidy: !this.data.showSubsidy })
  },
  toggleParams() {
    this.setData({ showParams: !this.data.showParams })
  },
  toggleReturns() {
    this.setData({ showReturns: !this.data.showReturns })
  },
  toggleFav() {
    this.setData({ fav: store.toggleFav(this.data.goods.id) })
  },
  addCart() {
    const d = this.data
    // 规格库存校验：缺货组合直接拦下（后端也会再校验一次）
    const left = d.goods && d.goods.skuStock ? d.goods.skuStock[d.color + '/' + d.size] : undefined
    if (left !== undefined && left < d.qty) {
      wx.showToast({ title: d.color + '/' + d.size + ' 库存不足（剩 ' + left + ' 件）', icon: 'none' })
      return
    }
    store.addToCart(d.goods, d.color, d.size, d.qty)
    this.setData({ sku: false, cartCount: store.cartCount() })
    wx.showToast({ title: '已加入进货车', icon: 'success' })
  },
  goStall() {
    wx.navigateTo({ url: '/pages/stall/index?id=' + this.data.goods.stallId })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/home/index' }) } })
  },
  goCart() {
    wx.switchTab({ url: '/pages/cart/index' })
  },
  goLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  },
  goCert() {
    wx.navigateTo({ url: '/pages/cert/index' })
  },
  service() {
    wx.showToast({ title: '客服：演示环境', icon: 'none' })
  },
  goSearch() {
    wx.navigateTo({ url: '/pages/search/index' })
  },
  download() {
    wx.showToast({ title: '演示环境：一键下载商品素材', icon: 'none' })
  },
})
