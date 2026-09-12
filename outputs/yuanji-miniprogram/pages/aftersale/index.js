const api = require('../../utils/api.js')
const store = require('../../utils/store.js')
const app = getApp()

const TYPES = ['仅退款', '退货退款', '换货', '质量问题', '少件/漏发']

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    orderId: '',
    order: null,
    types: TYPES,
    typeIndex: 0,
    reason: '',
    amount: '',
    images: [],
    uploading: false,
    submitting: false
  },
  onLoad(query) {
    const order = store.getOrder(query.orderId) || null
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      orderId: query.orderId || '',
      order: order,
      amount: order ? String(order.payable) : ''
    })
  },
  onType(e) {
    this.setData({ typeIndex: Number(e.detail.value) })
  },
  onReason(e) {
    this.setData({ reason: e.detail.value })
  },
  onAmount(e) {
    this.setData({ amount: e.detail.value })
  },
  // 上传凭证图（最多 3 张）
  chooseImages() {
    const self = this
    const left = 3 - this.data.images.length
    if (left <= 0) {
      wx.showToast({ title: '最多 3 张凭证', icon: 'none' })
      return
    }
    wx.chooseMedia({
      count: left,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: function (res) {
        const files = res.tempFiles || []
        if (!files.length) return
        self.setData({ uploading: true })
        const fs = wx.getFileSystemManager()
        const tasks = files.map(function (f) {
          try {
            const base64 = fs.readFileSync(f.tempFilePath, 'base64')
            const type = f.tempFilePath.indexOf('.png') > -1 ? 'image/png' : 'image/jpeg'
            return api.uploadImage(base64, type, 'aftersale')
          } catch (e) {
            return Promise.reject(new Error('读取图片失败'))
          }
        })
        Promise.all(tasks)
          .then(function (list) {
            const urls = self.data.images.concat(list.map(function (r) { return r.url })).slice(0, 3)
            self.setData({ uploading: false, images: urls })
            wx.showToast({ title: '已上传 ' + urls.length + ' 张', icon: 'success' })
          })
          .catch(function (e) {
            self.setData({ uploading: false })
            wx.showToast({ title: (e && e.message) || '上传失败', icon: 'none' })
          })
      }
    })
  },
  removeImage(e) {
    const images = this.data.images.slice()
    images.splice(Number(e.currentTarget.dataset.i), 1)
    this.setData({ images: images })
  },
  submit() {
    const self = this
    const d = this.data
    if (!d.reason.trim()) {
      wx.showToast({ title: '请填写售后原因', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    api
      .createAfterSale({
        orderId: d.orderId,
        type: TYPES[d.typeIndex],
        reason: d.reason.trim(),
        amount: Number(d.amount) || 0,
        images: d.images
      })
      .then(function () {
        self.setData({ submitting: false })
        wx.showToast({ title: '已提交售后', icon: 'success' })
        setTimeout(function () {
          wx.redirectTo({ url: '/pages/aftersales/index' })
        }, 900)
      })
      .catch(function (e) {
        self.setData({ submitting: false })
        wx.showToast({ title: (e && e.message) || '提交失败', icon: 'none' })
      })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.redirectTo({ url: '/pages/orders/index' }) } })
  }
})
