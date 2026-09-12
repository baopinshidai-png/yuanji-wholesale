const api = require('../../utils/api.js')
const app = getApp()

const STATUS_TEXT = {
  none: '未提交',
  pending: '待平台审核',
  approved: '已通过',
  rejected: '已驳回'
}

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    status: 'none',
    statusText: '未提交',
    reviewNote: '',
    contact: '',
    phone: '',
    city: '',
    licenseNo: '',
    accountTypes: ['商户号（推荐）', '微信号'],
    accountTypeIndex: 0,
    accountAccount: '',
    accountName: '',
    submitting: false
  },
  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    })
    this.load()
  },
  load() {
    const self = this
    api
      .stallProfile()
      .then(function (res) {
        const p = (res && res.profile) || {}
        const account = p.account || {}
        self.setData({
          status: p.status || 'none',
          statusText: STATUS_TEXT[p.status || 'none'] || p.status,
          reviewNote: p.reviewNote || '',
          contact: p.contact || '',
          phone: p.phone || '',
          city: p.city || '',
          licenseNo: p.licenseNo || '',
          accountAccount: account.account || '',
          accountName: account.name || '',
          accountTypeIndex: account.type === 'PERSONAL_OPENID' ? 1 : 0
        })
      })
      .catch(function (e) {
        wx.showToast({ title: (e && e.message) || '加载失败', icon: 'none' })
      })
  },
  onInput(e) {
    const key = e.currentTarget.dataset.k
    const patch = {}
    patch[key] = e.detail.value
    this.setData(patch)
  },
  onType(e) {
    this.setData({ accountTypeIndex: Number(e.detail.value) })
  },
  submit() {
    const self = this
    const d = this.data
    if (!d.contact) {
      wx.showToast({ title: '请填写联系人', icon: 'none' })
      return
    }
    if (!d.phone) {
      wx.showToast({ title: '请填写联系电话', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    api
      .stallSaveProfile({
        contact: d.contact,
        phone: d.phone,
        city: d.city,
        licenseNo: d.licenseNo,
        accountType: d.accountTypeIndex === 1 ? 'PERSONAL_OPENID' : 'MERCHANT_ID',
        accountAccount: d.accountAccount,
        accountName: d.accountName
      })
      .then(function () {
        self.setData({ submitting: false })
        wx.showToast({ title: '已提交审核', icon: 'success' })
        self.load()
      })
      .catch(function (e) {
        self.setData({ submitting: false })
        wx.showToast({ title: (e && e.message) || '提交失败', icon: 'none' })
      })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.redirectTo({ url: '/pages/stall-console/index' }) } })
  }
})
