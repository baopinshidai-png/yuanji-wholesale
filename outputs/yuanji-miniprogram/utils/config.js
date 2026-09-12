// 接口配置：本地开发连本机后端；正式版换成已备案的 HTTPS 域名
// 后端代码在 outputs/yuanji-server（node server.js 启动，默认 3000 端口）
module.exports = {
  // 微信开发者工具里勾了「不校验合法域名」就能直接连本机；
  // 真机预览要么连同一局域网 IP（如 http://192.168.1.10:3000/api/v1），
  // 要么把后端部署到 HTTPS 域名并填在这里（小程序后台也要配置服务器域名）。
  BASE_URL: 'http://127.0.0.1:3000/api/v1',
  // 关掉后完全走本地假数据（离线演示用）
  USE_REMOTE: true,
  TIMEOUT: 8000,
  // 演示登录：正式版交给后端用 wx.login 的 code 换 openid
  DEMO_LOGIN: true,
}
