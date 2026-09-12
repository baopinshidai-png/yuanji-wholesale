const store = require('../../utils/store.js')
const app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    addresses: [],
    pickedId: '',
    adding: false,
    form: { name: '', phone: '', region: '', detail: '' }
  },
  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    })
  },
  onShow() {
    this.refresh()
  },
  refresh() {
    this.setData({ addresses: store.state.addresses, pickedId: store.state.pickedAddressId })
  },
  pick(e) {
    store.pickAddress(e.currentTarget.dataset.id)
    this.refresh()
    wx.showToast({ title: '已选择该地址', icon: 'none' })
    setTimeout(function () {
      wx.navigateBack({ fail: function () {} })
    }, 600)
  },
  setDefault(e) {
    store.setDefaultAddress(e.currentTarget.dataset.id)
    this.refresh()
  },
  toggleAdd() {
    this.setData({ adding: !this.data.adding })
  },
  onInput(e) {
    const key = e.currentTarget.dataset.k
    const form = Object.assign({}, this.data.form)
    form[key] = e.detail.value
    this.setData({ form: form })
  },
  save() {
    const f = this.data.form
    if (!f.name || !f.phone || !f.region || !f.detail) {
      wx.showToast({ title: '请填写完整地址信息', icon: 'none' })
      return
    }
    store.addAddress({ name: f.name, phone: f.phone, region: f.region, detail: f.detail })
    this.setData({ adding: false, form: { name: '', phone: '', region: '', detail: '' } })
    this.refresh()
    wx.showToast({ title: '地址已保存', icon: 'success' })
  },
  back() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/mine/index' }) } })
  }
})
