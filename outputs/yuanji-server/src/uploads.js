// 图片上传（MVP：存本地 data/uploads，静态路由 /uploads/<文件名> 返回）
// 上生产建议把 saveImage 换成腾讯云 COS / 阿里云 OSS 直传 + CDN（其余代码不用动）
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const uploadDir = () => process.env.UPLOAD_DIR || path.resolve('data/uploads')
const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES || 4 * 1024 * 1024)

const EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export function assetBase(req) {
  if (process.env.ASSET_BASE_URL) return process.env.ASSET_BASE_URL.replace(/\/$/, '')
  const host = (req && req.headers && req.headers.host) || '127.0.0.1:3000'
  return 'http://' + host
}

export function saveImage(base64, contentType, filename) {
  const type = String(contentType || '').toLowerCase()
  const ext = EXT[type] || (filename && path.extname(filename).slice(1)) || 'jpg'
  const buf = Buffer.from(String(base64 || '').replace(/^data:[^;]+;base64,/, ''), 'base64')
  if (!buf.length) throw new Error('图片数据为空')
  if (buf.length > MAX_BYTES) throw new Error('图片超过 ' + Math.round(MAX_BYTES / 1024 / 1024) + 'MB 限制')
  const name = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 20) + '.' + ext
  fs.mkdirSync(uploadDir(), { recursive: true })
  const file = path.join(uploadDir(), name)
  if (!fs.existsSync(file)) fs.writeFileSync(file, buf)
  return { name: name, bytes: buf.length, contentType: type || 'image/' + ext }
}

export function findUpload(name) {
  const safe = path.basename(String(name || ''))
  const file = path.join(uploadDir(), safe)
  if (!file.startsWith(uploadDir())) return null
  if (!fs.existsSync(file)) return null
  return { file: file, contentType: 'image/' + (path.extname(safe).slice(1) || 'jpeg') }
}

export function uploadStats() {
  try {
    const files = fs.readdirSync(uploadDir())
    return { dir: uploadDir(), count: files.length }
  } catch (e) {
    return { dir: uploadDir(), count: 0 }
  }
}
