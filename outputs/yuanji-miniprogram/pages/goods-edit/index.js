const api = require('../../utils/api.js')
const app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    id: '',
    title: '',
    price: '',
    suggestPrice: '',
    goodsNo: '',
    colors: '',
    sizes: '',
    imgs: [],
    imgUrl: '',
    stock: '100',
    skuRows: [],
    uploading: false,
    submitting: false
  },
  onLoad(query) {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      id: query.id || ''
    })
    if (query.id) this.loadGoods(query.id)
  },
  // 编辑模式：从工作台商品列表里找到这件商品
  loadGoods(id) {
    const self = this
    api
      .stallGoods()
      .then(function (list) {
        const g = (list || []).filter(function (x) {
          return x.id === id
        })[0]
        if (!g) return
        self.setData({
          title: g.title,
          price: String(g.price),
          suggestPrice: String(g.suggestPrice || ''),
          imgUrl: g.imgUrl,
          imgs: g.imgUrl ? [g.imgUrl] : [],
          stock: String(g.stock === undefined ? 100 : g.stock)
        })
      })
      .catch(function () {})
  },
  onTitle(e) {
    this.setData({ title: e.detail.value })
  },
  onPrice(e) {
    this.setData({ price: e.detail.value })
  },
  onSuggest(e) {
    this.setData({ suggestPrice: e.detail.value })
  },
  onNo(e) {
    this.setData({ goodsNo: e.detail.value })
  },
  onColors(e) {
    this.setData({ colors: e.detail.value })
  },
  onSizes(e) {
    this.setData({ sizes: e.detail.value })
  },
  onStock(e) {
    this.setData({ stock: e.detail.value })
  },
  // 按颜色 × 尺码生成规格库存表（不填就用商品级库存）
  buildSkuRows() {
    const d = this.data
    const colors = String(d.colors || '').split(/[,，/\s]+/).filter(Boolean)
    const sizes = String(d.sizes || '').split(/[,，/\s]+/).filter(Boolean)
    const old = {}
    ;(d.skuRows || []).forEach(function (r) {
      old[r.key] = r.stock
    })
    const rows = []
    colors.forEach(function (c) {
      sizes.forEach(function (s) {
        const key = c + '/' + s
        rows.push({ key: key, label: c + ' / ' + s, stock: old[key] !== undefined ? old[key] : d.stock })
      })
    })
    this.setData({ skuRows: rows })
    wx.showToast({ title: '已生成 ' + rows.length + ' 个规格', icon: 'none' })
  },
  onSkuStock(e) {
    const i = Number(e.currentTarget.dataset.i)
    const rows = this.data.skuRows.slice()
    rows[i].stock = e.detail.value
    this.setData({ skuRows: rows })
  },
  // 选图 → 读成 base64 → 上传到后端，返回可访问 URL
  chooseImage() {
    const self = this
    wx.chooseMedia({
      count: 5,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: function (res) {
        const files = (res.tempFiles || []).slice(0, 5)
        if (!files.length) return
        self.setData({ uploading: true })
        const fs = wx.getFileSystemManager()
        const tasks = files.map(function (file) {
          try {
            const base64 = fs.readFileSync(file.tempFilePath, 'base64')
            const type = file.tempFilePath.indexOf('.png') > -1 ? 'image/png' : 'image/jpeg'
            return api.uploadImage(base64, type, 'goods')
          } catch (e) {
            return Promise.reject(new Error('读取图片失败'))
          }
        })
        Promise.all(tasks)
          .then(function (list) {
            const urls = self.data.imgs.concat(list.map(function (r) { return r.url })).slice(0, 5)
            self.setData({ uploading: false, imgs: urls, imgUrl: urls[0] || '' })
            wx.showToast({ title: '已上传 ' + urls.length + ' 张', icon: 'success' })
          })
          .catch(function (e) {
            self.setData({ uploading: false })
            wx.showToast({ title: (e && e.message) || '图片上传失败', icon: 'none' })
          })
      }
    })
  },
  removeImage(e) {
    const imgs = this.data.imgs.slice()
    imgs.splice(Number(e.currentTarget.dataset.i), 1)
    this.setData({ imgs: imgs, imgUrl: imgs[0] || '' })
  },
  submit() {
    const self = this
    const d = this.data
    if (!d.title) {
      wx.showToast({ title: '请填写商品标题', icon: 'none' })
      return
    }
    if (!(Number(d.price) > 0)) {
      wx.showToast({ title: '请填写拿货价', icon: 'none' })
      return
    }
    if (!d.imgUrl) {
      wx.showToast({ title: '请先上传商品图片', icon: 'none' })
      return
    }
    const payload = {
      title: d.title,
      price: Number(d.price),
      suggestPrice: Number(d.suggestPrice) || 0,
      stock: Number(d.stock) || 0,
      skuStock: (d.skuRows || []).reduce(function (acc, r) {
        acc[r.key] = Number(r.stock) || 0
        return acc
      }, {}),
      goodsNo: d.goodsNo,
      colors: d.colors,
      sizes: d.sizes,
      imgUrl: d.imgUrl,
      imgs: d.imgs
    }
    this.setData({ submitting: true })
    const task = d.id ? api.stallUpdateGoods(d.id, payload) : api.stallCreateGoods(payload)
    task
      .then(function () {
        self.setData({ submitting: false })
        wx.showToast({ title: d.id ? '已保存' : '已上架', icon: 'success' })
        setTimeout(function () {
          wx.navigateBack({ fail: function () { wx.redirectTo({ url: '/pages/stall-console/index' }) } })
        }, 900)
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
