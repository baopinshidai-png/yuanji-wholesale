// 源集小程序后端（MVP，零依赖）
// 启动：node server.js  （默认 http://127.0.0.1:3000）
import http from 'node:http'
import fs from 'node:fs'
import { URL } from 'node:url'
import { handle } from './src/app.js'
import { db, dbFile } from './src/db.js'
import { startOrderScheduler } from './src/orders.js'
import { refreshPlatformCerts } from './src/pay.js'
import { findUpload } from './src/uploads.js'

const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '0.0.0.0'
const MAX_BODY = 8 * 1024 * 1024 // 图片走 base64 上传，放宽到 8MB

function send(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new Error('请求体过大'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      req.__rawBody = raw
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (e) {
        reject(new Error('请求体不是合法 JSON'))
      }
    })
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  const started = Date.now()
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'))
  try {
    // 静态图片（档口上传的商品图）
    if (req.method === 'GET' && (url.pathname === '/admin' || url.pathname === '/admin/')) {
      const html = fs.readFileSync(new URL('./public/admin.html', import.meta.url))
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-length': html.length })
      res.end(html)
      return
    }
    if (req.method === 'GET' && url.pathname.indexOf('/uploads/') === 0) {
      const found = findUpload(url.pathname.replace('/uploads/', ''))
      if (!found) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('not found')
        return
      }
      const body = fs.readFileSync(found.file)
      res.writeHead(200, {
        'content-type': found.contentType,
        'content-length': body.length,
        'cache-control': 'public, max-age=31536000',
        'access-control-allow-origin': '*',
      })
      res.end(body)
      return
    }
    if (req.method === 'OPTIONS') {
      send(res, 204, {})
      return
    }
    const body = req.method === 'GET' || req.method === 'DELETE' ? {} : await readBody(req)
    const query = Object.fromEntries(url.searchParams.entries())
    const data = await handle(req, res, { pathname: url.pathname, query, body })
    // 少数接口（微信支付回调）要返回微信规定的原始报文，而不是统一响应体
    if (data && data.__raw) send(res, data.status || 200, data.body || {})
    else send(res, 200, { code: 0, msg: 'ok', data })
  } catch (e) {
    const status = e.httpStatus || 500
    send(res, status, { code: e.code || 50000, msg: e.message || '服务异常', data: null })
  } finally {
    if (process.env.LOG !== 'off') {
      console.log(`${req.method} ${url.pathname}${url.search} → ${res.statusCode} ${Date.now() - started}ms`)
    }
  }
})

server.listen(PORT, HOST, () => {
  console.log(`源集后端已启动: http://127.0.0.1:${PORT}/api/v1/health`)
  console.log(`数据文件: ${dbFile}（用户 ${db.users.length} / 订单 ${db.orders.length}）`)
  // 定时任务：超时未支付自动关单（每分钟）+ 平台证书每天刷新一次
  startOrderScheduler()
  refreshPlatformCerts().catch(() => {})
  setInterval(() => {
    refreshPlatformCerts().catch(() => {})
  }, 24 * 3600 * 1000)
})
