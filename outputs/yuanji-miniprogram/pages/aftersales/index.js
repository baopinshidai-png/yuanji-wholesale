const api = require('../../utils/api.js')
const app = getApp()

const STATUS_TEXT = {
  pending: '待档口处理',
  stall_rejected: '档口已拒绝',
  agreed: '档口已同意',
  waiting_return: '待你寄回',
  returning: '退货中',
  refunded: '已退款',
  approved: '平台已支持',
  rejected: '平台已驳回',
  escalated: '平台介入中'
}

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    list: []
  },
  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    })
  },
  onShow() {
    this.load()
  },
  load() {
    const self = this
    api
      .getAfterSales()
      .then(function (list) {
        self.setData({
          list: (list || []).map(function (t) {
            return Object.assign({}, t, {
              statusText: STATUS_TEXT[t.status] || t.status,
              images: t.images || []
            })
          })
        })
      })
      .catch(function (e) {
        wx.showToast({ title: (e && e.message) || '加载失败', icon: 'none' })
      })
  },
  detail(e) {
    wx.navigateTo({ url: '/pages/order-detail/index?id=' + e.currentTarget.dataset.order })
  },
  // 退货退款/换货：买家填写退货运单号
  fillReturn(e) {
    const id = e.currentTarget.dataset.id
    const self = this
    wx.showModal({
      title: '填写退货运单号',
      content: '寄回后填写运单号，档口确认收货后退款',
      editable: true,
      placeholderText: '如 SF1234567890',
      confirmText: '提交',
      success: function (res) {
        if (!res.confirm) return
        const logistics = (res.content || '').trim()
        if (!logistics) {
          wx.showToast({ title: '请填写运单号', icon: 'none' })
          return
        }
        api
          .submitAfterSaleReturn(id, logistics)
          .then(function () {
            wx.showToast({ title: '已提交', icon: 'success' })
            self.load()
          })
          .catch(function (err) {
            wx.showToast({ title: (err && err.message) || '提交失败', icon: 'none' })
          })
      }
    })
  },
  previewImage(e) {
    const url = e.currentTarget.dataset.url
    const urls = e.currentTarget.dataset.urls || [url]
    wx.previewImage({ current: url, urls: urls })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/mine/index' }) } })
  }
})
