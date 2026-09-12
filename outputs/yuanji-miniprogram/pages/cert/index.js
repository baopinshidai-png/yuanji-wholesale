const store = require('../../utils/store.js')

const TYPES = ['实体店店主', '网店店主', '直播店主', '微商', '二批档口', '服装工作室', '地摊/集市', '其他']
const CATS = ['女装', '男装', '童装', '鞋包', '饰品', '大码女装', '内衣家居']

Page({
  data: {
    types: TYPES,
    typeIndex: 0,
    cats: CATS,
    catIndex: 0,
    shop: '',
    city: '',
    phone: '',
    agreed: true
  },
  onShop(e) {
    this.setData({ shop: e.detail.value })
  },
  onCity(e) {
    this.setData({ city: e.detail.value })
  },
  onPhone(e) {
    this.setData({ phone: e.detail.value })
  },
  onType(e) {
    this.setData({ typeIndex: Number(e.detail.value) })
  },
  onCat(e) {
    this.setData({ catIndex: Number(e.detail.value) })
  },
  toggleAgree() {
    this.setData({ agreed: !this.data.agreed })
  },
  goDoc() {
    wx.navigateTo({ url: '/pages/doc/index?type=cert' })
  },
  upload() {
    wx.showToast({ title: '演示环境：此处上传门店/资质凭证', icon: 'none' })
  },
  submit() {
    const d = this.data
    if (!d.shop) {
      wx.showToast({ title: '请填写店铺名称', icon: 'none' })
      return
    }
    if (!d.agreed) {
      wx.showToast({ title: '请先同意认证须知', icon: 'none' })
      return
    }
    store.certify({
      shop: d.shop,
      type: TYPES[d.typeIndex],
      city: d.city,
      cat: CATS[d.catIndex],
      phone: d.phone
    })
    wx.showToast({ title: '认证通过，已解锁拿货价', icon: 'success' })
    setTimeout(function () {
      wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/mine/index' }) } })
    }, 1200)
  }
})
