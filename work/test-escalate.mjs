// 售后超时升级的单元测试：直接喂一条 25 小时前的 pending 工单，调升级函数看结果
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const tmp = path.join(os.tmpdir(), 'yuanji-escalate-' + Date.now() + '.json')
fs.writeFileSync(
  tmp,
  JSON.stringify({
    users: [],
    carts: {},
    orders: [],
    aftersales: [
      { id: 'AS-OLD', status: 'pending', createdAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString() },
      { id: 'AS-NEW', status: 'pending', createdAt: new Date().toISOString() },
    ],
  }),
  'utf8',
)
process.env.DB_FILE = tmp
process.env.AFTERSALE_ESCALATE_HOURS = '24'

const { escalateStaleAftersales } = await import('../outputs/yuanji-server/src/orders.js')
const escalated = escalateStaleAftersales()
const db = JSON.parse(fs.readFileSync(tmp, 'utf8'))
const oldTicket = db.aftersales.find((t) => t.id === 'AS-OLD')
const newTicket = db.aftersales.find((t) => t.id === 'AS-NEW')

console.log('escalated ids:', escalated.join(',') || '(none)')
console.log('AS-OLD ->', oldTicket.status, '|', oldTicket.note)
console.log('AS-NEW ->', newTicket.status)

const ok = escalated.length === 1 && oldTicket.status === 'escalated' && newTicket.status === 'pending'
console.log(ok ? '✅ 超时升级逻辑通过' : '❌ 超时升级逻辑异常')
fs.unlinkSync(tmp)
process.exit(ok ? 0 : 1)
