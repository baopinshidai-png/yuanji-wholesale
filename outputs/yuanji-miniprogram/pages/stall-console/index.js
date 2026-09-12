const api = require('../../utils/api.js')
const token = require('../../utils/token.js')
const app = getApp()

const STATUS_TEXT = {
  unpaid: '待付款',
  unship: '待发货',
  shipped: '待收货',
  done: '已完成',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款'
}

const PROFILE_TEXT = {
  none: '未提交 ›',
  pending: '待审核 ›',
  approved: '已通过 ›',
  rejected: '已驳回 ›'
}

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    logged: false,
    code: '',
    loading: false,
    stall: null,
    stats: null,
    tab: 'unship',
    tabs: [
      { key: 'unship', label: '待发货' },
      { key: 'shipped', label: '已发货' },
      { key: 'all', label: '全部' }
    ],
    orders: [],
    goods: [],
    showGoods: false,
    showSettle: false,
    settle: null,
    showAfter: false,
    aftersales: [],
    profileStatus: 'none',
    profileStatusText: '未提交 ›'
  },
  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    })
    if (token.getStall()) this.enter()
  },
  onShow() {
    if (this.data.logged) this.loadAll()
  },
  onCode(e) {
    this.setData({ code: e.detail.value })
  },
  // 用平台发的邀请码进入工作台
  login() {
    const self = this
    const code = (this.data.code || '').trim()
    if (!code) {
      wx.showToast({ title: '请输入档口邀请码', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    api
      .stallLogin(code)
      .then(function (res) {
        token.setStall(res.token)
        self.setData({ loading: false, logged: true, stall: res.stall, code: '' })
        self.loadAll()
        wx.showToast({ title: '已进入工作台', icon: 'success' })
      })
      .catch(function (e) {
        self.setData({ loading: false })
        wx.showToast({ title: (e && e.message) || '邀请码无效', icon: 'none' })
      })
  },
  enter() {
    const self = this
    api
      .request('/stall/me')
      .then(function (res) {
        self.setData({ logged: true, stall: res.stall })
        self.loadAll()
      })
      .catch(function () {
        token.setStall('')
        self.setData({ logged: false, stall: null })
      })
  },
  loadAll() {
    const self = this
    api.stallStats().then(function (stats) {
      if (stats) self.setData({ stats: stats })
    })
    api
      .stallProfile()
      .then(function (res) {
        const status = (res && res.profile && res.profile.status) || 'none'
        self.setData({ profileStatus: status, profileStatusText: PROFILE_TEXT[status] || '查看 ›' })
      })
      .catch(function () {})
    this.loadOrders()
  },
  goProfile() {
    wx.navigateTo({ url: '/pages/stall-profile/index' })
  },
  loadOrders() {
    const self = this
    api
      .stallOrders(this.data.tab)
      .then(function (list) {
        self.setData({
          orders: (list || []).map(function (o) {
            return Object.assign({}, o, { statusText: STATUS_TEXT[o.status] || o.status })
          })
        })
      })
      .catch(function (e) {
        wx.showToast({ title: (e && e.message) || '订单加载失败', icon: 'none' })
      })
  },
  // 结算明细
  showSettlements() {
    const self = this
    const next = !this.data.showSettle
    this.setData({ showSettle: next, showGoods: false, showAfter: false })
    if (next) {
      api
        .stallSettlements()
        .then(function (res) {
          self.setData({ settle: res })
        })
        .catch(function (e) {
          wx.showToast({ title: (e && e.message) || '结算加载失败', icon: 'none' })
        })
    }
  },
  // 售后工单
  showAftersales() {
    const self = this
    const next = !this.data.showAfter
    this.setData({ showAfter: next, showGoods: false, showSettle: false })
    if (!next) return
    api
      .stallAfterSales()
      .then(function (list) {
        const TEXT = {
          pending: '待处理',
          stall_rejected: '已拒绝',
          waiting_return: '待买家寄回',
          returning: '退货中',
          refunded: '已退款',
          escalated: '平台介入中'
        }
        self.setData({
          aftersales: (list || []).map(function (t) {
            return Object.assign({}, t, {
              statusText: TEXT[t.status] || t.status,
              images: t.images || []
            })
          })
        })
      })
      .catch(function (e) {
        wx.showToast({ title: (e && e.message) || '售后加载失败', icon: 'none' })
      })
  },
  handleAfter(e) {
    const id = e.currentTarget.dataset.id
    const agree = e.currentTarget.dataset.agree === 'true'
    const self = this
    wx.showModal({
      title: agree ? '同意售后' : '拒绝售后',
      content: agree ? '同意后将退款给买家（已分账的会同步回退）' : '请填写拒绝原因',
      editable: !agree,
      placeholderText: '拒绝原因',
      confirmText: agree ? '同意并退款' : '确认拒绝',
      success: function (res) {
        if (!res.confirm) return
        api
          .stallHandleAfterSale(id, agree, (res.content || '').trim())
          .then(function () {
            wx.showToast({ title: agree ? '已退款' : '已拒绝', icon: 'none' })
            self.showAftersales()
            self.showAftersales()
          })
          .catch(function (err) {
            wx.showToast({ title: (err && err.message) || '处理失败', icon: 'none' })
          })
      }
    })
  },
  // 收到退货后确认并退款
  confirmReceived(e) {
    const id = e.currentTarget.dataset.id
    const self = this
    wx.showModal({
      title: '确认收到退货',
      content: '确认后立即退款给买家（已分账的同步回退）',
      confirmText: '确认收货并退款',
      success: function (res) {
        if (!res.confirm) return
        api
          .stallConfirmAfterSaleReceived(id)
          .then(function () {
            wx.showToast({ title: '已确认并退款', icon: 'success' })
            self.showAftersales()
            self.showAftersales()
          })
          .catch(function (err) {
            wx.showToast({ title: (err && err.message) || '操作失败', icon: 'none' })
          })
      }
    })
  },
  setTab(e) {
    const self = this
    this.setData({ tab: e.currentTarget.dataset.k }, function () {
      self.loadOrders()
    })
  },
  // 发货：运单号可留空，留空自动生成
  ship(e) {
    const id = e.currentTarget.dataset.id
    const self = this
    wx.showModal({
      title: '发货',
      content: '填写快递单号（可留空自动生成）',
      editable: true,
      placeholderText: '如 SF1234567890',
      confirmText: '确认发货',
      success: function (res) {
        if (!res.confirm) return
        wx.showLoading({ title: '提交中', mask: true })
        api
          .stallShip(id, (res.content || '').trim())
          .then(function () {
            wx.hideLoading()
            wx.showToast({ title: '已发货', icon: 'success' })
            self.loadAll()
          })
          .catch(function (err) {
            wx.hideLoading()
            wx.showToast({ title: (err && err.message) || '发货失败', icon: 'none' })
          })
      }
    })
  },
  toggleGoodsPanel() {
    const self = this
    const next = !this.data.showGoods
    this.setData({ showGoods: next, showSettle: false, showAfter: false })
    if (next && !this.data.goods.length) {
      api
        .stallGoods()
        .then(function (list) {
          self.setData({ goods: list || [] })
        })
        .catch(function (e) {
          wx.showToast({ title: (e && e.message) || '商品加载失败', icon: 'none' })
        })
    }
  },
  addGoods() {
    wx.navigateTo({ url: '/pages/goods-edit/index' })
  },
  editGoods(e) {
    wx.navigateTo({ url: '/pages/goods-edit/index?id=' + e.currentTarget.dataset.id })
  },
  toggleGoods(e) {
    const id = e.currentTarget.dataset.id
    const off = e.currentTarget.dataset.off
    const self = this
    api
      .stallToggleGoods(id, !off)
      .then(function () {
        wx.showToast({ title: off ? '已上架' : '已下架', icon: 'none' })
        api.stallGoods().then(function (list) {
          self.setData({ goods: list || [] })
        })
      })
      .catch(function (err) {
        wx.showToast({ title: (err && err.message) || '操作失败', icon: 'none' })
      })
  },
  // 删除自己上架的商品（软删除，买家不再可见）
  removeGoods(e) {
    const id = e.currentTarget.dataset.id
    const self = this
    wx.showModal({
      title: '删除商品',
      content: '删除后买家列表与搜索不再可见，确认删除？',
      success: function (res) {
        if (!res.confirm) return
        api
          .stallRemoveGoods(id)
          .then(function () {
            wx.showToast({ title: '已删除', icon: 'none' })
            api.stallGoods().then(function (list) {
              self.setData({ goods: list || [] })
            })
          })
          .catch(function (err) {
            wx.showToast({ title: (err && err.message) || '删除失败', icon: 'none' })
          })
      }
    })
  },
  logout() {
    token.setStall('')
    this.setData({ logged: false, stall: null, stats: null, orders: [], goods: [] })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/mine/index' }) } })
  }
})
