// 微信支付（APIv3 / JSAPI）：统一下单、调起支付参数、回调验签解密、对账查询
// 没配商户号时自动进入 mock 模式（演示环境点「去付款」直接把订单置为已支付）
import crypto from 'node:crypto'
import fs from 'node:fs'

const API_HOST = 'https://api.mch.weixin.qq.com'

const readMaybeFile = (v) => {
  if (!v) return ''
  try {
    if (fs.existsSync(v)) return fs.readFileSync(v, 'utf8')
  } catch (e) {
    /* ignore */
  }
  return v
}

export function payConfig() {
  return {
    appid: process.env.WECHAT_APPID || '',
    mchid: process.env.WECHAT_MCHID || '',
    serial: process.env.WECHAT_PAY_SERIAL || '',
    privateKey: readMaybeFile(process.env.WECHAT_PAY_PRIVATE_KEY),
    apiV3Key: process.env.WECHAT_PAY_APIV3_KEY || '',
    platformCert: readMaybeFile(process.env.WECHAT_PAY_PLATFORM_CERT),
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || '',
  }
}

export function payReady() {
  const c = payConfig()
  return !!(c.appid && c.mchid && c.serial && c.privateKey && c.notifyUrl)
}

export function payMode() {
  return payReady() ? 'wechat' : 'mock'
}

const nonce = () => crypto.randomUUID().replace(/-/g, '')
const nowSec = () => String(Math.floor(Date.now() / 1000))

function rsaSign(message, privateKey) {
  return crypto.sign('RSA-SHA256', Buffer.from(message, 'utf8'), privateKey).toString('base64')
}

function authHeader(method, urlPath, body, c) {
  const ts = nowSec()
  const n = nonce()
  const message = [method, urlPath, ts, n, body, ''].join('\n')
  const signature = rsaSign(message, c.privateKey)
  return (
    'WECHATPAY2-SHA256-RSA2048 ' +
    `mchid="${c.mchid}",nonce_str="${n}",timestamp="${ts}",serial_no="${c.serial}",signature="${signature}"`
  )
}

export async function wxPayRequest(method, urlPath, bodyObj) {
  const c = payConfig()
  const body = bodyObj ? JSON.stringify(bodyObj) : ''
  const res = await fetch(API_HOST + urlPath, {
    method,
    headers: {
      Authorization: authHeader(method, urlPath, body, c),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'yuanji-server/0.1',
    },
    body: body || undefined,
  })
  const text = await res.text()
  let json = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch (e) {
    json = { raw: text }
  }
  if (!res.ok) {
    const err = new Error('微信支付接口错误：' + (json.message || res.status))
    err.detail = json
    err.httpStatus = 502
    err.code = 50201
    throw err
  }
  return json
}

// 统一下单（JSAPI）→ 返回小程序 wx.requestPayment 需要的参数
export async function createJsapiPayment(order, user) {
  const c = payConfig()
  const outTradeNo = order.id
  const total = Math.round(Number(order.payable) * 100)
  const payload = {
    appid: c.appid,
    mchid: c.mchid,
    description: '源集批发订单 ' + order.id,
    out_trade_no: outTradeNo,
    notify_url: c.notifyUrl,
    amount: { total: total, currency: 'CNY' },
    payer: { openid: user.openid },
  }
  const json = await wxPayRequest('POST', '/v3/pay/transactions/jsapi', payload)
  if (!json.prepay_id) {
    const err = new Error('统一下单未返回 prepay_id')
    err.httpStatus = 502
    err.code = 50202
    throw err
  }
  return { prepayId: json.prepay_id, outTradeNo, payParams: clientPayParams(json.prepay_id, c) }
}

function clientPayParams(prepayId, c) {
  const timeStamp = nowSec()
  const n = nonce()
  const pkg = 'prepay_id=' + prepayId
  const message = [c.appid, timeStamp, n, pkg, ''].join('\n')
  return {
    timeStamp: timeStamp,
    nonceStr: n,
    package: pkg,
    signType: 'RSA',
    paySign: rsaSign(message, c.privateKey),
  }
}

// 回调验签（用微信支付平台证书公钥）
export function verifyNotify(headers) {
  const c = payConfig()
  const ts = headers['wechatpay-timestamp']
  const n = headers['wechatpay-nonce']
  const sig = headers['wechatpay-signature']
  const cert = getPlatformCert(headers['wechatpay-serial'])
  if (!cert) return { verified: false, reason: '没有可用的平台证书（可等自动拉取，或配 WECHAT_PAY_PLATFORM_CERT）' }
  if (!ts || !n || !sig) return { verified: false, reason: '缺少验签头' }
  const message = [ts, n, headers.__rawBody || '', ''].join('\n')
  let ok = false
  try {
    ok = crypto.verify('RSA-SHA256', Buffer.from(message, 'utf8'), cert, Buffer.from(sig, 'base64'))
  } catch (e) {
    return { verified: false, reason: '验签异常：' + e.message }
  }
  return { verified: ok, reason: ok ? '' : '签名不匹配' }
}

// 回调解密（AES-256-GCM）
export function decryptResource(resource) {
  const c = payConfig()
  if (!c.apiV3Key) throw new Error('未配置 WECHAT_PAY_APIV3_KEY')
  const data = Buffer.from(resource.ciphertext, 'base64')
  const authTag = data.subarray(data.length - 16)
  const ciphertext = data.subarray(0, data.length - 16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(c.apiV3Key, 'utf8'), Buffer.from(resource.nonce, 'utf8'))
  decipher.setAuthTag(authTag)
  if (resource.associated_data) decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'))
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
  return JSON.parse(plain)
}

// 主动查单（回调丢了也能对账）
export async function queryPayment(outTradeNo) {
  const c = payConfig()
  return wxPayRequest('GET', '/v3/pay/transactions/out-trade-no/' + outTradeNo + '?mchid=' + c.mchid)
}

// 关闭订单（超时未支付自动关单用）
export async function closePayment(outTradeNo) {
  const c = payConfig()
  return wxPayRequest('POST', '/v3/pay/transactions/out-trade-no/' + outTradeNo + '/close', { mchid: c.mchid })
}

// 申请退款（原路退回）
export async function createRefund(order, amountYuan, reason, outRefundNo) {
  const c = payConfig()
  const refundFen = Math.round(Number(amountYuan) * 100)
  const totalFen = Math.round(Number(order.payable) * 100)
  return wxPayRequest('POST', '/v3/refund/domestic/refunds', {
    out_trade_no: order.id,
    out_refund_no: outRefundNo,
    reason: reason || '用户申请退款',
    notify_url: c.notifyUrl.replace(/\/pay\/notify$/, '/pay/refund-notify'),
    amount: { refund: refundFen, total: totalFen, currency: 'CNY' },
  })
}

// 查询退款（退款回调丢了也能对账）
export async function queryRefund(outRefundNo) {
  return wxPayRequest('GET', '/v3/refund/domestic/refunds/' + outRefundNo)
}

// ---------- 平台证书：自动下载 + 轮换（回调验签用） ----------
let platformCerts = {} // serial_no -> PEM

export function getPlatformCert(serial) {
  if (serial && platformCerts[serial]) return platformCerts[serial]
  return payConfig().platformCert || ''
}

export function platformCertSerials() {
  return Object.keys(platformCerts)
}

async function downloadCertificates() {
  const json = await wxPayRequest('GET', '/v3/certificates')
  const list = (json && json.data) || []
  const out = {}
  for (const item of list) {
    const info = item.encrypt_certificate
    if (!info) continue
    try {
      out[item.serial_no] = decryptResource({
        ciphertext: info.ciphertext,
        nonce: info.nonce,
        associated_data: info.associated_data,
      })
    } catch (e) {
      console.warn('[pay] 解密平台证书失败 ' + item.serial_no + '：' + e.message)
    }
  }
  return out
}

// 每天刷新一次；没配商户号时静默跳过
export async function refreshPlatformCerts() {
  if (!payReady() || !payConfig().apiV3Key) return { skipped: '未配置商户号或 APIv3 密钥' }
  try {
    const certs = await downloadCertificates()
    platformCerts = Object.assign(platformCerts, certs)
    const total = Object.keys(platformCerts).length
    if (total) console.log('[pay] 平台证书可用 ' + total + ' 张：' + Object.keys(platformCerts).join(', '))
    return { total: total }
  } catch (e) {
    console.warn('[pay] 拉取平台证书失败：' + e.message)
    return { error: e.message }
  }
}
