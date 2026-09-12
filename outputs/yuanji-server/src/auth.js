// 登录态：HMAC 签名 token（生产可换成 JWT / 网关签发）
import crypto from 'node:crypto'
import { db, save } from './db.js'

const SECRET = process.env.TOKEN_SECRET || 'yuanji-dev-secret-change-me'
const TTL = 30 * 24 * 3600 * 1000

export function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  return body + '.' + sig
}

export function verifyToken(token) {
  if (!token || token.indexOf('.') < 0) return null
  const [body, sig] = token.split('.')
  const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  if (sig !== expect) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (payload.exp && payload.exp < Date.now()) return null
    return payload
  } catch (e) {
    return null
  }
}

export function tokenFromRequest(req) {
  const raw = req.headers.authorization || ''
  return raw.startsWith('Bearer ') ? raw.slice(7) : ''
}

export function currentUser(req) {
  const payload = verifyToken(tokenFromRequest(req))
  if (!payload) return null
  return db.users.find((u) => u.id === payload.uid) || null
}

// code2session：配了 APPID/SECRET 就走微信真接口，否则用本地演示账号
export async function loginWithCode(code, profile) {
  const appid = process.env.WECHAT_APPID
  const secret = process.env.WECHAT_SECRET
  let openid = 'demo-' + crypto.createHash('md5').update(String(code || 'guest')).digest('hex').slice(0, 16)

  if (appid && secret && code) {
    const url =
      'https://api.weixin.qq.com/sns/jscode2session?appid=' +
      appid +
      '&secret=' +
      secret +
      '&js_code=' +
      encodeURIComponent(code) +
      '&grant_type=authorization_code'
    const res = await fetch(url)
    const json = await res.json()
    if (json.openid) openid = json.openid
    else throw new Error('code2session 失败：' + JSON.stringify(json))
  }

  let user = db.users.find((u) => u.openid === openid)
  if (!user) {
    user = {
      id: 'u' + crypto.randomUUID().slice(0, 8),
      openid,
      phone: (profile && profile.phone) || '',
      nick: (profile && profile.nick) || '店主' + String(db.users.length + 1).padStart(3, '0'),
      certified: false,
      certInfo: null,
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)
    save()
  }
  return { user, token: signToken({ uid: user.id, exp: Date.now() + TTL }) }
}
