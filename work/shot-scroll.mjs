// 快速看某一页某个滚动位置的渲染效果（开发者工具需开着自动化端口）
// 用法：node work/shot-scroll.mjs /pages/home/index 900 home-900
import path from 'node:path'
import automator from 'miniprogram-automator'

const [url = '/pages/home/index', top = '0', name = 'shot'] = process.argv.slice(2)
const OUT = path.resolve('outputs/预览截图/miniprogram/_scroll-' + name + '.png')

const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })
const page = await mp.reLaunch(url)
await new Promise((r) => setTimeout(r, 1500))
if (Number(top) > 0) {
  await mp.pageScrollTo(Number(top))
  await new Promise((r) => setTimeout(r, 1200))
}
await mp.screenshot({ path: OUT })
console.log('shot ->', OUT)
mp.disconnect()
process.exit(0)
