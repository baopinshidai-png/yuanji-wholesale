// 物流轨迹：默认用本地推演的轨迹（演示用），接入真实快递查询只需替换 queryTrace
import crypto from 'node:crypto'

const HOUR = 3600 * 1000

// 演示轨迹：按发货时间推演几个节点；接入快递100/菜鸟后换成真实返回值即可
export function localTrace(order) {
  if (!order || !order.logistics) return { logistics: '', steps: [], status: '未发货' }
  const shippedAt = order.shippedAt ? new Date(order.shippedAt).getTime() : Date.now() - 6 * HOUR
  const steps = [
    { time: shippedAt, text: '商品已出库（' + (order.stallName || '档口') + '）' },
    { time: shippedAt + 2 * HOUR, text: '广州分拨中心 已发出' },
    { time: shippedAt + 10 * HOUR, text: '运输中，预计明日送达' },
  ]
  if (order.status === 'done') steps.push({ time: shippedAt + 30 * HOUR, text: '已签收，感谢使用源集' })
  steps.sort((a, b) => b.time - a.time)
  return {
    logistics: order.logistics,
    status: order.status === 'done' ? '已签收' : '运输中',
    provider: 'demo',
    steps: steps.map((s) => ({ time: new Date(s.time).toLocaleString('zh-CN'), text: s.text })),
  }
}

// 接入快递100（生产）：配 KUAIDI100_KEY / KUAIDI100_CUSTOMER 后启用
export async function queryTrace(order) {
  const key = process.env.KUAIDI100_KEY
  const customer = process.env.KUAIDI100_CUSTOMER
  if (!key || !customer || !order.logistics) return localTrace(order)
  try {
    const param = JSON.stringify({ com: process.env.KUAIDI100_COM || 'shunfeng', num: order.logistics })
    const res = await fetch('https://poll.kuaidi100.com/poll/query.do', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body:
        'customer=' + encodeURIComponent(customer) +
        '&sign=' + encodeURIComponent(crypto.createHash('md5').update(param + key + customer).digest('hex').toUpperCase()) +
        '&param=' + encodeURIComponent(param),
    })
    const json = await res.json()
    const list = (json.data || []).map((d) => ({ time: d.ftime, text: d.context }))
    if (!list.length) return localTrace(order)
    return { logistics: order.logistics, status: json.state || '运输中', provider: 'kuaidi100', steps: list }
  } catch (e) {
    console.warn('[logistics] 快递100 查询失败，退回本地轨迹：' + e.message)
    return localTrace(order)
  }
}

export const logisticsReady = () => !!(process.env.KUAIDI100_KEY && process.env.KUAIDI100_CUSTOMER)
