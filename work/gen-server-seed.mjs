// 从小程序 utils/data.js 生成后端种子数据（outputs/yuanji-server/src/seed.js）
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const data = require(path.resolve('outputs/yuanji-miniprogram/utils/data.js'))

const seed = {
  markets: data.MARKETS,
  filters: data.FILTERS,
  categories: data.CATEGORIES,
  hotCategories: data.HOT_CATEGORIES,
  stalls: data.STALLS,
  goods: data.GOODS,
  coupons: data.COUPONS,
}

const OUT = path.resolve('outputs/yuanji-server/src/seed.js')
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(
  OUT,
  '// 由 work/gen-server-seed.mjs 从小程序 utils/data.js 生成，改动请改数据源后重新生成\n' +
    'export default ' +
    JSON.stringify(seed, null, 2) +
    '\n',
  'utf8',
)
console.log('seed ->', OUT)
console.log('markets', seed.markets.length, 'stalls', seed.stalls.length, 'goods', seed.goods.length, 'coupons', seed.coupons.length)
