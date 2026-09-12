// 首页运营位（banner / 活动卡）配置：运营后台可增删改、开关，小程序按位置取用
import crypto from 'node:crypto'
import { db, save } from './db.js'

export const POSITIONS = ['home_top', 'home_board', 'home_op']

const defaults = () => [
  {
    id: 'cp-newcomer',
    position: 'home_top',
    title: '新人 60 元礼包',
    subtitle: '包邮 + 退货卡价值超 30 元',
    image: '',
    link: '/pages/coupons/index',
    sort: 1,
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cp-autumn',
    position: 'home_top',
    title: '秋上新专场',
    subtitle: '源头档口 24H 发货',
    image: '',
    link: '/pages/list/index?sort=new',
    sort: 2,
    enabled: true,
    createdAt: new Date().toISOString(),
  },
]

export function allCampaigns() {
  if (!db.campaigns) db.campaigns = defaults()
  return db.campaigns.slice().sort((a, b) => (a.sort || 0) - (b.sort || 0))
}

export function publicCampaigns(position) {
  return allCampaigns()
    .filter((c) => c.enabled)
    .filter((c) => !position || c.position === position)
}

export function saveCampaign(payload) {
  const p = payload || {}
  if (!p.title) return { error: '请填写标题' }
  if (!db.campaigns) db.campaigns = defaults()
  const position = POSITIONS.indexOf(p.position) > -1 ? p.position : 'home_top'
  if (p.id) {
    const found = db.campaigns.find((c) => c.id === p.id)
    if (!found) return { error: '运营位不存在' }
    Object.assign(found, {
      position: position,
      title: p.title,
      subtitle: p.subtitle || '',
      image: p.image || '',
      link: p.link || '',
      sort: Number(p.sort) || found.sort || 1,
      enabled: p.enabled === undefined ? found.enabled : !!p.enabled,
      updatedAt: new Date().toISOString(),
    })
    save()
    return { campaign: found }
  }
  const campaign = {
    id: 'cp' + crypto.randomUUID().slice(0, 8),
    position: position,
    title: p.title,
    subtitle: p.subtitle || '',
    image: p.image || '',
    link: p.link || '',
    sort: Number(p.sort) || allCampaigns().length + 1,
    enabled: p.enabled === undefined ? true : !!p.enabled,
    createdAt: new Date().toISOString(),
  }
  db.campaigns.push(campaign)
  save()
  return { campaign: campaign }
}

export function toggleCampaign(id, enabled) {
  const found = allCampaigns().find((c) => c.id === id)
  if (!found) return { error: '运营位不存在' }
  found.enabled = enabled === undefined ? !found.enabled : !!enabled
  save()
  return { campaign: found }
}

export function removeCampaign(id) {
  if (!db.campaigns) db.campaigns = defaults()
  const i = db.campaigns.findIndex((c) => c.id === id)
  if (i < 0) return { error: '运营位不存在' }
  db.campaigns.splice(i, 1)
  save()
  return { id: id, removed: true }
}
