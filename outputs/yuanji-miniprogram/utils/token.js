// 登录凭证单独存一份，避免 api 与 store 互相 require 形成循环依赖
const KEY = 'yuanji_token'
const STALL_KEY = 'yuanji_stall_token'

let token = ''
let stallToken = ''
try {
  token = wx.getStorageSync(KEY) || ''
  stallToken = wx.getStorageSync(STALL_KEY) || ''
} catch (e) {
  token = ''
  stallToken = ''
}

module.exports = {
  get() {
    return token
  },
  set(value) {
    token = value || ''
    try {
      if (token) wx.setStorageSync(KEY, token)
      else wx.removeStorageSync(KEY)
    } catch (e) {
      /* ignore */
    }
  },
  clear() {
    this.set('')
  },
  // 档口工作台（商家端）的登录凭证，与买家登录态分开
  getStall() {
    return stallToken
  },
  setStall(value) {
    stallToken = value || ''
    try {
      if (stallToken) wx.setStorageSync(STALL_KEY, stallToken)
      else wx.removeStorageSync(STALL_KEY)
    } catch (e) {
      /* ignore */
    }
  },
}
