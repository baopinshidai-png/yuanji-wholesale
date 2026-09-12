// 给开发库预置档口邀请码（格式：档口ID大写-2026，例如 S1-2026）
import fs from 'node:fs'
import path from 'node:path'

const FILE = path.resolve('outputs/yuanji-server/data/db.json')
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'))
db.stallCodes = db.stallCodes || {}
const ids = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']
ids.forEach((id) => {
  db.stallCodes[id] = db.stallCodes[id] || id.toUpperCase() + '-2026'
})
fs.writeFileSync(FILE, JSON.stringify(db, null, 2), 'utf8')
console.log('档口邀请码：', JSON.stringify(db.stallCodes))
