// 极简 JSON 文件数据库：够 MVP 用、零依赖、可直接打开查看
// 上生产时替换成 MySQL/PostgreSQL（接口层不用动，见 README「换成正式数据库」）
import fs from 'node:fs'
import path from 'node:path'

const FILE = process.env.DB_FILE || path.resolve('data/db.json')

const empty = () => ({
  users: [],
  carts: {},
  orders: [],
  favorites: {},
  subs: {},
  claimedCoupons: {},
  addresses: {},
})

function load() {
  try {
    const raw = fs.readFileSync(FILE, 'utf8')
    return Object.assign(empty(), JSON.parse(raw))
  } catch (e) {
    return empty()
  }
}

export const db = load()
export const dbFile = FILE

export function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  const tmp = FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
  fs.renameSync(tmp, FILE)
}
