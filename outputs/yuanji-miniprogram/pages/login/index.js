const store = require('../../utils/store.js')

Page({
  data: {
    agreed: false,
    other: false,
    phone: '',
    code: '',
    counting: 0
  },
  onLoad() {},
  backDefault() {
    wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/home/index' }) } })
  },
  toggleAgree() {
    this.setData({ agreed: !this.data.agreed })
  },
  toggleOther() {
    this.setData({ other: !this.data.other })
  },
  goDoc(e) {
    wx.navigateTo({ url: '/pages/doc/index?type=' + (e.currentTarget.dataset.type || 'terms') })
  },
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },
  onCodeInput(e) {
    this.setData({ code: e.detail.value })
  },
  sendCode() {
    if (!this.data.phone || this.data.phone.length < 11) {
      wx.showToast({ title: '请输入 11 位手机号', icon: 'none' })
      return
    }
    if (this.data.counting) return
    const self = this
    let n = 60
    this.setData({ counting: n })
    const t = setInterval(function () {
      n -= 1
      self.setData({ counting: n })
      if (n <= 0) clearInterval(t)
    }, 1000)
    wx.showToast({ title: '演示环境：验证码 1234', icon: 'none' })
  },
  // 微信手机号一键登录（真机需要后端 code2session 换手机号；演示直接登录）
  onGetPhone(e) {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先阅读并同意协议', icon: 'none' })
      return
    }
    store.login('191****5001')
    wx.showToast({ title: '登录成功', icon: 'success' })
    const self = this
    setTimeout(function () {
      self.afterLogin()
    }, 800)
  },
  loginByCode() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先阅读并同意协议', icon: 'none' })
      return
    }
    if (this.data.code !== '1234') {
      wx.showToast({ title: '验证码错误（演示 1234）', icon: 'none' })
      return
    }
    store.login(this.data.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'))
    wx.showToast({ title: '登录成功', icon: 'success' })
    const self = this
    setTimeout(function () {
      self.afterLogin()
    }, 800)
  },
  afterLogin() {
    if (store.state.certified) {
      wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/mine/index' }) } })
      return
    }
    wx.showModal({
      title: '完成店主认证',
      content: '认证后即可查看拿货价（批发价）、享受一件起批与售后保障。是否现在认证？',
      confirmText: '去认证',
      cancelText: '先看看',
      success: function (res) {
        if (res.confirm) wx.redirectTo({ url: '/pages/cert/index' })
        else wx.switchTab({ url: '/pages/mine/index' })
      }
    })
  }
})
