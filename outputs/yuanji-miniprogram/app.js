const api = require('./utils/api.js')
const token = require('./utils/token.js')
const store = require('./utils/store.js')

App({
  globalData: {
    statusBarHeight: 20,
    navBarHeight: 44,
  },
  onLaunch() {
    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      this.globalData.statusBarHeight = info.statusBarHeight || 20
      const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
      if (menu && menu.top) {
        // 胶囊按钮上下留白一致，得到导航栏高度
        this.globalData.navBarHeight = (menu.top - this.globalData.statusBarHeight) * 2 + menu.height
      }
    } catch (e) {
      /* ignore */
    }
    // 启动即拉后端目录数据（失败自动退回本地假数据）
    api.hydrate()
    // 本地有登录凭证时，用后端的最新用户状态刷新（认证状态、昵称）
    if (token.get()) {
      api.getUser().then(function (user) {
        if (user) store.syncUser(user)
      })
    }
  },
})
