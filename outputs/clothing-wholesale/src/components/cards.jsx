import React from 'react'
import Icon from './Icon.jsx'
import { Tags } from './ui.jsx'
import { go } from '../router.js'
import { getStall } from '../data/mock.js'

/** 商品卡（双列瀑布流用） */
export function GoodsCard({ g, rank }) {
  const stall = getStall(g.stallId)
  return (
    <div className="gcard" onClick={() => go('#/goods/' + g.id)}>
      <div className="gcard-img">
        <img src={`goods/g${g.img}.svg`} alt={g.title} loading="lazy" />
        {g.newHours <= 12 ? <span className="gcard-new">上新</span> : null}
        {rank ? <span className="gcard-rank">{rank}</span> : null}
      </div>
      <div className="gcard-body">
        <p className="gcard-title">
          <span className="gcard-badge">一手</span>
          {g.title}
        </p>
        <div className="gcard-tags">
          {g.tags.slice(0, 2).map((t) => (
            <span key={t} className="mini-tag">
              {t}
            </span>
          ))}
        </div>
        <div className="gcard-foot">
          <span className="gcard-price">
            <i>¥</i>
            {g.price}
            <em>起</em>
          </span>
          <span className="gcard-sold">已售{g.sold > 999 ? (g.sold / 1000).toFixed(1) + 'k' : g.sold}</span>
        </div>
        <div className="gcard-stall">
          <Icon name="tag" size={11} color="#b0b0ba" />
          <span>{stall ? stall.name : ''}</span>
          <i>{g.market}</i>
        </div>
      </div>
    </div>
  )
}

export function GoodsGrid({ list, className = '' }) {
  return (
    <div className={'ggrid ' + className}>
      {list.map((g) => (
        <GoodsCard key={g.id} g={g} />
      ))}
    </div>
  )
}

/** 商品横排（订单、进货单用） */
export function GoodsRow({ g, children }) {
  return (
    <div className="grow">
      <img className="grow-img" src={`goods/g${g.img}.svg`} alt={g.title} loading="lazy" />
      <div className="grow-body">
        <p className="grow-title">{g.title}</p>
        <div className="grow-meta">{children}</div>
      </div>
    </div>
  )
}

/** 档口卡（横向滚动用） */
export function StallCard({ s }) {
  return (
    <div className="scard" onClick={() => go('#/stall/' + s.id)}>
      <div className="scard-top">
        <div className="scard-avatar">{s.name.slice(0, 1)}</div>
        <div className="scard-info">
          <p className="scard-name">{s.name}</p>
          <p className="scard-market">
            <Icon name="location" size={11} color="#a8a8b3" />
            {s.market} · {s.address}
          </p>
        </div>
      </div>
      <p className="scard-main">{s.main}</p>
      <div className="scard-tags">
        {s.tags.slice(0, 2).map((t) => (
          <span key={t} className="mini-tag warm">
            {t}
          </span>
        ))}
      </div>
      <div className="scard-foot">
        <span className="scard-new">今日上新 {s.newCount}</span>
        <span className="scard-fans">{s.fans} 店主关注</span>
      </div>
    </div>
  )
}

/** 档口行（列表用） */
export function StallRow({ s, right }) {
  return (
    <div className="srow" onClick={() => go('#/stall/' + s.id)}>
      <div className="scard-avatar sm">{s.name.slice(0, 1)}</div>
      <div className="srow-body">
        <p className="srow-name">{s.name}</p>
        <p className="srow-meta">
          {s.market} · {s.main}
        </p>
        <Tags list={[`评分 ${s.score}`, `发货率 ${s.shipRate}%`, `上新 ${s.newCount}`]} tone="plain" />
      </div>
      {right || <Icon name="right" size={16} color="#c9c9d1" />}
    </div>
  )
}
